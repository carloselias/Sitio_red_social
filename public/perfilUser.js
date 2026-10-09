const API_URL = "/api";

const params = new URLSearchParams(window.location.search);

const profileId = params.get("id");

const profileForm = document.querySelector("#profile-form");

const nameInput = document.querySelector("#profile-name");

const emailInput = document.querySelector("#profile-email");

const descriptionInput = document.querySelector("#profile-description");

const imageInput = document.querySelector("#profile-image");

const profileImageContainer = document.querySelector("#profile-image-container");

const profileMessage = document.querySelector("#profile-message");

const headerUserName = document.querySelector("#header-user-name");

const logoutButton = document.querySelector("#logout-button");

const followSection = document.querySelector("#follow-section");

const followButton = document.querySelector("#follow-button");

const followersCount = document.querySelector("#followers-count");

const saveProfileButton = document.querySelector("#save-profile-button");

async function getCurrentUser() {

    const token =
        localStorage.getItem("token");

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

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        return data.user;

    } catch (error) {

        console.error(error);

        return null;
    }
}

function updateUserInterface() {

    const userIcon = document.querySelector(".user-icon");

    const userName = document.querySelector(".user-name");

    const loginButton = document.querySelector("#login-button");

    const logoutButton = document.querySelector("#logout-button");

    const registerButton = document.querySelector("#register-button");

    if (currentUser) {

        /*
         * Usuario autenticado
         */
        if (currentUser.profileImage) {
            userIcon.src = currentUser.profileImage;
        }
        userName.textContent = currentUser.name;
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-block";
        registerButton.style.display = "none";
        userName.style.cursor = "pointer";
        userName.addEventListener("click", redirectToProfile);

    } else {

        /*
         * Usuario no autenticado
         */
        userIcon.src = "/svg/default-user-icon.svg"; // Limpiar la fuente del icono del usuario
        userName.textContent = "Invitado";
        loginButton.style.display = "inline-block";
        logoutButton.style.display = "none";
        userName.style.cursor = "none";
        userName.removeEventListener("click", redirectToProfile);
    }
}

async function getProfile(id) {

    const response =
        await fetch(
            `${API_URL}/aut/users/${id}`
        );

    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "No se pudo obtener el perfil"
        );

    }


    return data.user;
}

function enableEditMode() {

    nameInput.readOnly = false;

    descriptionInput.readOnly = false;

    imageInput.style.display =
        "block";

    saveProfileButton.style.display =
        "inline-block";

    profileForm.classList.remove(
        "view-only"
    );

    followSection.style.display = "none";
}

function enableViewMode() {
    nameInput.readOnly = true;

    descriptionInput.readOnly = true;

    imageInput.style.display =
        "none";

    saveProfileButton.style.display =
        "none";

    profileForm.classList.add(
        "view-only"
    );

    followSection.style.display = "block";
}

function updateFollowButton(following) {

    if (following) {

        followButton.textContent =
            "Dejar de seguir";

        followButton.classList.add(
            "following"
        );

    } else {

        followButton.textContent =
            "Seguir";

        followButton.classList.remove(
            "following"
        );

    }

}

async function toggleFollow(id) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "iniciarSesion.html";

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/aut/users/${id}/follow`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "No se pudo modificar el seguimiento"
            );

        }


        updateFollowButton(
            data.following
        );


        followersCount.textContent =
            data.followersCount;


    } catch (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

    }

}

// ==========================================
// Mostrar mensaje
// ==========================================

function showMessage(message, type) {

    profileMessage.textContent =
        message;

    profileMessage.className =
        `form-message ${type}`;

}

// ==========================================
// Cargar usuario
// ==========================================

async function loadProfile() {

    const token =
        localStorage.getItem("token");


    let currentUser = null;


    if (token) {

        currentUser =
            await getCurrentUser();

    }


    let profile;


    try {

        if (profileId) {

            // Estamos visitando un perfil específico

            profile =
                await getProfile(profileId);

        } else {

            // Estamos viendo nuestro propio perfil

            if (!currentUser) {

                window.location.href =
                    "iniciarSesion.html";

                return;

            }

            profile =
                currentUser;

        }


    } catch (error) {

        console.error(error);

        showMessage(
            error.message,
            "error"
        );

        return;

    }


    /*
     * Determinar si es nuestro perfil
     */

    const isOwnProfile =
        currentUser &&
        currentUser._id === profile._id;

    followersCount.textContent = profile.followersCount || 0;

    /*
     * Cargar información
     */

    nameInput.value =
        profile.name || "";

    emailInput.value =
        profile.email || "";

    descriptionInput.value =
        profile.description || "";


    headerUserName.textContent =
        profile.name || "Usuario";


    renderProfileImage(
        profile.profileImage
    );


    /*
     * Modo edición
     */

    if (isOwnProfile) {

        enableEditMode();

    } else {

        enableViewMode();
        updateFollowButton(profile.following);
    }

}

// ==========================================
// Mostrar foto de perfil
// ==========================================

function renderProfileImage(image) {

    if (image) {

        profileImageContainer.innerHTML = `

            <img
                src="${image}"
                alt="Foto de perfil"
                class="profile-image"
            >

        `;

    } else {

        profileImageContainer.innerHTML = `

            <p>
                No tienes una foto de perfil.
            </p>

        `;

    }

}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * Comprobar si ya existe
         * una sesión guardada
         */
        currentUser =
            await getCurrentUser();

        if (!currentUser) {
            window.location.replace("iniciarSesion.html");
            return;
        }

        updateUserInterface();
    }
);

// ==========================================
// Vista previa
// ==========================================

imageInput.addEventListener(
    "change",
    () => {

        const image =
            imageInput.files[0];


        if (!image) {
            return;
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];


        if (
            !allowedTypes.includes(
                image.type
            )
        ) {

            showMessage(
                "Solo se permiten imágenes JPG, PNG, WEBP o GIF",
                "error"
            );

            imageInput.value = "";

            return;

        }


        if (
            image.size >
            5 * 1024 * 1024
        ) {

            showMessage(
                "La imagen no puede superar los 5 MB",
                "error"
            );

            imageInput.value = "";

            return;

        }


        const imageURL =
            URL.createObjectURL(image);


        profileImageContainer.innerHTML = `

            <img
                src="${imageURL}"
                alt="Vista previa"
                class="profile-image"
            >

        `;

    }
);

// ==========================================
// Guardar perfil
// ==========================================

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const token =
            localStorage.getItem("token");


        if (!token) {

            window.location.href =
                "iniciarSesion.html";

            return;

        }


        const name =
            nameInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const image =
            imageInput.files[0];


        // Validar nombre

        if (!name) {

            showMessage(
                "El nombre es obligatorio",
                "error"
            );

            return;

        }


        // Validar longitud del nombre

        if (
            name.length > 100
        ) {

            showMessage(
                "El nombre no puede superar los 100 caracteres",
                "error"
            );

            return;

        }


        // Validar descripción

        if (
            description.length > 500
        ) {

            showMessage(
                "La descripción no puede superar los 500 caracteres",
                "error"
            );

            return;

        }


        try {

            showMessage(
                "Guardando cambios...",
                "loading"
            );


            const formData =
                new FormData();


            formData.append(
                "name",
                name
            );


            formData.append(
                "description",
                description
            );


            if (image) {

                formData.append(
                    "profileImage",
                    image
                );

            }


            const response =
                await fetch(
                    `${API_URL}/aut/perfil`,
                    {
                        method: "PUT",

                        headers: {
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
                    "No se pudo actualizar el perfil"
                );

            }


            showMessage(
                "Perfil actualizado correctamente",
                "success"
            );


            // Actualizar nombre del encabezado

            headerUserName.textContent =
                data.user.name;


            // Mostrar nueva imagen

            renderProfileImage(
                data.user.profileImage
            );


            // Limpiar input de imagen

            imageInput.value = "";


        } catch (error) {

            console.error(
                "Error al actualizar perfil:",
                error
            );


            showMessage(
                error.message,
                "error"
            );

        }

    }
);

// ==========================================
// Cerrar sesión
// ==========================================

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

// ==========================================
// Inicializar
// ==========================================

followButton.addEventListener(
    "click",
    () => {

        if (!profileId) {
            return;
        }

        toggleFollow(profileId);

    }
);

loadProfile();