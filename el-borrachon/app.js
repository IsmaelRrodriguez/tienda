// ==========================================
// 1. ESTADO DE LA APLICACIÓN Y BASE DE DATOS
// ==========================================

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

const defaultProducts = [
    { id: 1, name: "Ron Añejo Extra", price: 25.00, img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=300", category: "Ron" },
    { id: 2, name: "Vodka Premium", price: 30.00, img: "https://images.unsplash.com/photo-1608885898957-a599fb1bf680?q=80&w=300", category: "Vodka" },
    { id: 3, name: "Cerveza Artesanal IPAs (Six-Pack)", price: 15.50, img: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=300", category: "Cerveza" },
    { id: 4, name: "Ron Extra Viejo", price: 800.00, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=300", category: "Ron" },
    { id: 5, name: "Whisky Escocés 12 Años", price: 2400.00, img: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=300", category: "Whisky" },
    { id: 6, name: "Tequila Reposado Gold", price: 1850.00, img: "https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=300", category: "Tequila" },
    { id: 7, name: "Ginebra Dry Gin", price: 950.00, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=300", category: "Otros" }
];

let products = JSON.parse(localStorage.getItem('products')) || defaultProducts;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Redirección si no hay un usuario autenticado en la sesión
if (!currentUser) {
    window.location.href = "index.html";
} else {
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
        welcomeMsg.textContent = `Hola, ${currentUser.email}`;
    }
    
    // Configuración visual según rol de usuario
    const adminPanel = document.getElementById("admin-panel");
    const clientPanel = document.getElementById("client-panel");
    
    if (currentUser.role === "admin") {
        if (adminPanel) adminPanel.classList.remove("hidden");
        if (clientPanel) clientPanel.classList.add("hidden");
    } else {
        if (adminPanel) adminPanel.classList.add("hidden");
        if (clientPanel) clientPanel.classList.remove("hidden");
    }
}

// ==========================================
// 2. CONTROL DEL CAROUSEL DINÁMICO DE PROMO
// ==========================================
function renderCarousel() {
    const inner = document.getElementById("carousel-dynamic-inner");
    if (!inner) return;

    inner.innerHTML = "";

    // CORRECCIÓN: Si hay productos en el catálogo, usamos sus imágenes reales en vez de los banners por defecto
    let carouselItemsData = [];
    
    if (products && products.length > 0) {
        // Tomamos hasta un máximo de 3 productos del catálogo actual para el carrusel
        const maxBanners = Math.min(products.length, 3);
        for (let i = 0; i < maxBanners; i++) {
            carouselItemsData.push({
                title: products[i].name.toUpperCase(),
                desc: `¡Disponible en catálogo por sólo RD$ ${parseFloat(products[i].price).toFixed(2)}!`,
                img: products[i].img
            });
        }
    } else {
        // Respaldar con datos por defecto limpios si se eliminaran todos los productos
        carouselItemsData = [
            { title: "¡BIENVENIDO A EL BORRACHÓN!", desc: "Disfruta de nuestra gran variedad de bebidas.", img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200" },
            { title: "OFERTAS ESPECIALES", desc: "Los mejores precios en rones y cervezas nacionales.", img: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=1200" }
        ];
    }

    // Inyectar los elementos estructurados en el contenedor del carrusel
    carouselItemsData.forEach((banner, index) => {
        inner.insertAdjacentHTML('beforeend', `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${banner.img}" alt="${banner.title}">
                <div class="carousel-caption">
                    <h3>${banner.title}</h3>
                    <p>${banner.desc}</p>
                </div>
            </div>
        `);
    });

    let currentIndex = 0;
    const items = inner.querySelectorAll(".carousel-item");

    function showSlide(index) {
        items.forEach(item => item.classList.remove("active"));
        if (items[index]) items[index].classList.add("active");
    }

    const prevBtn = document.getElementById("carousel-prev-btn");
    const nextBtn = document.getElementById("carousel-next-btn");

    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => {
            currentIndex = (currentIndex === 0) ? items.length - 1 : currentIndex - 1;
            showSlide(currentIndex);
        };
        nextBtn.onclick = () => {
            currentIndex = (currentIndex === items.length - 1) ? 0 : currentIndex + 1;
            showSlide(currentIndex);
        };
    }
}

// ==========================================
// 3. RENDERIZACIÓN DEL CATÁLOGO DE PRODUCTOS
// ==========================================
function renderProducts(productsList) {
    const grids = {
        todas: document.getElementById("grid-todas"),
        cerveza: document.getElementById("grid-cerveza"),
        ron: document.getElementById("grid-ron"),
        whisky: document.getElementById("grid-whisky"),
        vodka: document.getElementById("grid-vodka"),
        tequila: document.getElementById("grid-tequila"),
        otros: document.getElementById("grid-otros")
    };

    // Limpiar todas las cuadrículas antes de renderizar
    Object.values(grids).forEach(grid => { if (grid) grid.innerHTML = ""; });

    productsList.forEach(product => {
        const formattedPrice = parseFloat(product.price).toFixed(2);
        let actionButton = "";

        if (currentUser.role === "admin") {
            actionButton = `
                <button class="btn" style="background:#576574; margin-bottom:5px;" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn" style="background:var(--danger);" onclick="deleteProduct(${product.id})">Eliminar</button>
            `;
        } else {
            actionButton = `
                <button class="btn" style="margin-bottom: 8px;" onclick="addToCart(${product.id})">Añadir al Carrito</button>
                <button class="btn" style="background-color: #576574;" onclick="showProductCardDetail(${product.id})">Ver Detalle</button>
            `;
        }

        const cardHTML = `
            <div class="product-card">
                <img src="${product.img}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">Precio de venta RD$ ${formattedPrice}</p>
                ${actionButton}
            </div>
        `;

        // Insertar en la pestaña 'Todas las Bebidas'
        if (grids.todas) grids.todas.insertAdjacentHTML('beforeend', cardHTML);

        // Insertar en la categoría que le corresponde
        const catKey = product.category ? product.category.toLowerCase() : "";
        if (grids[catKey]) {
            grids[catKey].insertAdjacentHTML('beforeend', cardHTML);
        }
    });
}

// ==========================================
// 4. LOGICA DE ADMINISTRACIÓN (CRUD PRODUCTOS)
// ==========================================
const productForm = document.getElementById("product-form");
if (productForm) {
    productForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const id = document.getElementById("product-id").value;
        const name = document.getElementById("prod-name").value.trim();
        const price = parseFloat(document.getElementById("prod-price").value);
        const img = document.getElementById("prod-img").value.trim();
        const category = document.getElementById("prod-category").value;

        if (id) {
            // Modificación
            products = products.map(p => p.id == id ? { id: parseInt(id), name, price, img, category } : p);
        } else {
            // Creación
            const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
            products.push({ id: newId, name, price, img, category });
        }

        localStorage.setItem('products', JSON.stringify(products));
        renderProducts(products);
        productForm.reset();
        document.getElementById("product-id").value = "";
        document.getElementById("form-submit-btn").textContent = "Guardar";
        document.getElementById("prod-category").classList.remove("selected-valid");
    });
}

function deleteProduct(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto del inventario?")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        
        // Limpiar del carrito si existía
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        renderProducts(products);
        renderCart();
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById("product-id").value = product.id;
        document.getElementById("prod-name").value = product.name;
        document.getElementById("prod-price").value = product.price;
        document.getElementById("prod-img").value = product.img;
        
        const select = document.getElementById("prod-category");
        select.value = product.category;
        select.classList.add("selected-valid");
        
        document.getElementById("form-submit-btn").textContent = "Actualizar";
        window.scrollTo({ top: 150, behavior: 'smooth' });
    }
}

// ==========================================
// 5. GESTIÓN DEL CARRITO DE COMPRAS (CLIENTES)
// ==========================================
function renderCart() {
    const cartItemsDiv = document.getElementById("cart-items");
    const cartTotalVal = document.getElementById("cart-total-val");
    if (!cartItemsDiv || !cartTotalVal) return;

    cartItemsDiv.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        cartItemsDiv.insertAdjacentHTML('beforeend', `
            <div class="cart-item-row">
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <p>RD$ ${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty" onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="btn-qty" onclick="changeQuantity(${item.id}, 1)">+</button>
                    <button class="btn-del-cart" onclick="removeFromCart(${item.id})">&times;</button>
                </div>
            </div>
        `);
    });

    cartTotalVal.textContent = total.toFixed(2);
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function changeQuantity(id, amount) {
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;

    cartItem.quantity += amount;
    if (cartItem.quantity <= 0) {
        cart = cart.filter(item => item.id !== id);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (!cart.length) {
            alert("Tu carrito está vacío. Añade algunas bebidas antes de procesar la compra.");
            return;
        }
        alert("¡Compra procesada con éxito! Gracias por preferir El Borrachón.");
        cart = [];
        localStorage.removeItem('cart');
        renderCart();
    });
}

// ==========================================
// 6. VENTANA MODAL: DETALLES DE PRODUCTOS
// ==========================================
function showProductCardDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("details-modal-content");
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <div class="product-detail-card">
            <span class="close-modal-detail" onclick="closeProductDetailModal()">&times;</span>
            <div class="detail-layout">
                <img src="${product.img}" alt="${product.name}">
                <div class="detail-info">
                    <span class="category-badge">${product.category}</span>
                    <h2>${product.name}</h2>
                    <p class="description">Bebida premium seleccionada meticulosamente de nuestro catálogo para garantizar la máxima calidad en tu paladar.</p>
                    <p class="price">RD$ ${parseFloat(product.price).toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function closeProductDetailModal() {
    const modal = document.getElementById("details-modal");
    if (modal) modal.classList.add("hidden");
}

// ==========================================
// 7. FUNCIONALIDAD DEL BUSCADOR DE NAV
// ==========================================
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activeTabButton = document.querySelector("#category-filter-list .active");
        
        // Si hay una búsqueda activa, cambiamos temporalmente a la pestaña 'Todas' para buscar globalmente
        if (query !== "" && activeTabButton && activeTabButton.id !== "tab-todas-btn") {
            const todasTab = document.getElementById("tab-todas-btn");
            if (todasTab) {
                bootstrap.Tab.getOrCreateInstance(todasTab).show();
            }
        }
        
        const filtered = products.filter(p => p.name.toLowerCase().includes(query));
        renderProducts(filtered);
    });
}

// CERRAR SESIÓN
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = "index.html";
    });
}

const selectCategory = document.getElementById("prod-category");
if(selectCategory) {
    selectCategory.addEventListener("change", function() {
        if(this.value !== "") {
            this.classList.add("selected-valid");
        } else {
            this.classList.remove("selected-valid");
        }
    });
}

// INICIALIZACIÓN GLOBAL AL CARGAR EL DOM
document.addEventListener("DOMContentLoaded", () => {
    renderCarousel();
    renderProducts(products);
    renderCart();
});