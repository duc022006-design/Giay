from django.db import models
from django.contrib.auth.models import User

class NguoiMua(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile', null=True, blank=True)
    tai_khoan = models.CharField(max_length=255, unique=True)
    mat_khau = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    so_dien_thoai = models.CharField(max_length=255, null=True, blank=True)
    ten = models.CharField(max_length=255)

    def __str__(self):
        return self.ten or self.tai_khoan

    class Meta:
        verbose_name = "Người mua"
        verbose_name_plural = "Người mua"
