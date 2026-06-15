// --- BASE DE DATOS INICIAL EN LOCALSTORAGE ---
const defaultProducts = [
    { id: 1, name: "Ron Añejo Extra", price: 25.00, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400" },
    { id: 2, name: "Vodka Premium", price: 30.00, img: "https://images.unsplash.com/photo-1608885898957-a599fb1bf680?w=400" },
    { id: 3, name: "Cerveza Artesanal IPAs (Six-Pack)", price: 15.50, img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400" }
];

if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(defaultProducts));
}

let products = JSON.parse(localStorage.getItem('products'));
let cart = [];
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// --- DETECCIÓN DE PÁGINA ACTUAL ---
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("login-form")) {
        initLogin();
    } else {
        initStore();
    }
});

// --- LÓGICA DE AUTENTICACIÓN ---
function initLogin() {
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Validación simple basada en Roles
        if (email === "admin@borrachon.com" && password === "admin123") {
            currentUser = { email, role: "admin" };
        } else if (email === "cliente@correo.com" && password === "user123") {
            currentUser = { email, role: "client" };
        } else {
            alert("Credenciales incorrectas. Intenta con las cuentas de prueba.");
            return;
        }

        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = "tienda.html";
    });
}

// --- LÓGICA DE LA TIENDA Y ROLES ---
function initStore() {
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    // Mostrar saludo
    document.getElementById("welcome-msg").innerText = `Hola, ${currentUser.email} (${currentUser.role})`;

    // Control de vistas por rol
    if (currentUser.role === "admin") {
        document.getElementById("admin-panel").classList.remove("hidden");
    } else if (currentUser.role === "client") {
        document.getElementById("client-panel").classList.remove("hidden");
    }

    // Botón Salir
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = "index.html";
    });

    // CRUD de Administrador (Eventos)
    if (currentUser.role === "admin") {
        document.getElementById("product-form").addEventListener("submit", handleProductSubmit);
    }

    // Checkout de cliente
    if (currentUser.role === "client") {
        document.getElementById("checkout-btn").addEventListener("click", () => {
            if (cart.length === 0) return alert("Tu carrito está vacío.");
            alert("¡Compra procesada con éxito! Disfruta con moderación. 🍻");
            cart = [];
            renderCart();
        });
    }

    renderProducts();
}

// --- RENDERIZAR CATÁLOGO ---
function renderProducts() {
    const container = document.getElementById("products-container");
    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        
        let actionButton = "";
        if (currentUser.role === "admin") {
            actionButton = `
                <button class="btn" style="background:#576574; margin-bottom:5px;" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn" style="background:var(--danger);" onclick="deleteProduct(${product.id})">Eliminar</button>
            `;
        } else {
            actionButton = `<button class="btn" onclick="addToCart(${product.id})">Añadir al Carrito</button>`;
        }

        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            ${actionButton}
        `;
        container.appendChild(card);
    });
}

// --- COMPORTAMIENTO ADMINISTRADOR (CRUD) ---
function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const name = document.getElementById("prod-name").value;
    const price = parseFloat(document.getElementById("prod-price").value);
    const img = document.getElementById("prod-img").value;

    if (id) {
        // Modo Edición
        products = products.map(p => p.id == id ? { id: parseInt(id), name, price, img } : p);
    } else {
        // Modo Creación
        const newProd = { id: Date.now(), name, price, img };
        products.push(newProd);
    }

    saveAndRefresh();
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("form-submit-btn").innerText = "Guardar Producto";
}

window.editProduct = function(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById("product-id").value = prod.id;
    document.getElementById("prod-name").value = prod.name;
    document.getElementById("prod-price").value = prod.price;
    document.getElementById("prod-img").value = prod.img;
    document.getElementById("form-submit-btn").innerText = "Actualizar Producto";
};

window.deleteProduct = function(id) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        products = products.filter(p => p.id !== id);
        saveAndRefresh();
    }
};

function saveAndRefresh() {
    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();
}

// --- COMPORTAMIENTO CLIENTE (CARRITO) ---
window.addToCart = function(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    cart.push(prod);
    renderCart();
};

function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const totalContainer = document.getElementById("cart-total-val");
    cartContainer.innerHTML = "";

    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)} <button class="btn-sm" onclick="removeFromCart(${index})">X</button></span>
        `;
        cartContainer.appendChild(div);
    });

    totalContainer.innerText = total.toFixed(2);
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
};