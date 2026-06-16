from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import NguoiMua

class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        phone = request.data.get('phone', '')
        name = request.data.get('name', '')

        if not username or not password or not email:
            return Response(
                {"error": "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Tên đăng nhập đã tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email đã tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Tạo tài khoản User Django
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=name
            )
            # Tạo profile NguoiMua liên kết tương ứng
            NguoiMua.objects.create(
                user=user,
                tai_khoan=username,
                mat_khau=user.password, # Lưu dạng băm mật khẩu
                email=email,
                so_dien_thoai=phone,
                ten=name or username
            )
            return Response(
                {"message": "Đăng ký tài khoản thành công!"},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Lỗi máy chủ: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
