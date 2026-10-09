const User = require("../modelos/usuarios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const registro = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validar campos
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        // Verificar si el correo ya existe
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "El correo electrónico ya está registrado"
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Usuario registrado correctamente",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al registrar el usuario"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "El correo y la contraseña son obligatorios"
            });
        }

        // Buscar usuario
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        // Comparar contraseña
        const passwordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        // Crear JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al iniciar sesión"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            user
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error al obtener los datos del usuario"
        });
    }
};

const updatePerfil = async (req, res) => {

    try {

        const {
            name,
            description
        } = req.body;


        const user =
            await User.findById(req.user.id);


        if (!user) {

            return res.status(404).json({
                message:
                    "Usuario no encontrado"
            });

        }


        if (name !== undefined) {

            if (!name.trim()) {

                return res.status(400).json({
                    message:
                        "El nombre no puede estar vacío"
                });

            }

            user.name =
                name.trim();

        }


        if (description !== undefined) {

            user.description =
                description.trim();

        }


        const oldProfileImage =
            user.profileImage;


        if (req.file) {

            user.profileImage =
                `/images/${req.file.filename}`;

        }


        await user.save();


        /*
         * Si se cambió la imagen,
         * eliminamos la anterior.
         */

        if (
            req.file &&
            oldProfileImage
        ) {

            deletePerfilImage(
                oldProfileImage
            );

        }


        res.json({

            message:
                "Perfil actualizado correctamente",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                description: user.description,
                profileImage: user.profileImage
            }

        });

    } catch (error) {

        console.error(
            "Error al actualizar perfil:",
            error
        );


        res.status(500).json({

            message:
                "Error al actualizar el perfil"

        });

    }

};

const deletePerfilImage = (imagePath) => {

    if (!imagePath) {
        return;
    }


    const filename =
        path.basename(imagePath);


    const filePath =
        path.join(
            __dirname,
            "../../images",
            filename
        );


    fs.unlink(
        filePath,
        (error) => {

            if (error) {

                if (error.code === "ENOENT") {

                    console.log(
                        "La imagen de perfil ya no existe:",
                        filePath
                    );

                    return;

                }


                console.error(
                    "Error al eliminar imagen de perfil:",
                    error
                );

                return;

            }


            console.log(
                "Imagen de perfil anterior eliminada:",
                filePath
            );

        }
    );

};

const getUserPerfil = async (req, res) => {

    try {

        const user =
            await User.findById(
                req.params.id
            ).select(
                "_id name email role description profileImage followers createdAt"
            );


        if (!user) {

            return res.status(404).json({
                message:
                    "Usuario no encontrado"
            });

        }


        const token =
            req.headers.authorization;


        let following = false;


        if (
            token &&
            token.startsWith("Bearer ")
        ) {

            try {

                const jwt =
                    require("jsonwebtoken");

                const decoded =
                    jwt.verify(
                        token.split(" ")[1],
                        process.env.JWT_SECRET
                    );


                following =
                    (user.followers || []).some(
                        follower =>
                            follower.toString() ===
                            decoded.id
                    );

            } catch (error) {

                // Token inválido:
                // simplemente se considera que no sigue

                following = false;

            }

        }


        res.json({

            user: {

                _id: user._id,

                name: user.name,

                email: user.email,

                role: user.role,

                description:
                    user.description,

                profileImage:
                    user.profileImage,

                followersCount:
                    user.followers?.length || 0,

                following

            }

        });


    } catch (error) {

        console.error(
            "Error al obtener perfil:",
            error
        );


        res.status(500).json({

            message:
                "Error al obtener el perfil del usuario"

        });

    }

};

const toggleFollow = async (req, res) => {

    try {

        const currentUserId = req.user.id;
        const targetUserId = req.params.id;


        // No permitir seguirse a sí mismo

        if (currentUserId === targetUserId) {

            return res.status(400).json({
                message:
                    "No puedes seguirte a ti mismo"
            });

        }


        const targetUser =
            await User.findById(targetUserId);

        if (!targetUser) {

            return res.status(404).json({
                message: "Usuario no encontrado"
            });

        }

        if (!targetUser.followers) {
            targetUser.followers = [];
        }


        // Comprobar si ya lo sigue

        const alreadyFollowing =
            targetUser.followers.some(
                follower =>
                    follower.toString() === currentUserId
            );


        if (alreadyFollowing) {

            // Dejar de seguir

            targetUser.followers =
                targetUser.followers.filter(
                    follower =>
                        follower.toString() !== currentUserId
                );

            await targetUser.save();


            return res.json({

                message:
                    "Has dejado de seguir al usuario",

                following: false,

                followersCount:
                    targetUser.followers.length

            });

        }


        // Seguir

        targetUser.followers.push(
            currentUserId
        );

        await targetUser.save();


        res.json({

            message:
                "Ahora sigues a este usuario",

            following: true,

            followersCount:
                targetUser.followers.length

        });


    } catch (error) {

        console.error(
            "Error al modificar seguimiento:",
            error
        );


        res.status(500).json({

            message:
                "Error al modificar el seguimiento"

        });

    }

};

module.exports = {
    registro,
    login,
    getMe,
    updatePerfil,
    getUserPerfil,
    toggleFollow
};