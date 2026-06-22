/**
 * Hàm hiển thị giỏ hàng từ localStorage
 */
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (!cartContainer) return;
    cartContainer.innerHTML = '';
    
    let totalPrice = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="grid-column: span 2; text-align: center; color: #555;">Giỏ hàng của bạn đang trống.</p>';
        if(totalElement) totalElement.innerText = formatCurrencyVND(0);
        return;
    }

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        const rowHTML = `
            <div class="cart-item">
                <input type="checkbox" class="select-item" checked>
                <figure>
                    <img src="${item.image || '../images/giay-da-bong.jpg'}" alt="${item.name}" onerror="this.onerror=null; this.src='../images/giay-da-bong.jpg';">
                </figure>
                <div class="info">
                    <h2>${item.name}</h2>
                    <p>Size: ${item.size || 40}</p>
                    <p>Đơn giá: ${formatCurrencyVND(item.price)}</p>
                    <p>Thành tiền: <strong>${formatCurrencyVND(itemTotal)}</strong></p>
                    <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                        <label>Số lượng:</label>
                        <input type="number" value="${item.quantity}" min="1" style="width: 50px; padding: 4px; border-radius: 6px; border: 1px solid #ddd;" onchange="updateQuantity(${index}, this.value)">
                    </div>
                    <button class="remove" onclick="removeFromCart(${index})">Xóa</button>
                </div>
            </div>
        `;
        cartContainer.insertAdjacentHTML('beforeend', rowHTML);
    });

    if(totalElement) {
        totalElement.innerText = formatCurrencyVND(totalPrice);
    }
}

/**
 * Hàm cập nhật số lượng sản phẩm
 */
async function updateQuantity(index, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    if(!cart || !cart[index]) return;
    
    const item = cart[index];
    const qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty < 1) {
        alert("Số lượng phải lớn hơn hoặc bằng 1.");
        renderCart();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${item.id}/`);
        if (response.ok) {
            const product = await response.json();
            let stock = 0;
            if (product.variants && product.variants.length > 0) {
                const variant = product.variants.find(v => String(v.size) === String(item.size || 40));
                stock = variant ? variant.stock : 0;
            } else {
                stock = product.quantity || 0;
            }

            if (qty > stock) {
                alert(`Không thể thay đổi. Số lượng yêu cầu (${qty}) vượt quá số lượng tồn kho cho Size ${item.size || 40} (Còn lại: ${stock} sản phẩm).`);
                renderCart();
                return;
            }
        }
    } catch (err) {
        console.error("Lỗi kiểm tra tồn kho khi cập nhật số lượng:", err);
    }
    
    cart[index].quantity = qty;
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    syncCartToBackend();
}

/**
 * Hàm xóa sản phẩm khỏi giỏ hàng
 */
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    if(!cart) return;
    
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    syncCartToBackend();
}

/**
 * Đồng bộ giỏ hàng từ localStorage lên Backend Database
 */
async function syncCartToBackend() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsToSync = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        size: item.size || 40
    }));

    try {
        await fetch(`${API_BASE_URL}/add-multiple-to-cart/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(itemsToSync)
        });
    } catch (error) {
        console.error("Lỗi tự động đồng bộ giỏ hàng:", error);
    }
}

/**
 * Hàm Gửi yêu cầu Thanh Toán (Đặt hàng) lên Backend
 */
async function checkout() {
    if (!isLoggedIn()) {
        alert("Vui lòng đăng nhập trước khi thanh toán!");
        window.location.href = 'login.html';
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart'));
    if (!cart || cart.length === 0) return alert("Giỏ hàng trống!");

    const token = localStorage.getItem('token');
    try {
        // Bước 1: Gửi giỏ hàng từ localStorage lên server
        const itemsToSync = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            size: item.size || 40
        }));

        const syncResponse = await fetch(`${API_BASE_URL}/add-multiple-to-cart/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(itemsToSync)
        });

        if (!syncResponse.ok) {
            alert("Đồng bộ giỏ hàng thất bại!");
            return;
        }

        // Bước 2: Gửi yêu cầu đặt hàng (checkout) qua API thay vì dùng form submit để tránh lỗi mất template
        const checkoutResponse = await fetch('http://localhost:8000/checkout/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (checkoutResponse.ok) {
            localStorage.removeItem('cart');
            alert("Đặt hàng thành công!");
            window.location.href = 'index.html';
        } else {
            const errData = await checkoutResponse.json().catch(() => ({}));
            alert("Thanh toán thất bại: " + (errData.error || "Lỗi không xác định"));
        }
        
    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
    }
}

document.addEventListener("DOMContentLoaded", renderCart);