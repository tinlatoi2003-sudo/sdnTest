const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/managerController");

router.use(protect, authorize("manager", "admin"));

router.get("/requests", ctrl.getRequests);
router.put("/requests/:id", ctrl.reviewRequest);
router.put("/requests/:id/approve-retention", ctrl.approveRetention);
router.get("/building-rooms", ctrl.getManagerBuildingRooms);
router.get("/unpaid-students", ctrl.getUnpaidStudents);
router.post("/rooms/:roomId/electricity", ctrl.recordRoomElectricity);

module.exports = router;
