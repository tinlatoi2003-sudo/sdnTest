const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/buildingController");

router.put("/:id", protect, authorize("admin"), ctrl.updateRoom);
router.delete("/:id", protect, authorize("admin"), ctrl.deleteRoom);

module.exports = router;
