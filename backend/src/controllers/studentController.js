const Student = require("../models/Student");
const Notification = require("../models/Notification");
const RoomAssignment = require("../models/RoomAssignment");
const RoomRegistration = require("../models/RoomRegistration");
const ElectricityUsage = require("../models/ElectricityUsage");
const Payment = require("../models/Payment");
const Request = require("../models/Request");
const ViolationRecord = require("../models/ViolationRecord");
const Room = require("../models/Room");

// ── Helper: lấy Student từ userId, tự tạo nếu chưa có ─────────────────────
const getStudent = async (user) => {
    let student = await Student.findOne({ userId: user._id });
    if (!student) {
        // Tạo hồ sơ sinh viên cơ bản từ thông tin User
        student = await Student.create({
            userId: user._id,
            studentCode: user.username,          // dùng tạm username làm mã SV
            fullName: user.username,
            gender: "male",                      // giá trị mặc định
            dateOfBirth: new Date("2000-01-01"),
            identityNumber: user._id.toString().slice(-9), // tạm thời
            faculty: "Chưa cập nhật",
            major: "Chưa cập nhật",
            classCode: "Chưa cập nhật",
            academicYear: new Date().getFullYear().toString(),
        });
    }
    return student;
};


// ── GET /student/profile ───────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate("userId", "username email phone")
            .populate("currentRoomId", "roomNumber building floor");
        if (!student) return res.status(404).json({ success: false, message: "Chưa có hồ sơ sinh viên" });
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/news ──────────────────────────────────────────────────────
// Lấy thông báo dành cho student (role=student hoặc all, hoặc gửi trực tiếp cho user này)
exports.getNews = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { receiverType: "role", targetRole: { $in: ["all", "student"] } },
                { receiverType: "individual", receiverIds: req.user._id },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("senderId", "username");
        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ── GET /student/room-history ──────────────────────────────────────────────
exports.getRoomHistory = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const assignments = await RoomAssignment.find({ studentId: student._id })
            .sort({ startDate: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor type pricePerTerm buildingId",
                populate: { path: "buildingId", select: "name address" },
            });
        res.json({ success: true, data: assignments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ── GET /student/bookings ──────────────────────────────────────────────────
exports.getBookings = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const bookings = await RoomRegistration.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("roomId", "roomNumber building floor type capacity")
            .populate("reviewedBy", "username");
        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /student/bookings ─────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { roomId, termCode, note } = req.body;
        if (!roomId || !termCode)
            return res.status(400).json({ success: false, message: "roomId và termCode là bắt buộc" });

        // Kiểm tra đã có đăng ký pending cho kỳ này chưa
        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode,
            status: "pending",
        });
        if (existing)
            return res.status(400).json({ success: false, message: "Bạn đã có đơn đăng ký đang chờ duyệt cho kỳ này" });

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId,
            termCode,
            note,
        });
        res.status(201).json({ success: true, message: "Đăng ký phòng thành công", data: booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/electricity ───────────────────────────────────────────────
exports.getElectricity = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        if (!student.currentRoomId)
            return res.json({ success: true, data: [], message: "Chưa có phòng hiện tại" });

        const records = await ElectricityUsage.find({ roomId: student.currentRoomId })
            .sort({ year: -1, month: -1 })
            .limit(12);
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/payments ──────────────────────────────────────────────────
exports.getPayments = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const payments = await Payment.find({ studentId: student._id })
            .sort({ paidAt: -1 })
            .populate("invoiceId", "type totalAmount dueDate status");
        res.json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/requests ──────────────────────────────────────────────────
exports.getMyRequests = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const requests = await Request.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("currentRoomId", "roomNumber building")
            .populate("targetRoomId", "roomNumber building");
        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /student/requests ─────────────────────────────────────────────────
exports.createRequest = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { type, title, description, targetRoomId } = req.body;
        if (!type || !title || !description)
            return res.status(400).json({ success: false, message: "type, title, description là bắt buộc" });

        const request = await Request.create({
            studentId: student._id,
            type,
            title,
            description,
            currentRoomId: student.currentRoomId,
            targetRoomId: targetRoomId || null,
        });
        res.status(201).json({ success: true, message: "Tạo yêu cầu thành công", data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/violations ────────────────────────────────────────────────
exports.getViolations = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const violations = await ViolationRecord.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("roomId", "roomNumber building floor")
            .populate("reportedBy", "username");
        res.json({ success: true, data: violations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /student/rooms/available ───────────────────────────────────────────
// Lấy danh sách phòng chưa full để sinh viên chọn đăng ký
exports.getAvailableRooms = async (req, res) => {
    try {
        const { type, building } = req.query;
        const filter = {
            isActive: true,
            status: { $in: ["available", "partial"] },          // chưa full hoặc còn chỗ
        };
        if (type) filter.type = type;

        const rooms = await Room.find(filter)
            .populate("buildingId", "name address")
            .sort({ "buildingId": 1, floor: 1, roomNumber: 1 });

        // Lọc thêm theo building name nếu có query
        const result = building
            ? rooms.filter(r => r.buildingId?.name?.toLowerCase().includes(building.toLowerCase()))
            : rooms;

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /student/requests/:id/approve-retention ───────────────────────────
// Manager duyệt yêu cầu giữ phòng → tạo RoomRegistration cho kỳ tiếp theo
exports.approveRetentionRequest = async (req, res) => {
    try {
        // Chỉ manager & admin mới gọi được (route sẽ authorize)
        const { id } = req.params;
        const { nextTermCode } = req.body;

        if (!nextTermCode)
            return res.status(400).json({ success: false, message: "nextTermCode là bắt buộc" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        if (request.type !== "room_retention")
            return res.status(400).json({ success: false, message: "Yêu cầu này không phải xin giữ phòng" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu cầu đã được xử lý" });

        // Lấy phòng hiện tại của sinh viên
        const student = await Student.findById(request.studentId);
        if (!student?.currentRoomId)
            return res.status(400).json({ success: false, message: "Sinh viên chưa có phòng hiện tại" });

        // Kiểm tra đã đăng ký phòng cho kỳ tiếp chưa
        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode: nextTermCode,
        });
        if (existing)
            return res.status(400).json({ success: false, message: "Sinh viên đã có đơn đăng ký cho kỳ này" });

        // Tạo đăng ký phòng cho kỳ tiếp theo (auto approved)
        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: student.currentRoomId,
            termCode: nextTermCode,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: `Được duyệt giữ phòng từ yêu cầu #${id}`,
        });

        // Cập nhật trạng thái yêu cầu → completed
        request.status = "completed";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: "approved",
            note: `Đã tạo đăng ký phòng cho kỳ ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({
            success: true,
            message: `Đã duyệt giữ phòng và tạo đăng ký cho kỳ ${nextTermCode}`,
            data: { booking, request },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
