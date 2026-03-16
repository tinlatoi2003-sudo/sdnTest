const Notification = require("../models/Notification");
const User = require("../models/User");
const Building = require("../models/Building");
const Room = require("../models/Room");
const Student = require("../models/Student");

// ─────────────────────────────────────────
// Helper: lấy tất cả userId của student trong các tòa nhà mà manager quản lý
// ─────────────────────────────────────────
const getStudentUserIdsInManagerBuildings = async (managerId) => {
    const buildings = await Building.find({ managerId }).select("_id");
    if (!buildings.length) return [];
    const buildingIds = buildings.map((b) => b._id);

    const rooms = await Room.find({ buildingId: { $in: buildingIds } }).select("_id");
    const roomIds = rooms.map((r) => r._id);

    const students = await Student.find({ currentRoomId: { $in: roomIds } }).select("userId");
    return students.map((s) => s.userId);
};

// ─────────────────────────────────────────
// [ADMIN/MANAGER] Gửi thông báo mới
// POST /api/notifications/send
// Admin body: { title, message, type, receiverType, targetRole, receiverIds }
//   receiverType: "role" | "individual"
// Manager body: { title, message, type, receiverType, receiverIds }
//   receiverType: "building" (toàn bộ student trong tòa nhà) | "individual" (student cụ thể trong tòa nhà)
// ─────────────────────────────────────────
exports.sendNotification = async (req, res) => {
    try {
        const { title, message, type, receiverType, targetRole, receiverIds } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc" });
        }

        let resolvedReceiverIds = [];
        let finalReceiverType = receiverType;
        let finalTargetRole = targetRole || "all";

        if (req.user.role === "manager") {
            // ── Manager: chỉ gửi trong phạm vi tòa nhà mình quản lý ──
            const allBuildingUserIds = await getStudentUserIdsInManagerBuildings(req.user._id);

            if (!allBuildingUserIds.length) {
                return res.status(400).json({ success: false, message: "Bạn không quản lý tòa nhà nào hoặc không có sinh viên nào trong tòa nhà" });
            }

            if (receiverType === "building") {
                // Gửi tất cả student trong tòa nhà
                resolvedReceiverIds = allBuildingUserIds;
                finalReceiverType = "role";
                finalTargetRole = "student";
            } else if (receiverType === "individual") {
                // Gửi student cụ thể — validate phải nằm trong tòa nhà
                if (!receiverIds || !receiverIds.length) {
                    return res.status(400).json({ success: false, message: "Phải chọn ít nhất một sinh viên" });
                }
                const allowedSet = new Set(allBuildingUserIds.map(String));
                const invalid = receiverIds.filter((id) => !allowedSet.has(String(id)));
                if (invalid.length) {
                    return res.status(403).json({ success: false, message: "Một số sinh viên không thuộc tòa nhà bạn quản lý" });
                }
                resolvedReceiverIds = receiverIds;
            } else {
                return res.status(400).json({ success: false, message: "receiverType phải là 'building' hoặc 'individual'" });
            }
        } else {
            // ── Admin: toàn quyền ──
            if (receiverType === "role") {
                const query = {};
                if (targetRole && targetRole !== "all") query.role = targetRole;
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
        }

        const notification = await Notification.create({
            senderId: req.user._id,
            receiverIds: resolvedReceiverIds,
            receiverType: finalReceiverType,
            targetRole: finalTargetRole,
            title,
            message,
            type: type || "general",
        });

        return res.status(201).json({
            success: true,
            message: `Đã gửi thông báo tới ${resolvedReceiverIds.length} sinh viên`,
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

// ─────────────────────────────────────────
// [MANAGER] Lấy danh sách student trong tòa nhà mình quản lý
// GET /api/notifications/manager/building-students?search=<keyword>
// ─────────────────────────────────────────
exports.getManagerBuildingStudents = async (req, res) => {
    try {
        const managerId = req.user._id;
        const { search } = req.query;

        // Tòa nhà manager quản lý
        const buildings = await Building.find({ managerId }).select("_id name");
        if (!buildings.length) {
            return res.json({ success: true, buildings: [], students: [], total: 0 });
        }
        const buildingIds = buildings.map((b) => b._id);

        // Phòng trong tòa nhà
        const rooms = await Room.find({ buildingId: { $in: buildingIds } }).select("_id buildingId");
        const roomIds = rooms.map((r) => r._id);

        // Student đang ở
        const students = await Student.find({ currentRoomId: { $in: roomIds } })
            .select("userId fullName studentCode currentRoomId")
            .populate("userId", "username email")
            .populate({ path: "currentRoomId", select: "roomNumber buildingId", populate: { path: "buildingId", select: "name" } })
            .lean();

        // Lọc theo keyword nếu có
        let result = students;
        if (search) {
            const kw = search.toLowerCase();
            result = students.filter((s) =>
                s.fullName?.toLowerCase().includes(kw) ||
                s.studentCode?.toLowerCase().includes(kw) ||
                s.userId?.username?.toLowerCase().includes(kw) ||
                s.userId?.email?.toLowerCase().includes(kw)
            );
        }

        return res.json({
            success: true,
            buildings: buildings.map((b) => ({ _id: b._id, name: b.name })),
            students: result,
            total: result.length,
        });
    } catch (err) {
        console.error("getManagerBuildingStudents error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
