const Request = require("../models/Request");
const Student = require("../models/Student");
const RoomRegistration = require("../models/RoomRegistration");
const RoomAssignment = require("../models/RoomAssignment");
const Room = require("../models/Room");
const Building = require("../models/Building");
const Invoice = require("../models/Invoice");
const PaymentSession = require("../models/PaymentSession");
const ElectricityUsage = require("../models/ElectricityUsage");
const Setting = require("../models/Setting");
const Notification = require("../models/Notification");

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
    if (!room || !room.isActive) throw new Error("Phòng dịch không tồn tại hoặc đã ngừng hoạt động");
    if (!(["available", "partial"].includes(room.status)) || room.currentOccupancy >= room.maxOccupancy)
        throw new Error("Phòng dịch đã đầy hoặc không khả dụng");

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
            .populate({
                path: "currentRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .populate({
                path: "targetRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            });

        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.reviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body;

        if (!["approve", "reject"].includes(action))
            return res.status(400).json({ success: false, message: "action phải là approve hoặc reject" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yeu cau da duoc xu ly" });

        request.status = action === "approve" ? "manager_approved" : "manager_rejected";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: action === "approve" ? "approved" : "rejected",
            note: note || "",
            reviewedAt: new Date(),
        };

        if (action === "approve" && request.type === "room_transfer") {
            if (!request.targetRoomId)
                return res.status(400).json({ success: false, message: "Yêu cầu chuyển phòng chưa có phòng đích" });

            const student = await Student.findById(request.studentId);
            if (!student)
                return res.status(404).json({ success: false, message: "Khong tim thay sinh vien" });
            if (!student.currentRoomId)
                return res.status(400).json({ success: false, message: "Sinh viên chưa có phòng hiện tại để chuyển" });
            if (String(student.currentRoomId) === String(request.targetRoomId))
                return res.status(400).json({ success: false, message: "Phòng đích trung với phòng hiện tại" });

            const targetRoom = await increaseRoomOccupancy(request.targetRoomId);
            await decreaseRoomOccupancy(student.currentRoomId);

            await RoomAssignment.updateMany(
                { studentId: student._id, status: "active" },
                { $set: { status: "ended", endDate: new Date() } }
            );

            const termCode = getCurrentTermCode();
            await RoomAssignment.create({
                studentId: student._id,
                roomId: targetRoom._id,
                buildingId: targetRoom.buildingId,
                termCode,
                startDate: new Date(),
                status: "active",
            });

            await RoomRegistration.create({
                studentId: student._id,
                roomId: targetRoom._id,
                termCode,
                status: "approved",
                reviewedBy: req.user._id,
                reviewedAt: new Date(),
                reviewNote: `Manager duyệt chuyển phòng từ yêu cầu #${id}`,
                activatedAt: new Date(),
            });

            student.currentRoomId = targetRoom._id;
            await student.save();

            request.status = "completed";
            request.managerReview.note = (note ? `${note}. ` : "") + "Đã chuyển phòng thành công";
        }

        if (action === "approve" && request.type === "room_reservation_cancel") {
            const student = await Student.findById(request.studentId);
            if (!student)
                return res.status(404).json({ success: false, message: "Khong tim thay sinh vien" });
            if (student.currentRoomId)
                return res.status(400).json({ success: false, message: "Sinh viên đã vào phòng, không thể hủy giữ chỗ" });

            const booking = await RoomRegistration.findOne({
                studentId: student._id,
                status: "approved",
                activatedAt: null,
            }).sort({ createdAt: -1 });

            if (!booking)
                return res.status(400).json({ success: false, message: "Không còn booking giữ chỗ để hủy" });

            const invoices = await Invoice.find({
                studentId: student._id,
                roomId: booking.roomId,
                termCode: booking.termCode,
                type: "room_fee",
            });

            if (invoices.some((invoice) => (invoice.paidAmount || 0) > 0))
                return res.status(400).json({ success: false, message: "Booking này đã có bill được thanh toán, không thể tự hủy" });

            const room = await Room.findById(booking.roomId);
            if (room) {
                room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
                room.status = calcRoomStatus(room);
                await room.save();
            }

            const invoiceIds = invoices.map((invoice) => invoice._id);
            if (invoiceIds.length > 0) {
                await PaymentSession.deleteMany({
                    studentId: student._id,
                    status: { $in: ["pending", "expired", "cancelled"] },
                    invoiceIds: { $in: invoiceIds },
                });
                await Invoice.deleteMany({ _id: { $in: invoiceIds } });
            }

            booking.status = "cancelled";
            booking.reviewedBy = req.user._id;
            booking.reviewedAt = new Date();
            booking.reviewNote = note || "Manager duyệt hủy phòng đã giữ chỗ";
            await booking.save();

            request.status = "completed";
            request.managerReview.note = (note ? `${note}. ` : "") + "Đã hủy giữ chỗ thành công";
        }

        await request.save();
        res.json({ success: true, message: `Đã ${action === "approve" ? "duyệt" : "từ chối"} yêu cầu`, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

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
            return res.status(400).json({ success: false, message: "Yeu cau da duoc xu ly" });

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
            status: "approved",
            note: `Đã tạo đăng ký giữ phòng kỳ ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({ success: true, message: `Đã duyệt giữ phòng kỳ ${nextTermCode}`, data: { booking, request } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getManagerBuildingRooms = async (req, res) => {
    try {
        const managerId = req.user._id;
        const buildings = await Building.find({ managerId }).select("name address totalFloors status").lean();

        if (buildings.length === 0) {
            return res.json({ success: true, data: [], message: "Bạn chưa được gán quản lý tòa nhà nào" });
        }

        const buildingIds = buildings.map((b) => b._id);
        const rooms = await Room.find({ buildingId: { $in: buildingIds } })
            .select("roomNumber floor type maxOccupancy currentOccupancy status buildingId")
            .sort({ buildingId: 1, floor: 1, roomNumber: 1 })
            .lean();

        const roomIds = rooms.map((r) => r._id);
        const electricityRecords = await ElectricityUsage.find({ roomId: { $in: roomIds } })
            .sort({ year: -1, month: -1, createdAt: -1 })
            .lean();
        const students = await Student.find({ currentRoomId: { $in: roomIds } })
            .select("fullName studentCode gender faculty major classCode currentRoomId userId")
            .populate("userId", "username email phone")
            .lean();

        const latestElectricityByRoom = {};
        for (const item of electricityRecords) {
            const key = item.roomId?.toString();
            if (key && !latestElectricityByRoom[key]) {
                latestElectricityByRoom[key] = item;
            }
        }

        const studentsByRoom = {};
        for (const sv of students) {
            const rid = sv.currentRoomId?.toString();
            if (rid) {
                if (!studentsByRoom[rid]) studentsByRoom[rid] = [];
                studentsByRoom[rid].push(sv);
            }
        }

        const result = buildings.map((b) => ({
            ...b,
            rooms: rooms
                .filter((r) => r.buildingId?.toString() === b._id.toString())
                .map((r) => ({
                    ...r,
                    students: studentsByRoom[r._id.toString()] || [],
                    latestElectricity: latestElectricityByRoom[r._id.toString()] || null,
                })),
        }));

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error("getManagerBuildingRooms error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getUnpaidStudents = async (req, res) => {
    try {
        const buildingFilter = req.user.role === "admin" ? {} : { managerId: req.user._id };
        const buildings = await Building.find(buildingFilter).select("_id name").lean();

        if (buildings.length === 0) {
            return res.json({ success: true, data: [], total: 0, overview: { studentCount: 0, totalDebt: 0, overdueCount: 0 } });
        }

        const buildingIds = buildings.map((item) => item._id);
        const rooms = await Room.find({ buildingId: { $in: buildingIds } })
            .select("_id roomNumber buildingId floor")
            .lean();

        const roomIds = rooms.map((item) => item._id);
        const roomMap = new Map(rooms.map((room) => [room._id.toString(), room]));
        const buildingMap = new Map(buildings.map((building) => [building._id.toString(), building]));

        const students = await Student.find({ currentRoomId: { $in: roomIds } })
            .select("fullName studentCode currentRoomId userId faculty major classCode")
            .populate("userId", "username email phone")
            .lean();

        if (students.length === 0) {
            return res.json({ success: true, data: [], total: 0, overview: { studentCount: 0, totalDebt: 0, overdueCount: 0 } });
        }

        const studentIds = students.map((item) => item._id);
        const invoices = await Invoice.find({
            studentId: { $in: studentIds },
            status: { $in: ["unpaid", "partial", "overdue"] },
        })
            .select("studentId invoiceCode type amount paidAmount dueDate status description createdAt")
            .sort({ dueDate: 1, createdAt: -1 })
            .lean();

        const debtsByStudent = new Map();
        for (const invoice of invoices) {
            const key = invoice.studentId?.toString();
            if (!key) continue;
            if (!debtsByStudent.has(key)) debtsByStudent.set(key, []);
            debtsByStudent.get(key).push({
                ...invoice,
                remainingAmount: Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0)),
            });
        }

        const data = students
            .map((student) => {
                const debtItems = debtsByStudent.get(student._id.toString()) || [];
                if (debtItems.length === 0) return null;

                const room = roomMap.get(student.currentRoomId?.toString?.() || "");
                const building = buildingMap.get(room?.buildingId?.toString?.() || "");
                const totalDebt = debtItems.reduce((sum, item) => sum + (item.remainingAmount || 0), 0);
                const overdueCount = debtItems.filter((item) => item.status === "overdue").length;

                return {
                    studentId: student._id,
                    student: {
                        ...student,
                        currentRoom: room
                            ? {
                                _id: room._id,
                                roomNumber: room.roomNumber,
                                floor: room.floor,
                                buildingId: room.buildingId,
                            }
                            : null,
                    },
                    building: building || null,
                    totalDebt,
                    invoiceCount: debtItems.length,
                    overdueCount,
                    invoices: debtItems,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.totalDebt - a.totalDebt);

        const overview = {
            studentCount: data.length,
            totalDebt: data.reduce((sum, item) => sum + item.totalDebt, 0),
            overdueCount: data.reduce((sum, item) => sum + item.overdueCount, 0),
        };

        return res.json({ success: true, total: data.length, overview, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.recordRoomElectricity = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { currentReading, month, year, dueDate } = req.body;

        if (currentReading === undefined || Number(currentReading) < 0) {
            return res.status(400).json({ success: false, message: "currentReading phải là số không âm" });
        }

        const room = await Room.findById(roomId).populate("buildingId", "managerId name");
        if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy phòng" });
        if (String(room.buildingId?.managerId || "") !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Bạn không quản lý phòng này" });
        }

        const targetMonth = Number(month) || (new Date().getMonth() + 1);
        const targetYear = Number(year) || new Date().getFullYear();

        const existingUsage = await ElectricityUsage.findOne({
            roomId,
            month: targetMonth,
            year: targetYear,
        });
        if (existingUsage) {
            return res.status(400).json({ success: false, message: "Phòng này đã được ghi số điện cho tháng này" });
        }

        const latestUsage = await ElectricityUsage.findOne({ roomId })
            .sort({ year: -1, month: -1, createdAt: -1 });

        const previousReading = latestUsage?.currentReading || 0;
        const currentValue = Number(currentReading);
        if (currentValue < previousReading) {
            return res.status(400).json({ success: false, message: "Số điện mới không được nhỏ hơn số điện cũ" });
        }

        const students = await Student.find({ currentRoomId: roomId }).select("_id fullName studentCode userId").lean();
        if (students.length === 0) {
            return res.status(400).json({ success: false, message: "Phòng này hiện không có sinh viên để chia bill" });
        }

        const settings = await Setting.find({
            key: {
                $in: [
                    "electricity_excess_rate",
                    "electricity_free_units",
                    "electricity_excess_price",
                    "electricity_free_limit",
                    "free_electricity_units",
                ],
            },
        }).lean();
        const getSettingValue = (keys, fallback) => {
            for (const key of keys) {
                const found = settings.find((s) => s.key === key);
                if (found && found.value !== undefined && found.value !== null) return Number(found.value);
            }
            return fallback;
        };
        const excessRate = getSettingValue(["electricity_excess_rate", "electricity_excess_price"], 3500);
        const freeKwh = getSettingValue(["electricity_free_units", "electricity_free_limit", "free_electricity_units"], 50);

        const totalKwh = currentValue - previousReading;
        const excessKwh = Math.max(0, totalKwh - freeKwh);
        const excessAmount = excessKwh * excessRate;
        const perStudentBase = students.length > 0 ? Math.floor(excessAmount / students.length) : 0;
        const remainder = students.length > 0 ? excessAmount - perStudentBase * students.length : 0;
        const finalDueDate = dueDate
            ? new Date(dueDate)
            : new Date(targetYear, targetMonth, 15, 23, 59, 59, 999);
        if (Number.isNaN(finalDueDate.getTime())) {
            return res.status(400).json({ success: false, message: "dueDate không hợp lệ" });
        }

        const usage = await ElectricityUsage.create({
            roomId,
            month: targetMonth,
            year: targetYear,
            previousReading,
            currentReading: currentValue,
            totalKwh,
            freeKwh,
            excessKwh,
            excessAmount,
            recordedBy: req.user._id,
        });

        const invoices = [];
        for (let i = 0; i < students.length; i += 1) {
            const student = students[i];
            const amount = perStudentBase + (i < remainder ? 1 : 0);

            invoices.push({
                invoiceCode: genInvoiceCode(),
                studentId: student._id,
                roomId,
                type: "electricity",
                termCode: `T${String(targetMonth).padStart(2, "0")}-${targetYear}`,
                description: `Tiền điện tháng ${targetMonth}/${targetYear}: (${currentValue} - ${previousReading}) - ${freeKwh} free = ${excessKwh} kWh, chia ${students.length} người`,
                amount,
                paidAmount: 0,
                dueDate: finalDueDate,
                status: "unpaid",
                createdBy: req.user._id,
            });
        }

        const createdInvoices = invoices.length > 0 ? await Invoice.insertMany(invoices) : [];
        const receiverIds = students
            .map((student) => student.userId)
            .filter((userId) => !!userId);
        if (receiverIds.length > 0) {
            await Notification.create({
                senderId: req.user._id,
                receiverIds,
                receiverType: "individual",
                title: `Bill điện phòng ${room.roomNumber} tháng ${targetMonth}/${targetYear}`,
                message: `Chỉ số mới ${currentValue}, chỉ số cũ ${previousReading}, vượt free ${excessKwh} kWh. Hệ thống đã tạo ${createdInvoices.length} bill để thanh toán.`,
                type: "payment_reminder",
            });
        }

        return res.status(201).json({
            success: true,
            message: `Đã ghi số điện và tạo ${createdInvoices.length} bill cho phòng ${room.roomNumber}`,
            data: {
                usage,
                room: { _id: room._id, roomNumber: room.roomNumber, buildingName: room.buildingId?.name || "" },
                students,
                billing: {
                    previousReading,
                    currentReading: currentValue,
                    totalKwh,
                    freeKwh,
                    excessKwh,
                    excessRate,
                    excessAmount,
                    occupantCount: students.length,
                },
                invoices: createdInvoices,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
