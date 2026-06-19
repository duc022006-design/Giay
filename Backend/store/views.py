from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Product, ProductVariant, CartItem, Order, OrderItem, Review
from .serializers import (
    RegisterSerializer,
    ProductSerializer,
    CartItemSerializer,
    OrderSerializer,
    ReviewSerializer
)

# === API ĐĂNG KÝ ===
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

# === API SẢN PHẨM ===
class ProductListAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# === API GIỎ HÀNG (THEO USER) ===
class CartItemListAPIView(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).order_by('-added_at')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart_api(request):
    try:
        data = request.data
        product_id = data.get('product_id')
        size = int(data.get('size', 40))
        quantity = int(data.get('quantity', 1))
        color = data.get('color', None)
        
        product = get_object_or_404(Product, id=product_id)
        
        # Tìm biến thể phù hợp
        variant_qs = ProductVariant.objects.filter(product=product, size=size)
        if color:
            variant_qs = variant_qs.filter(color=color)
            
        variant = variant_qs.first()
        if not variant:
            # Fallback: tạo biến thể mặc định nếu chưa được khởi tạo
            variant = ProductVariant.objects.create(product=product, size=size, color=color, stock=10)
            
        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            variant=variant,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
            
        return Response({'message': 'Đã cập nhật giỏ hàng!'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def add_multiple_to_cart_api(request):
    try:
        items_data = request.data
        if not isinstance(items_data, list):
            return Response({'error': 'Dữ liệu đầu vào phải là một mảng (array).'}, status=status.HTTP_400_BAD_REQUEST)

        # Xóa giỏ hàng cũ trước khi đồng bộ (để đồng bộ chính xác từ local)
        CartItem.objects.filter(user=request.user).delete()

        for item_data in items_data:
            product_id = item_data.get('product_id')
            size = int(item_data.get('size', 40))
            quantity = int(item_data.get('quantity', 1))
            color = item_data.get('color', None)
            
            product = get_object_or_404(Product, id=product_id)
            
            variant_qs = ProductVariant.objects.filter(product=product, size=size)
            if color:
                variant_qs = variant_qs.filter(color=color)
                
            variant = variant_qs.first()
            if not variant:
                variant = ProductVariant.objects.create(product=product, size=size, color=color, stock=10)
                
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                variant=variant,
                defaults={'quantity': quantity}
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
                
        return Response({'message': f'Đã cập nhật thành công {len(items_data)} sản phẩm!'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# === API ĐƠN HÀNG (THEO USER & KIỂM TRA TỒN KHO) ===
class OrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def checkout(request):
    cart_items = CartItem.objects.filter(user=request.user)
    if not cart_items:
        return Response({'error': 'Giỏ hàng trống'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Kiểm tra tồn kho trước khi đặt hàng
    for item in cart_items:
        if item.variant.stock < item.quantity:
            return Response({
                'error': f'Sản phẩm {item.variant.product.name} (Size {item.variant.size}) chỉ còn {item.variant.stock} sản phẩm trong kho.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    total_price = sum(item.get_total_price() for item in cart_items)
    
    # Tạo Đơn hàng
    order = Order.objects.create(
        user=request.user,
        total_price=total_price,
        status=1 # Chờ xác nhận
    )
    
    # Tạo chi tiết đơn hàng và trừ kho
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            variant=item.variant,
            price=item.variant.product.price,
            quantity=item.quantity
        )
        item.variant.stock -= item.quantity
        item.variant.save()
        
    # Xóa giỏ hàng
    cart_items.delete()
    
    return Response({'message': 'Đặt hàng thành công!', 'order_id': order.id}, status=status.HTTP_201_CREATED)

# === API ĐÁNH GIÁ (REVIEW) ===
class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return Review.objects.filter(product_id=product_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        product = serializer.validated_data.get('product')
        
        # Tìm một OrderItem của sản phẩm này chưa từng được đánh giá
        unreviewed_item = OrderItem.objects.filter(
            order__user=self.request.user,
            variant__product=product,
            review__isnull=True
        ).first()
        
        if not unreviewed_item:
            raise ValidationError("Bạn không có lượt đánh giá nào còn trống cho sản phẩm này. Hãy mua thêm để tiếp tục đánh giá!")
            
        serializer.save(user=self.request.user, order_item=unreviewed_item)
