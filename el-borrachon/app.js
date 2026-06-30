// ==========================================
// 1. ESTADO DE LA APLICACIÓN Y BASE DE DATOS
// ==========================================

// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyB6qu7KfOJdiGLXOG-DwJODY3rxYyMEWAU",
    authDomain: "el-borrachon.firebaseapp.com",
    databaseURL: "https://el-borrachon-default-rtdb.firebaseio.com/", 
    projectId: "el-borrachon",
    storageBucket: "el-borrachon.firebasestorage.app",
    messagingSenderId: "854934153912",
    appId: "1:854934153912:web:496c4311874785fa23224d"
};

// Inicializar Firebase de forma segura
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

const defaultProducts = [
    { id: 1, name: "Ron Añejo Extra", price: 25.00, img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=300", category: "Ron" },
    { id: 2, name: "Vodka Premium", price: 30.00, img: "https://images.unsplash.com/photo-1608885898957-a599fb1bf680?q=80&w=300", category: "Vodka" },
    { id: 3, name: "Cerveza Artesanal IPAs (Six-Pack)", price: 15.50, img: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=300", category: "Cerveza" },
    { id: 4, name: "Ron Extra Viejo", price: 800.00, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=300", category: "Ron" },
    { id: 5, name: "Tequila Reposado", price: 1200.00, img: "https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=300", category: "Tequila" },
    { id: 6, name: "Whisky Escocés 12 Años", price: 2500.00, img: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=300", category: "Otros" }
];

let products = [];

// Redirección de seguridad inmediata si no hay sesión activa
if (!currentUser) {
    window.location.replace("index.html");
}

// ==========================================
// 2. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL
// ==========================================
function inicializarTienda() {
    if (!currentUser) return;

    const adminPanel = document.getElementById("admin-panel");
    const adminUsersPanel = document.getElementById("admin-users-panel");
    const adminTopNav = document.getElementById("admin-top-nav");
    const clientPanel = document.getElementById("client-panel");
    const welcomeMsg = document.getElementById("welcome-msg");
    const adminIndicatorBar = document.getElementById("admin-indicator-bar");

    // Mostrar saludo dinámico unificado usando el ID real corregido
    if (welcomeMsg) {
        if (currentUser.firstName && currentUser.lastName) {
            welcomeMsg.textContent = `Hola, ${currentUser.firstName} ${currentUser.lastName} (${currentUser.role.toUpperCase()})`;
        } else {
            welcomeMsg.textContent = `Hola, ${currentUser.email.split('@')[0]} (${currentUser.role.toUpperCase()})`;
        }
    }

    // Escuchar el total de ventas registradas en Firebase en tiempo real
    db.ref("ventas").on("value", (snapshot) => {
        const ventas = snapshot.val();
        let totalVentas = 0;

        if (ventas) {
            Object.values(ventas).forEach(venta => {
                totalVentas += parseFloat(venta.total);
            });
        }

        const dashTotalSales = document.getElementById("dash-total-sales");
        if (dashTotalSales) {
            dashTotalSales.textContent = `RD$ ${totalVentas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
        }
    });

    // Escuchar cambios de rol del usuario actual en tiempo real
    db.ref("usuarios/" + currentUser.uid + "/role").on("value", (snapshot) => {
        const serverRole = snapshot.val() || currentUser.role;
        
        if (serverRole !== currentUser.role) {
            currentUser.role = serverRole;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            window.location.reload(); 
            return;
        }

        // Gestión limpia de paneles y menús de pestañas de Administración
        if (serverRole === "admin") {
            if (adminTopNav) adminTopNav.classList.remove("hidden");
            if (adminIndicatorBar) adminIndicatorBar.classList.remove("hidden");
            if (clientPanel) clientPanel.classList.add("hidden");
            
            cargarUsuariosYRoles(); // Carga la tabla de control de usuarios

            // NUEVO: Referencia al Dashboard
            const adminDashboard = document.getElementById("admin-dashboard");
            
            const catalogSection = document.getElementById("catalog-section");
            const carouselSection = document.getElementById("carouselExampleAutoplaying");

            // NUEVO: Botón del Dashboard
            const btnDashboard = document.querySelector('a[href="#admin-dashboard"]');
            
            const btnCatalog = document.querySelector('a[href="#catalog-section"]');
            const btnUsers = document.querySelector('a[href="#admin-users-panel"]');
            const btnAddProducts = document.querySelector('a[href="#admin-panel"]');

            // MODIFICADO: Nueva lógica de navegación unificada
            function showAdminSection(activeBtn, visibleSection) {
                // Limpiar clases activas de los botones
                [btnDashboard, btnCatalog, btnUsers, btnAddProducts].forEach(btn => {
                    if (btn) btn.classList.remove('active');
                });
                
                if (activeBtn) activeBtn.classList.add('active');
                
                // Ocultar todas las secciones primero
                if (adminDashboard) adminDashboard.classList.add('hidden');
                if (catalogSection) catalogSection.classList.add('hidden');
                if (carouselSection) carouselSection.classList.add('hidden');
                if (adminUsersPanel) adminUsersPanel.classList.add('hidden');
                if (adminPanel) adminPanel.classList.add('hidden');

                // Mostrar solo la sección seleccionada (el catálogo incluye el carrusel)
                if (visibleSection) {
                    visibleSection.classList.remove('hidden');
                    if (visibleSection === catalogSection && carouselSection) {
                        carouselSection.classList.remove('hidden');
                    }
                }
            }

            // MODIFICADO: Mostrar el Dashboard por defecto al entrar
            showAdminSection(btnDashboard, adminDashboard);

            // MODIFICADO: Controladores de clics de pestañas con la nueva función
            if (btnDashboard) {
                btnDashboard.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAdminSection(btnDashboard, adminDashboard);
                });
            }

            if (btnCatalog) {
                btnCatalog.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAdminSection(btnCatalog, catalogSection);
                });
            }

            if (btnUsers) {
                btnUsers.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAdminSection(btnUsers, adminUsersPanel);
                });
            }

            if (btnAddProducts) {
                btnAddProducts.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAdminSection(btnAddProducts, adminPanel);
                });
            }

        } else {
            // Configuración para Clientes normales
            if (adminTopNav) adminTopNav.classList.add("hidden");
            if (adminIndicatorBar) adminIndicatorBar.classList.add("hidden");
            if (adminPanel) adminPanel.classList.add("hidden");
            if (adminUsersPanel) adminUsersPanel.classList.add("hidden");
            if (clientPanel) clientPanel.classList.remove("hidden");
        }
    });

    // Escuchar el catálogo de productos de Firebase en tiempo real
    db.ref("productos").on("value", (snapshot) => {
        const data = snapshot.val();

        // NUEVO: Actualizar la tarjeta del Dashboard (Total de Bebidas)
        const dashTotalProducts = document.getElementById("dash-total-products");
        if (dashTotalProducts) {
            dashTotalProducts.textContent = data ? Object.keys(data).length : 0;
        }

        if (data) {
            products = Object.keys(data).map(key => ({
                id: key, 
                name: data[key].name,
                price: data[key].price,
                img: data[key].img,
                category: data[key].category
            }));
        } else {
            defaultProducts.forEach(prod => {
                db.ref("productos").push({
                    name: prod.name,
                    price: prod.price,
                    img: prod.img,
                    category: prod.category
                });
            });
            return;
        }

        renderCarousel();
        renderProducts(products);
    });

    renderCart();
}

// Ejecución segura de la inicialización (evita problemas de DOM estancados)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarTienda);
} else {
    inicializarTienda();
}

// ==========================================
// 3. GESTIÓN DE USUARIOS Y ROLES (GLOBALES)
// ==========================================
function cargarUsuariosYRoles() {
    const tableBody = document.getElementById("users-table-body");
    if (!tableBody) return;

    db.ref("usuarios").on("value", (snapshot) => {
        tableBody.innerHTML = "";
        const usuarios = snapshot.val();

        // NUEVO: Actualizar la tarjeta del Dashboard (Usuarios Registrados)
        const dashTotalUsers = document.getElementById("dash-total-users");
        if (dashTotalUsers) {
            dashTotalUsers.textContent = usuarios ? Object.keys(usuarios).length : 0;
        }

        if (usuarios) {
            Object.keys(usuarios).forEach(uid => {
                const user = usuarios[uid];
                if (!user || !user.email) return;

                const fecha = user.createdAt || user.fechaRegistro 
                    ? new Date(user.createdAt || user.fechaRegistro).toLocaleDateString() 
                    : "Predefinido";
                
                const badgeClass = user.role === "admin" ? "bg-danger" : "bg-info";
                const botonTexto = user.role === "admin" ? "Hacer Cliente" : "Hacer Admin";
                const botonClass = user.role === "admin" ? "btn-outline-info" : "btn-outline-danger";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${user.email}</strong></td>
                    <td><span class="badge ${badgeClass} text-uppercase fw-bold">${user.role || 'client'}</span></td>
                    <td><span class="text-white-50 small">${fecha}</span></td>
                    <td>
                        <div class="d-flex justify-content-end gap-2">
                            <button class="btn btn-sm ${botonClass} fw-bold" onclick="cambiarRolUsuario('${uid}', '${user.role || 'client'}')">
                                ${botonTexto}
                            </button>
                            <button class="btn btn-sm btn-outline-warning fw-bold" onclick="adminForzarResetPassword('${user.email}')">
                                 Restablecer Clave
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-white-50">No hay usuarios registrados.</td></tr>`;
        }
    });
}

window.cambiarRolUsuario = function(uid, rolActual) {
    const nuevoRol = rolActual === "admin" ? "client" : "admin";
    
    if (currentUser.uid === uid) {
        alert("⚠️ No puedes cambiar tu propio rol de administrador.");
        return;
    }

    db.ref("usuarios/" + uid).update({ role: nuevoRol })
    .then(() => {
        alert(`¡Rol actualizado con éxito a ${nuevoRol.toUpperCase()}!`);
    })
    .catch((error) => console.error("Error al actualizar el rol:", error));
};

window.adminForzarResetPassword = function(email) {
    const confirmar = confirm(`¿Estás seguro de que deseas enviar un correo de restablecimiento de contraseña a: ${email}?`);
    if (confirmar) {
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                alert(`¡Solicitud procesada! Se ha enviado un enlace seguro al correo ${email} para que reconfigure su contraseña.`);
            })
            .catch((error) => {
                console.error("Error en reset de clave:", error);
                alert("No se pudo enviar la solicitud: " + error.message);
            });
    }
};

// ==========================================
// 4. RENDERIZADO DE INTERFAZ (PRODUCTOS / CAROUSEL)
// ==========================================
function renderCarousel() {
    const carouselInner = document.getElementById("carousel-dynamic-inner");
    if (!carouselInner || !products || products.length === 0) return;

    carouselInner.innerHTML = "";
    products.forEach((product, index) => {
        const activeClass = index === 0 ? "active" : "";
        carouselInner.insertAdjacentHTML('beforeend', `
            <div class="carousel-item ${activeClass}">
                <img src="${product.img}" class="d-block w-100" alt="${product.name}" style="height: 350px; object-fit: cover;">
                <div class="carousel-caption d-none d-md-block" style="background: rgba(0, 0, 0, 0.6); border-radius: 8px; padding: 10px;">
                    <h5 class="fw-bold">${product.name}</h5>
                    <p class="mb-0">Precio de venta RD$ ${product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>
        `);
    });

    const myCarouselEl = document.getElementById('carouselExampleAutoplaying');
    if (myCarouselEl) {
        const carousel = bootstrap.Carousel.getOrCreateInstance(myCarouselEl);
        carousel.to(0);
        carousel.cycle();
    }
}

function renderProducts(productsList) {
    const grids = {
        Ron: document.getElementById("grid-ron"),
        Vino: document.getElementById("grid-vino"),
        Vodka: document.getElementById("grid-vodka"),
        Cerveza: document.getElementById("grid-cerveza"),
        Whisky: document.getElementById("grid-whisky"),
        Tequila: document.getElementById("grid-tequila"),
        Otros: document.getElementById("grid-otros"),
        Todas: document.getElementById("grid-todas")
    };

    Object.values(grids).forEach(grid => { if (grid) grid.innerHTML = ""; });

    productsList.forEach(product => {
        const formattedPrice = parseFloat(product.price).toLocaleString('es-DO', { minimumFractionDigits: 2 });
        let actionButton = `<button class="btn btn-primary btn-sm w-100 mt-2 fw-bold" onclick="addToCart('${product.id}')">Añadir al Carrito</button>`;

        if (currentUser && currentUser.role === "admin") {
            actionButton = `
                <div class="d-flex flex-column gap-1 w-100" style="margin-top: auto;">
                    <button class="btn btn-warning btn-sm text-dark fw-bold" onclick="loadProductToEdit('${product.id}')">Editar</button>
                    <button class="btn btn-danger btn-sm fw-bold" onclick="deleteProduct('${product.id}')">Eliminar</button>
                </div>
            `;
        }

        const cardHTML = `
            <div class="product-card">
                <img src="${product.img}" alt="${product.name}" onclick="showProductCardDetail('${product.id}')" style="cursor:pointer;">
                <h3 onclick="showProductCardDetail('${product.id}')" style="cursor:pointer;">${product.name}</h3>
                <p class="price">Precio de venta RD$ ${formattedPrice}</p>
                ${actionButton}
            </div>
        `;

        if (grids[product.category]) grids[product.category].insertAdjacentHTML('beforeend', cardHTML);
        if (grids.Todas) grids.Todas.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ==========================================
// 5. OPERACIONES DE PRODUCTOS (ALTAS, EDICIÓN, BAJAS)
// ==========================================
window.loadProductToEdit = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("product-id").value = product.id;
    document.getElementById("prod-name").value = product.name;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-img").value = product.img;
    
    const selectCategory = document.getElementById("prod-category");
    if (selectCategory) {
        selectCategory.value = product.category;
        selectCategory.classList.add("selected-valid");
    }

    document.getElementById("form-submit-btn").textContent = "Actualizar Bebida";

    const btnAddProducts = document.querySelector('a[href="#admin-panel"]');
    if (btnAddProducts) btnAddProducts.click();
};

const productForm = document.getElementById("product-form");
if (productForm) {
    productForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const idVal = document.getElementById("product-id").value;
        const nameVal = document.getElementById("prod-name").value.trim();
        const priceVal = parseFloat(document.getElementById("prod-price").value);
        const imgVal = document.getElementById("prod-img").value.trim();
        const catVal = document.getElementById("prod-category").value;

        if (!nameVal || isNaN(priceVal) || !imgVal || !catVal) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const productData = { name: nameVal, price: priceVal, img: imgVal, category: catVal };

        if (idVal) {
            db.ref("productos/" + idVal).update(productData)
                .then(() => {
                    alert("¡Bebida modificada con éxito!");
                    productForm.reset();
                    document.getElementById("product-id").value = "";
                    document.getElementById("form-submit-btn").textContent = "Guardar";
                    const btnCatalog = document.querySelector('a[href="#catalog-section"]');
                    if (btnCatalog) btnCatalog.click();
                })
                .catch(error => alert("Error al actualizar: " + error.message));
        } else {
            db.ref("productos").push(productData)
                .then(() => {
                    alert("¡Bebida agregada exitosamente!");
                    productForm.reset();
                })
                .catch(error => alert("Hubo un problema al guardar: " + error.message));
        }
    });
}

window.deleteProduct = function(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) {
        db.ref(`productos/${id}`).remove()
            .then(() => alert("Producto eliminado correctamente."))
            .catch(error => console.error("Error al eliminar:", error));
    }
};

// ==========================================
// 6. CARRITO DE COMPRAS Y MODAL DE DETALLE
// ==========================================
function getCart() {
    return JSON.parse(localStorage.getItem(`cart_${currentUser?.email}`)) || [];
}

function saveCart(cart) {
    localStorage.setItem(`cart_${currentUser?.email}`, JSON.stringify(cart));
}

window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    let cart = getCart();
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    renderCart();
};

window.updateCartQuantity = function(id, amount) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    saveCart(cart);
    renderCart();
};

function renderCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalVal = document.getElementById("cart-total-val");

    if (!cartItemsContainer || !cartTotalVal) return;

    const cart = getCart();
    cartItemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        cartItemsContainer.insertAdjacentHTML('beforeend', `
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <h6 class="m-0 text-white">${item.name}</h6>
                    <small class="text-muted">RD$ ${parseFloat(item.price).toLocaleString('es-DO')} x ${item.quantity}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold text-warning me-2">RD$ ${subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    <button class="btn btn-sm btn-secondary px-2 py-0" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <button class="btn btn-sm btn-secondary px-2 py-0" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
        `);
    });

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-muted m-0 text-center py-2">Tu carrito está vacío.</p>`;
    }

    cartTotalVal.textContent = total.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) {
            alert("No tienes artículos en tu carrito de compras.");
            return;
        }

        // Calcular el total antes de vaciar el carrito
        const totalCompra = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Registrar la venta en Firebase
        db.ref("ventas").push({
            total: totalCompra,
            fecha: new Date().toISOString(),
            usuario: currentUser.email
        }).then(() => {
            alert("¡Compra procesada con éxito! Su pedido de bebidas va en camino.");
            saveCart([]);
            renderCart();
        }).catch(error => {
            alert("Error al procesar la compra: " + error.message);
        });
    });
}

window.showProductCardDetail = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("details-modal-content");

    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <div class="card" style="width: 22rem;">
            <span class="close-modal text-end pe-3 pt-2" onclick="closeProductDetailModal()" style="cursor:pointer; font-size:1.8rem;">&times;</span>
            <img src="${product.img}" class="card-img-top p-3" alt="${product.name}" style="height:220px; object-fit:contain;">
            <div class="card-body">
                <span class="badge bg-info text-uppercase mb-2">${product.category}</span>
                <h4 class="card-title text-white fw-bold">${product.name}</h4>
                <p class="card-text text-white-50">Selección premium importada y distribuida oficialmente bajo los estándares de El Borrachón.</p>
                <h5 class="text-warning fw-bold mb-3">RD$ ${parseFloat(product.price).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h5>
                <button class="btn btn-primary w-100 fw-bold" onclick="addToCart('${product.id}'); closeProductDetailModal();">Añadir al Carrito</button>
            </div>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.closeProductDetailModal = function() {
    const modal = document.getElementById("details-modal");
    if (modal) modal.classList.add("hidden");
};

window.addEventListener("click", (e) => {
    const modal = document.getElementById("details-modal");
    if (e.target === modal) modal.classList.add("hidden");
});

// ==========================================
// 7. BUSCADOR Y CIERRE DE SESIÓN
// ==========================================
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const activeTabButton = document.querySelector("#category-filter-list .active");

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

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        firebase.auth().signOut()
            .then(() => window.location.replace("index.html"))
            .catch(() => window.location.replace("index.html"));
    });
}