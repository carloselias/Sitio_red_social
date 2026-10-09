const express = require("express");

const {
    registro,
    login,
    getMe,
    updatePerfil,
    getUserPerfil,
    toggleFollow
} = require("../controladores/autControlador");

const autMiddleware = require("../middleware/autMiddleware");
const subirPerfilImage = require("../middleware/subirPerfilMiddleware");
const router = express.Router();

router.post("/registro", registro);

router.post("/login", login);

router.get("/me", autMiddleware, getMe);

router.put("/perfil", autMiddleware, subirPerfilImage.single("profileImage"), updatePerfil);

router.get("/users/:id", getUserPerfil);

router.post("/users/:id/follow", autMiddleware, toggleFollow);

module.exports = router;