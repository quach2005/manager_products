// Cache DOM elements
const productsGrid = document.getElementById('productsGrid');
const addProductBtn = document.getElementById('addProductBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const untickedModal = document.getElementById('untickedModal');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const copyBtn = document.getElementById('copyBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const brandFilter = document.getElementById('brandFilter');
const brandList = document.getElementById('brandList');

// State management
let products = [];
let currentProductId = null;
let selectedBrand = '';

// API URL
const API_URL = 'https://684c817bed2578be881efc50.mockapi.io/api/products';

// Utility functions
const showLoading = () => {
    productsGrid.innerHTML = '<div class="loading"></div>';
};

const hideLoading = () => {
    const loading = productsGrid.querySelector('.loading');
    if (loading) loading.remove();
};

const showModal = (modal) => {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
};

const hideModal = (modal) => {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
};

// Brand management
const updateBrandLists = () => {
    const brands = [...new Set(products.map(p => p.brand))].sort();
    
    // Update filter dropdown
    const currentValue = brandFilter.value;
    brandFilter.innerHTML = `
        <option value="">Tất cả sản phẩm</option>
        ${brands.map(brand => `
            <option value="${brand}" ${brand === currentValue ? 'selected' : ''}>
                ${brand}
            </option>
        `).join('')}
    `;

    // Update datalist for suggestions
    brandList.innerHTML = brands.map(brand => `
        <option value="${brand}">
    `).join('');
};

const getFilteredProducts = () => {
    if (!selectedBrand) return products;
    return products.filter(p => p.brand === selectedBrand);
};

// API functions
const fetchProducts = async () => {
    try {
        showLoading();
        const response = await fetch(API_URL);
        products = await response.json();
        updateBrandLists();
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p class="error">Error loading products. Please try again.</p>';
    } finally {
        hideLoading();
    }
};

const createProduct = async (productData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        });
        const newProduct = await response.json();
        products.push(newProduct);
        updateBrandLists();
        renderProducts();
        return newProduct;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

const updateProduct = async (id, productData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        });
        const updatedProduct = await response.json();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = updatedProduct;
            updateBrandLists();
            renderProducts();
        }
        return updatedProduct;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

const deleteProduct = async (id) => {
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        products = products.filter(p => p.id !== id);
        updateBrandLists();
        renderProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

// Render functions
const renderProducts = () => {
    const filteredProducts = getFilteredProducts();
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-brand">${product.brand}</div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-actions">
                <label class="checkbox-container">
                    <input type="checkbox" class="product-checkbox" ${product.checked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    attachProductEventListeners();
};

const renderUntickedProducts = () => {
    const untickedList = document.getElementById('untickedList');
    const untickedProducts = getFilteredProducts().filter(p => !p.checked);
    
    if (untickedProducts.length === 0) {
        untickedList.innerHTML = '<p>No unticked products found.</p>';
        return;
    }

    untickedList.innerHTML = untickedProducts.map(product => `
        <div class="unticked-product">
            <p>${product.name} (${product.brand})</p>
        </div>
    `).join('');
};

// Event handlers
const handleCheckboxChange = async (event, productId) => {
    const checked = event.target.checked;
    try {
        await updateProduct(productId, { checked });
    } catch (error) {
        event.target.checked = !checked;
        alert('Failed to update product status');
    }
};

const handleEdit = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sản phẩm';
    document.getElementById('productName').value = product.name;
    document.getElementById('productBrand').value = product.brand;
    showModal(productModal);
};

const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await deleteProduct(productId);
    } catch (error) {
        alert('Failed to delete product');
    }
};

const handleSaveProduct = async (event) => {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        brand: document.getElementById('productBrand').value,
    };

    if (!productData.brand || !productData.name){
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        if (currentProductId) {
            await updateProduct(currentProductId, productData);
        } else {
            await createProduct(productData);
        }
        hideModal(productModal);
        productForm.reset();
        currentProductId = null;
    } catch (error) {
        alert('Failed to save product');
    }
};

const handleSaveChanges = () => {
    renderUntickedProducts();
    showModal(untickedModal);
};

const handleCopyList = () => {
    const untickedProducts = getFilteredProducts().filter(p => !p.checked);
    const text = untickedProducts.map(p => `${p.name} (${p.brand})`).join(', ');
    
    navigator.clipboard.writeText(text).then(() => {
        alert('List copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy list');
    });
};

const handleBrandFilter = (event) => {
    selectedBrand = event.target.value;
    renderProducts();
};

const handleClearAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn reset tất cả checkbox về trạng thái ban đầu?')) return;
    
    try {
        const updates = products.map(product => 
            updateProduct(product.id, { checked: false })
        );
        await Promise.all(updates);
        renderProducts();
    } catch (error) {
        console.error('Error clearing all checkboxes:', error);
        alert('Failed to clear all checkboxes');
    }
};

// Event listener attachment
const attachProductEventListeners = () => {
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        const productId = checkbox.closest('.product-card').dataset.id;
        checkbox.addEventListener('change', (e) => handleCheckboxChange(e, productId));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        const productId = btn.closest('.product-card').dataset.id;
        btn.addEventListener('click', () => handleEdit(productId));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        const productId = btn.closest('.product-card').dataset.id;
        btn.addEventListener('click', () => handleDelete(productId));
    });
};

// Initialize event listeners
addProductBtn.addEventListener('click', () => {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Thêm sản phẩm';
    productForm.reset();
    showModal(productModal);
});

saveBtn.addEventListener('click', handleSaveChanges);
clearBtn.addEventListener('click', handleClearAll);
saveProductBtn.addEventListener('click', handleSaveProduct);
copyBtn.addEventListener('click', handleCopyList);
brandFilter.addEventListener('change', handleBrandFilter);

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        hideModal(btn.closest('.modal'));
    });
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        hideModal(event.target);
    }
});

// Initialize the application
fetchProducts(); 