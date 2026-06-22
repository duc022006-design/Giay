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
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/products/${id}/`, { headers });
        if (response.ok) {
            currentProduct = await response.json();
            renderProductDetail(currentProduct);
            loadProductReviews(id);
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
    
    // Đặt mặc định kích cỡ được chọn ban đầu (ưu tiên size còn hàng)
    if (sizes.length > 0) {
        const availableSizes = sizes.filter(size => {
            const variant = product.variants ? product.variants.find(v => String(v.size) === String(size)) : null;
            return variant ? variant.stock > 0 : true;
        });
        
        if (availableSizes.length > 0) {
            if (availableSizes.includes("40")) {
                selectedSize = "40";
            } else {
                selectedSize = availableSizes[0];
            }
        } else {
            selectedSize = sizes.includes("40") ? "40" : sizes[0];
        }
    }

    // Tạo HTML cho danh sách kích cỡ dựa theo định dạng ở dashboard
    let sizeGridHTML = '';
    sizes.forEach(size => {
        const variant = product.variants ? product.variants.find(v => String(v.size) === String(size)) : null;
        const stock = variant ? variant.stock : 0;
        
        let btnClass = 'size-btn';
        if (product.variants && stock === 0) {
            btnClass += ' disabled';
        }
        if (String(size) === String(selectedSize)) {
            btnClass += ' selected';
        }
        sizeGridHTML += `<button class="${btnClass}" onclick="selectSize('${size.replace(/'/g, "\\'")}', this)">${size}</button>`;
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
                    <button onclick="changeDetailQuantity(-1)" style="border: none; background: none; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; outline: none;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'"><i class='bx bx-minus' style="font-size: 16px; color: #666;"></i></button>
                    <span id="detail-quantity" style="padding: 0 10px; font-weight: 600; min-width: 30px; text-align: center; font-size: 15px; color: #111;">1</span>
                    <button onclick="changeDetailQuantity(1)" style="border: none; background: none; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; outline: none;" onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor='transparent'"><i class='bx bx-plus' style="font-size: 16px; color: #666;"></i></button>
                </div>
                <span id="selected-size-stock-label" style="font-size: 13px; color: #888;">(Còn lại: ${product.quantity || 0} sản phẩm)</span>
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
    updateStockDisplayForSelectedSize();
}

function updateStockDisplayForSelectedSize() {
    if (!currentProduct) return;
    
    let stock = 0;
    if (currentProduct.variants && currentProduct.variants.length > 0) {
        const variant = currentProduct.variants.find(v => String(v.size) === String(selectedSize));
        if (variant) {
            stock = variant.stock;
        }
    } else {
        stock = currentProduct.quantity || 0;
    }
    
    const stockLabel = document.getElementById('selected-size-stock-label');
    if (stockLabel) {
        stockLabel.innerText = `(Còn lại: ${stock} sản phẩm)`;
    }
}

function selectSize(size, element) {
    if (element.classList.contains('disabled')) return;
    selectedSize = size;
    // Bỏ chọn các nút khác
    const buttons = document.querySelectorAll('#size-grid .size-btn:not(.disabled)');
    buttons.forEach(btn => btn.classList.remove('selected'));
    // Chọn nút hiện tại
    element.classList.add('selected');
    
    // Cập nhật số lượng tồn kho hiển thị
    updateStockDisplayForSelectedSize();
    
    // Reset lại số lượng chi tiết mua về 1
    detailQuantity = 1;
    const qtyElement = document.getElementById('detail-quantity');
    if (qtyElement) {
        qtyElement.innerText = detailQuantity;
    }
}

function changeDetailQuantity(amount) {
    const qtyElement = document.getElementById('detail-quantity');
    if (!qtyElement) return;

    let currentQty = parseInt(qtyElement.innerText) || 1;
    currentQty += amount;
    if (currentQty < 1) currentQty = 1;
    
    let stock = 0;
    if (currentProduct) {
        if (currentProduct.variants && currentProduct.variants.length > 0) {
            const variant = currentProduct.variants.find(v => String(v.size) === String(selectedSize));
            if (variant) {
                stock = variant.stock;
            }
        } else {
            stock = currentProduct.quantity || 0;
        }
    }
    
    // Giới hạn số lượng mua theo tồn kho tối đa của size đã chọn
    if (currentQty > stock) {
        currentQty = stock > 0 ? stock : 1;
        alert(`Số lượng tồn kho cho Size ${selectedSize} chỉ còn tối đa ${stock} sản phẩm!`);
    }
    
    detailQuantity = currentQty;
    qtyElement.innerText = detailQuantity;
}

function addProductToCart() {
    if (!currentProduct) return;
    if (!selectedSize) {
        alert("Vui lòng chọn kích cỡ giày của bạn!");
        return;
    }

    let stock = 0;
    if (currentProduct.variants && currentProduct.variants.length > 0) {
        const variant = currentProduct.variants.find(v => String(v.size) === String(selectedSize));
        if (variant) {
            stock = variant.stock;
        }
    } else {
        stock = currentProduct.quantity || 0;
    }

    if (stock <= 0) {
        alert(`Kích cỡ ${selectedSize} hiện tại đã hết hàng! Vui lòng chọn size khác.`);
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Tìm sản phẩm cùng ID và cùng Size trong giỏ
    let existingItem = cart.find(item => item.id === currentProduct.id && String(item.size) === String(selectedSize));
    let currentInCart = existingItem ? (parseInt(existingItem.quantity) || 0) : 0;
    let addedQty = parseInt(detailQuantity) || 1;

    if (currentInCart + addedQty > stock) {
        alert(`Không thể thêm. Tổng số lượng trong giỏ hàng (${currentInCart + addedQty}) vượt quá số lượng tồn kho cho Size ${selectedSize} (Còn lại: ${stock} sản phẩm).`);
        return;
    }

    const imageUrl = currentProduct.image ? currentProduct.image : '../images/giay-da-bong.jpg';

    if (existingItem) {
        existingItem.quantity = (parseInt(existingItem.quantity) || 0) + addedQty;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: imageUrl,
            size: selectedSize,
            quantity: addedQty
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
                quantity: addedQty
            })
        }).catch(err => console.error("Lỗi đồng bộ giỏ hàng lên backend:", err));
    }

    alert(`Đã thêm ${addedQty} sản phẩm "${currentProduct.name}" (Size: ${selectedSize}) vào giỏ hàng thành công!`);

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

// === CÁC HÀM XỬ LÝ ĐÁNH GIÁ & BÌNH LUẬN ===
let selectedStarRating = 5;

function selectRatingStar(stars) {
    selectedStarRating = stars;
    for (let i = 1; i <= 5; i++) {
        const starBtn = document.getElementById(`star-${i}`);
        if (starBtn) {
            if (i <= stars) {
                starBtn.classList.add('active');
            } else {
                starBtn.classList.remove('active');
            }
        }
    }
}

async function loadProductReviews(productId) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/?product_id=${productId}`);
        if (!response.ok) throw new Error("Lỗi tải đánh giá");

        const reviews = await response.json();
        renderReviewsSection(reviews, productId);
    } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
        reviewsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #ff4d4f;">Không thể tải đánh giá sản phẩm.</div>`;
    }
}

function renderReviewsSection(reviews, productId) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    // Tính toán số liệu trung bình
    const totalReviews = reviews.length;
    let avgRating = 0;
    if (totalReviews > 0) {
        const sum = reviews.reduce((acc, curr) => acc + curr.stars, 0);
        avgRating = (sum / totalReviews).toFixed(1);
    }

    // Tạo HTML các ngôi sao trung bình
    let avgStarsHtml = '';
    const roundedAvg = Math.round(avgRating);
    for (let i = 1; i <= 5; i++) {
        avgStarsHtml += `<span style="color: ${i <= roundedAvg ? '#ffc107' : '#e0e0e0'}">★</span>`;
    }

    // Danh sách các review
    let reviewsListHTML = '';
    if (totalReviews === 0) {
        reviewsListHTML = `<p style="text-align: center; color: #888; padding: 40px 0; grid-column: span 2; width: 100%;">Chưa có lượt đánh giá nào cho sản phẩm này. Hãy là người đầu tiên mua và đánh giá sản phẩm!</p>`;
    } else {
        reviews.forEach(r => {
            const initial = r.user ? r.user.charAt(0).toUpperCase() : 'U';
            const dateStr = new Date(r.created_at).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<span style="color: ${i <= r.stars ? '#ffc107' : '#e0e0e0'}">★</span>`;
            }

            reviewsListHTML += `
                <div class="review-card">
                    <div class="review-card-header">
                        <div class="review-user-info">
                            <div class="user-avatar-circle">${initial}</div>
                            <div>
                                <div class="user-name-display">
                                    ${r.user}
                                    <span class="buyer-verified-badge"><i class='bx bx-check-shield'></i> Đã mua hàng</span>
                                </div>
                                <div class="review-card-stars">${starsHtml}</div>
                            </div>
                        </div>
                        <span class="review-card-date">${dateStr}</span>
                    </div>
                    <p class="review-card-content">${r.comment || 'Không có bình luận chi tiết.'}</p>
                </div>
            `;
        });
    }

    // Khung form đánh giá dựa trên trạng thái người dùng
    let formHTML = '';
    if (!isLoggedIn()) {
        formHTML = `
            <div class="review-notice">
                <i class='bx bx-info-circle' style="font-size: 20px;"></i>
                <span>Bạn cần <a href="login.html" style="color: #007bff; font-weight: 600; text-decoration: underline;">Đăng nhập</a> để viết bình luận và đánh giá sản phẩm này.</span>
            </div>
        `;
    } else if (currentProduct && !currentProduct.has_purchased) {
        if (currentProduct.has_history) {
            formHTML = `
                <div class="review-notice">
                    <i class='bx bx-check-double' style="font-size: 20px; color: #28a745;"></i>
                    <span>Bạn đã đánh giá sản phẩm này từ các lần mua trước. Hãy mua thêm để tiếp tục đánh giá!</span>
                </div>
            `;
        } else {
            formHTML = `
                <div class="review-notice">
                    <i class='bx bx-lock-alt' style="font-size: 20px;"></i>
                    <span>Bạn chỉ có thể gửi đánh giá sau khi đã mua đôi giày này thành công.</span>
                </div>
            `;
        }
    } else {
        // Cho phép đánh giá
        formHTML = `
            <div class="review-form-card">
                <h3>Viết đánh giá của bạn</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 14px; color: #555;">Chọn số sao:</span>
                    <div class="star-rating-select">
                        <button id="star-1" class="star-select-btn active" onclick="selectRatingStar(1)">★</button>
                        <button id="star-2" class="star-select-btn active" onclick="selectRatingStar(2)">★</button>
                        <button id="star-3" class="star-select-btn active" onclick="selectRatingStar(3)">★</button>
                        <button id="star-4" class="star-select-btn active" onclick="selectRatingStar(4)">★</button>
                        <button id="star-5" class="star-select-btn active" onclick="selectRatingStar(5)">★</button>
                    </div>
                </div>
                <textarea id="review-comment-input" class="comment-textarea" placeholder="Nhập bình luận đánh giá chi tiết của bạn về chất lượng đôi giày..."></textarea>
                <button class="submit-review-btn" onclick="submitUserReview(${productId})">Gửi đánh giá</button>
            </div>
        `;
    }

    reviewsContainer.innerHTML = `
        <h2><i class='bx bx-message-detail'></i> Đánh giá & Bình luận</h2>
        <div class="reviews-layout">
            <div class="reviews-sidebar">
                <div class="reviews-summary-card">
                    <p class="summary-rating-number">${avgRating}</p>
                    <div class="summary-stars">${avgStarsHtml}</div>
                    <p class="summary-count">${totalReviews} đánh giá từ người mua</p>
                </div>
                ${formHTML}
            </div>
            <div class="reviews-list">
                ${reviewsListHTML}
            </div>
        </div>
    `;
    
    // Đặt mặc định 5 sao nếu form hiển thị
    if (isLoggedIn() && currentProduct && currentProduct.has_purchased) {
        selectRatingStar(5);
    }
}

async function submitUserReview(productId) {
    const commentInput = document.getElementById('review-comment-input');
    const comment = commentInput ? commentInput.value.trim() : '';
    
    if (selectedStarRating < 1 || selectedStarRating > 5) {
        alert("Vui lòng chọn số sao đánh giá hợp lệ (1-5 sao)!");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) return alert("Vui lòng đăng nhập!");

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product: productId,
                stars: selectedStarRating,
                comment: comment
            })
        });

        if (response.ok) {
            alert("Đã gửi đánh giá thành công! Xin cảm ơn nhận xét của bạn.");
            loadProductDetail(productId); // Tải lại chi tiết sản phẩm để cập nhật trạng thái mua/đánh giá
        } else {
            const errData = await response.json();
            alert("Gửi đánh giá thất bại: " + (errData[0] || errData.non_field_errors || JSON.stringify(errData)));
        }
    } catch (err) {
        console.error("Lỗi khi gửi bình luận:", err);
        alert("Lỗi kết nối máy chủ.");
    }
}
