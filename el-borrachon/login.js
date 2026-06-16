// CONTROL EXCLUSIVO PARA INDEX.HTML (LOGIN)
document.addEventListener("DOMContentLoaded", () => {
    // Si el usuario ya tiene sesión activa, enviarlo directo a la tienda
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = "tienda.html";
        return;
    }

    // Elementos del Modal
    const loginModal = document.getElementById("login-modal");
    const showLoginBtn = document.getElementById("show-login-btn");
    const getStartedBtn = document.getElementById("get-started-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");

    // Abrir Modal al presionar botones de la Landing
    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", () => loginModal.classList.remove("hidden"));
    }
    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", () => loginModal.classList.remove("hidden"));
    }

    // Cerrar Modal al presionar la X
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => loginModal.classList.add("hidden"));
    }

    // Cerrar si hace clic fuera del cuadro blanco
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add("hidden");
            }
        });
    }

    // Procesar envío del formulario
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            // Validar roles dinámicamente según el correo
            let role = "client"; 
            if (email.toLowerCase().includes("admin")) {
                role = "admin";
            }

            // Guardar sesión del usuario
            sessionStorage.setItem('currentUser', JSON.stringify({ email, role }));
            
            // Redirección inmediata
            window.location.href = "tienda.html";
        });
    }
});