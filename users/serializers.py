from rest_framework import serializers
from .models import NguoiMua

class NguoiMuaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NguoiMua
        fields = ['id', 'tai_khoan', 'email', 'so_dien_thoai', 'ten']
