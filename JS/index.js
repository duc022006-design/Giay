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

document.addEventListener("DOMContentLoaded", () => {
    loadProductsHome();
});

async function loadProductsHome() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        if (response.ok) {
            const products = await response.json();
            if (products.length === 0) {
                console.log("API rỗng, hiển thị mock products ở trang chủ.");
                renderHomeProducts(MOCK_PRODUCTS);
            } else {
                renderHomeProducts(products);
            }
        } else {
            throw new Error("Không thể kết nối API");
        }
    } catch(err) {
        console.error("Lỗi khi tải sản phẩm trang chủ, sử dụng mock data:", err);
        renderHomeProducts(MOCK_PRODUCTS);
    }
}

function renderHomeProducts(products) {
    const listNike = document.getElementById('list-nike');
    const listPuma = document.getElementById('list-puma');
    const listAdidas = document.getElementById('list-adidas');
    const listOther = document.getElementById('list-other');

    // Xóa rỗng trước khi load
    if(listNike) listNike.innerHTML = '';
    if(listPuma) listPuma.innerHTML = '';
    if(listAdidas) listAdidas.innerHTML = '';
    if(listOther) listOther.innerHTML = '';

    products.forEach(p => {
        const imageUrl = p.image ? p.image : '../images/giay-da-bong.jpg';
        
        const productHtml = `
            <div class="product-item" onclick="location.href='product-detail.html?id=${p.id}'" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${p.name}" onerror="this.onerror=null; this.src='../images/giay-da-bong.jpg';">
                <h2>${p.name}</h2>
                <p>Giá: ${formatCurrencyVND(p.price)}</p>
            </div>
        `;

        // Phân loại hãng để đưa vào div tương ứng
        if (p.brand === 'Nike') {
            if (listNike) listNike.innerHTML += productHtml;
        } else if (p.brand === 'Puma') {
            if (listPuma) listPuma.innerHTML += productHtml;
        } else if (p.brand === 'Adidas') {
            if (listAdidas) listAdidas.innerHTML += productHtml;
        } else {
            // Dành cho 'Khác'
            if (listOther) listOther.innerHTML += productHtml;
        }
    });
    
    // Xử lý nếu hãng nào không có sản phẩm thì hiện chữ "Chưa có sản phẩm"
    if (listNike && listNike.innerHTML.trim() === '') listNike.innerHTML = '<p style="text-align:center; width:100%; color:gray;">Chưa có sản phẩm Nike nào.</p>';
    if (listPuma && listPuma.innerHTML.trim() === '') listPuma.innerHTML = '<p style="text-align:center; width:100%; color:gray;">Chưa có sản phẩm Puma nào.</p>';
    if (listAdidas && listAdidas.innerHTML.trim() === '') listAdidas.innerHTML = '<p style="text-align:center; width:100%; color:gray;">Chưa có sản phẩm Adidas nào.</p>';
    if (listOther && listOther.innerHTML.trim() === '') listOther.innerHTML = '<p style="text-align:center; width:100%; color:gray;">Chưa có sản phẩm nào khác.</p>';
}
