const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/buildingController");

// ── Building CRUD (admin only) ──
router.get("/", protect, ctrl.getBuildings);
router.post("/", protect, authorize("admin"), ctrl.createBuilding);
router.put("/:id", protect, authorize("admin"), ctrl.updateBuilding);
router.delete("/:id", protect, authorize("admin"), ctrl.deleteBuilding);

// ── Rooms per building ──
router.get("/:id/rooms", protect, ctrl.getRoomsByBuilding);
router.post("/:id/rooms", protect, authorize("admin"), ctrl.createRoom);

module.exports = router;
