from django.contrib import admin
from .models import GioHang, DonHang, ChiTietDonHang

class ChiTietDonHangInline(admin.TabularInline):
    model = ChiTietDonHang
    readonly_fields = ('bien_the', 'so_luong_san_pham', 'gia_mua')
    extra = 0

@admin.register(DonHang)
class DonHangAdmin(admin.ModelAdmin):
    list_display = ('id', 'nguoi_mua', 'tong_tien', 'trang_thai', 'ngay_dat')
    list_filter = ('trang_thai', 'ngay_dat')
    search_fields = ('nguoi_mua__ten', 'id')
    inlines = [ChiTietDonHangInline]

@admin.register(GioHang)
class GioHangAdmin(admin.ModelAdmin):
    list_display = ('id', 'nguoi_mua', 'bien_the', 'so_luong', 'ngay_them')
    search_fields = ('nguoi_mua__ten', 'bien_the__san_pham__ten')