// Danh sách sản phẩm mock dùng làm fallback khi backend không hoạt động hoặc không có sản phẩm
const MOCK_PRODUCTS = [
    {
        id: 101,
        name: "Nike Air Max 90 Ultimate",
        brand: "Nike",
        price: 3450000,
        image: "../images/nike.jpg"
    },
    {
        id: 102,
        name: "Adidas Ultraboost Light",
        brand: "Adidas",
        price: 4500000,
        image: "../images/adidas.jpg"
    },
    {
        id: 103,
        name: "Puma Suede Classic Plus",
        brand: "Puma",
        price: 2200000,
        image: "../images/Puma.avif"
    },
    {
        id: 104,
        name: "Nike ACG Trail Fly",
        brand: "Nike",
        price: 3800000,
        image: "../images/NIKE+ACG+ULTRAFLY+TRAIL.avif"
    },
    {
        id: 105,
        name: "Giày Thể Thao Đa Năng",
        brand: "Khác",
        price: 950000,
        image: "../images/giay-da-bong.jpg"
    }
];

let allProducts = [];

/**
 * Hàm lấy danh sách sản phẩm từ API và hiển thị
 */
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if(!response.ok) throw new Error("Network response was not ok");
        
        const products = await response.json();
        if (products.length === 0) {
            allProducts = MOCK_PRODUCTS;
        } else {
            // Chuẩn hóa đường dẫn hình ảnh từ backend
            allProducts = products.map(p => {
                if (p.image && !p.image.startsWith('http') && !p.image.startsWith('/media/')) {
                    return { ...p, image: p.image };
                }
                return p;
            });
        }
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm từ API, sử dụng mock data:", error);
        allProducts = MOCK_PRODUCTS;
    }
    applyFilters();
}

/**
 * Hàm áp dụng bộ lọc: Hãng, Giá, Size
 */
function applyFilters() {
    const brandFilter = document.querySelector('#filter-brand .custom-option.selected')?.getAttribute('data-value') || "";
    const priceFilter = document.querySelector('#filter-price .custom-option.selected')?.getAttribute('data-value') || "";
    const sizeFilter = document.querySelector('#filter-size .custom-option.selected')?.getAttribute('data-value') || "";

    let filtered = allProducts;

    if (brandFilter) {
        filtered = filtered.filter(p => p.brand === brandFilter);
    }

    if (priceFilter) {
        if (priceFilter === 'under1') {
            filtered = filtered.filter(p => p.price < 1000000);
        } else if (priceFilter === '1to3') {
            filtered = filtered.filter(p => p.price >= 1000000 && p.price <= 3000000);
        } else if (priceFilter === 'over3') {
            filtered = filtered.filter(p => p.price > 3000000);
        }
    }

    // 3. Lọc theo Kích cỡ (Kiểm tra trong chuỗi sizes phân tách bằng dấu phẩy)
    if (sizeFilter) {
        filtered = filtered.filter(p => {
            if (!p.sizes) return false;
            const sizesList = p.sizes.split(',').map(s => s.trim());
            return sizesList.includes(sizeFilter);
        });
    }

    renderProducts(filtered);
}

/**
 * Hàm vẽ HTML danh sách sản phẩm
 */
function renderProducts(products) {
    const productContainer = document.getElementById('product-list');
    if (!productContainer) return;
    
    productContainer.innerHTML = '';
    
    if (products.length === 0) {
        productContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px 0; font-size: 1.1rem;">Không tìm thấy sản phẩm nào khớp với bộ lọc!</p>';
        return;
    }
    
    products.forEach(product => {
        const imageUrl = product.image ? product.image : '../images/giay-da-bong.jpg';
        // Tạo thẻ HTML cho mỗi đôi giày, truyền thêm ảnh vào addToCart, thêm click vào thẻ để xem chi tiết
        const productHTML = `
            <div class="product-card" onclick="location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='../images/giay-da-bong.jpg';" />
                <h3>${product.name}</h3>
                <p class="price">${formatCurrencyVND(product.price)}</p>
                <button onclick="event.stopPropagation(); addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${imageUrl}')">Thêm vào giỏ</button>
            </div>
        `;
        productContainer.insertAdjacentHTML('beforeend', productHTML);
    });
}

/**
 * Hàm thêm một sản phẩm vào Giỏ Hàng (Lưu tạm trong localStorage)
 */
function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const product = allProducts.find(p => p.id === id);
    let stock = 0;
    if (product) {
        if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => String(v.size) === "40");
            stock = variant ? variant.stock : 0;
        } else {
            stock = product.quantity || 0;
        }
    }

    let existingItem = cart.find(item => item.id === id && String(item.size) === "40");
    let currentInCart = existingItem ? (parseInt(existingItem.quantity) || 0) : 0;

    if (currentInCart + 1 > stock) {
        alert(`Không thể thêm. Số lượng trong giỏ hàng đã đạt giới hạn tồn kho cho Size 40 (Còn lại: ${stock} sản phẩm).`);
        return;
    }
    
    if (existingItem) {
        existingItem.quantity = (parseInt(existingItem.quantity) || 0) + 1;
    } else {
        cart.push({ 
            id, 
            name, 
            price, 
            image: image || '../images/giay-da-bong.jpg', 
            quantity: 1, 
            size: 40
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Đã thêm "${name}" (Size 40) vào giỏ hàng!`);

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
                product_id: id,
                size: 40,
                quantity: 1
            })
        }).catch(err => console.error("Lỗi đồng bộ giỏ hàng lên backend:", err));
    }
}

/**
 * Hàm khởi tạo và cấu hình các bộ lọc custom (custom dropdown)
 */
function setupCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select');
    
    customSelects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const optionsContainer = select.querySelector('.custom-options');
        const options = select.querySelectorAll('.custom-option');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            customSelects.forEach(otherSelect => {
                if (otherSelect !== select) {
                    otherSelect.classList.remove('active');
                }
            });
            
            select.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                options.forEach(opt => opt.classList.remove('selected'));
                
                option.classList.add('selected');
                
                trigger.querySelector('span').textContent = option.textContent;
                
                select.classList.remove('active');
                
                applyFilters();
            });
        });
    });
    
    document.addEventListener('click', () => {
        customSelects.forEach(select => {
            select.classList.remove('active');
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('product-list')) {
        fetchProducts();
        setupCustomSelects();
    }
});
