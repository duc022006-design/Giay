# pyrefly: ignore [missing-import]
from rest_framework import serializers
from .models import GioHang, DonHang, ChiTietDonHang
from products.serializers import BienTheSanPhamSerializer, SanPhamSerializer

class GioHangSerializer(serializers.ModelSerializer):
    # Lấy thông tin biến thể giày đầy đủ (bao gồm tên giày, size, màu)
    bien_the_info = BienTheSanPhamSerializer(source='bien_the', read_only=True)
    ten_san_pham = serializers.CharField(source='bien_the.san_pham.ten', read_only=True)
    anh_dai_dien = serializers.CharField(source='bien_the.san_pham.anh_dai_dien', read_only=True)
    gia_tien = serializers.DecimalField(source='bien_the.san_pham.gia_tien', max_digits=12, decimal_places=0, read_only=True)

    class Meta:
        model = GioHang
        fields = ['id', 'nguoi_mua', 'bien_the', 'bien_the_info', 'ten_san_pham', 'anh_dai_dien', 'gia_tien', 'so_luong', 'ngay_them']


class ChiTietDonHangSerializer(serializers.ModelSerializer):
    ten_san_pham = serializers.CharField(source='bien_the.san_pham.ten', read_only=True)
    size = serializers.IntegerField(source='bien_the.size', read_only=True)
    mau = serializers.CharField(source='bien_the.mau', read_only=True)

    class Meta:
        model = ChiTietDonHang
        fields = ['id', 'bien_the', 'ten_san_pham', 'size', 'mau', 'so_luong_san_pham', 'gia_mua']


class DonHangSerializer(serializers.ModelSerializer):
    details = ChiTietDonHangSerializer(many=True, read_only=True)
    nguoi_mua_name = serializers.CharField(source='nguoi_mua.ten', read_only=True)
    trang_thai_display = serializers.CharField(source='get_trang_thai_display', read_only=True)

    class Meta:
        model = DonHang
        fields = ['id', 'nguoi_mua', 'nguoi_mua_name', 'tong_tien', 'trang_thai', 'trang_thai_display', 'ngay_dat', 'ngay_nhan_du_kien', 'id_chu_shop', 'details']