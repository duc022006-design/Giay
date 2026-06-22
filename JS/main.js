// URL của Backend API (Thay đổi cho phù hợp với server của bạn)
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Hàm định dạng số tiền sang chuẩn VNĐ (Ví dụ: 100000 -> 100.000 đ)
 */
function formatCurrencyVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Hàm tải Header và Footer chung cho các trang
 */
function loadComponents() {
    const headerElement = document.getElementById("header");

    // Nếu header đã có nội dung inline (ví dụ dashboard.html), không cần fetch
    if (headerElement && headerElement.innerHTML.trim() !== '') {
        updateHeaderAuth();
        return;
    }

    // Tự động chọn đường dẫn đúng theo độ sâu thư mục của trang hiện tại
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    // HTML/Owner/ có depth >= 3 (FrontendShoeWeb--main/HTML/Owner/...)
    // HTML/ có depth == 2
    const prefix = depth >= 3 ? '../' : '';

    fetch(`${prefix}component/header.html`)
        .then(response => {
            if (!response.ok) throw new Error('Header not found');
            return response.text();
        })
        .then(data => {
            if (headerElement) {
                headerElement.innerHTML = data;
                updateHeaderAuth();
            }
        })
        .catch(error => console.warn("Lỗi tải header (bỏ qua nếu dùng header tĩnh):", error));
}

/**
 * Kiểm tra người dùng đã đăng nhập chưa thông qua localStorage
 */
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

/**
 * Hàm Đăng xuất
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Xóa giỏ hàng cục bộ khi đăng xuất để tránh lộ dữ liệu
    window.location.href = 'login.html'; // Chuyển hướng về trang đăng nhập
}

/**
 * Cập nhật hiển thị các nút trên header dựa theo trạng thái đăng nhập
 */
function updateHeaderAuth() {
    const navRegister = document.getElementById('nav-register');
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');

    if (isLoggedIn()) {
        if (navRegister) navRegister.style.display = 'none';
        if (navLogin) navLogin.style.display = 'none';
        if (navLogout) navLogout.style.display = 'block';
    } else {
        if (navRegister) navRegister.style.display = 'block';
        if (navLogin) navLogin.style.display = 'block';
        if (navLogout) navLogout.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponents();
});
