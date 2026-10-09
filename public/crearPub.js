const API_URL = "/api";


/* =========================
   OBTENER USUARIO ACTUAL
   ========================= */

async function getCurrentUser() {

    const token =
        localStorage.getItem("token");

    /*
     * Si no existe token,
     * no hay sesión.
     */
    if (!token) {
        return null;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/aut/me`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        /*
         * Token inválido
         * o expirado.
         */
        if (response.status === 401) {

            localStorage.removeItem("token");

            return null;
        }


        if (!response.ok) {
            return null;
        }


        const data =
            await response.json();


        return data.user;

    } catch (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;
    }
}


/* =========================
   CREAR PUBLICACIÓN
   ========================= */

async function createPost(
    title,
    content,
    imageFile
) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        throw new Error(
            "Debes iniciar sesión para crear una publicación"
        );
    }


    /*
     * FormData permite enviar
     * texto + archivo.
     */
    const formData =
        new FormData();


    formData.append(
        "title",
        title
    );


    formData.append(
        "content",
        content
    );


    /*
     * La imagen es opcional.
     */
    if (imageFile) {

        formData.append(
            "image",
            imageFile
        );
    }


    const response =
        await fetch(
            `${API_URL}/pub`,
            {
                method: "POST",

                headers: {
                    /*
                     * IMPORTANTE:
                     * NO establecer Content-Type
                     * manualmente cuando usamos FormData.
                     */
                    "Authorization":
                        `Bearer ${token}`
                },

                body: formData
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "No se pudo crear la publicación"
        );
    }


    return data.post;
}


/* =========================
   INICIALIZAR PÁGINA
   ========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const userName =
            document.querySelector(
                "#user-name"
            );


        const form =
            document.querySelector(
                "#create-post-form"
            );


        const titleInput =
            document.querySelector(
                "#post-title"
            );


        const contentInput =
            document.querySelector(
                "#post-content"
            );


        const imageInput =
            document.querySelector(
                "#post-image"
            );


        const message =
            document.querySelector(
                "#create-post-message"
            );


        const previewContainer =
            document.querySelector(
                "#image-preview-container"
            );


        const previewImage =
            document.querySelector(
                "#image-preview"
            );


        const cancelButton =
            document.querySelector(
                "#cancel-post-button"
            );


        const logoutButton =
            document.querySelector(
                "#logout-button"
            );


        const publishButton =
            document.querySelector(
                "#publish-post-button"
            );


        /* =========================
           COMPROBAR SESIÓN
           ========================= */

        const currentUser =
            await getCurrentUser();


        if (!currentUser) {

            /*
             * No existe una sesión válida.
             */
            window.location.href =
                "index.html";

            return;
        }


        /*
         * Mostrar nombre del usuario.
         */
        userName.textContent =
            currentUser.name;


        /* =========================
           VISTA PREVIA DE IMAGEN
           ========================= */

        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files[0];


                if (!file) {

                    previewContainer.style.display =
                        "none";

                    previewImage.src = "";

                    return;
                }


                /*
                 * Validar tipo de archivo.
                 */
                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif"
                ];


                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    message.textContent =
                        "Solo se permiten imágenes JPG, PNG, WEBP o GIF.";

                    imageInput.value = "";

                    previewContainer.style.display =
                        "none";

                    return;
                }


                /*
                 * Validar tamaño.
                 */
                const maxSize =
                    5 * 1024 * 1024;


                if (file.size > maxSize) {

                    message.textContent =
                        "La imagen no puede superar los 5 MB.";

                    imageInput.value = "";

                    previewContainer.style.display =
                        "none";

                    return;
                }


                /*
                 * Crear URL temporal
                 * para la vista previa.
                 */
                const imageURL =
                    URL.createObjectURL(file);


                previewImage.src =
                    imageURL;


                previewContainer.style.display =
                    "block";


                message.textContent = "";
            }
        );


        /* =========================
           ENVIAR FORMULARIO
           ========================= */

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const title =
                    titleInput.value.trim();


                const content =
                    contentInput.value.trim();


                const imageFile =
                    imageInput.files[0] ||
                    null;


                message.textContent =
                    "Publicando...";


                publishButton.disabled =
                    true;


                try {

                    /*
                     * Crear publicación.
                     */
                    const post =
                        await createPost(
                            title,
                            content,
                            imageFile
                        );


                    console.log(
                        "Publicación creada:",
                        post
                    );


                    message.textContent =
                        "Publicación creada correctamente.";


                    /*
                     * Esperamos brevemente
                     * para que el usuario vea
                     * el mensaje.
                     */
                    setTimeout(
                        () => {

                            window.location.href =
                                "index.html";

                        },
                        700
                    );

                } catch (error) {

                    console.error(
                        "Error:",
                        error
                    );


                    message.textContent =
                        error.message;


                    publishButton.disabled =
                        false;
                }
            }
        );

        /* =========================
           CERRAR SESIÓN
           ========================= */

        logoutButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "token"
                );


                window.location.href =
                    "index.html";
            }
        );

    }
);