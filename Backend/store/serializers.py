from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, ProductVariant, CartItem, Order, OrderItem, Review

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'color', 'size', 'stock']

class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    sizes = serializers.CharField(required=False)
    quantity = serializers.IntegerField(required=False)
    has_purchased = serializers.SerializerMethodField(read_only=True)
    has_history = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'brand', 'price', 'description', 'image', 'sizes', 'quantity', 'variants', 'has_purchased', 'has_history']

    def get_has_purchased(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            # Kiểm tra xem người dùng có đơn hàng nào của sản phẩm này chưa được đánh giá không
            return OrderItem.objects.filter(
                order__user=request.user,
                variant__product=obj,
                review__isnull=True
            ).exists()
        return False

    def get_has_history(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            # Kiểm tra xem người dùng đã từng mua sản phẩm này chưa (dù đã đánh giá hay chưa)
            return OrderItem.objects.filter(
                order__user=request.user,
                variant__product=obj
            ).exists()
        return False

    def create(self, validated_data):
        sizes_str = validated_data.pop('sizes', '39,40,41,42,43,44,45')
        qty = validated_data.pop('quantity', 0)
        
        product = Product.objects.create(**validated_data)
        
        # Parse sizes
        try:
            sizes_list = [int(s.strip()) for s in sizes_str.split(',') if s.strip().isdigit()]
        except Exception:
            sizes_list = []
            
        if not sizes_list:
            sizes_list = [39, 40, 41, 42, 43, 44, 45]
            
        num_sizes = len(sizes_list)
        stock_per_size = qty // num_sizes if num_sizes > 0 else 0
        remainder = qty % num_sizes if num_sizes > 0 else 0
        
        for i, size in enumerate(sizes_list):
            stock = stock_per_size + (remainder if i == 0 else 0)
            ProductVariant.objects.create(product=product, size=size, stock=stock)
            
        return product

    def update(self, instance, validated_data):
        sizes_str = validated_data.pop('sizes', None)
        qty = validated_data.pop('quantity', None)
        
        # Update core fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update variants if sizes or quantity are modified
        if sizes_str is not None or qty is not None:
            if sizes_str is None:
                # Use current sizes
                sizes_list = list(instance.variants.values_list('size', flat=True).distinct())
            else:
                try:
                    sizes_list = [int(s.strip()) for s in sizes_str.split(',') if s.strip().isdigit()]
                except Exception:
                    sizes_list = []
                    
            if not sizes_list:
                sizes_list = [39, 40, 41, 42, 43, 44, 45]
                
            if qty is None:
                qty = sum(v.stock for v in instance.variants.all())
                
            # If size list changed, delete old variants and create new ones
            if sizes_str is not None:
                instance.variants.all().delete()
                
            num_sizes = len(sizes_list)
            stock_per_size = qty // num_sizes if num_sizes > 0 else 0
            remainder = qty % num_sizes if num_sizes > 0 else 0
            
            for i, size in enumerate(sizes_list):
                if sizes_str is not None:
                    ProductVariant.objects.create(product=instance, size=size, stock=stock_per_size + (remainder if i == 0 else 0))
                else:
                    variant, created = ProductVariant.objects.get_or_create(product=instance, size=size)
                    variant.stock = stock_per_size + (remainder if i == 0 else 0)
                    variant.save()
                    
        return instance

class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.IntegerField(source='variant.product.id', read_only=True)
    size = serializers.IntegerField(source='variant.size', read_only=True)
    color = serializers.CharField(source='variant.color', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    product_price = serializers.DecimalField(source='variant.product.price', max_digits=12, decimal_places=0, read_only=True)
    product_image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'size', 'color', 'quantity', 'added_at', 'product_name', 'product_price', 'product_image']

    def get_product_image(self, obj):
        if obj.variant.product.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.variant.product.image.url)
            return f"http://localhost:8000{obj.variant.product.image.url}"
        return None

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.IntegerField(source='variant.product.id', read_only=True)
    size = serializers.IntegerField(source='variant.size', read_only=True)
    color = serializers.CharField(source='variant.color', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'price', 'quantity', 'size', 'color']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_price', 'status', 'status_display', 'created_at', 'delivery_date', 'items']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'stars', 'comment', 'created_at']
