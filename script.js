// Cấu hình
const SHEET_ID = '1KuCZXLFbW3oZQ_7RVb2nVngcKOHlRcU5hu3ebMedI84';
const SHEET_NAME = 'Sheet1';
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

// Các đối tượng DOM
const productList = document.getElementById('product-list');
const contactModal = document.getElementById('contact-modal');
const closeButton = document.querySelector('.close-button');
const priceFilters = document.querySelectorAll('input[name="price"]');
const colorFilterContainer = document.querySelector('[data-filter-type="color"]');
let colorFilters = []; // Sẽ được cập nhật sau khi tải dữ liệu

let slideIndex = 0;
let allProducts = []; // Lưu trữ tất cả sản phẩm

// Hàm định dạng tiền tệ
function formatCurrency(number) {
    if (typeof number !== 'number') return number;
    return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Hàm hiển thị sản phẩm
function renderProducts(products) {
    productList.innerHTML = '';
    if (products.length === 0) {
        productList.innerHTML = '<p>Không có sản phẩm nào phù hợp.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        let discountBadge = '';
        if (product.gia && product.gia_goc && product.gia_goc > product.gia) {
            const discountPercent = Math.round(((product.gia_goc - product.gia) / product.gia_goc) * 100);
            discountBadge = `<div class="discount-badge">${discountPercent}%</div>`;
        }

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.link_hinh_anh}" alt="${product.ten_san_pham}">
                ${discountBadge}
            </div>
            <div class="product-info">
                <h3>${product.ten_san_pham}</h3>
                <p>${product.mo_ta}</p>
                <div class="price-container">
                    <span class="current-price">${formatCurrency(product.gia)}</span>
                    ${product.gia_goc ? `<span class="original-price">${formatCurrency(product.gia_goc)}</span>` : ''}
                </div>
            </div>
        `;
        
        productCard.addEventListener('click', () => {
            contactModal.style.display = 'block';
        });

        productList.appendChild(productCard);
    });
}

// Hàm tạo các tùy chọn lọc màu sắc
function populateColorFilters() {
    const colors = [...new Set(allProducts.map(p => p.mau_sac).filter(Boolean))]; // Lấy các màu duy nhất

    colorFilterContainer.innerHTML = ''; // Xóa các tùy chọn cũ
    colors.forEach(color => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'color';
        checkbox.value = color;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${color}`));
        colorFilterContainer.appendChild(label);
    });

    // Cập nhật lại danh sách các checkbox màu và thêm sự kiện
    colorFilters = document.querySelectorAll('input[name="color"]');
    colorFilters.forEach(filter => filter.addEventListener('change', filterProducts));
}


// Hàm lọc sản phẩm
function filterProducts() {
    let filteredProducts = [...allProducts];

    // Lọc theo giá
    const selectedPrices = [...priceFilters].filter(f => f.checked).map(f => f.value);
    if (selectedPrices.length > 0) {
        filteredProducts = filteredProducts.filter(p => {
            if (!p.gia) return false;
            return selectedPrices.some(priceRange => {
                const [min, max] = priceRange.split('-').map(Number);
                 if(max){
                     return p.gia >= min && p.gia <= max;
                 }
                 return p.gia >= min;
            });
        });
    }

    // Lọc theo màu sắc
    const selectedColors = [...colorFilters].filter(f => f.checked).map(f => f.value);
    if (selectedColors.length > 0) {
        filteredProducts = filteredProducts.filter(p => selectedColors.includes(p.mau_sac));
    }

    renderProducts(filteredProducts);
}


// Hàm chính để lấy và hiển thị sản phẩm
async function fetchProducts() {
    try {
        productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';
        const response = await fetch(API_URL);
        const text = await response.text();
        const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/)[1];
        const data = JSON.parse(jsonString);

        const rows = data.table.rows;
        // Cập nhật để lấy màu từ cột H (index 7)
        allProducts = rows.map(row => ({
            ten_san_pham: row.c[1]?.v || 'Chưa có tên',
            gia: row.c[2]?.v,
            gia_goc: row.c[3]?.v,
            mo_ta: row.c[4]?.v || '',
            link_hinh_anh: row.c[5]?.v || 'https://via.placeholder.com/300',
            danh_muc: row.c[6]?.v,
            mau_sac: row.c[7]?.v, // Cột H là index 7
            kich_thuoc: row.c[8]?.v
        }));
        
        populateColorFilters(); // Tạo bộ lọc màu sắc động
        renderProducts(allProducts); // Hiển thị tất cả sản phẩm ban đầu

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
        productList.innerHTML = '<p>Không thể tải được sản phẩm. Vui lòng kiểm tra lại cấu hình.</p>';
    }
}

// --- Logic cho Banner ---
function setupBanner() {
    const slides = document.querySelectorAll(".banner-slide");
    const dotsContainer = document.querySelector(".banner-dots");
    if (slides.length === 0) return;

    // Tạo các chấm điều khiển
    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.addEventListener('click', () => showSlides(slideIndex = i));
        dotsContainer.appendChild(dot);
    });

    showSlides(); // Hiển thị slide đầu tiên

    // Tự động chuyển slide
    setInterval(() => {
        showSlides(++slideIndex);
    }, 5000); // Chuyển ảnh mỗi 5 giây
}

function showSlides() {
    const slides = document.querySelectorAll(".banner-slide");
    const dots = document.querySelectorAll(".dot");

    if (slideIndex >= slides.length) { slideIndex = 0; }
    if (slideIndex < 0) { slideIndex = slides.length - 1; }

    slides.forEach(slide => slide.style.display = "none");
    dots.forEach(dot => dot.classList.remove("active"));

    slides[slideIndex].style.display = "block";
    dots[slideIndex].classList.add("active");
}

// Sự kiện
priceFilters.forEach(filter => filter.addEventListener('change', filterProducts));

closeButton.addEventListener('click', () => contactModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target == contactModal) contactModal.style.display = 'none';
});

document.querySelectorAll('.filter-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const filterOptions = button.nextElementSibling;
        const icon = button.querySelector('i');
        
        const isVisible = filterOptions.style.display === 'block';
        filterOptions.style.display = isVisible ? 'none' : 'block';
        icon.classList.toggle('fa-chevron-down', isVisible);
        icon.classList.toggle('fa-chevron-up', !isVisible);
    });
});

// Chạy hàm khi trang được tảii
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupBanner();
});
