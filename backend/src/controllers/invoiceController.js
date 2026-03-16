const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const User = require("../models/User");

// Tạo mã hóa đơn tự động
const genInvoiceCode = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${y}${m}${d}-${rand}`;
};

// ─────────────────────────────────────────
// [ADMIN] Lấy tất cả hóa đơn (có filter)
// GET /api/invoices?status=&type=&studentId=&page=
// ─────────────────────────────────────────
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, type, studentId, page = 1, limit = 30 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (studentId) filter.studentId = studentId;

        const skip = (Number(page) - 1) * Number(limit);
        const [invoices, total] = await Promise.all([
            Invoice.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate({ path: "studentId", select: "fullName studentCode" })
                .populate({ path: "createdBy", select: "username" })
                .lean(),
            Invoice.countDocuments(filter),
        ]);

        return res.json({ success: true, data: invoices, pagination: { page: Number(page), limit: Number(limit), total } });
    } catch (err) {
        console.error("getAllInvoices error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Tạo hóa đơn gửi cho sinh viên
// POST /api/invoices
// Body: { studentId, type, amount, description, dueDate, termCode }
// ─────────────────────────────────────────
exports.createInvoice = async (req, res) => {
    try {
        const { studentId, type, amount, description, dueDate, termCode } = req.body;

        if (!studentId || !type || !amount || !dueDate) {
            return res.status(400).json({ success: false, message: "studentId, type, amount và dueDate là bắt buộc" });
        }

        const VALID_TYPES = ["room_fee", "violation_fine", "damage_compensation", "electricity", "other"];
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: "Loại hóa đơn không hợp lệ" });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Số tiền phải lớn hơn 0" });
        }

        // Kiểm tra sinh viên tồn tại
        const student = await Student.findById(studentId).populate("userId", "username");
        if (!student) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên" });
        }

        // Cần roomId — nếu sinh viên có phòng thì dùng, không thì tạo invoice không có room
        const roomId = student.currentRoomId;
        if (!roomId) {
            return res.status(400).json({ success: false, message: "Sinh viên chưa được phân phòng, không thể tạo hóa đơn" });
        }

        const invoice = await Invoice.create({
            invoiceCode: genInvoiceCode(),
            studentId,
            roomId,
            type,
            amount: Number(amount),
            paidAmount: 0,
            dueDate: new Date(dueDate),
            termCode: termCode || null,
            description: description || "",
            status: "unpaid",
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: `Đã tạo hóa đơn ${invoice.invoiceCode} cho sinh viên ${student.fullName}`,
            data: invoice,
        });
    } catch (err) {
        console.error("createInvoice error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Danh sách sinh viên có khoản nợ
// GET /api/invoices/debtors
// ─────────────────────────────────────────
exports.getDebtors = async (req, res) => {
    try {
        // Tổng hợp nợ theo studentId
        const debtData = await Invoice.aggregate([
            { $match: { status: { $in: ["unpaid", "partial", "overdue"] } } },
            {
                $group: {
                    _id: "$studentId",
                    totalDebt: { $sum: { $subtract: ["$amount", "$paidAmount"] } },
                    invoiceCount: { $sum: 1 },
                    types: { $addToSet: "$type" },
                    oldestDue: { $min: "$dueDate" },
                },
            },
            { $sort: { totalDebt: -1 } },
            { $limit: 50 },
        ]);

        // Populate thông tin sinh viên
        const studentIds = debtData.map(d => d._id);
        const students = await Student.find({ _id: { $in: studentIds } })
            .select("fullName studentCode currentRoomId")
            .lean();

        const result = debtData.map(d => {
            const student = students.find(s => s._id.toString() === d._id?.toString());
            return {
                studentId: d._id,
                student: student || null,
                totalDebt: d.totalDebt,
                invoiceCount: d.invoiceCount,
                types: d.types,
                oldestDue: d.oldestDue,
            };
        }).filter(d => d.student); // chỉ trả về nếu tìm thấy sinh viên

        return res.json({ success: true, data: result, total: result.length });
    } catch (err) {
        console.error("getDebtors error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Tìm kiếm sinh viên để gửi bill
// GET /api/invoices/search-students?q=
// ─────────────────────────────────────────
exports.searchStudents = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: [] });
        }
        const students = await Student.find({
            $or: [
                { fullName: { $regex: q.trim(), $options: "i" } },
                { studentCode: { $regex: q.trim(), $options: "i" } },
            ],
        })
            .limit(10)
            .select("fullName studentCode currentRoomId status")
            .populate("currentRoomId", "roomNumber currentOccupancy maxOccupancy")
            .lean();

        return res.json({ success: true, data: students });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
