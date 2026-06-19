let editingProductId = null; // Biến lưu trạng thái đang sửa
let cachedProducts = [];     // Cache danh sách sản phẩm phục vụ thống kê & tìm kiếm
let cachedOrders = [];       // Cache danh sách đơn hàng phục vụ thống kê & tìm kiếm

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if (response.ok) {
            const products = await response.json();
            cachedProducts = products;
            renderProductsList(products);
        }
    } catch(err) {
        console.error("Lỗi khi tải danh sách sản phẩm", err);
    }
}

function renderProductsList(products) {
    const tbody = document.getElementById('inventory-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Không tìm thấy sản phẩm nào</td></tr>';
        return;
    }
    
    products.forEach(p => {
        const imageUrl = p.image ? p.image : '../../images/giay-da-bong.jpg';
        const statusHtml = p.quantity > 0 
            ? `<span class="badge in-stock">Còn hàng (${p.quantity})</span>` 
            : `<span class="badge out-stock">Hết hàng</span>`;
        
        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${imageUrl}" alt="Shoe">
                        <span>${p.name}</span>
                    </div>
                </td>
                <td>${p.brand || 'Khác'}</td>
                <td>${formatCurrencyVND(p.price)}</td>
                <td>${statusHtml}</td>
                <td>
                    <div class="action-btns">
                        <button type="button" class="btn-icon edit" onclick="editProduct(${p.id})"><i class='bx bx-edit-alt'></i></button>
                        <button type="button" class="btn-icon delete" onclick="deleteProduct(${p.id})"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * Hàm thêm hoặc cập nhật một đôi giày (Chỉ dành cho chủ cửa hàng)
 */
async function addOrUpdateProduct(event) {
    event.preventDefault();

    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const brand = document.getElementById('shoe-brand').value;
    const quantity = document.getElementById('productQuantity').value;
    const sizes = document.getElementById('productSizes').value;
    const desc = document.getElementById('shoe-desc').value;
    const imageFile = document.getElementById('productImageFile').files[0];

    const token = localStorage.getItem('token'); // Bắt buộc phải có token Admin
    if(!token) {
        alert("Bạn chưa đăng nhập hoặc không có quyền Admin!");
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('brand', brand);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('sizes', sizes);
    formData.append('description', desc);
    
    // Chỉ đính kèm file nếu người dùng có chọn file mới
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const url = editingProductId ? `${API_BASE_URL}/products/${editingProductId}/` : `${API_BASE_URL}/products/`;
    const method = editingProductId ? 'PATCH' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            alert(editingProductId ? "Đã cập nhật thành công!" : "Đã thêm giày mới thành công!");
            resetForm();
            loadProducts(); // Load lại bảng
        } else {
            const errData = await response.json();
            if (response.status === 401 || (errData && errData.code === 'token_not_valid')) {
                alert("Phiên làm việc của bạn đã hết hạn (Token hết hạn). Vui lòng đăng nhập lại!");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../login.html';
                return;
            }
            alert("Đã xảy ra lỗi: " + JSON.stringify(errData));
        }
    } catch (error) {
        console.error("Lỗi khi lưu sản phẩm:", error);
    }
}

document.getElementById('addProductForm')?.addEventListener('submit', addOrUpdateProduct);

async function deleteProduct(productId) {
    if(!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert("Xóa thành công!");
            loadProducts();
        } else {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 401 || (errData && errData.code === 'token_not_valid')) {
                alert("Phiên làm việc của bạn đã hết hạn (Token hết hạn). Vui lòng đăng nhập lại!");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../login.html';
                return;
            }
            alert("Lỗi khi xóa! Bạn có phải là Admin?");
        }
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/`);
        if(response.ok) {
            const p = await response.json();
            
            // Đổ dữ liệu lên form
            document.getElementById('productName').value = p.name;
            document.getElementById('productPrice').value = p.price;
            document.getElementById('shoe-brand').value = p.brand || 'Khác';
            document.getElementById('productQuantity').value = p.quantity;
            document.getElementById('productSizes').value = p.sizes || '39,40,41,42,43,44,45';
            document.getElementById('shoe-desc').value = p.description || '';
            
            // Bỏ require cho thẻ input file khi đang edit (nếu không chọn file mới thì giữ nguyên file cũ)
            document.getElementById('productImageFile').required = false;

            // Đổi text nút Submit và thẻ Tiêu đề form
            const formBtn = document.querySelector('#addProductForm button[type="submit"]');
            if(formBtn) formBtn.innerText = 'Cập nhật Sản Phẩm';
            
            const formHeader = document.querySelector('.add-product-card h2');
            if(formHeader) formHeader.innerHTML = `<i class='bx bx-edit-alt'></i> Đang Sửa: ${p.name}`;

            editingProductId = productId; // Gắn cờ đang sửa
            
            // Cuộn lên đầu trang chỗ form
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Lỗi tải thông tin sản phẩm", error);
    }
}

function resetForm() {
    document.getElementById('addProductForm').reset();
    document.getElementById('productImageFile').required = true;
    editingProductId = null;
    
    const formBtn = document.querySelector('#addProductForm button[type="submit"]');
    if(formBtn) formBtn.innerText = 'Lưu Sản Phẩm';
    
    const formHeader = document.querySelector('.add-product-card h2');
    if(formHeader) formHeader.innerHTML = `<i class='bx bx-plus-circle'></i> Thêm Sản Phẩm Mới`;
}

// Chạy hàm load khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    // Tải dữ liệu mặc định cho phần Tổng Quan
    loadOverviewStats();
});

// Chuyển đổi qua lại giữa các section trong dashboard
function switchSection(sectionId) {
    // Reset thanh tìm kiếm khi chuyển trang
    const searchInput = document.getElementById('dashboard-search');
    if (searchInput) searchInput.value = '';

    // Ẩn tất cả các phần nội dung
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Hiển thị phần nội dung được chọn
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
    
    // Cập nhật trạng thái active trên sidebar
    document.querySelectorAll('#sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('data-section') === sectionId) {
            li.classList.add('active');
        }
    });
    
    // Tải dữ liệu tương ứng
    if (sectionId === 'overview') {
        loadOverviewStats();
    } else if (sectionId === 'products') {
        loadProducts();
    } else if (sectionId === 'orders') {
        loadOrders();
    }
}

// Tải thông tin thống kê chung & cập nhật Widgets
async function loadOverviewStats() {
    try {
        // Tải danh sách sản phẩm
        const prodRes = await fetch(`${API_BASE_URL}/products/`);
        if (prodRes.ok) {
            cachedProducts = await prodRes.json();
        }
        
        // Tải danh sách đơn hàng
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const orderRes = await fetch(`${API_BASE_URL}/orders/`, { headers });
        if (orderRes.ok) {
            cachedOrders = await orderRes.json();
        }
        
        // Tính toán số liệu thống kê
        const totalProducts = cachedProducts.length;
        const totalOrders = cachedOrders.length;
        const totalRevenue = cachedOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
        
        // Cập nhật giao diện Widgets
        document.getElementById('stat-products').innerText = totalProducts;
        document.getElementById('stat-orders').innerText = totalOrders;
        document.getElementById('stat-revenue').innerText = formatCurrencyVND(totalRevenue);
        
        // Hiển thị 5 đơn hàng mới nhất
        const recentOrdersBody = document.getElementById('recent-orders-body');
        if (recentOrdersBody) {
            recentOrdersBody.innerHTML = '';
            const recentOrders = cachedOrders.slice(0, 5);
            if (recentOrders.length === 0) {
                recentOrdersBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa có đơn hàng nào</td></tr>';
            } else {
                recentOrders.forEach(o => {
                    recentOrdersBody.innerHTML += `
                        <tr>
                            <td><strong>#${o.id}</strong></td>
                            <td>${new Date(o.created_at).toLocaleString('vi-VN')}</td>
                            <td style="color: var(--danger); font-weight: 600;">${formatCurrencyVND(o.total_price)}</td>
                            <td>
                                <button class="btn-icon edit" onclick="viewOrderDetails(${o.id})"><i class='bx bx-show'></i></button>
                            </td>
                        </tr>
                    `;
                });
            }
        }
        
        // Cảnh báo hết hàng/sắp hết hàng (tồn kho < 5)
        const lowStockBody = document.getElementById('low-stock-body');
        if (lowStockBody) {
            lowStockBody.innerHTML = '';
            const lowStockProducts = cachedProducts.filter(p => p.quantity < 5);
            if (lowStockProducts.length === 0) {
                lowStockBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--success); padding: 20px 0;">Không có sản phẩm nào sắp hết hàng</td></tr>';
            } else {
                lowStockProducts.forEach(p => {
                    const statusClass = p.quantity === 0 ? 'badge out-stock' : 'badge out-stock';
                    const statusText = p.quantity === 0 ? 'Hết hàng' : `Chỉ còn ${p.quantity}`;
                    lowStockBody.innerHTML += `
                        <tr>
                            <td>
                                <div class="product-cell">
                                    <img src="${p.image || '../../images/giay-da-bong.jpg'}" alt="Shoe" style="width: 32px; height: 32px;">
                                    <span style="font-size: 13px;">${p.name}</span>
                                </div>
                            </td>
                            <td><span class="${statusClass}">${statusText}</span></td>
                        </tr>
                    `;
                });
            }
        }
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu tổng quan:", err);
    }
}

// Tải toàn bộ đơn hàng
async function loadOrders() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        // Fetch products first if not cached
        if (cachedProducts.length === 0) {
            const prodRes = await fetch(`${API_BASE_URL}/products/`);
            if (prodRes.ok) cachedProducts = await prodRes.json();
        }
        
        const response = await fetch(`${API_BASE_URL}/orders/`, { headers });
        if (response.ok) {
            const orders = await response.json();
            cachedOrders = orders;
            renderOrders(orders);
        }
    } catch (err) {
        console.error("Lỗi khi tải danh sách đơn hàng:", err);
    }
}

// Render danh sách đơn hàng ra bảng
function renderOrders(orders) {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">Không tìm thấy đơn hàng nào</td></tr>';
        return;
    }
    
    orders.forEach(o => {
        const itemsHtml = o.items.map(item => {
            const prod = cachedProducts.find(p => p.id === item.product);
            const name = prod ? prod.name : `Sản phẩm #${item.product}`;
            return `<div style="margin-bottom: 4px;"><strong>${name}</strong> (Size ${item.size}) x${item.quantity}</div>`;
        }).join('');
        
        tbody.innerHTML += `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${new Date(o.created_at).toLocaleString('vi-VN')}</td>
                <td>${itemsHtml}</td>
                <td style="color: var(--danger); font-weight: 600;">${formatCurrencyVND(o.total_price)}</td>
                <td>
                    <button class="btn-outline" style="display: flex; align-items: center; gap: 6px;" onclick="viewOrderDetails(${o.id})">
                        <i class='bx bx-show' style="font-size: 16px;"></i> Chi tiết
                    </button>
                </td>
            </tr>
        `;
    });
}

// Xem chi tiết một đơn hàng trên Modal
function viewOrderDetails(orderId) {
    const order = cachedOrders.find(o => o.id === orderId);
    if (!order) return;
    
    document.getElementById('modal-order-id').innerText = `#${order.id}`;
    document.getElementById('modal-order-date').innerText = new Date(order.created_at).toLocaleString('vi-VN');
    document.getElementById('modal-order-total').innerText = formatCurrencyVND(order.total_price);
    
    const itemsTbody = document.getElementById('modal-order-items');
    if (itemsTbody) {
        itemsTbody.innerHTML = '';
        order.items.forEach(item => {
            const prod = cachedProducts.find(p => p.id === item.product);
            const name = prod ? prod.name : `Sản phẩm #${item.product}`;
            const img = prod ? prod.image : '../../images/giay-da-bong.jpg';
            const unitPrice = parseFloat(item.price);
            const qty = item.quantity;
            const subtotal = unitPrice * qty;
            
            itemsTbody.innerHTML += `
                <tr>
                    <td>
                        <div class="product-cell">
                            <img src="${img}" alt="Shoe" style="width: 40px; height: 40px; border-radius: 6px;">
                            <span>${name}</span>
                        </div>
                    </td>
                    <td>${item.size}</td>
                    <td>${formatCurrencyVND(unitPrice)}</td>
                    <td>${qty}</td>
                    <td style="font-weight: 600;">${formatCurrencyVND(subtotal)}</td>
                </tr>
            `;
        });
    }
    
    document.getElementById('order-detail-modal').classList.add('active');
}

// Đóng modal chi tiết đơn hàng
function closeOrderModal() {
    document.getElementById('order-detail-modal').classList.remove('active');
}

// Xử lý tìm kiếm động
function handleSearch(query) {
    const q = query.toLowerCase().trim();
    
    // Tìm kiếm phần section đang active
    const activeSection = document.querySelector('.dashboard-section[style*="display: block"]') || 
                          document.querySelector('.dashboard-section:not([style*="display: none"])');
    if (!activeSection) return;
    
    const sectionId = activeSection.id;
    if (sectionId === 'products-section') {
        const filtered = cachedProducts.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.brand && p.brand.toLowerCase().includes(q))
        );
        renderProductsList(filtered);
    } else if (sectionId === 'orders-section') {
        const filtered = cachedOrders.filter(o => {
            if (o.id.toString().includes(q)) return true;
            return o.items.some(item => {
                const prod = cachedProducts.find(p => p.id === item.product);
                return prod && prod.name.toLowerCase().includes(q);
            });
        });
        renderOrders(filtered);
    }
}
