const Request = require("../models/Request");
const Student = require("../models/Student");
const RoomRegistration = require("../models/RoomRegistration");

// ── GET /api/manager/requests ──────────────────────────────────────────────
// Lấy tất cả yêu cầu của sinh viên (manager xem)
exports.getRequests = async (req, res) => {
    try {
        const { type, status } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const requests = await Request.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "studentId",
                select: "fullName studentCode",
                populate: { path: "userId", select: "username email" },
            })
            .populate("currentRoomId", "roomNumber floor buildingId")
            .populate("targetRoomId", "roomNumber floor buildingId");

        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/manager/requests/:id ──────────────────────────────────────────
// Duyệt hoặc từ chối yêu cầu (damage_report, room_transfer, other)
exports.reviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body; // action: "approve" | "reject"

        if (!["approve", "reject"].includes(action))
            return res.status(400).json({ success: false, message: "action phải là approve hoặc reject" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu cầu đã được xử lý" });

        const newStatus = action === "approve" ? "manager_approved" : "manager_rejected";
        request.status = newStatus;
        request.managerReview = {
            reviewedBy: req.user._id,
            status: action,
            note: note || "",
            reviewedAt: new Date(),
        };

        // Nếu approve chuyển phòng → tự động tạo booking cho phòng mới
        if (action === "approve" && request.type === "room_transfer" && request.targetRoomId) {
            const student = await Student.findById(request.studentId);
            if (student) {
                const today = new Date();
                const termCode = `HK${today.getMonth() < 6 ? 1 : 2}-${today.getFullYear()}`;
                await RoomRegistration.create({
                    studentId: student._id,
                    roomId: request.targetRoomId,
                    termCode,
                    status: "approved",
                    reviewedBy: req.user._id,
                    reviewedAt: new Date(),
                    reviewNote: `Chuyển phòng được duyệt từ yêu cầu #${id}`,
                });
            }
        }

        await request.save();
        res.json({ success: true, message: `Đã ${action === "approve" ? "duyệt" : "từ chối"} yêu cầu`, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PUT /api/manager/requests/:id/approve-retention ────────────────────────
// Duyệt giữ phòng → tạo booking kỳ tiếp
exports.approveRetention = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextTermCode } = req.body;

        if (!nextTermCode)
            return res.status(400).json({ success: false, message: "nextTermCode là bắt buộc" });

        const request = await Request.findById(id).populate("studentId");
        if (!request) return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        if (request.type !== "room_retention")
            return res.status(400).json({ success: false, message: "Không phải yêu cầu giữ phòng" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu cầu đã được xử lý" });

        const student = await Student.findById(request.studentId);
        if (!student?.currentRoomId)
            return res.status(400).json({ success: false, message: "Sinh viên chưa có phòng hiện tại" });

        const existing = await RoomRegistration.findOne({ studentId: student._id, termCode: nextTermCode });
        if (existing)
            return res.status(400).json({ success: false, message: "Sinh viên đã có đăng ký cho kỳ này" });

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: student.currentRoomId,
            termCode: nextTermCode,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: `Duyệt giữ phòng từ yêu cầu #${id}`,
        });

        request.status = "completed";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: "approve",
            note: `Đã tạo đăng ký giữ phòng kỳ ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({ success: true, message: `Đã duyệt giữ phòng kỳ ${nextTermCode}`, data: { booking, request } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
