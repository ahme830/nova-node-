const express = require("express");
const router = express.Router();
const notifController = require("../controllers/notification.controller");
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/",              notifController.getNotifications);
router.put("/lire-tout",     notifController.markAllAsRead);
router.put("/:id/lu",        notifController.markAsRead);

module.exports = router;