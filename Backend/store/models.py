from django.db import models
from django.contrib.auth.models import User

# 1. Bảng Sản phẩm gốc
class Product(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên sản phẩm")
    brand = models.CharField(max_length=100, default='Khác', verbose_name="Thương hiệu")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá tiền")
    description = models.TextField(blank=True, null=True, verbose_name="Mô tả")
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name="Hình ảnh")

    def __str__(self):
        return self.name

    @property
    def sizes(self):
        # Trả về chuỗi các size cách nhau bởi dấu phẩy để tương thích với frontend cũ
        sizes_list = self.variants.values_list('size', flat=True).distinct().order_by('size')
        if not sizes_list:
            return "39,40,41,42,43,44,45" # Giá trị mặc định nếu chưa có biến thể
        return ','.join(str(s) for s in sizes_list)

    @property
    def quantity(self):
        # Trả về tổng tồn kho của tất cả biến thể để tương thích với frontend cũ
        total_stock = sum(v.stock for v in self.variants.all())
        return total_stock if total_stock > 0 else 0

# 2. Bảng Biến thể sản phẩm (Màu sắc, Size, Tồn kho)
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants', verbose_name="Sản phẩm")
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name="Màu sắc")
    size = models.PositiveIntegerField(verbose_name="Kích cỡ")
    stock = models.PositiveIntegerField(default=0, verbose_name="Số lượng tồn")

    def __str__(self):
        color_str = f" - {self.color}" if self.color else ""
        return f"{self.product.name}{color_str} - Size {self.size} (Còn {self.stock})"

# 3. Bảng Giỏ hàng (Liên kết User với Biến thể sản phẩm)
class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items', verbose_name="Người mua")
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, verbose_name="Biến thể sản phẩm")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Số lượng")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày thêm")

    def __str__(self):
        return f"{self.user.username} - {self.quantity} x {self.variant}"

    def get_total_price(self):
        return self.variant.product.price * self.quantity

# 4. Bảng Đơn hàng
class Order(models.Model):
    STATUS_CHOICES = (
        (1, 'Chờ xác nhận'),
        (2, 'Đang giao hàng'),
        (3, 'Đã nhận hàng'),
        (4, 'Đã hủy'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name="Người mua")
    total_price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Tổng tiền")
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=1, verbose_name="Trạng thái")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày đặt")
    delivery_date = models.DateField(blank=True, null=True, verbose_name="Ngày nhận dự kiến")

    def __str__(self):
        return f"Đơn hàng #{self.id} - {self.user.username} - {self.get_status_display()}"

# 5. Bảng Chi tiết đơn hàng
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, verbose_name="Biến thể sản phẩm")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá mua lúc đặt")
    quantity = models.PositiveIntegerField(verbose_name="Số lượng")

    def __str__(self):
        return f"{self.quantity} x {self.variant} trong Đơn hàng #{self.order.id}"

# 6. Bảng Đánh giá
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Người mua")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name="Sản phẩm")
    order_item = models.OneToOneField(OrderItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='review', verbose_name="Chi tiết đơn hàng")
    stars = models.SmallIntegerField(verbose_name="Số sao")
    comment = models.TextField(blank=True, null=True, verbose_name="Bình luận")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày đánh giá")

    def __str__(self):
        return f"Đánh giá {self.stars} sao cho {self.product.name} bởi {self.user.username}"
