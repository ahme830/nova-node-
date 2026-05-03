const express            = require("express");
const router             = express.Router();
const predictionController = require("../controllers/prediction.controller");
const verifyToken        = require("../middleware/auth.middleware");
const verifyAdmin        = require("../middleware/admin.middleware");
 
router.get("/revenue/:id_magasin",
  verifyToken,
  predictionController.getRevenueForecast
);
 
router.get("/restock/:id_magasin",
  verifyToken,
  predictionController.getRestockAlerts
);
 
// Test endpoint — accessible by vendor or admin
// GET /api/predictions/test/:id_magasin?reset=1
router.get("/test/:id_magasin",
  verifyToken,
  predictionController.testPredictions
);
 
module.exports = router;