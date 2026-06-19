from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404 # render : tạo trang HTML, redirect : chuyển hướng người dùng, get_object_or_404 : lấy đối tượng hoặc báo lỗi
import json
from django.db import transaction
from rest_framework import generics # nhập các lớp view có sẵn, cực kì mạnh  mẽ của DJANGO REST FRAMEWORK để tạo API
from .models import Product, CartItem , Order, OrderItem # nhập các model đã tạo
from .serializers import ProductSerializer, CartItemSerializer, OrderSerializer, RegisterSerializer # nhập các người phiên dịch để chuyển dữ liệu sang JSON cho API
from .forms import AddToCartForm # nhập form để người dùng điền thông tin
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User


def home(request): # hiện trang chủ
    products = Product.objects.all() # lấy tất cả sản phẩm từ database và gửi danh sách đó cho home.html để hiển thị 
    return render(request, 'cart/home.html', {'products': products})


def cart_page(request): # hiển thị trang giỏ hàng
    items = CartItem.objects.all().order_by('-added_at') # lấy tất cả các món hàng trong giỏ, tính tổng tiền và gửi cho file cart.html
    total = sum(item.get_total_price() for item in items) 
    return render(request, 'cart/cart.html', {
        'items': items,
        'total': total
    }
    )


def product_detail_view(request, product_id):
    """Hiển thị trang chi tiết của một sản phẩm."""
    product = get_object_or_404(Product, id=product_id)
    form = AddToCartForm()
    context = {
        'product': product,
        'form': form
    }
    return render(request, 'cart/product_detail.html', context)


@csrf_exempt
def update_quantity(request, item_id): # xử lý các hành động trong giỏ hàng
    if request.method == 'POST':
        try:
            quantity = int(request.POST.get('quantity'))
            if quantity > 0:
                item = CartItem.objects.get(id=item_id)
                item.quantity = quantity
                item.save()
        except (ValueError, CartItem.DoesNotExist):
            pass
    return redirect('cart_page')


@csrf_exempt # xử lý các hành động trong giỏ hàng
def delete_item(request, item_id):
    CartItem.objects.filter(id=item_id).delete()
    return redirect('cart_page')


@csrf_exempt
@transaction.atomic # đảm bảo an toàn dữ liệu 
def checkout(request): # xử lý logic khi người dùng ấn thanh toán
    if request.method == 'POST':
        cart_items = CartItem.objects.all()
        if not cart_items:
            return JsonResponse({'error': 'Giỏ hàng trống'}, status=400)
        total_price = sum(item.get_total_price() for item in cart_items)
        order = Order.objects.create(total_price=total_price)

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                price=item.product.price, 
                quantity=item.quantity,
                size=item.size
            )
        cart_items.delete()
        return JsonResponse({'message': 'Đặt hàng thành công!', 'order_id': order.id}, status=201)
    
    return JsonResponse({'error': 'Yêu cầu không hợp lệ'}, status=405)


# === CÁC VIEW DÀNH CHO API (TRẢ VỀ JSON) ===

@csrf_exempt 
def add_to_cart_api(request):
    """API để thêm sản phẩm vào giỏ hàng từ frontend."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data['product_id']
            product = get_object_or_404(Product, id=product_id)

            cart_item, created = CartItem.objects.get_or_create(
                product=product,
                size=data['size'],
                defaults={'quantity': data.get('quantity', 1)}
            )

            if not created:
                cart_item.quantity += data.get('quantity', 1)
                cart_item.save()

            return JsonResponse({'message': 'Đã cập nhật giỏ hàng!'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Yêu cầu không hợp lệ'}, status=405)

@csrf_exempt
@transaction.atomic # Đảm bảo tất cả cùng thành công hoặc thất bại
def add_multiple_to_cart_api(request):
    """API để thêm NHIỀU sản phẩm vào giỏ hàng cùng lúc."""
    if request.method == 'POST':
        try:
            # Đọc dữ liệu từ body
            items_data = json.loads(request.body)

            # Kiểm tra xem dữ liệu có phải là một danh sách (array) không
            if not isinstance(items_data, list):
                return JsonResponse({'error': 'Dữ liệu đầu vào phải là một mảng (array).'}, status=400)

            # Lặp qua từng sản phẩm trong danh sách
            for item_data in items_data:
                product_id = item_data['product_id']
                product = get_object_or_404(Product, id=product_id)

                cart_item, created = CartItem.objects.get_or_create(
                    product=product,
                    size=item_data['size'],
                    defaults={'quantity': item_data.get('quantity', 1)}
                )

                if not created:
                    cart_item.quantity += item_data.get('quantity', 1)
                    cart_item.save()
            
            return JsonResponse({'message': f'Đã cập nhật thành công {len(items_data)} sản phẩm!'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Yêu cầu không hợp lệ'}, status=405)

from rest_framework.permissions import IsAuthenticatedOrReadOnly

class ProductListAPIView(generics.ListCreateAPIView):
    """API để lấy danh sách TẤT CẢ sản phẩm."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """API để lấy/sửa/xóa CHI TIẾT của 1 sản phẩm."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class CartItemListAPIView(generics.ListAPIView):
    """API để lấy danh sách các món hàng trong giỏ."""
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

class OrderListAPIView(generics.ListAPIView):
    """API để lấy danh sách tất cả đơn hàng."""
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer # chuyển đổi sang dạng JSON 

class OrderDetailAPIView(generics.RetrieveAPIView):
    """API để lấy chi tiết của một đơn hàng."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # cho phép ai cũng được đăng kí
    serializer_class = RegisterSerializer