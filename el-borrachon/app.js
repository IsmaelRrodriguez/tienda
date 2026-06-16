// ==========================================
// 1. ESTADO DE LA APLICACIÓN Y BASE DE DATOS
// ==========================================

const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

const defaultProducts = [
    { id: 1, name: "Ron Añejo Extra", price: 25.00, img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=300", category: "Ron" },
    { id: 2, name: "Vodka Premium", price: 30.00, img: "https://images.unsplash.com/photo-1608885898957-a599fb1bf680?q=80&w=300", category: "Vodka" },
    { id: 3, name: "Cerveza Artesanal IPAs (Six-Pack)", price: 15.50, img: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=300", category: "Cerveza" },
    { id: 4, name: "Ron Extra Viejo", price: 800.00, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=300", category: "Ron" },
    { id: 5, name: "Whisky Escocés 12 Años", price: 2500.00, img: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=300", category: "Whisky" },
    { id: 6, name: "Tequila Reposado Oro", price: 1800.00, img: "https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=300", category: "Tequila" },
    { id: 7, name: "Licor de Amaretto Dulce", price: 950.00, img: "https://images.unsplash.com/photo-1614313511387-1436a4480edd?q=80&w=300", category: "Otros" }
];

let products = JSON.parse(localStorage.getItem('products'));
if (!products) {
    products = defaultProducts;
    localStorage.setItem('products', JSON.stringify(products));
}

// RESTAURADO: Banners originales de tu página
const defaultBanners = [
    { id: 1, title: "¡BIENVENIDO A EL BORRACHÓN!", desc: "Disfruta de nuestra gran variedad de bebidas.", img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200" },
    { id: 2, title: "OFERTAS ESPECIALES", desc: "Los mejores precios en rones y cervezas nacionales.", img: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=1200" },
    { id: 3, title: "DELIVERY DISPONIBLE", desc: "Llevamos tus bebidas frías directamente a tu puerta.", img: "https://images.unsplash.com/photo-1574096079513-d8259312b785?q=80&w=1200" }
];

let banners = JSON.parse(localStorage.getItem('banners')) || defaultBanners;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ==========================================
// 2. CONTROL DE ACCESO SEGURIDAD (SESSION)
// ==========================================
if (!currentUser) {
    alert("Acceso denegado. Por favor, inicia sesión.");
    window.location.href = "index.html";
} else {
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) {
        welcomeMsg.innerText = `Hola, ${currentUser.email} (${currentUser.role === 'admin' ? 'Admin' : 'Cliente'})`;
    }
    
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
        if (currentUser.role === "admin") {
            adminPanel.classList.remove("hidden");
        } else {
            adminPanel.classList.add("hidden");
        }
    }

    const clientPanel = document.getElementById("client-panel");
    if (clientPanel) {
        if (currentUser.role === "client") {
            clientPanel.classList.remove("hidden");
        } else {
            clientPanel.classList.add("hidden");
        }
    }
}

// Cierre de sesión
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = "index.html";
    });
}

// ==========================================
// 3. LOGICA DEL RENDERIZADO DEL CATALOGO
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

        if (grids.todas) grids.todas.insertAdjacentHTML('beforeend', cardHTML);

        const catKey = product.category ? product.category.toLowerCase() : "";
        if (grids[catKey]) {
            grids[catKey].insertAdjacentHTML('beforeend', cardHTML);
        }
    });

    // CORRECCIÓN SCROLLSPY: Ajustamos el offset a 15 también en JS para mantener consistencia
    setTimeout(() => {
        const spyEl = document.getElementById("scrollspy-container");
        if (spyEl) {
            const spyInstance = bootstrap.ScrollSpy.getInstance(spyEl);
            if (spyInstance) {
                spyInstance.refresh();
            } else {
                new bootstrap.ScrollSpy(spyEl, {
                    target: '#category-filter-list',
                    offset: 15
                });
            }
        }
    }, 150);
}

// ==========================================
// 4. FUNCIONALIDADES CRUD (SOLO ADMIN)
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
            // Si hay ID, estamos editando
            products = products.map(p => p.id == id ? { id: parseInt(id), name, price, img, category } : p);
            document.getElementById("form-submit-btn").innerText = "Guardar";
        } else {
            // Si no hay ID, es un producto nuevo
            const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            products.push({ id: newId, name, price, img, category });
        }

        // ====================================================================
        // AQUÍ ES DONDE SE COLOCA EL BLOQUE QUE COLOCASTE
        // ====================================================================
        localStorage.setItem('products', JSON.stringify(products));
        productForm.reset();
        document.getElementById("product-id").value = "";
        
        const selectCustom = document.getElementById("prod-category");
        if(selectCustom) selectCustom.classList.remove('selected-valid');

        // Renderizamos tanto el catálogo como el carrusel para que se vean los cambios arriba
        renderProducts(products);
        renderCarousel(); 
        // ====================================================================
    });
}

// También agregamos renderCarousel() al eliminar para que si se borra una bebida, salga del carrusel
window.deleteProduct = function(id) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        
        renderProducts(products);
        renderCarousel(); // <-- Agregado aquí también para mantener la sincronización
    }
};

window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById("product-id").value = product.id;
        document.getElementById("prod-name").value = product.name;
        document.getElementById("prod-price").value = product.price;
        document.getElementById("prod-img").value = product.img;
        
        const selectElement = document.getElementById("prod-category");
        selectElement.value = product.category;
        selectElement.classList.add('selected-valid');

        document.getElementById("form-submit-btn").innerText = "Actualizar";
        window.scrollTo({ top: document.getElementById("admin-panel").offsetTop - 20, behavior: 'smooth' });
    }
};

// ==========================================
// 5. OPERACIONES DEL CARRITO (CLIENTE)
// ==========================================
window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotalVal = document.getElementById("cart-total-val");

    if (!cartItems || !cartTotalVal) return;

    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        cartItems.insertAdjacentHTML('beforeend', `
            <div class="cart-item">
                <span>${item.name} - RD$ ${parseFloat(item.price).toFixed(2)}</span>
                <button class="btn-sm" onclick="removeFromCart(${index})">❌</button>
            </div>
        `);
    });

    cartTotalVal.innerText = total.toFixed(2);
}

const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
        alert("¡Compra realizada con éxito! Gracias por tu orden.");
        cart = [];
        localStorage.removeItem('cart');
        renderCart();
    });
}

// ==========================================
// 6. MODAL DETALLE DE PRODUCTO
// ==========================================
window.showProductCardDetail = function(id) {
    const product = products.find(p => p.id === id);
    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("details-modal-content");

    if (product && modal && modalContent) {
        modalContent.innerHTML = `
            <div class="card">
                <img src="${product.img}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">Categoría: <strong>${product.category}</strong><br>Disfruta de una excelente bebida premium directo en tu hogar.</p>
                    <button class="btn-primary" onclick="addToCart(${product.id}); document.getElementById('details-modal').classList.add('hidden');">Añadir al Carrito</button>
                    <button class="btn-primary mt-2" style="background-color:#576574 !important;" onclick="document.getElementById('details-modal').classList.add('hidden');">Cerrar</button>
                </div>
            </div>
        `;
        modal.classList.remove("hidden");
    }
};

const detailsModal = document.getElementById("details-modal");
if (detailsModal) {
    detailsModal.addEventListener("click", (e) => {
        if (e.target === detailsModal) detailsModal.classList.add("hidden");
    });
}

// ==========================================
// 7. RENDERIZADO DEL CARRUSEL (BANNERS DINÁMICOS CON PRODUCTOS DE LA TIENDA)
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
// 8. FILTRADO POR BUSCADOR REAL
// ==========================================
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const text = e.target.value.toLowerCase().trim();
        const blocks = document.querySelectorAll('.category-block');

        if (text !== "") {
            blocks.forEach(block => block.classList.add('d-none'));

            const gridTodas = document.getElementById("grid-todas");
            const blockTodas = document.getElementById("cat-todas");

            if (blockTodas && gridTodas) {
                blockTodas.classList.remove('d-none');
                gridTodas.innerHTML = "";

                const filtered = products.filter(p => p.name.toLowerCase().includes(text));

                if (filtered.length === 0) {
                    gridTodas.innerHTML = `<p class="text-center w-100 my-4 text-muted">No se encontraron bebidas.</p>`;
                } else {
                    filtered.forEach(product => {
                        const formattedPrice = parseFloat(product.price).toFixed(2);
                        let actionButton = currentUser.role === "admin" ? `
                            <button class="btn" style="background:#576574; margin-bottom:5px;" onclick="editProduct(${product.id})">Editar</button>
                            <button class="btn" style="background:var(--danger);" onclick="deleteProduct(${product.id})">Eliminar</button>
                        ` : `
                            <button class="btn" style="margin-bottom: 8px;" onclick="addToCart(${product.id})">Añadir al Carrito</button>
                            <button class="btn" style="background-color: #576574;" onclick="showProductCardDetail(${product.id})">Ver Detalle</button>
                        `;

                        gridTodas.insertAdjacentHTML('beforeend', `
                            <div class="product-card">
                                <img src="${product.img}" alt="${product.name}">
                                <h3>${product.name}</h3>
                                <p class="price">Precio de venta RD$ ${formattedPrice}</p>
                                ${actionButton}
                            </div>
                        `);
                    });
                }
            }
        } else {
            blocks.forEach(block => block.classList.remove('d-none'));
            renderProducts(products);
        }
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