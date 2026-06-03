from django.contrib import admin
from .models import Product, CartItem, Order, OrderItem

# Hiển thị các OrderItem ngay bên trong trang chi tiết của Order
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('product', 'price', 'quantity', 'size')
    extra = 0 # Không hiển thị ô để thêm mới

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'total_price')
    inlines = [OrderItemInline]

# Các đăng ký cũ
admin.site.register(Product)
admin.site.register(CartItem)