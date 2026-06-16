from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404
import json
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import AllowAny

# Import các model mới
from products.models import SanPham, BienTheSanPham, DanhGia
from users.models import NguoiMua
from .models import GioHang, DonHang, ChiTietDonHang

# Import các Serializer mới
from products.serializers import SanPhamSerializer
from .serializers import GioHangSerializer, DonHangSerializer
from .forms import AddToCartForm


def get_current_buyer(request):
    """Hàm bổ trợ lấy Người mua hiện tại (hoặc tạo mặc định khi chạy thử chưa đăng nhập)."""
    # Thử xác thực qua JWT token gửi trong header (cho API)
    if not request.user.is_authenticated:
        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            auth_res = JWTAuthentication().authenticate(request)
            if auth_res is not None:
                request.user, _ = auth_res
        except Exception:
            pass

    if request.user.is_authenticated:
        buyer, _ = NguoiMua.objects.get_or_create(
            user=request.user,
            defaults={
                'tai_khoan': request.user.username,
                'mat_khau': request.user.password,
                'email': request.user.email or f"{request.user.username}@example.com",
                'ten': request.user.first_name or request.user.username
            }
        )
        return buyer
    
    # Tạo tài khoản Guest giả lập cho mục đích test
    user, _ = User.objects.get_or_create(username='khach_vang_lai', defaults={'email': 'khach@example.com'})
    buyer, _ = NguoiMua.objects.get_or_create(
        user=user,
        defaults={
            'tai_khoan': 'khach_vang_lai',
            'mat_khau': '123456',
            'email': 'khach@example.com',
            'ten': 'Khách hàng thử nghiệm'
        }
    )
    return buyer


def home(request):
    """Trang chủ hiển thị danh sách sản phẩm giày."""
    products = SanPham.objects.all()
    return render(request, 'cart/home.html', {'products': products})


def cart_page(request):
    """Trang hiển thị giỏ hàng."""
    buyer = get_current_buyer(request)
    items = GioHang.objects.filter(nguoi_mua=buyer).order_by('-ngay_them')
    total = sum(item.get_total_price() for item in items) 
    return render(request, 'cart/cart.html', {
        'items': items,
        'total': total
    })


def product_detail_view(request, product_id):
    """Trang chi tiết của một sản phẩm giày."""
    product = get_object_or_404(SanPham, id=product_id)
    form = AddToCartForm()
    context = {
        'product': product,
        'form': form
    }
    return render(request, 'cart/product_detail.html', context)


@csrf_exempt
def update_quantity(request, item_id):
    """Xử lý cập nhật số lượng của một món đồ trong giỏ hàng."""
    if request.method == 'POST':
        try:
            quantity = int(request.POST.get('quantity'))
            if quantity > 0:
                item = GioHang.objects.get(id=item_id)
                item.so_luong = quantity
                item.save()
        except (ValueError, GioHang.DoesNotExist):
            pass
    return redirect('cart_page')


@csrf_exempt
def delete_item(request, item_id):
    """Xóa một món đồ khỏi giỏ hàng."""
    GioHang.objects.filter(id=item_id).delete()
    return redirect('cart_page')


@csrf_exempt
@transaction.atomic
def checkout(request):
    """Xử lý thanh toán đơn hàng (Chuyển giỏ hàng thành đơn hàng)."""
    if request.method == 'POST':
        buyer = get_current_buyer(request)
        cart_items = GioHang.objects.filter(nguoi_mua=buyer)
        if not cart_items:
            return redirect('cart_page')
        
        total_price = sum(item.get_total_price() for item in cart_items)
        order = DonHang.objects.create(
            nguoi_mua=buyer,
            tong_tien=total_price,
            trang_thai=0 # Chờ xử lý
        )

        for item in cart_items:
            ChiTietDonHang.objects.create(
                don_hang=order,
                bien_the=item.bien_the,
                so_luong_san_pham=item.so_luong,
                gia_mua=item.bien_the.san_pham.gia_tien
            )
            # Giảm số lượng tồn kho (nếu có)
            if item.bien_the.so_luong_ton >= item.so_luong:
                item.bien_the.so_luong_ton -= item.so_luong
                item.bien_the.save()

        # Xóa các mục trong giỏ hàng sau khi đã đặt hàng thành công
        cart_items.delete()
        return render(request, 'cart/thank_you.html', {'order': order})
    
    return redirect('cart_page')


# === CÁC VIEW DÀNH CHO API (TRẢ VỀ JSON) ===

@csrf_exempt
def add_to_cart_api(request):
    """API thêm sản phẩm vào giỏ hàng."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data['product_id']
            size = data['size']
            quantity = data.get('quantity', 1)
            buyer = get_current_buyer(request)

            # Tìm biến thể giày tương ứng với size (nếu không có thì tạo mặc định)
            bien_the = BienTheSanPham.objects.filter(san_pham_id=product_id, size=size).first()
            if not bien_the:
                product = get_object_or_404(SanPham, id=product_id)
                bien_the = BienTheSanPham.objects.create(
                    san_pham=product,
                    size=size,
                    mau='Mặc định',
                    so_luong_ton=100
                )

            cart_item, created = GioHang.objects.get_or_create(
                nguoi_mua=buyer,
                bien_the=bien_the,
                defaults={'so_luong': quantity}
            )

            if not created:
                cart_item.so_luong += quantity
                cart_item.save()

            return JsonResponse({'message': 'Đã cập nhật giỏ hàng!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Yêu cầu không hợp lệ'}, status=405)


@csrf_exempt
@transaction.atomic
def add_multiple_to_cart_api(request):
    """API thêm nhiều sản phẩm vào giỏ hàng cùng lúc."""
    if request.method == 'POST':
        try:
            items_data = json.loads(request.body)
            if not isinstance(items_data, list):
                return JsonResponse({'error': 'Dữ liệu đầu vào phải là một mảng (array).'}, status=400)

            buyer = get_current_buyer(request)

            for item_data in items_data:
                product_id = item_data['product_id']
                size = item_data['size']
                quantity = item_data.get('quantity', 1)

                bien_the = BienTheSanPham.objects.filter(san_pham_id=product_id, size=size).first()
                if not bien_the:
                    product = get_object_or_404(SanPham, id=product_id)
                    bien_the = BienTheSanPham.objects.create(
                        san_pham=product,
                        size=size,
                        mau='Mặc định',
                        so_luong_ton=100
                    )

                cart_item, created = GioHang.objects.get_or_create(
                    nguoi_mua=buyer,
                    bien_the=bien_the,
                    defaults={'so_luong': quantity}
                )

                if not created:
                    cart_item.so_luong += quantity
                    cart_item.save()
            
            return JsonResponse({'message': f'Đã cập nhật thành công {len(items_data)} sản phẩm!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Yêu cầu không hợp lệ'}, status=405)


class ProductListAPIView(generics.ListCreateAPIView):
    """API để lấy danh sách TẤT CẢ sản phẩm."""
    permission_classes = [AllowAny]
    queryset = SanPham.objects.all()
    serializer_class = SanPhamSerializer


class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """API để lấy/sửa/xóa CHI TIẾT của 1 sản phẩm."""
    permission_classes = [AllowAny]
    queryset = SanPham.objects.all()
    serializer_class = SanPhamSerializer


class CartItemListAPIView(generics.ListAPIView):
    """API để lấy danh sách các món hàng trong giỏ của người mua hiện tại."""
    serializer_class = GioHangSerializer

    def get_queryset(self):
        buyer = get_current_buyer(self.request)
        return GioHang.objects.filter(nguoi_mua=buyer).order_by('-ngay_them')


class OrderListAPIView(generics.ListAPIView):
    """API để lấy danh sách tất cả đơn hàng của người mua hiện tại."""
    serializer_class = DonHangSerializer

    def get_queryset(self):
        buyer = get_current_buyer(self.request)
        return DonHang.objects.filter(nguoi_mua=buyer).order_by('-ngay_dat')


class OrderDetailAPIView(generics.RetrieveAPIView):
    """API để lấy chi tiết của một đơn hàng."""
    queryset = DonHang.objects.all()
    serializer_class = DonHangSerializer