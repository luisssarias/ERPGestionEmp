// Helper para obtener URL de API
const getApiBaseUrl = () => {
    const protocol = window.location.protocol;
    const host = window.location.host.split(':')[0];
    return `${protocol}//${host}:8000/api`;
};

// Mostrar/ocultar contraseña
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function(e) {
        e.preventDefault();
        const input = document.querySelector("#contrasena");
        const icon = this.querySelector("i");

        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    });
});


document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
        const response = await fetch(`${getApiBaseUrl()}/login`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: correo,
                contrasena: contrasena
            })
        });

        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await response.json() : null;

        if(response.ok){
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        } else {
            const message = data?.message
                || data?.errors?.correo?.[0]
                || "Credenciales incorrectas";
            alert(message);
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
});