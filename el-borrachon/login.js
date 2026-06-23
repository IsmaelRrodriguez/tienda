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

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
    
    let authMode = "login";

    // OBTENER ELEMENTOS DEL DOM
    const loginModal = document.getElementById("login-modal");
    const showLoginBtn = document.getElementById("show-login-btn");
    const getStartedBtn = document.getElementById("get-started-btn");
    const closeModalBtn = document.getElementById("close-modal-btn"); // <-- ¡ID de la X Corregido!
    const loginForm = document.getElementById("login-form");
    const confirmPasswordGroup = document.getElementById("confirm-password-group");
    const btnSubmitAuth = document.getElementById("btn-submit-auth");
    const toggleAuthModeBtn = document.getElementById("toggle-auth-mode"); // Unificado para evitar error de duplicación
    const testCredsBox = document.getElementById("test-creds-box");
    const btnGoogleAuth = document.getElementById("btn-google-auth"); // Botón de Google
    
    // ELEMENTOS DEL DOM PARA CAPTURAR NOMBRE Y APELLIDO (Mantenidos intactos)
    const registerNameGroup = document.getElementById("register-name-group");
    const registerLastNameGroup = document.getElementById("register-lastname");
    const regFirstNameInput = document.getElementById("reg-firstname");
    const regLastNameInput = document.getElementById("reg-lastname");

    // Redirigir si el usuario ya inició sesión previamente
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = "tienda.html";
        return;
    }

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

    // CAMBIAR ENTRE MODO INICIAR SESIÓN Y REGISTRO
    if (toggleAuthModeBtn) {
        toggleAuthModeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (authMode === "login") {
                authMode = "register";
                toggleAuthModeBtn.textContent = "¿Ya tienes cuenta? Inicia sesión aquí";
                btnSubmitAuth.textContent = "Registrarse";
                confirmPasswordGroup.classList.remove("hidden");
                
                // Mostrar campos de nombre/apellido y activarlos como obligatorios
                if (registerNameGroup) registerNameGroup.classList.remove("hidden");
                if (registerLastNameGroup) registerLastNameGroup.classList.remove("hidden");
                if (regFirstNameInput) regFirstNameInput.required = true;
                if (regLastNameInput) regLastNameInput.required = true;

                if (testCredsBox) testCredsBox.classList.add("hidden");
            } else {
                authMode = "login";
                toggleAuthModeBtn.textContent = "¿No tienes cuenta? Regístrate aquí";
                btnSubmitAuth.textContent = "Ingresar";
                confirmPasswordGroup.classList.add("hidden");
                
                // Ocultar campos de nombre/apellido y remover obligatoriedad
                if (registerNameGroup) registerNameGroup.classList.add("hidden");
                if (registerLastNameGroup) registerLastNameGroup.classList.add("hidden");
                if (regFirstNameInput) regFirstNameInput.required = false;
                if (regLastNameInput) regLastNameInput.required = false;

                if (testCredsBox) testCredsBox.classList.remove("hidden");
            }
        });
    }

    // REGISTRO / LOGIN CON GOOGLE CORREGIDO PARA GITHUB PAGES
    if (btnGoogleAuth) {
        btnGoogleAuth.addEventListener("click", () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    
                    // Extraer de forma segura el nombre de Google para evitar ReferenceError
                    const displayName = user.displayName || "Usuario Google";
                    const nameParts = displayName.split(" ");
                    const firstName = nameParts[0] || "Usuario";
                    const lastName = nameParts.slice(1).join(" ") || "Google";

                    // Verificar existencia del usuario en Realtime Database
                    db.ref("usuarios/" + user.uid).once("value")
                        .then((snapshot) => {
                            let userRole = "client"; // Estandarizado a "client" para evitar conflictos
                            let finalFirstName = firstName;
                            let finalLastName = lastName;

                            if (snapshot.exists()) {
                                const existingData = snapshot.val();
                                // Soportar tanto 'role' como 'rol' por compatibilidad
                                userRole = existingData.role || existingData.rol || "client";
                                finalFirstName = existingData.firstName || firstName;
                                finalLastName = existingData.lastName || lastName;
                            } else {
                                // Si es un usuario de Google nuevo, registrarlo correctamente
                                db.ref("usuarios/" + user.uid).set({
                                    email: user.email,
                                    role: userRole,
                                    firstName: finalFirstName,
                                    lastName: finalLastName,
                                    createdAt: new Date().toISOString()
                                });
                            }

                            // Guardar la sesión localmente en el sessionStorage
                            sessionStorage.setItem('currentUser', JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                role: userRole,
                                firstName: finalFirstName,
                                lastName: finalLastName
                            }));

                            // DETECTAR LA RUTA CORRECTA EN GITHUB PAGES DINÁMICAMENTE
                            const currentPath = window.location.pathname;
                            if (currentPath.includes("/el-borrachon/")) {
                                // Cambia index.html por tienda.html manteniendo las carpetas de GitHub
                                window.location.href = currentPath.replace("index.html", "tienda.html");
                            } else {
                                window.location.href = "tienda.html"; // Respaldo para Localhost
                            }
                        })
                        .catch((dbErr) => {
                            console.error("Error en la base de datos de Firebase:", dbErr);
                            alert("Error en la base de datos: " + dbErr.message);
                        });
                })
                .catch((error) => {
                    console.error("Error completo de Firebase Auth:", error);
                    alert("Error al autenticar con Google: " + traducirError(error.code));
                });
        });
    }
    // PROCESAR ENVÍO DEL FORMULARIO (LOGIN / REGISTRO)
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const originalBtnText = btnSubmitAuth.textContent;
            btnSubmitAuth.disabled = true;
            btnSubmitAuth.textContent = authMode === "login" ? "Ingresando..." : "Registrando...";

            if (authMode === "login") {
                // LÓGICA PARA INICIAR SESIÓN
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const uid = userCredential.user.uid;

                        // Buscar en tiempo real los datos guardados de este usuario en la Base de Datos
                        db.ref("usuarios/" + uid).once("value")
                            .then((snapshot) => {
                                const userData = snapshot.val();
                                const role = userData ? userData.role : "client";
                                const firstName = userData ? userData.firstName : "";
                                const lastName = userData ? userData.lastName : "";

                                // Guardar sesión local con nombre completo
                                sessionStorage.setItem('currentUser', JSON.stringify({ 
                                    uid, 
                                    email, 
                                    role,
                                    firstName,
                                    lastName
                                }));
                                window.location.href = "tienda.html";
                            })
                            .catch((err) => {
                                console.error("Error leyendo datos del usuario:", err);
                                window.location.href = "tienda.html";
                            });
                    })
                    .catch((error) => {
                        alert("Error: " + traducirError(error.code));
                        resetSubmitButton(btnSubmitAuth, originalBtnText);
                    });

            } else {
                // LÓGICA PARA REGISTRAR NUEVA CUENTA
                const confirmPassword = document.getElementById("confirm-password").value;
                const firstName = regFirstNameInput ? regFirstNameInput.value.trim() : "";
                const lastName = regLastNameInput ? regLastNameInput.value.trim() : "";

                // Validación manual obligatoria por código
                if (!firstName || !lastName) {
                    alert("Por favor, introduce tu primer nombre y primer apellido.");
                    resetSubmitButton(btnSubmitAuth, originalBtnText);
                    return;
                }

                if (password !== confirmPassword) {
                    alert("Las contraseñas no coinciden.");
                    resetSubmitButton(btnSubmitAuth, originalBtnText);
                    return;
                }

                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const uid = userCredential.user.uid;
                        
                        let role = "client"; 
                        if (email.toLowerCase().includes("admin")) {
                            role = "admin";
                        }

                        // Guardar la información estructurada en Firebase Realtime Database
                        db.ref("usuarios/" + uid).set({
                            email: email,
                            role: role,
                            firstName: firstName,
                            lastName: lastName,
                            createdAt: new Date().toISOString()
                        }).then(() => {
                            alert("¡Cuenta creada exitosamente!");
                            
                            // Autenticar la sesión local automáticamente
                            sessionStorage.setItem('currentUser', JSON.stringify({ 
                                uid, 
                                email, 
                                role,
                                firstName,
                                lastName
                            }));
                            window.location.href = "tienda.html";
                        }).catch((dbErr) => {
                            console.error("Error guardando datos del usuario en DB:", dbErr);
                            resetSubmitButton(btnSubmitAuth, originalBtnText);
                        });
                    })
                    .catch((error) => {
                        alert("Error al registrar: " + traducirError(error.code));
                        resetSubmitButton(btnSubmitAuth, originalBtnText);
                    });
            }
        });
    }
});

function resetSubmitButton(btn, text) {
    btn.disabled = false;
    btn.textContent = text;
}

function traducirError(code) {
    switch (code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Las credenciales son incorrectas.";
        case "auth/email-already-in-use":
            return "Este correo electrónico ya está registrado por otro usuario.";
        case "auth/invalid-email":
            return "El formato de correo electrónico no es válido.";
        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";
        case "auth/too-many-requests":
            return "Demasiados intentos. Cuenta bloqueada temporalmente.";
        case "auth/popup-blocked":
            return "El navegador bloqueó la ventana emergente de Google. Por favor, permite los pop-ups para este sitio.";
        case "auth/popup-closed-by-user":
            return "Cerraste la ventana de Google antes de completar el inicio de sesión.";
        case "auth/cancelled-popup-request":
            return "Se canceló la solicitud porque se abrió otra ventana de autenticación.";
        default:
            return "Ocurrió un error inesperado.";
    }
}