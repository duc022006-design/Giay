from django.contrib import admin
from .models import SanPham, BienTheSanPham, DanhGia

class BienTheSanPhamInline(admin.TabularInline):
    model = BienTheSanPham
    extra = 1

@admin.register(SanPham)
class SanPhamAdmin(admin.ModelAdmin):
    list_display = ('id', 'ten', 'thuong_hieu', 'gia_tien', 'id_chu_shop')
    search_fields = ('ten', 'thuong_hieu')
    list_filter = ('thuong_hieu',)
    inlines = [BienTheSanPhamInline]

@admin.register(BienTheSanPham)
class BienTheSanPhamAdmin(admin.ModelAdmin):
    list_display = ('id', 'san_pham', 'size', 'mau', 'so_luong_ton')
    search_fields = ('san_pham__ten', 'mau')
    list_filter = ('size', 'mau')

@admin.register(DanhGia)
class DanhGiaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nguoi_mua', 'san_pham', 'so_sao', 'ngay_danh_gia')
    search_fields = ('nguoi_mua__ten', 'san_pham__ten', 'binh_luan')
    list_filter = ('so_sao', 'ngay_danh_gia')
