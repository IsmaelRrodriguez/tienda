// ==========================================
// 1. ESTADO DE LA APLICACIÓN Y BASE DE DATOS
// ==========================================

// CONFIGURACIÓN DE FIREBASE (Asegúrate de colocar tu databaseURL correcta)
const firebaseConfig = {
    apiKey: "AIzaSyB6qu7KfOJdiGLXOG-DwJODY3rxYyMEWAU",
    authDomain: "el-borrachon.firebaseapp.com",
    databaseURL: "https://el-borrachon-default-rtdb.firebaseio.com/", // <-- Reemplaza con la URL exacta de tu Realtime Database si varía
    projectId: "el-borrachon",
    storageBucket: "el-borrachon.firebasestorage.app",
    messagingSenderId: "854934153912",
    appId: "1:854934153912:web:496c4311874785fa23224d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
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

// Arreglo global reactivo que se llenará automáticamente con los datos de Firebase
let products = [];

// ==========================================
// CONTROL DE ACCESOS Y VISTAS DE ROLES
// ==========================================
if (!currentUser) {
    window.location.replace("index.html");
} else {
    document.addEventListener("DOMContentLoaded", () => {
        const adminPanel = document.getElementById("admin-panel");
        const adminUsersPanel = document.getElementById("admin-users-panel");
        const clientPanel = document.getElementById("client-panel");
        const userNavLabel = document.getElementById("user-role-label");

        if (userNavLabel) {
            userNavLabel.textContent = `${currentUser.email} (${currentUser.role.toUpperCase()})`;
        }

        // Escuchamos el rol del usuario logueado directamente desde Firebase en tiempo real
        db.ref("usuarios/" + currentUser.uid + "/role").on("value", (snapshot) => {
            const serverRole = snapshot.val() || currentUser.role;
            
            // Si el administrador nos cambió el rol desde el panel, actualizamos la sesión local
            if (serverRole !== currentUser.role) {
                currentUser.role = serverRole;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                window.location.reload(); // Recarga para aplicar los cambios de vista
                return;
            }

            // Gestionar visibilidad de paneles según el rol definitivo
            if (serverRole === "admin") {
                if (adminPanel) adminPanel.classList.remove("hidden");
                if (adminUsersPanel) adminUsersPanel.classList.remove("hidden");
                if (clientPanel) clientPanel.classList.add("hidden");
                cargarUsuariosYRoles(); // Llama a la función de la tabla de usuarios
            } else {
                if (adminPanel) adminPanel.classList.add("hidden");
                if (adminUsersPanel) adminUsersPanel.classList.add("hidden");
                if (clientPanel) clientPanel.classList.remove("hidden");
            }
        });
    });
}

// ==========================================
// GESTIÓN DE USUARIOS Y CAMBIO DE ROLES (NUEVO)
// ==========================================
function cargarUsuariosYRoles() {
    const tableBody = document.getElementById("users-table-body");
    if (!tableBody) return;

    // Escuchar el nodo 'usuarios' en Firebase Realtime Database
    db.ref("usuarios").on("value", (snapshot) => {
        tableBody.innerHTML = "";
        const usuarios = snapshot.val();

        if (usuarios) {
            Object.keys(usuarios).map(uid => {
                const user = usuarios[uid];
                const fecha = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Predefinido";
                
                // Definir el color del badge según el rol
                const badgeClass = user.role === "admin" ? "bg-danger" : "bg-info";
                const botonTexto = user.role === "admin" ? "Cambiar a Cliente" : "Hacer Administrador";
                const botonClass = user.role === "admin" ? "btn-outline-info" : "btn-outline-danger";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><strong>${user.email}</strong></td>
                    <td><span class="badge ${badgeClass}">${user.role.toUpperCase()}</span></td>
                    <td><span class="text-white-50 small">${fecha}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm ${botonClass}" onclick="cambiarRolUsuario('${uid}', '${user.role}')">
                            ${botonTexto}
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-white-50">No hay usuarios registrados en la base de datos.</td></tr>`;
        }
    });
}

// Función global para actualizar el rol en Firebase
window.cambiarRolUsuario = function(uid, rolActual) {
    const nuevoRol = rolActual === "admin" ? "client" : "admin";
    
    // Evitar que el administrador se quite los permisos a sí mismo por error
    if (currentUser.uid === uid || currentUser.email === "admin@borrachon.com") {
        if (currentUser.uid === uid) {
            alert("⚠️ No puedes cambiar tu propio rol de administrador.");
            return;
        }
    }

    db.ref("usuarios/" + uid).update({
        role: nuevoRol
    })
    .then(() => {
        alert(`¡Rol actualizado con éxito a ${nuevoRol.toUpperCase()}!`);
        
        // Si el administrador actual modificó su propia sesión secundaria, actualizamos
        if(currentUser.uid === uid) {
            currentUser.role = nuevoRol;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            window.location.reload();
        }
    })
    .catch((error) => {
        console.error("Error al actualizar el rol:", error);
    });
};

// ==========================================
// 3. RENDERIZADO DEL INTERFAZ DE USUARIO
// ==========================================

// Pintar el Carrusel dinámico con los últimos 4 licores de internet
// Pintar el Carrusel dinámico con los últimos licores de internet
function renderCarousel() {
    const carouselInner = document.getElementById("carousel-dynamic-inner");
    if (!carouselInner) return;

    // CORRECCIÓN AQUÍ: Limpiamos con comillas vacías, SIN el "0"
    carouselInner.innerHTML = "";

    // Si no hay productos en la base de datos, salimos de la función
    if (!products || products.length === 0) return;

    // Recorremos los productos e inyectamos la estructura exacta que Bootstrap requiere
    products.forEach((product, index) => {
        // Solo el primer producto (index === 0) lleva la clase 'active'
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

    // Reiniciamos el carrusel para que reconozca los nuevos elementos y aplique el tiempo
    const myCarouselEl = document.getElementById('carouselExampleAutoplaying');
    if (myCarouselEl) {
        const carousel = bootstrap.Carousel.getOrCreateInstance(myCarouselEl);
        carousel.to(0); // Mueve el carrusel al primer elemento de forma segura
        carousel.cycle(); // Activa el movimiento automático
    }
}

// Pintar las cuadrículas de productos por categorías
function renderProducts(productsList) {
    const grids = {
        Ron: document.getElementById("grid-ron"),
        Vodka: document.getElementById("grid-vodka"),
        Cerveza: document.getElementById("grid-cerveza"),
        Tequila: document.getElementById("grid-tequila"),
        Otros: document.getElementById("grid-otros"),
        Todas: document.getElementById("grid-todas")
    };

    Object.values(grids).forEach(grid => { if (grid) grid.innerHTML = ""; });

    productsList.forEach(product => {
        const formattedPrice = parseFloat(product.price).toLocaleString('es-DO', { minimumFractionDigits: 2 });
        let actionButton = "";

        if (currentUser && currentUser.role === "admin") {
            actionButton = `<button class="btn btn-danger" style="margin-top: auto;" onclick="deleteProduct('${product.id}')">Eliminar</button>`;
        } else {
            actionButton = `
                <button class="btn" style="margin-bottom: 8px;" onclick="addToCart('${product.id}')">Añadir al Carrito</button>
                <button class="btn" style="background-color: #576574;" onclick="showProductCardDetail('${product.id}')">Ver Detalle</button>
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

        if (grids[product.category]) {
            grids[product.category].insertAdjacentHTML('beforeend', cardHTML);
        }
        if (grids.Todas) {
            grids.Todas.insertAdjacentHTML('beforeend', cardHTML);
        }
    });
}

// ==========================================
// 4. LOGICA DE ADMINISTRACIÓN (ALTAS Y BAJAS EN FIREBASE)
// ==========================================
const productForm = document.getElementById("product-form");
if (productForm) {
    productForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const nameVal = document.getElementById("prod-name").value.trim();
        const priceVal = parseFloat(document.getElementById("prod-price").value);
        const imgVal = document.getElementById("prod-img").value.trim();
        const catVal = document.getElementById("prod-category").value;

        if (!nameVal || isNaN(priceVal) || !imgVal || !catVal) {
            alert("Por favor, completa correctamente todos los campos obligatorios.");
            return;
        }

        const newProduct = {
            name: nameVal,
            price: priceVal,
            img: imgVal,
            category: catVal
        };

        // Guardado directo en internet usando Firebase
        db.ref("productos").push(newProduct)
            .then(() => {
                alert("¡Bebida agregada exitosamente y sincronizada en la nube!");
                productForm.reset();
                const selectCategory = document.getElementById("prod-category");
                if (selectCategory) selectCategory.classList.remove("selected-valid");
            })
            .catch(error => {
                console.error("Error al sincronizar con Firebase:", error);
                alert("Hubo un problema al guardar en internet.");
            });
    });
}

// Función global para eliminar licores desde la base de datos
function deleteProduct(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto permanentemente de todos los dispositivos?")) {
        db.ref(`productos/${id}`).remove()
            .then(() => {
                alert("Producto eliminado correctamente.");
            })
            .catch(error => console.error("Error al eliminar de Firebase:", error));
    }
}

// ==========================================
// 5. GESTIÓN DEL CARRITO DE COMPRAS (LOCAL POR PESTAÑA)
// ==========================================
function getCart() {
    return JSON.parse(localStorage.getItem(`cart_${currentUser?.email}`)) || [];
}

function saveCart(cart) {
    localStorage.setItem(`cart_${currentUser?.email}`, JSON.stringify(cart));
}

function addToCart(id) {
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
}

function updateCartQuantity(id, amount) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    saveCart(cart);
    renderCart();
}

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
        cartItemsContainer.innerHTML = `<p class="text-muted m-0 text-center py-2">Tu carrito está completamente vacío.</p>`;
    }

    cartTotalVal.textContent = total.toLocaleString('es-DO', { minimumFractionDigits: 2 });
}

// Finalizar la compra
const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) {
            alert("No tienes artículos en tu carrito de compras.");
            return;
        }
        alert("¡Compra procesada con éxito! Su pedido de bebidas va en camino.");
        saveCart([]);
        renderCart();
    });
}

// ==========================================
// 6. DETALLES EXTENDIDOS (MODAL)
// ==========================================
function showProductCardDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById("details-modal");
    const modalContent = document.getElementById("details-modal-content");

    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
        <span class="close-modal" onclick="closeProductDetailModal()">&times;</span>
        <div class="row align-items-center g-4">
            <div class="col-md-5 text-center">
                <img src="${product.img}" alt="${product.name}" class="img-fluid rounded" style="max-height: 280px; object-fit: contain; border: 1px solid rgba(255,255,255,0.1);">
            </div>
            <div class="col-md-7">
                <span class="badge mb-2 text-uppercase" style="background-color: var(--turquoise-color); font-size: 0.75rem;">${product.category}</span>
                <h2 class="text-white mb-2" style="font-weight: 700;">${product.name}</h2>
                <h3 class="text-warning mb-4" style="font-weight: 600;">RD$ ${parseFloat(product.price).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h3>
                <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.6;">
                    Disfruta de la mejor selección de nuestra categoría <strong class="text-white">${product.category}</strong>. 
                    Producto importado y distribuido oficialmente bajo los estándares de calidad de El Borrachón.
                </p>
                <button class="btn w-100" style="padding: 10px; font-weight: 600;" onclick="addToCart('${product.id}'); closeProductDetailModal();">Añadir al Carrito</button>
            </div>
        </div>
    `;

    modal.classList.remove("hidden");
}

function closeProductDetailModal() {
    const modal = document.getElementById("details-modal");
    if (modal) modal.classList.add("hidden");
}

window.addEventListener("click", (e) => {
    const modal = document.getElementById("details-modal");
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});

// ==========================================
// 7. BUSCADOR INTERNO FILTRADO Y LÓGICA AUXILIAR
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

// ==========================================
// CERRAR SESIÓN (OPTIMIZADO PARA EVITAR BUCLES)
// ==========================================
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault(); // Evita cualquier comportamiento por defecto del enlace/botón
        
        // 1. Limpiamos inmediatamente el almacenamiento local
        sessionStorage.removeItem('currentUser');
        
        // 2. Cerramos sesión en los servidores de Firebase
        firebase.auth().signOut()
            .then(() => {
                // Redirección limpia reemplazando el historial para que no pueda dar "atrás"
                window.location.replace("index.html");
            })
            .catch((error) => {
                console.error("Error al cerrar sesión en Firebase Auth:", error);
                // Forzar salida si falla la red
                window.location.replace("index.html");
            });
    });
}

// ==========================================
// 8. INICIALIZACIÓN CONECTADA A LA NUBE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // MODIFICACIÓN: Mostrar saludo con Nombre y Apellido si existen en la sesión
    const welcomeTextElement = document.getElementById("welcome-user-text");
    if (welcomeTextElement && currentUser) {
        if (currentUser.firstName && currentUser.lastName) {
            welcomeTextElement.textContent = `Hola, ${currentUser.firstName} ${currentUser.lastName}`;
        } else {
            // Fallback por si inicia sesión con un correo viejo sin registro de nombre completo
            welcomeTextElement.textContent = `Hola, ${currentUser.email.split('@')[0]}`;
        }
    }

    // Escuchar cambios en internet en tiempo real
    db.ref("productos").on("value", (snapshot) => {
        const data = snapshot.val();

        if (data) {
            // Convertimos la colección de Firebase en un arreglo manejable
            products = Object.keys(data).map(key => ({
                id: key, 
                name: data[key].name,
                price: data[key].price,
                img: data[key].img,
                category: data[key].category
            }));
        } else {
            // Si la base de datos de internet está vacía, subimos los defaultProducts automáticos
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

        // Redibujar de forma síncrona en todas las PCs y celulares abiertos
        renderCarousel();
        renderProducts(products);
    });

    renderCart();
});