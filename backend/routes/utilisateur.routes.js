const express = require("express");
const router = express.Router();
const utilisateurController = require("../controllers/utilisateur.controller");
const verifyToken = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload");

router.get("/", utilisateurController.getAllUtilisateurs);
router.get("/:id", utilisateurController.getUtilisateurById);
router.patch("/:id", verifyToken, upload.single("image"), utilisateurController.updateUtilisateur);

module.exports = router;