from django.urls import path
from .views import (
    RegisterView,
    ProductListAPIView,
    ProductDetailAPIView,
    CartItemListAPIView,
    add_to_cart_api,
    add_multiple_to_cart_api,
    OrderListAPIView,
    OrderDetailAPIView,
    ReviewListCreateAPIView
)

urlpatterns = [
    # API endpoints
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/products/', ProductListAPIView.as_view(), name='product-list-api'),
    path('api/products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail-api'),
    path('api/cart-items/', CartItemListAPIView.as_view(), name='cart_item_list_api'),
    path('api/add-to-cart/', add_to_cart_api, name='add_to_cart_api'),
    path('api/add-multiple-to-cart/', add_multiple_to_cart_api, name='add_multiple_to_cart_api'),
    path('api/orders/', OrderListAPIView.as_view(), name='order-list-api'),
    path('api/orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail-api'),
    path('api/reviews/', ReviewListCreateAPIView.as_view(), name='review-list-create'),
]
