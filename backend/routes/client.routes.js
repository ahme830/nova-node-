const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client.controller");
const verifyToken = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload");

router.get("/profile", verifyToken, clientController.getProfile);
router.put("/profile", verifyToken, clientController.updateProfile);
router.put("/password", verifyToken, clientController.changePassword);
router.post("/profile/picture", verifyToken, upload.single("photo"), clientController.uploadProfilePicture);

router.get("/", clientController.getAllClients);
router.get("/:id", clientController.getClientById);
router.patch("/:id/statut", clientController.updateClientStatut);

module.exports = router;