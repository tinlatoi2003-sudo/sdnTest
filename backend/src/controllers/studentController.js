const Student = require("../models/Student");
const Notification = require("../models/Notification");
const RoomAssignment = require("../models/RoomAssignment");
const RoomRegistration = require("../models/RoomRegistration");
const ElectricityUsage = require("../models/ElectricityUsage");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const PaymentSession = require("../models/PaymentSession");
const Request = require("../models/Request");
const ViolationRecord = require("../models/ViolationRecord");
const Room = require("../models/Room");
const Setting = require("../models/Setting");
const {
    getInvoiceStatus,
    activateRoomForPaidBooking,
    completeQrPaymentSession,
} = require("../services/paymentService");

const getCurrentTermCode = (date = new Date()) => {
    const month = date.getMonth() + 1;
    return `HK${month < 6 ? 1 : 2}-${date.getFullYear()}`;
};

const calcRoomStatus = (room) => {
    if (room.status === "maintenance") return "maintenance";
    if (room.currentOccupancy >= room.maxOccupancy) return "full";
    if (room.currentOccupancy > 0) return "partial";
    return "available";
};

const increaseRoomOccupancy = async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room || !room.isActive) throw new Error("Phòng không t?n t?i ho?c dã ng?ng ho?t d?ng");
    if (!(["available", "partial"].includes(room.status)) || room.currentOccupancy >= room.maxOccupancy)
        throw new Error("Phòng dã d?y ho?c không kh? d?ng");

    room.currentOccupancy += 1;
    room.status = calcRoomStatus(room);
    await room.save();
    return room;
};

const decreaseRoomOccupancy = async (roomId) => {
    if (!roomId) return;
    const room = await Room.findById(roomId);
    if (!room) return;

    room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
    room.status = calcRoomStatus(room);
    await room.save();
};

const genInvoiceCode = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${y}${m}${d}-${rand}`;
};

const buildTransactionCode = (prefix = "STU") => {
    const now = new Date();
    const parts = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
        String(now.getMilliseconds()).padStart(3, "0"),
    ];
    return `${prefix}${parts.join("")}${Math.floor(Math.random() * 900 + 100)}`;
};

const getPaymentQrConfig = async () => {
    const settings = await Setting.find({
        key: { $in: ["payment_bank_bin", "payment_account_no", "payment_account_name", "payment_qr_template"] },
    }).lean();

    const findSetting = (key) => settings.find((item) => item.key === key)?.value;

    return {
        bankBin: String(findSetting("payment_bank_bin") || process.env.PAYMENT_BANK_BIN || "").trim(),
        accountNo: String(findSetting("payment_account_no") || process.env.PAYMENT_ACCOUNT_NO || "").trim(),
        accountName: String(findSetting("payment_account_name") || process.env.PAYMENT_ACCOUNT_NAME || "").trim(),
        qrTemplate: String(findSetting("payment_qr_template") || process.env.PAYMENT_QR_TEMPLATE || "pcZ4Bku").trim(),
    };
};

const getRemainingAmount = (invoice) => Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0));

const buildVietQrUrl = ({ bankBin, accountNo, accountName, amount, addInfo, qrTemplate }) => {
    const params = new URLSearchParams({
        amount: String(amount),
        accountName,
    });
    if (addInfo) params.set("addInfo", addInfo);
    return `https://api.vietqr.io/image/${bankBin}-${accountNo}-${qrTemplate}.jpg?${params.toString()}`;
};

const createRoomFeeInvoices = async ({ studentId, room, termCode, createdBy, startDate }) => {
    const totalAmount = Number(room.pricePerTerm || 0);
    if (totalAmount <= 0) return [];

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 7);
    dueDate.setHours(23, 59, 59, 999);

    return Invoice.insertMany([{
        invoiceCode: genInvoiceCode(),
        studentId,
        roomId: room._id,
        type: "room_fee",
        termCode,
        description: `Tien phong ${termCode} - Phong ${room.roomNumber}`,
        amount: totalAmount,
        paidAmount: 0,
        dueDate,
        status: "unpaid",
        createdBy,
    }]);
};

// Helper: l?y Student t? userId, t? t?o n?u chua có
const getStudent = async (user) => {
    let student = await Student.findOne({ userId: user._id });
    if (!student) {
        student = await Student.create({
            userId: user._id,
            studentCode: user.username,
            fullName: user.username,
            gender: "male",
            dateOfBirth: new Date("2000-01-01"),
            identityNumber: user._id.toString().slice(-9),
            faculty: "Chua c?p nh?t",
            major: "Chua c?p nh?t",
            classCode: "Chua c?p nh?t",
            academicYear: new Date().getFullYear().toString(),
        });
    }
    return student;
};

// GET /student/profile
exports.getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate("userId", "username email phone")
            .populate({
                path: "currentRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name address" },
            });

        if (!student) return res.status(404).json({ success: false, message: "Chua có h? so sinh viên" });
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/news
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

// GET /student/room-history
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

// GET /student/bookings
exports.getBookings = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const bookings = await RoomRegistration.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor type maxOccupancy currentOccupancy buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .populate("reviewedBy", "username");

        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/bookings
exports.createBooking = async (req, res) => {
    try {
        const regSetting = await Setting.findOne({ key: "room_registration_open" }).lean();
        const isOpen = regSetting ? Boolean(regSetting.value) : true;
        if (!isOpen)
            return res.status(403).json({ success: false, message: "Ban qu?n lý hi?n dang t?m d?ng nh?n don dang ký phòng. Vui lòng th? l?i sau." });

        const student = await getStudent(req.user);
        const { roomId, termCode, note } = req.body;
        if (!roomId || !termCode)
            return res.status(400).json({ success: false, message: "roomId và termCode là b?t bu?c" });

        const currentTerm = getCurrentTermCode();
        const hasCurrentRoom = Boolean(student.currentRoomId);
        const activeAssignmentThisTerm = await RoomAssignment.findOne({
            studentId: student._id,
            status: "active",
            termCode: currentTerm,
        });

        if (hasCurrentRoom || activeAssignmentThisTerm) {
            return res.status(400).json({
                success: false,
                message: "B?n dang có phòng ? k? hi?n t?i, không th? dang ký phòng m?i. N?u mu?n d?i phòng, vui lòng g?i yêu c?u chuy?n phòng.",
            });
        }

        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode,
            status: { $in: ["pending", "approved"] },
        });
        if (existing)
            return res.status(400).json({ success: false, message: "B?n dã có dang ký phòng cho k? này" });

        const room = await increaseRoomOccupancy(roomId);

        if (student.currentRoomId && String(student.currentRoomId) !== String(room._id)) {
            await decreaseRoomOccupancy(student.currentRoomId);
        }

        await RoomAssignment.updateMany(
            { studentId: student._id, status: "active" },
            { $set: { status: "ended", endDate: new Date() } }
        );

        const bookingStartDate = new Date();

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: room._id,
            termCode,
            note,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: "H? th?ng t? duy?t do phòng còn ch? tr?ng",
        });

        const invoices = await createRoomFeeInvoices({
            studentId: student._id,
            room,
            termCode,
            createdBy: req.user._id,
            startDate: bookingStartDate,
        });

        res.status(201).json({
            success: true,
            message: "Dang ky phong thanh cong, da giu cho va tao 1 hoa don tien phong cho ca ky. Phong se duoc kich hoat sau khi thanh toan.",
            data: { booking, invoices },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/electricity
exports.getElectricity = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        if (!student.currentRoomId)
            return res.json({ success: true, data: [], message: "Chua có phòng hi?n t?i" });

        const records = await ElectricityUsage.find({ roomId: student.currentRoomId })
            .sort({ year: -1, month: -1 })
            .limit(12);
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/payments
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

// GET /student/payments/outstanding
exports.getOutstandingInvoices = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const invoices = await Invoice.find({
            studentId: student._id,
            status: { $in: ["unpaid", "partial", "overdue"] },
        })
            .sort({ dueDate: 1, createdAt: -1 })
            .populate("roomId", "roomNumber")
            .lean();

        const data = invoices
            .map((invoice) => ({
                ...invoice,
                remainingAmount: Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0)),
            }))
            .filter((invoice) => invoice.remainingAmount > 0);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/payments/qr-session
exports.createQrPaymentSession = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { invoiceIds } = req.body;

        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất một khoản nợ để tạo mã QR" });
        }

        const qrConfig = await getPaymentQrConfig();
        if (!qrConfig.bankBin || !qrConfig.accountNo || !qrConfig.accountName) {
            return res.status(400).json({
                success: false,
                message: "Chưa cấu hình tài khoản nhận tiền để tạo mã QR",
            });
        }

        const invoices = await Invoice.find({
            _id: { $in: invoiceIds },
            studentId: student._id,
            status: { $in: ["unpaid", "partial", "overdue"] },
        });

        if (invoices.length !== invoiceIds.length) {
            return res.status(404).json({ success: false, message: "Có khoản nợ không tồn tại hoặc không thuộc tài khoản này" });
        }

        const totalAmount = invoices.reduce((sum, invoice) => sum + getRemainingAmount(invoice), 0);
        if (totalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Các khoản nợ đã được thanh toán trước đó" });
        }

        const sessionCode = buildTransactionCode("QR");
        const transferContent = `KTX ${student.studentCode} ${sessionCode.slice(-6)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const qrUrl = buildVietQrUrl({
            ...qrConfig,
            amount: totalAmount,
            addInfo: transferContent,
        });

        const session = await PaymentSession.create({
            studentId: student._id,
            invoiceIds,
            totalAmount,
            paymentMethod: "bank_transfer",
            status: "pending",
            transferContent,
            qrUrl,
            sessionCode,
            expiresAt,
        });

        res.status(201).json({
            success: true,
            message: "Đã tạo mã QR thanh toán",
            data: {
                _id: session._id,
                sessionCode: session.sessionCode,
                totalAmount: session.totalAmount,
                transferContent: session.transferContent,
                qrUrl: session.qrUrl,
                status: session.status,
                expiresAt: session.expiresAt,
                accountName: qrConfig.accountName,
                accountNo: qrConfig.accountNo,
                bankBin: qrConfig.bankBin,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/payments/qr-session/:id
exports.getQrPaymentSession = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const session = await PaymentSession.findOne({
            _id: req.params.id,
            studentId: student._id,
        }).lean();

        if (!session) {
            return res.status(404).json({ success: false, message: "Không tìm thấy phiên thanh toán QR" });
        }

        const status =
            session.status === "pending" && new Date(session.expiresAt) < new Date()
                ? "expired"
                : session.status;

        if (status !== session.status) {
            await PaymentSession.updateOne({ _id: session._id }, { $set: { status } });
        }

        res.json({
            success: true,
            data: {
                ...session,
                status,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/payments/pay
exports.payOutstandingInvoices = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { invoiceIds, paymentMethod = "bank_transfer", note } = req.body;

        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất một khoản nợ để thanh toán" });
        }

        const validMethods = ["cash", "bank_transfer", "e_wallet"];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: "Hình thức thanh toán không hợp lệ" });
        }

        const invoices = await Invoice.find({
            _id: { $in: invoiceIds },
            studentId: student._id,
            status: { $in: ["unpaid", "partial", "overdue"] },
        });

        if (invoices.length !== invoiceIds.length) {
            return res.status(404).json({ success: false, message: "Có khoản nợ không tồn tại hoặc không thuộc tài khoản này" });
        }

        const paidAt = new Date();
        const createdPayments = [];
        let totalPaid = 0;

        for (const invoice of invoices) {
            const remainingAmount = Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0));
            if (remainingAmount <= 0) continue;

            const payment = await Payment.create({
                invoiceId: invoice._id,
                studentId: student._id,
                amount: remainingAmount,
                paymentMethod,
                transactionCode: buildTransactionCode("STU"),
                note: note?.trim() || `Sinh viên thanh toán hóa đơn ${invoice.invoiceCode}`,
                paidAt,
            });

            invoice.paidAmount = (invoice.paidAmount || 0) + remainingAmount;
            invoice.status = getInvoiceStatus(invoice);
            await invoice.save();

            createdPayments.push(payment);
            totalPaid += remainingAmount;
        }

        await activateRoomForPaidBooking({ studentId: student._id, reviewedBy: req.user._id });

        res.status(201).json({
            success: true,
            message: createdPayments.length > 1
                ? `Đã thanh toán ${createdPayments.length} khoản nợ`
                : "Đã thanh toán khoản nợ thành công",
            data: {
                payments: createdPayments,
                totalPaid,
                count: createdPayments.length,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/payments/qr-session/:id/confirm
exports.confirmQrPaymentSession = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const session = await PaymentSession.findOne({
            _id: req.params.id,
            studentId: student._id,
        });

        if (!session) {
            return res.status(404).json({ success: false, message: "Không tìm thấy phiên thanh toán QR" });
        }

        const result = await completeQrPaymentSession({
            session,
            transactionCode: session.sessionCode,
            note: `Thanh toan QR - ${session.transferContent}`,
            paidAt: new Date(),
            reviewedBy: req.user._id,
        });

        res.json({
            success: true,
            message: result.alreadyCompleted ? "Phiên QR đã được xác nhận trước đó" : "Đã xác nhận thanh toán QR thành công",
            data: {
                _id: result.session._id,
                status: result.session.status,
                confirmedAt: result.session.confirmedAt,
                totalPaid: result.totalPaid,
                count: result.count,
            },
        });
    } catch (err) {
        const status = [
            "Phien thanh toan QR khong con hieu luc",
            "Ma QR da het han",
        ].includes(err.message) ? 400 : 500;
        res.status(status).json({ success: false, message: err.message });
    }
};

// GET /student/requests
exports.getMyRequests = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const requests = await Request.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("currentRoomId", "roomNumber floor buildingId")
            .populate("targetRoomId", "roomNumber floor buildingId");

        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/requests
exports.createRequest = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { type, title, description, targetRoomId } = req.body;
        if (!type || !title || !description)
            return res.status(400).json({ success: false, message: "type, title, description là b?t bu?c" });

        const reservedBooking = await RoomRegistration.findOne({
            studentId: student._id,
            status: "approved",
            activatedAt: null,
        }).sort({ createdAt: -1 });

        if (type === "room_transfer") {
            if (!student.currentRoomId)
                return res.status(400).json({ success: false, message: "B?n chua có phòng hi?n t?i d? g?i yêu c?u chuy?n phòng" });
            if (!targetRoomId)
                return res.status(400).json({ success: false, message: "Vui lòng ch?n phòng mu?n chuy?n d?n" });
            if (String(targetRoomId) === String(student.currentRoomId))
                return res.status(400).json({ success: false, message: "Phòng chuy?n d?n ph?i khác phòng hi?n t?i" });

            const targetRoom = await Room.findById(targetRoomId);
            if (!targetRoom || !targetRoom.isActive)
                return res.status(404).json({ success: false, message: "Không tìm th?y phòng mu?n chuy?n" });
            if (!(["available", "partial"].includes(targetRoom.status)) || targetRoom.currentOccupancy >= targetRoom.maxOccupancy)
                return res.status(400).json({ success: false, message: "Phòng mu?n chuy?n dã h?t ch?" });

            const pendingTransfer = await Request.findOne({
                studentId: student._id,
                type: "room_transfer",
                status: "pending",
            });
            if (pendingTransfer)
                return res.status(400).json({ success: false, message: "B?n dang có yêu c?u chuy?n phòng ch? duy?t" });
        }

        if (type === "room_reservation_cancel") {
            if (student.currentRoomId)
                return res.status(400).json({ success: false, message: "B?n dang ? trong phòng, không th? dùng yêu c?u này" });
            if (!reservedBooking)
                return res.status(400).json({ success: false, message: "B?n không có phòng dang gi? ch? d? h?y" });

            const pendingCancel = await Request.findOne({
                studentId: student._id,
                type: "room_reservation_cancel",
                status: "pending",
            });
            if (pendingCancel)
                return res.status(400).json({ success: false, message: "B?n dang có yêu c?u h?y gi? ch? ch? duy?t" });
        }

        const request = await Request.create({
            studentId: student._id,
            type,
            title,
            description,
            currentRoomId: student.currentRoomId || reservedBooking?.roomId || null,
            targetRoomId: type === "room_transfer" ? targetRoomId : null,
        });

        res.status(201).json({ success: true, message: "T?o yêu c?u thành công", data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/violations
exports.getViolations = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const violations = await ViolationRecord.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .populate("reportedBy", "username")
            .populate("invoiceId", "invoiceCode amount paidAmount status dueDate type description createdAt")
            .lean();

        const mappedViolationIds = new Set(
            violations
                .map((item) => item.invoiceId?._id?.toString())
                .filter(Boolean)
        );

        const violationInvoices = await Invoice.find({
            studentId: student._id,
            type: "violation_fine",
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .lean();

        const syntheticViolations = violationInvoices
            .filter((invoice) => !mappedViolationIds.has(invoice._id.toString()))
            .map((invoice) => ({
                _id: `invoice-${invoice._id}`,
                studentId: student._id,
                roomId: invoice.roomId,
                type: "other",
                description: invoice.description || "Vi phạm nội quy ký túc xá",
                fineAmount: invoice.amount || 0,
                invoiceId: invoice,
                reportedBy: null,
                evidence: [],
                status: invoice.status === "paid" ? "resolved" : "invoiced",
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                source: "invoice",
            }));

        const normalizedViolations = violations.map((item) => ({
            ...item,
            status: item.invoiceId?.status === "paid" ? "resolved" : item.status,
        }));

        const data = [...normalizedViolations, ...syntheticViolations].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/rooms/available
exports.getAvailableRooms = async (req, res) => {
    try {
        const { type, building } = req.query;
        const filter = {
            isActive: true,
            status: { $in: ["available", "partial"] },
        };
        if (type) filter.type = type;

        const rooms = await Room.find(filter)
            .populate("buildingId", "name address")
            .sort({ "buildingId": 1, floor: 1, roomNumber: 1 });

        const result = building
            ? rooms.filter((r) => r.buildingId?.name?.toLowerCase().includes(building.toLowerCase()))
            : rooms;

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/requests/:id/approve-retention
exports.approveRetentionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextTermCode } = req.body;

        if (!nextTermCode)
            return res.status(400).json({ success: false, message: "nextTermCode là b?t bu?c" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm th?y yêu c?u" });
        if (request.type !== "room_retention")
            return res.status(400).json({ success: false, message: "Yêu c?u này không ph?i xin gi? phòng" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu c?u dã du?c x? lý" });

        const student = await Student.findById(request.studentId);
        if (!student?.currentRoomId)
            return res.status(400).json({ success: false, message: "Sinh viên chua có phòng hi?n t?i" });

        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode: nextTermCode,
        });
        if (existing)
            return res.status(400).json({ success: false, message: "Sinh viên dã có don dang ký cho k? này" });

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: student.currentRoomId,
            termCode: nextTermCode,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: `Ðu?c duy?t gi? phòng t? yêu c?u #${id}`,
        });

        request.status = "completed";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: "approved",
            note: `Ðã t?o dang ký phòng cho k? ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({
            success: true,
            message: `Ðã duy?t gi? phòng và t?o dang ký cho k? ${nextTermCode}`,
            data: { booking, request },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


