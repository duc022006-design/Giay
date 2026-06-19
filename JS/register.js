/**
 * Hàm xử lý khi người dùng nhấn nút Đăng Ký
 */
async function handleRegister(event) {
    event.preventDefault(); // Ngăn chặn form tải lại trang

    // Lấy dữ liệu từ các input (Cần đảm bảo HTML của bạn có các ID tương ứng)
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Kiểm tra dữ liệu cơ bản
    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    try {
        // Gửi request POST tới Backend
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        let data = {};
        try {
            data = await response.json();
        } catch (e) {}

        if (response.ok) {
            // Tự động chuyển hướng ngay lập tức sang trang đăng nhập mà không cần bấm OK alert
            window.location.href = 'login.html';
        } else {
            // Trích xuất các lỗi kiểm tra (validation errors) từ Django
            let errors = [];
            for (let key in data) {
                if (Array.isArray(data[key])) {
                    errors.push(`${key}: ${data[key].join(', ')}`);
                } else if (typeof data[key] === 'string') {
                    errors.push(`${key}: ${data[key]}`);
                }
            }
            alert("Đăng ký thất bại!\n" + (errors.join('\n') || "Vui lòng kiểm tra lại thông tin."));
        }
    } catch (error) {
        console.error("Lỗi kết nối server:", error);
        alert("Lỗi hệ thống, vui lòng thử lại sau.");
    }
}

// Gắn sự kiện submit cho form đăng ký, dùng ?. để tránh lỗi nếu trang không có form này
document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
