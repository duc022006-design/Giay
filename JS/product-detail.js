// product-detail.js

const MOCK_PRODUCTS = [
    {
        id: 101,
        name: "Nike Air Max 90 Ultimate",
        brand: "Nike",
        price: 3450000,
        image: "../images/nike.jpg",
        description: "Thiết kế kinh điển mang lại sự thoải mái tối đa nhờ công nghệ Air Max nổi tiếng. Thích hợp cho cả chạy bộ và phong cách thời trang năng động hàng ngày."
    },
    {
        id: 102,
        name: "Adidas Ultraboost Light",
        brand: "Adidas",
        price: 4500000,
        image: "../images/adidas.jpg",
        description: "Thế hệ Ultraboost mới nhất siêu nhẹ, mang lại phản hồi lực tuyệt vời với đế Boost cao cấp. Upper bằng vải sợi dệt thoáng khí giúp bạn thoải mái cả ngày."
    },
    {
        id: 103,
        name: "Puma Suede Classic Plus",
        brand: "Puma",
        price: 2200000,
        image: "../images/Puma.avif",
        description: "Mẫu giày da lộn huyền thoại của Puma, giữ nguyên nét thiết kế cổ điển phong trần từ thập niên 80. Thích hợp cho các set đồ streetwear cá tính."
    },
    {
        id: 104,
        name: "Nike ACG Trail Fly",
        brand: "Nike",
        price: 3800000,
        image: "../images/NIKE+ACG+ULTRAFLY+TRAIL.avif",
        description: "Dòng sản phẩm chuyên dụng cho dã ngoại, leo núi ngoài trời của Nike. Đế gai bám đường tốt và thân giày chống nước nhẹ bảo vệ đôi chân tối đa."
    },
    {
        id: 105,
        name: "Giày Thể Thao Đa Năng",
        brand: "Khác",
        price: 950000,
        image: "../images/giay-da-bong.jpg",
        description: "Đôi giày thể thao đa năng, linh hoạt cho nhiều hoạt động như tập gym, chạy bộ ngắn hoặc đi học, đi chơi. Chất liệu bền bỉ và giá thành hợp lý."
    }
];

let currentProduct = null;
let selectedSize = "40"; // Mặc định chọn size 40
let detailQuantity = 1; // Số lượng đặt mua mặc định

document.addEventListener("DOMContentLoaded", () => {
    // Lấy ID sản phẩm từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (productId) {
        loadProductDetail(productId);
    } else {
        showProductError();
    }
});

async function loadProductDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}/`);
        if (response.ok) {
            currentProduct = await response.json();
            renderProductDetail(currentProduct);
        } else {
            throw new Error("Không lấy được thông tin từ API");
        }
    } catch (error) {
        console.warn("Lỗi kết nối API, tìm kiếm trong mock products cho ID:", id);
        currentProduct = MOCK_PRODUCTS.find(p => p.id === id);
        if (currentProduct) {
            renderProductDetail(currentProduct);
        } else {
            showProductError();
        }
    }
}

function renderProductDetail(product) {
    const detailContainer = document.getElementById('product-detail-content');
    if (!detailContainer) return;

    const imageUrl = product.image ? product.image : '../images/giay-da-bong.jpg';
    const description = product.description || "Chưa có mô tả chi tiết cho sản phẩm này. Sản phẩm chính hãng 100%, bảo hành 6 tháng.";

    // Lấy danh sách kích cỡ từ product.sizes, nếu không có thì mặc định từ 39 đến 45
    const sizes = product.sizes ? product.sizes.split(',').map(s => s.trim()).filter(s => s !== '') : ["39", "40", "41", "42", "43", "44", "45"];
    
    // Đặt mặc định kích cỡ được chọn ban đầu
    if (sizes.length > 0) {
        if (sizes.includes("40")) {
            selectedSize = "40";
        } else {
            selectedSize = sizes[0];
        }
    }

    // Tạo HTML cho danh sách kích cỡ dựa theo định dạng ở dashboard
    let sizeGridHTML = '';
    sizes.forEach(size => {
        const isSelected = String(size) === String(selectedSize) ? 'selected' : '';
        sizeGridHTML += `<button class="size-btn ${isSelected}" onclick="selectSize('${size.replace(/'/g, "\\'")}', this)">${size}</button>`;
    });

    const detailHTML = `
        <div class="detail-left">
            <img id="product-img" src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='../images/giay-da-bong.jpg';">
        </div>
        <div class="detail-right">
            <div>
                <p class="product-brand" id="product-brand">${product.brand || 'Khác'}</p>
                <h1 class="product-title" id="product-title">${product.name}</h1>
            </div>
            
            <p class="product-price" id="product-price">${formatCurrencyVND(product.price)}</p>
            
            <!-- Chọn Kích cỡ -->
            <div class="size-section">
                <div class="size-header">
                    <span>Chọn Kích Cỡ</span>
                    <span class="size-guide" onclick="alert('Hãy chọn kích cỡ giày phù hợp nhất với chân bạn!')">Hướng dẫn chọn size</span>
                </div>
                <div class="size-grid" id="size-grid">
                    ${sizeGridHTML}
                </div>
            </div>

            <!-- Chọn Số Lượng -->
            <div class="quantity-section" style="display: flex; align-items: center; gap: 15px; margin-top: 10px; margin-bottom: 5px;">
                <span style="font-weight: 600; font-size: 15px; color: #333;">Số lượng:</span>
                <div style="display: flex; align-items: center; border: 1px solid #ddd; border-radius: 20px; overflow: hidden; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <button onclick="changeDetailQuantity(-1)" style="border: none; background: none; padding: 8px 16px; cursor: pointer; font-size: 16px; font-weight: bold; color: #666; transition: 0.2s; outline: none;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">-</button>
                    <span id="detail-quantity" style="padding: 0 10px; font-weight: 600; min-width: 30px; text-align: center; font-size: 15px; color: #111;">1</span>
                    <button onclick="changeDetailQuantity(1)" style="border: none; background: none; padding: 8px 16px; cursor: pointer; font-size: 16px; font-weight: bold; color: #666; transition: 0.2s; outline: none;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'">+</button>
                </div>
                <span style="font-size: 13px; color: #888;">(Còn lại: ${product.quantity || 0} sản phẩm)</span>
            </div>

            <!-- Các nút hành động -->
            <div class="btn-group">
                <button class="add-bag-btn" onclick="addProductToCart()">Thêm vào giỏ hàng</button>
                <button class="fav-btn" onclick="toggleFavourite(${product.id}, '${product.name}')">
                    <span>Yêu thích</span> 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart" id="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
            </div>

            <!-- Mô tả chi tiết -->
            <div class="product-desc">
                <h4>Mô tả sản phẩm</h4>
                <p id="product-desc-text">${description}</p>
            </div>
        </div>
    `;
    
    detailContainer.innerHTML = detailHTML;
}

function selectSize(size, element) {
    selectedSize = size;
    // Bỏ chọn các nút khác
    const buttons = document.querySelectorAll('#size-grid .size-btn:not(.disabled)');
    buttons.forEach(btn => btn.classList.remove('selected'));
    // Chọn nút hiện tại
    element.classList.add('selected');
}

function changeDetailQuantity(amount) {
    detailQuantity += amount;
    if (detailQuantity < 1) detailQuantity = 1;
    
    // Giới hạn số lượng mua theo tồn kho tối đa của sản phẩm
    if (currentProduct && currentProduct.quantity !== undefined && detailQuantity > currentProduct.quantity) {
        detailQuantity = currentProduct.quantity;
        alert(`Số lượng tồn kho chỉ còn tối đa ${currentProduct.quantity} sản phẩm!`);
    }
    
    const qtyElement = document.getElementById('detail-quantity');
    if (qtyElement) {
        qtyElement.innerText = detailQuantity;
    }
}

function addProductToCart() {
    if (!currentProduct) return;
    if (!selectedSize) {
        alert("Vui lòng chọn kích cỡ giày của bạn!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Tìm sản phẩm cùng ID và cùng Size trong giỏ
    let existingItem = cart.find(item => item.id === currentProduct.id && String(item.size) === String(selectedSize));
    
    const imageUrl = currentProduct.image ? currentProduct.image : '../images/giay-da-bong.jpg';

    if (existingItem) {
        existingItem.quantity += detailQuantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: imageUrl,
            size: selectedSize,
            quantity: detailQuantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Đồng bộ ngay lập tức lên cơ sở dữ liệu nếu đã đăng nhập
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/add-to-cart/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: currentProduct.id,
                size: selectedSize,
                quantity: detailQuantity
            })
        }).catch(err => console.error("Lỗi đồng bộ giỏ hàng lên backend:", err));
    }

    alert(`Đã thêm ${detailQuantity} sản phẩm "${currentProduct.name}" (Size: ${selectedSize}) vào giỏ hàng thành công!`);

    // Reset lại số lượng về 1 sau khi thêm thành công
    detailQuantity = 1;
    const qtyElement = document.getElementById('detail-quantity');
    if (qtyElement) {
        qtyElement.innerText = detailQuantity;
    }
}

function toggleFavourite(id, name) {
    const heart = document.getElementById('heart-icon');
    if (heart) {
        if (heart.getAttribute('fill') === 'currentColor') {
            heart.setAttribute('fill', 'none');
            alert(`Đã bỏ "${name}" khỏi mục yêu thích.`);
        } else {
            heart.setAttribute('fill', 'currentColor');
            heart.style.color = '#ff4d4f';
            alert(`Đã thêm "${name}" vào mục yêu thích!`);
        }
    }
}

function showProductError() {
    const detailContainer = document.getElementById('product-detail-content');
    if (detailContainer) {
        detailContainer.innerHTML = `
            <div style="text-align: center; width: 100%; padding: 50px 0;">
                <h2 style="color: #ff4d4f;">Không tìm thấy sản phẩm hoặc thông tin không hợp lệ!</h2>
                <p>Vui lòng quay lại <a href="products.html" style="color: #007bff; font-weight: 600;">Trang sản phẩm</a> và chọn lại.</p>
            </div>
        `;
    }
}
