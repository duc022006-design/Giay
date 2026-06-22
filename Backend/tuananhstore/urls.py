# tuananhstore/urls.py
from django.contrib import admin
from django.urls import path, include

# Import các view của Simple JWT
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from django.conf import settings
from django.conf.urls.static import static

from store.views import checkout, MyTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # URL để lấy token (đăng nhập)
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # URL để làm mới token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Checkout ở root level phục vụ cho frontend cũ
    path('checkout/', checkout, name='checkout'),

    # Các API khác của store app
    path('', include('store.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)