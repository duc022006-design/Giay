from django.db import models

class SanPham(models.Model):
    ten = models.CharField(max_length=255, verbose_name="Tên giày")
    thuong_hieu = models.CharField(max_length=255, verbose_name="Thương hiệu")
    gia_tien = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá tiền")
    id_chu_shop = models.IntegerField(null=True, blank=True, verbose_name="ID Chủ shop")
    mo_ta = models.TextField(null=True, blank=True, verbose_name="Mô tả")
    anh_dai_dien = models.CharField(max_length=255, null=True, blank=True, verbose_name="Ảnh đại diện")

    def __str__(self):
        return f"{self.ten} ({self.thuong_hieu})"

    class Meta:
        verbose_name = "Sản phẩm"
        verbose_name_plural = "Sản phẩm"


class BienTheSanPham(models.Model):
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE, related_name='variants', verbose_name="Sản phẩm")
    size = models.IntegerField(verbose_name="Size giày")
    mau = models.CharField(max_length=255, verbose_name="Màu sắc")
    so_luong_ton = models.IntegerField(default=0, verbose_name="Số lượng tồn kho")

    def __str__(self):
        return f"{self.san_pham.ten} - Size: {self.size} - Màu: {self.mau} (Tồn: {self.so_luong_ton})"

    class Meta:
        verbose_name = "Biến thể sản phẩm"
        verbose_name_plural = "Biến thể sản phẩm"


class DanhGia(models.Model):
    nguoi_mua = models.ForeignKey('users.NguoiMua', on_delete=models.CASCADE, verbose_name="Người mua")
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE, related_name='reviews', verbose_name="Sản phẩm")
    so_sao = models.SmallIntegerField(verbose_name="Số sao")
    binh_luan = models.TextField(null=True, blank=True, verbose_name="Bình luận")
    ngay_danh_gia = models.DateField(auto_now_add=True, verbose_name="Ngày đánh giá")

    def __str__(self):
        return f"Đánh giá {self.so_sao} sao cho {self.san_pham.ten} bởi {self.nguoi_mua.ten}"

    class Meta:
        verbose_name = "Đánh giá"
        verbose_name_plural = "Đánh giá"
