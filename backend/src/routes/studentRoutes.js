const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/studentController");

// Tất cả routes yêu cầu JWT hợp lệ
router.use(protect);

// ── Student-only routes ──
router.get("/profile", authorize("student"), ctrl.getMyProfile);
router.get("/news", authorize("student"), ctrl.getNews);
router.get("/room-history", authorize("student"), ctrl.getRoomHistory);
router.get("/bookings", authorize("student"), ctrl.getBookings);
router.post("/bookings", authorize("student"), ctrl.createBooking);
router.get("/electricity", authorize("student"), ctrl.getElectricity);
router.get("/payments", authorize("student"), ctrl.getPayments);
router.get("/requests", authorize("student"), ctrl.getMyRequests);
router.post("/requests", authorize("student"), ctrl.createRequest);
router.get("/violations", authorize("student"), ctrl.getViolations);
router.get("/rooms/available", authorize("student"), ctrl.getAvailableRooms);

// ── Manager/Admin route: duyệt giữ phòng ──
router.post("/requests/:id/approve-retention", authorize("manager", "admin"), ctrl.approveRetentionRequest);

module.exports = router;
