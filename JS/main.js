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
    // Tải Header
    fetch("component/header.html") 
        .then(response => response.text())
        .then(data => {
            const headerElement = document.getElementById("header");
            if(headerElement) {
                headerElement.innerHTML = data;
                updateHeaderAuth(); // Cập nhật nút Đăng nhập / Đăng ký / Đăng xuất
            }
        })
        .catch(error => console.error("Lỗi tải header:", error));
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

// Chạy hàm loadComponents khi trang vừa tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadComponents();
});
