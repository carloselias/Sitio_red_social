let currentUser = null;
let redirectToCreatePost = false;
const API_URL = "/api";

async function getPosts() {

    try {

        const response =
            await fetch(`${API_URL}/pub`);

        if (!response.ok) {
            throw new Error(
                "No se pudieron obtener las publicaciones"
            );
        }

        const data = await response.json();

        return data.posts;

    } catch (error) {

        console.error(error);

        return [];
    }
}

async function loadPosts() {

    const posts = await getPosts();

    renderPosts(posts);
}

function renderPosts(posts) {
    const container =
        document.querySelector(".posts-list");
    
    if (!container) {
        return;
    }

    container.innerHTML = "";

    posts.forEach(post => {
        const authorId =
            post.author?._id?.toString();
        const currentUserId =
            currentUser?._id?.toString();

        const isAuthor =
            currentUser &&
            authorId === currentUserId;

        const isAdmin =
            currentUser?.role === "admin";

        const canModify =
            isAuthor || isAdmin;

        const actionsHTML = canModify
            ? `
                <div class="post-actions">

                    <button
                        class="edit-post-button"
                        data-id="${post._id}"
                    >
                        Editar
                    </button>

                    <button
                        class="delete-post-button"
                        data-id="${post._id}"
                    >
                        Eliminar
                    </button>

                </div>
            `
            : "";

        const article =
            document.createElement("article");

        article.className = "post-card";

        article.innerHTML = `
        
            ${
                post.image
                ? `
                    <div class="post-image-container">

                        <img
                            src="${post.image}"
                            alt="${post.title}"
                            class="post-image"
                        >

                    </div>
                `
                : ""
            }

            <div class="post-content">

                <h2 class="post-title">
                    ${post.title}
                </h2>
                
                <div class="post-metadata">
                    <a href="perfilUser.html?id=${post.author?._id || ""}" class="post-author-link">
                        ${
                            post.author?.profileImage
                            ?
                            `
                                <img
                                    src="${post.author.profileImage}"
                                    alt="${post.author.name || "Usuario"}"
                                    class="post-author-icon"
                                >
                            `
                            :
                            `
                                <img
                                    src="/svg/default-user-icon.svg"
                                    alt="Usuario"
                                    class="post-author-icon"
                                >
                            `
                        }

                        <span class="post-author">
                            ${post.author?.name || "Usuario"}
                        </span>

                    </a>

                    <span class="post-date">
                        ${formatDate(post.createdAt)}
                    </span>

                </div>

                <div class="post-body">

                    <p class="post-text">
                        ${post.content}
                    </p>

                </div>

                <div class="post-interactions">

                    <button
                        class="like-button"
                        data-id="${post._id}"
                    >
                        <span class="like-text">
                            Me gusta
                        </span>

                        <span class="like-count">
                            ${post.likes?.length || 0}
                        </span>
                    </button>

                    <button
                        class="comments-button"
                        data-id="${post._id}"
                    >
                        Comentarios

                        <span class="comments-count">
                            #
                        </span>

                    </button>

                </div>

                <div class="comments-section" hidden>

                    <h3 class="comments-title">
                        Comentarios
                    </h3>

                    <form class="comment-form">

                        <textarea
                            class="comment-input"
                            placeholder="Escribe un comentario..."
                            maxlength="500"
                            required
                        ></textarea>

                        <button
                            type="submit"
                            class="comment-submit-button"
                        >
                            Comentar
                        </button>

                    </form>

                    <div class="comments-list">
                    </div>

                </div>

                ${actionsHTML}

            </div>
        `;

        container.appendChild(article);
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(
        "es-GT",
        {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
        }
    );
}

async function login(email, password) {

    try {

        const response = await fetch(
            `${API_URL}/aut/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Error al iniciar sesión"
            );
        }

        /*
         * Guardamos el JWT
         */
        localStorage.setItem(
            "token",
            data.token
        );

        /*
         * Si el login devuelve el usuario,
         * lo utilizamos directamente.
         */
        localStorage.setItem(
            "token",
            data.token
        );

        currentUser = await getCurrentUser();

        return data;

    } catch (error) {

        console.error(
            "Error de login:",
            error
        );

        throw error;
    }
}

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

        /*
         * Token inválido o expirado
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

function openLoginModal() {

    const modal =
        document.querySelector("#login-modal");

    const email =
        document.querySelector("#login-email");

    const message =
        document.querySelector("#login-message");

    message.textContent = "";

    modal.style.display = "flex";

    email.focus();
}

function closeLoginModal() {

    const modal =
        document.querySelector("#login-modal");

    modal.style.display = "none";
}

function redirectToProfile() {
  window.location.href = "perfilUser.html";
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

async function deletePost(id) {

    const token =
        localStorage.getItem("token");

    try {

        const response =
            await fetch(
                `${API_URL}/pub/${id}`,
                {
                    method: "DELETE",

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
                "Error al eliminar publicación"
            );
        }

        await loadPosts();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

async function toggleLike(postId) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert(
            "Debes iniciar sesión para dar like"
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/pub/${postId}/like`,
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
                "Error al procesar el like"
            );
        }

        return data;

    } catch (error) {

        console.error(error);

        alert(error.message);

        return null;
    }
}

async function getComments(postId) {

    try {

        const response =
            await fetch(
                `${API_URL}/pub/${postId}/comentarios`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Error al obtener comentarios"
            );
        }

        return data.comments;

    } catch (error) {

        console.error(error);

        return [];
    }
}

function renderComments(
    comments,
    container
) {

    container.innerHTML = "";

    if (comments.length === 0) {

        container.innerHTML = `
            <p class="no-comments">
                No hay comentarios todavía.
            </p>
        `;

        return;
    }

    comments.forEach(comment => {
        
        const authorId =
            comment.author?._id?.toString();

        const currentUserId =
            currentUser?._id?.toString();

        const isAuthor =
            currentUser &&
            authorId === currentUserId;

        const isAdmin =
            currentUser?.role === "admin";

        const canModify =
            isAuthor || isAdmin;

        const actionsHTML = canModify
            ? `
                <button
                    class="delete-comment-button"
                    data-id="${comment._id}"
                >
                    Eliminar
                </button>
            `
            : "";

        const commentElement =
            document.createElement("div");

        commentElement.className =
            "comment-item";

        commentElement.innerHTML = `

            <div class="comment-header">

                <span class="comment-author">
                    ${comment.author.name}
                </span>

                <span class="comment-date">
                    ${formatDate(comment.createdAt)}
                </span>

            </div>

            <p class="comment-text">
                ${comment.content}
            </p>

            ${actionsHTML}

        `;

        container.appendChild(
            commentElement
        );
    });
}

async function createComment(
    postId,
    content
) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert(
            "Debes iniciar sesión para comentar"
        );

        return null;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/pub/${postId}/comentarios`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        content
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Error al crear comentario"
            );
        }

        return data.comment;

    } catch (error) {

        console.error(error);

        alert(error.message);

        return null;
    }
}

async function deleteComment(commentId) {

    const token =
        localStorage.getItem("token");

    try {

        const response =
            await fetch(
                `${API_URL}/comentarios/${commentId}`,
                {
                    method: "DELETE",

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
                "Error al eliminar comentario"
            );
        }

        return true;

    } catch (error) {

        console.error(error);

        alert(error.message);

        return false;
    }
}

/* =========================
   EVENTOS
========================= */

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

        /*
         * Cargar publicaciones después
         * de conocer al usuario.
         */
        await loadPosts();


        /* -------------------------
           Abrir login
           ------------------------- */

        document
            .querySelector("#login-button")
            .addEventListener(
                "click",
                () => {
                    window.location.href = "iniciarSesion.html";
                }
            );

        /* -------------------------
        Crear publicación
        ------------------------- */

        document
        .querySelectorAll(".create-post-button, .nav-link-create-post")
        .forEach((button) => {
            button.addEventListener("click", () => {
            if (currentUser) {
                window.location.href = "crearPub.html";
                return;
            }

            redirectToCreatePost = true;
            openLoginModal();
            });
        });


        /* -------------------------
           Cerrar login
           ------------------------- */

        document
            .querySelector("#close-login-modal")
            ?.addEventListener(
                "click",
                closeLoginModal
            );


        /* -------------------------
           Cerrar haciendo clic
           fuera del formulario
           ------------------------- */

        document
            .querySelector("#login-modal")
            ?.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target.id ===
                        "login-modal"
                    ) {

                        closeLoginModal();
                    }
                }
            );


        /* -------------------------
           Formulario
           ------------------------- */

        document
            .querySelector("#login-form")
            ?.addEventListener(
                "submit",
                async (event) => {

                    event.preventDefault();


                    const email =
                        document
                            .querySelector(
                                "#login-email"
                            )
                            .value
                            .trim();


                    const password =
                        document
                            .querySelector(
                                "#login-password"
                            )
                            .value;


                    const message =
                        document
                            .querySelector(
                                "#login-message"
                            );


                    message.textContent =
                        "Iniciando sesión...";


                    try {
                        await login(
                            email,
                            password
                        );
                        
                        /*
                         * Actualizar header
                         */
                        updateUserInterface();

                                                /*
                        * Si el login fue iniciado desde
                        * "Crear publicación", ir a la
                        * pantalla de creación.
                        */
                        if (redirectToCreatePost) {

                            redirectToCreatePost = false;

                            window.location.href =
                                "crearPub.html";

                            return;
                        }

                        /*
                         * Cerrar modal
                         */
                        closeLoginModal();


                        /*
                         * Limpiar formulario
                         */
                        document
                            .querySelector(
                                "#login-form"
                            )
                            .reset();


                        /*
                         * Volver a renderizar
                         * publicaciones.
                         */
                        await loadPosts();
                    } catch (error) {

                        message.textContent =
                            error.message;
                    }
                }
            );


        /* -------------------------
           Cerrar sesión
           ------------------------- */

        document
            .querySelector("#logout-button")
            .addEventListener(
                "click",
                async () => {

                    localStorage.removeItem(
                        "token"
                    );

                    currentUser = null;

                    if (!currentUser) {
                        window.location.replace("iniciarSesion.html");
                        return;
                    }

                    updateUserInterface();

                    await loadPosts();
                }
            );

    }
);

document.addEventListener(
    "click",
    async (event) => {

        // =========================
        // EDITAR POST
        // =========================

        const editButton =
            event.target.closest(
                ".edit-post-button"
            );

        if (editButton) {

            const postId =
                editButton.dataset.id;

            window.location.href =
                `editarPub.html?id=${postId}`;

            return;
        }

        // =========================
        // LIKE
        // =========================

        const likeButton =
            event.target.closest(".like-button");

        if (likeButton) {

            const postId =
                likeButton.dataset.id;

            const result =
                await toggleLike(postId);

            if (result) {

                const count =
                    likeButton.querySelector(
                        ".like-count"
                    );

                count.textContent =
                    result.likesCount;

                if (result.liked) {

                    likeButton.classList.add(
                        "liked"
                    );

                } else {

                    likeButton.classList.remove(
                        "liked"
                    );
                }
            }
        }

        const commentsButton =
        event.target.closest(
            ".comments-button"
        );

        if (commentsButton) {

            const postCard =
                commentsButton.closest(
                    ".post-card"
                );

            const commentsSection =
                postCard.querySelector(
                    ".comments-section"
                );

            const postId =
                commentsButton.dataset.id;

            const isHidden = commentsSection.hidden;

            if (isHidden) {
            const comments = await getComments(postId);

            const commentsList =
                commentsSection.querySelector(".comments-list");

            renderComments(comments, commentsList);

            commentsSection.hidden = false;
            } else {
            commentsSection.hidden = true;
            }
        }

        // =========================
        // ELIMINAR POST
        // =========================

        if (
            event.target.classList.contains(
                "delete-post-button"
            )
        ) {

            const id =
                event.target.dataset.id;

            if (
                confirm(
                    "¿Deseas eliminar esta publicación?"
                )
            ) {

                await deletePost(id);
            }
        }

    }
);

document.addEventListener(
    "submit",
    async (event) => {

        if (
            !event.target.classList.contains(
                "comment-form"
            )
        ) {
            return;
        }

        event.preventDefault();

        const form =
            event.target;

        const postCard =
            form.closest(
                ".post-card"
            );

        const postId =
            postCard.querySelector(
                ".like-button"
            ).dataset.id;

        const input =
            form.querySelector(
                ".comment-input"
            );

        const content =
            input.value.trim();

        if (!content) {
            return;
        }

        const comment =
            await createComment(
                postId,
                content
            );

        if (comment) {

            input.value = "";

            const commentsList =
                postCard.querySelector(
                    ".comments-list"
                );

            const comments =
                await getComments(
                    postId
                );

            renderComments(
                comments,
                commentsList
            );
        }

    }
);

document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".delete-comment-button"
            );

        if (!button) {
            return;
        }

        const commentId =
            button.dataset.id;

        if (
            !confirm(
                "¿Deseas eliminar este comentario?"
            )
        ) {
            return;
        }

        const deleted =
            await deleteComment(
                commentId
            );

        if (deleted) {

            button
                .closest(".comment-item")
                .remove();
        }

    }
);

/* =========================
   INICIO
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadPosts();

        const user =
            await getCurrentUser();

        if (user) {
            
            const userIcon =
                document.querySelector(
                    ".user-icon"
                );

            if (user.profileImage) {
                userIcon.src =
                    user.profileImage;
            }

            const userName =
                document.querySelector(
                    ".user-name"
                );

            if (userName) {
                userName.textContent =
                    user.name;
            }

            userName.addEventListener("click", redirectToProfile);
        }

    }
);