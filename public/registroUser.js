const API_URL = "/api";

const registerForm =
    document.querySelector("#register-form");

const nameInput =
    document.querySelector("#register-name");

const emailInput =
    document.querySelector("#register-email");

const passwordInput =
    document.querySelector("#register-password");

const passwordConfirmInput =
    document.querySelector("#register-password-confirm");

const registerMessage =
    document.querySelector("#register-message");


function showMessage(message, type) {

    registerMessage.textContent = message;

    registerMessage.className =
        `form-message ${type}`;
}


registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const name =
            nameInput.value.trim();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const passwordConfirm =
            passwordConfirmInput.value;


        // Validar nombre

        if (!name) {

            showMessage(
                "El nombre es obligatorio",
                "error"
            );

            return;
        }


        // Validar correo

        if (!email) {

            showMessage(
                "El correo electrónico es obligatorio",
                "error"
            );

            return;
        }


        // Validar contraseña

        if (password.length < 6) {

            showMessage(
                "La contraseña debe tener al menos 6 caracteres",
                "error"
            );

            return;
        }


        // Confirmar contraseña

        if (password !== passwordConfirm) {

            showMessage(
                "Las contraseñas no coinciden",
                "error"
            );

            return;
        }


        try {

            showMessage(
                "Creando cuenta...",
                "loading"
            );


            const response =
                await fetch(
                    `${API_URL}/aut/registro`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                const errorMessage =
                    data.message ||
                    "No se pudo crear la cuenta";

                showMessage(
                    errorMessage,
                    "error"
                );

                return;
            }


            showMessage(
                "Cuenta creada correctamente. Redirigiendo al inicio de sesión...",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "iniciarSesion.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Error al registrar usuario:",
                error
            );

            showMessage(
                "No se pudo conectar con el servidor",
                "error"
            );
        }

    }
);