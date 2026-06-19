/**
 * Hàm xử lý khi người dùng nhấn nút Đăng Nhập
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // Backend Django SimpleJWT trả về access token
            localStorage.setItem('token', data.access);
            localStorage.setItem('user', JSON.stringify({ username: username }));
            
            // Đồng bộ giỏ hàng từ backend về localStorage
            try {
                const cartResponse = await fetch(`${API_BASE_URL}/cart-items/`, {
                    headers: { 'Authorization': `Bearer ${data.access}` }
                });
                if (cartResponse.ok) {
                    const dbCart = await cartResponse.json();
                    const localCart = dbCart.map(item => ({
                        id: item.product,
                        name: item.product_name,
                        price: parseFloat(item.product_price),
                        image: item.product_image,
                        size: item.size,
                        quantity: item.quantity
                    }));
                    localStorage.setItem('cart', JSON.stringify(localCart));
                }
            } catch (cartError) {
                console.error("Lỗi đồng bộ giỏ hàng khi đăng nhập:", cartError);
            }
            
            alert("Đăng nhập thành công!");
            
            // Nếu là admin thì chuyển hướng vào trang quản trị
            if (username === 'admin') {
                window.location.href = 'Owner/dashboard.html';
            } else {
                window.location.href = 'index.html'; // Trở về trang chủ
            }
        } else {
            alert("Sai tài khoản hoặc mật khẩu!");
        }
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        alert("Không thể kết nối với máy chủ.");
    }
}

// Gắn sự kiện submit cho form đăng nhập, dùng ?. để tránh lỗi
document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
