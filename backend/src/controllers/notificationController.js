const Notification = require("../models/Notification");
const User = require("../models/User");

// ─────────────────────────────────────────
// [ADMIN] Gửi thông báo mới
// POST /api/notifications/send
// Body: { title, message, type, receiverType, targetRole }
//   receiverType: "role" (gửi theo role, targetRole: "all"|"student"|"manager")
//                 "individual" (gửi cho user cụ thể, receiverIds: [userId,...])
// ─────────────────────────────────────────
exports.sendNotification = async (req, res) => {
    try {
        const { title, message, type, receiverType, targetRole, receiverIds } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc" });
        }

        let resolvedReceiverIds = [];

        if (receiverType === "role") {
            // Tìm tất cả users theo role
            const query = {};
            if (targetRole && targetRole !== "all") {
                query.role = targetRole;
            }
            const users = await User.find(query).select("_id");
            resolvedReceiverIds = users.map((u) => u._id);
        } else if (receiverType === "individual") {
            if (!receiverIds || !receiverIds.length) {
                return res.status(400).json({ success: false, message: "Phải chọn ít nhất một người nhận" });
            }
            resolvedReceiverIds = receiverIds;
        } else {
            return res.status(400).json({ success: false, message: "receiverType không hợp lệ" });
        }

        const notification = await Notification.create({
            senderId: req.user._id,
            receiverIds: resolvedReceiverIds,
            receiverType,
            targetRole: targetRole || "all",
            title,
            message,
            type: type || "general",
        });

        return res.status(201).json({
            success: true,
            message: `Đã gửi thông báo tới ${resolvedReceiverIds.length} người dùng`,
            data: notification,
        });
    } catch (err) {
        console.error("sendNotification error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ALL] Lấy danh sách thông báo của mình
// GET /api/notifications/my?page=1&limit=20
// ─────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Thông báo của tôi = tôi có trong receiverIds
        const notifications = await Notification.find({ receiverIds: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("senderId", "username role")
            .lean();

        // Gắn cờ isRead cho từng thông báo
        const result = notifications.map((n) => {
            const readEntry = n.readBy?.find((r) => r.userId?.toString() === userId.toString());
            return {
                ...n,
                isRead: !!readEntry,
                readAt: readEntry?.readAt || null,
            };
        });

        const total = await Notification.countDocuments({ receiverIds: userId });

        return res.json({
            success: true,
            data: result,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error("getMyNotifications error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ALL] Đếm thông báo chưa đọc
// GET /api/notifications/unread-count
// ─────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ receiverIds: userId }).select("readBy").lean();

        const unread = notifications.filter((n) => {
            return !n.readBy?.some((r) => r.userId?.toString() === userId.toString());
        });

        return res.json({ success: true, count: unread.length });
    } catch (err) {
        console.error("getUnreadCount error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ALL] Đánh dấu một thông báo đã đọc
// PUT /api/notifications/:id/read
// ─────────────────────────────────────────
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const notification = await Notification.findOne({ _id: id, receiverIds: userId });
        if (!notification) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
        }

        const alreadyRead = notification.readBy.some((r) => r.userId?.toString() === userId.toString());
        if (!alreadyRead) {
            notification.readBy.push({ userId, readAt: new Date() });
            await notification.save();
        }

        return res.json({ success: true, message: "Đã đánh dấu đã đọc" });
    } catch (err) {
        console.error("markAsRead error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ALL] Đánh dấu TẤT CẢ thông báo đã đọc
// PUT /api/notifications/read-all
// ─────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        // Lấy các thông báo chưa đọc
        const notifications = await Notification.find({
            receiverIds: userId,
            "readBy.userId": { $ne: userId },
        });

        const now = new Date();
        const updates = notifications.map((n) => {
            n.readBy.push({ userId, readAt: now });
            return n.save();
        });

        await Promise.all(updates);

        return res.json({ success: true, message: `Đã đánh dấu ${notifications.length} thông báo đã đọc` });
    } catch (err) {
        console.error("markAllAsRead error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Lấy danh sách thông báo đã gửi
// GET /api/notifications/sent
// ─────────────────────────────────────────
exports.getSentNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ senderId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments({ senderId: req.user._id });

        return res.json({
            success: true,
            data: notifications,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error("getSentNotifications error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
