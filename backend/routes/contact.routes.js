const express = require("express");
const router = express.Router();
const contactCtrl = require("../controllers/contact.controller");
const verifyToken = require("../middleware/auth.middleware");
const verifyAdmin = require("../middleware/admin.middleware");

// Public route to send a message
router.post("/", contactCtrl.sendContactMessage);

// Admin-only routes to manage messages
router.get("/", verifyToken, verifyAdmin, contactCtrl.getContactMessages);
router.delete("/:id", verifyToken, verifyAdmin, contactCtrl.deleteContactMessage);

module.exports = router;
