const Report = require("../models/Report");
const Building = require("../models/Building");

// ── Lấy danh sách báo cáo (manager chỉ thấy báo cáo của mình) ──────────────
exports.getReports = async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};

        // Manager chỉ thấy báo cáo của mình, Admin thấy tất cả
        if (req.user.role === "manager") filter.managerId = req.user._id;
        if (status) filter.status = status;
        if (type) filter.type = type;

        const reports = await Report.find(filter)
            .populate("managerId", "username email")
            .populate("buildingId", "name address")
            .populate("adminReview.reviewedBy", "username")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reports.length, reports });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Lấy 1 báo cáo ────────────────────────────────────────────────────────────
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate("managerId", "username email")
            .populate("buildingId", "name address")
            .populate("adminReview.reviewedBy", "username");

        if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

        // Manager chỉ được xem báo cáo của mình
        if (req.user.role === "manager" && report.managerId._id.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Không có quyền truy cập" });

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Tạo báo cáo mới (manager) ─────────────────────────────────────────────
exports.createReport = async (req, res) => {
    try {
        const { title, content, type, buildingId } = req.body;

        if (!title || !content || !buildingId)
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });

        // Verify building tồn tại và thuộc quyền quản lý của manager
        const building = await Building.findById(buildingId);
        if (!building) return res.status(404).json({ success: false, message: "Tòa nhà không tồn tại" });

        if (req.user.role === "manager" && building.managerId?.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Bạn không quản lý tòa nhà này" });

        const report = await Report.create({
            managerId: req.user._id,
            buildingId,
            title: title.trim(),
            content: content.trim(),
            type: type || "general",
        });

        await report.populate("buildingId", "name address");
        res.status(201).json({ success: true, message: "Gửi báo cáo thành công", report });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
};

// ── Duyệt báo cáo (admin) ─────────────────────────────────────────────────
exports.reviewReport = async (req, res) => {
    try {
        const { note } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

        report.status = "reviewed";
        report.adminReview = {
            reviewedBy: req.user._id,
            note: note || "",
            reviewedAt: new Date(),
        };
        await report.save();
        await report.populate("managerId", "username email");
        await report.populate("buildingId", "name");
        await report.populate("adminReview.reviewedBy", "username");

        res.json({ success: true, message: "Đã duyệt báo cáo", report });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Xóa báo cáo (chỉ pending + manager tự xóa) ───────────────────────────
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

        if (report.managerId.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: "Không có quyền xóa báo cáo này" });

        if (report.status === "reviewed")
            return res.status(400).json({ success: false, message: "Không thể xóa báo cáo đã được duyệt" });

        await report.deleteOne();
        res.json({ success: true, message: "Đã xóa báo cáo" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Lấy tòa nhà manager quản lý để điền form ─────────────────────────────
exports.getMyBuildings = async (req, res) => {
    try {
        const buildings = await Building.find({ managerId: req.user._id }).select("name address");
        res.json({ success: true, buildings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
