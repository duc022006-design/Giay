from django.urls import path
from .views import add_multiple_to_cart_api
from .views import (
    home, 
    cart_page, 
    product_detail_view, 
    update_quantity,
    delete_item,
    checkout,
    # API Views
    add_to_cart_api, 
    CartItemListAPIView,
    ProductListAPIView, 
    ProductDetailAPIView,
    # Order API
    OrderListAPIView,
    OrderDetailAPIView
)

urlpatterns = [
    # URLs cho trang web
    path('', home, name='home'),
    path('cart/', cart_page, name='cart_page'),
    path('products/<int:product_id>/', product_detail_view, name='product_detail'),
    
    # URLs cho các hành động trong giỏ hàng
    path('update-quantity/<int:item_id>/', update_quantity, name='update_quantity'),
    path('delete-item/<int:item_id>/', delete_item, name='delete_item'),
    path('checkout/', checkout, name='checkout'),
    
    # URLs cho API
    path('api/add-to-cart/', add_to_cart_api, name='add_to_cart_api'),
    path('api/cart-items/', CartItemListAPIView.as_view(), name='cart_item_list_api'),
    path('api/products/', ProductListAPIView.as_view(), name='product-list-api'),
    path('api/products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail-api'),
    path('api/orders/', OrderListAPIView.as_view(), name='order-list-api'),
    path('api/orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail-api'),
    path('api/add-multiple-to-cart/', add_multiple_to_cart_api, name='add_multiple_to_cart_api'),
]