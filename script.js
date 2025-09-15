// Cấu hình
const SHEET_ID = '1KuCZXLFbW3oZQ_7RVb2nVngcKOHlRcU5hu3ebMedI84';
const SHEET_NAME = 'Sheet1';
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

// Các đối tượng DOM
const productList = document.getElementById('product-list');
const paginationContainer = document.getElementById('pagination-container');
const searchInput = document.getElementById('search-input');
const contactModal = document.getElementById('contact-modal');
const closeButton = document.querySelector('.close-button');
// Các đối tượng DOM cho modal chi tiết sản phẩm
const modalProductName = document.getElementById('modal-product-name');
const modalProductImage = document.getElementById('modal-product-image');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductOriginalPrice = document.getElementById('modal-product-original-price');

const categoryFilterContainer = document.querySelector('[data-filter-type="category"]');
let categoryFilters = []; // Sẽ được cập nhật sau khi tải dữ liệu

// Cấu hình phân trang
let currentPage = 1;
const productsPerPage = 9;

let slideIndex = 0;
let allProducts = []; // Lưu trữ tất cả sản phẩm
let currentFilteredProducts = []; // Lưu trữ sản phẩm sau khi lọc để phân trang

// Hàm định dạng tiền tệ
function formatCurrency(number) {
    if (typeof number !== 'number') return number;
    return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Hàm hiển thị modal chi tiết sản phẩm
function showProductDetailModal(product) {
    modalProductName.textContent = product.ten_san_pham;
    // Chỉ cập nhật ảnh nếu có link hợp lệ, nếu không thì ẩn đi
    if (product.link_hinh_anh) {
        modalProductImage.style.backgroundImage = `url('${product.link_hinh_anh}')`;
        modalProductImage.style.display = 'block';
    } else {
        modalProductImage.style.display = 'none';
    }
    modalProductDescription.textContent = product.mo_ta;
    modalProductPrice.textContent = formatCurrency(product.gia);

    if (product.gia_goc && product.gia_goc > product.gia) {
        modalProductOriginalPrice.textContent = formatCurrency(product.gia_goc);
        modalProductOriginalPrice.style.display = 'inline';
    } else {
        modalProductOriginalPrice.style.display = 'none';
    }

    contactModal.style.display = 'block';
}

// Hàm hiển thị sản phẩm cho trang hiện tại
function displayCurrentPage() {
    productList.innerHTML = '';
    paginationContainer.innerHTML = '';

    // Luôn sử dụng currentFilteredProducts để hiển thị và phân trang
    if (currentFilteredProducts.length === 0) {
        productList.innerHTML = '<p>Không có sản phẩm nào phù hợp.</p>';
        return;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = currentFilteredProducts.slice(startIndex, endIndex);

    paginatedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        let discountBadge = '';
        if (product.gia && product.gia_goc && product.gia_goc > product.gia) {
            const discountPercent = Math.round(((product.gia_goc - product.gia) / product.gia_goc) * 100);
            discountBadge = `<div class="discount-badge">${discountPercent}%</div>`;
        }

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.link_hinh_anh || 'https://via.placeholder.com/300?text=No+Image'}" alt="${product.ten_san_pham}">
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
            showProductDetailModal(product);
        });

        productList.appendChild(productCard);
    });

    setupPagination();
}

// Hàm tạo các nút phân trang
function setupPagination() {
    const pageCount = Math.ceil(currentFilteredProducts.length / productsPerPage);
    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.classList.add('pagination-button');
        if (i === currentPage) { // Đánh dấu trang hiện tại là active
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            currentPage = i;
            displayCurrentPage();
            // Cuộn lên đầu danh sách sản phẩm
            document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
        });
        paginationContainer.appendChild(btn);
    }
}

// Hàm lọc sản phẩm
function filterProducts() {
    let tempFilteredProducts = [...allProducts];

    // Lọc theo từ khóa tìm kiếm
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        tempFilteredProducts = tempFilteredProducts.filter(p => 
            p.ten_san_pham.toLowerCase().includes(searchTerm)
        );
    }

    // Lọc theo màu sắc
    const selectedCategories = [...categoryFilters].filter(f => f.checked).map(f => f.value);
    if (selectedCategories.length > 0) {
        tempFilteredProducts = tempFilteredProducts.filter(p => selectedCategories.includes(p.danh_muc));
    }

    currentFilteredProducts = tempFilteredProducts; // Cập nhật danh sách sản phẩm đã lọc
    currentPage = 1; // Reset về trang 1 mỗi khi có bộ lọc mới
    displayCurrentPage(); // Hiển thị trang hiện tại của kết quả đã lọc
}

// Hàm tạo các tùy chọn lọc danh mục
function populateCategoryFilters() {
    const categories = [...new Set(allProducts.map(p => p.danh_muc).filter(Boolean))]; // Lấy các danh mục duy nhất

    categoryFilterContainer.innerHTML = ''; // Xóa các tùy chọn cũ
    categories.forEach(category => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'category';
        checkbox.value = category;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${category}`));
        categoryFilterContainer.appendChild(label);
    });

    // Cập nhật lại danh sách các checkbox danh mục và thêm sự kiện
    categoryFilters = document.querySelectorAll('input[name="category"]');
    categoryFilters.forEach(filter => filter.addEventListener('change', filterProducts));
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
            link_hinh_anh: row.c[5]?.v, // Để giá trị là null nếu không có link, sẽ xử lý lúc hiển thị
            danh_muc: row.c[6]?.v,
            mau_sac: row.c[7]?.v, // Cột H là index 7
            kich_thuoc: row.c[8]?.v
        }));
        
        populateCategoryFilters(); // Tạo bộ lọc danh mục động
        currentFilteredProducts = [...allProducts]; // Gán danh sách sản phẩm ban đầu
        displayCurrentPage(); // Hiển thị trang đầu tiên

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
searchInput.addEventListener('input', filterProducts);

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
