# pyrefly: ignore [missing-import]
from django.db import models

class GioHang(models.Model):
    nguoi_mua = models.ForeignKey('users.NguoiMua', on_delete=models.CASCADE, verbose_name="Người mua")
    bien_the = models.ForeignKey('products.BienTheSanPham', on_delete=models.CASCADE, verbose_name="Biến thể sản phẩm")
    so_luong = models.IntegerField(default=1, verbose_name="Số lượng")
    ngay_them = models.DateField(auto_now_add=True, verbose_name="Ngày thêm")

    def __str__(self):
        return f"Giỏ hàng của {self.nguoi_mua.ten} - {self.bien_the.san_pham.ten} (Size: {self.bien_the.size}, SL: {self.so_luong})"

    def get_total_price(self):
        return self.bien_the.san_pham.gia_tien * self.so_luong

    class Meta:
        verbose_name = "Giỏ hàng"
        verbose_name_plural = "Giỏ hàng"


class DonHang(models.Model):
    TRANG_THAI_CHOICES = (
        (0, 'Chờ xử lý'),
        (1, 'Đang giao'),
        (2, 'Đã giao'),
        (3, 'Đã hủy'),
    )
    nguoi_mua = models.ForeignKey('users.NguoiMua', on_delete=models.CASCADE, verbose_name="Người mua")
    tong_tien = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Tổng tiền")
    trang_thai = models.SmallIntegerField(choices=TRANG_THAI_CHOICES, default=0, verbose_name="Trạng thái")
    ngay_dat = models.DateField(auto_now_add=True, verbose_name="Ngày đặt")
    ngay_nhan_du_kien = models.DateField(null=True, blank=True, verbose_name="Ngày nhận dự kiến")
    id_chu_shop = models.IntegerField(null=True, blank=True, verbose_name="ID Chủ shop")

    def __str__(self):
        return f"Đơn hàng #{self.id} của {self.nguoi_mua.ten} - Tổng: {self.tong_tien}đ"

    class Meta:
        verbose_name = "Đơn hàng"
        verbose_name_plural = "Đơn hàng"


class ChiTietDonHang(models.Model):
    don_hang = models.ForeignKey(DonHang, on_delete=models.CASCADE, related_name='details', verbose_name="Đơn hàng")
    bien_the = models.ForeignKey('products.BienTheSanPham', on_delete=models.PROTECT, verbose_name="Biến thể sản phẩm")
    so_luong_san_pham = models.IntegerField(verbose_name="Số lượng")
    gia_mua = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Giá mua lúc đặt")

    def __str__(self):
        return f"{self.so_luong_san_pham} x {self.bien_the.san_pham.ten} (Size: {self.bien_the.size}) cho Đơn #{self.don_hang.id}"

    class Meta:
        verbose_name = "Chi tiết đơn hàng"
        verbose_name_plural = "Chi tiết đơn hàng"