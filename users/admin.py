# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import NguoiMua

@admin.register(NguoiMua)
class NguoiMuaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tai_khoan', 'email', 'so_dien_thoai', 'ten')
    search_fields = ('tai_khoan', 'email', 'ten')
