const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verifyToken = require("../middleware/auth.middleware");

router.post("/register", authController.registerUser);

router.post("/login", authController.signInUser);
router.post("/logout", verifyToken, authController.signOutUser);
module.exports = router;