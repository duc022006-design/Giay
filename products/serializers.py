from rest_framework import serializers
from .models import SanPham, BienTheSanPham, DanhGia

class BienTheSanPhamSerializer(serializers.ModelSerializer):
    class Meta:
        model = BienTheSanPham
        fields = ['id', 'size', 'mau', 'so_luong_ton']

class SanPhamSerializer(serializers.ModelSerializer):
    variants = BienTheSanPhamSerializer(many=True, read_only=True)

    class Meta:
        model = SanPham
        fields = ['id', 'ten', 'thuong_hieu', 'gia_tien', 'mo_ta', 'anh_dai_dien', 'id_chu_shop', 'variants']

class DanhGiaSerializer(serializers.ModelSerializer):
    nguoi_mua_name = serializers.CharField(source='nguoi_mua.ten', read_only=True)

    class Meta:
        model = DanhGia
        fields = ['id', 'nguoi_mua', 'nguoi_mua_name', 'san_pham', 'so_sao', 'binh_luan', 'ngay_danh_gia']
