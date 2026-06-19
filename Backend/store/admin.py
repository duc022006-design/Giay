from django.contrib import admin
from .models import Product, ProductVariant, CartItem, Order, OrderItem, Review

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'brand', 'price', 'sizes', 'quantity')
    search_fields = ('name', 'brand')
    inlines = [ProductVariantInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('variant', 'price', 'quantity')
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'id')
    inlines = [OrderItemInline]

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'variant', 'quantity', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'variant__product__name')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'stars', 'created_at')
    list_filter = ('stars', 'created_at')
    search_fields = ('user__username', 'product__name')
