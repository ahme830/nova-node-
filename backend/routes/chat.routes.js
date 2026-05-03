// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

// Public endpoint — no auth required so non-logged-in users can get help too
router.post("/", chatController.chat);

module.exports = router;