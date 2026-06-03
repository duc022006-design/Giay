# backend/urls.py
from django.contrib import admin
from django.urls import path, include

# Import các view của Simple JWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # URL để lấy token (đăng nhập)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # URL để làm mới token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Dòng này LUÔN LUÔN nên đặt ở cuối cùng
    # để nó chỉ xử lý những URL không khớp với các URL ở trên
    path('', include('cart.urls')),
]