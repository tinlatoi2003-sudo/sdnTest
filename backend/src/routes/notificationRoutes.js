const express = require("express");
const router = express.Router();
const {
    sendNotification,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getSentNotifications,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Tất cả routes yêu cầu đăng nhập
router.use(protect);

// ── Student / Tất cả người dùng ──
router.get("/my", getMyNotifications);              // Lấy thông báo của tôi
router.get("/unread-count", getUnreadCount);        // Đếm chưa đọc
router.put("/read-all", markAllAsRead);              // Đánh dấu tất cả đã đọc
router.put("/:id/read", markAsRead);                // Đánh dấu 1 thông báo đã đọc

// ── Admin only ──
router.post("/send", authorize("admin"), sendNotification);        // Gửi thông báo
router.get("/sent", authorize("admin"), getSentNotifications);     // Lịch sử đã gửi

module.exports = router;
