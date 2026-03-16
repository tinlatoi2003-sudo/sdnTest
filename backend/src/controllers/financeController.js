const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// ─────────────────────────────────────────
// [ADMIN] Tổng hợp dữ liệu tài chính
// GET /api/finance/summary
// ─────────────────────────────────────────
exports.getFinanceSummary = async (req, res) => {
    try {
        // ── Tổng số hóa đơn theo trạng thái ──
        const [paidCount, unpaidCount, partialCount, overdueCount] = await Promise.all([
            Invoice.countDocuments({ status: "paid" }),
            Invoice.countDocuments({ status: "unpaid" }),
            Invoice.countDocuments({ status: "partial" }),
            Invoice.countDocuments({ status: "overdue" }),
        ]);

        const totalInvoices = paidCount + unpaidCount + partialCount + overdueCount;

        // ── Tổng doanh thu (paidAmount từ tất cả hóa đơn) ──
        const revenueResult = await Invoice.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$paidAmount" }, totalBilled: { $sum: "$amount" } } },
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;
        const totalBilled = revenueResult[0]?.totalBilled || 0;
        const unpaidAmount = totalBilled - totalRevenue;

        // ── Doanh thu 12 tháng gần nhất ──
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const monthlyRevenue = await Invoice.aggregate([
            {
                $match: {
                    createdAt: { $gte: twelveMonthsAgo },
                    status: { $in: ["paid", "partial"] },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    revenue: { $sum: "$paidAmount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Fill đủ 12 tháng (kể cả tháng không có dữ liệu)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const found = monthlyRevenue.find(m => m._id.year === year && m._id.month === month);
            monthlyData.push({
                label: `${month}/${year}`,
                month,
                year,
                revenue: found?.revenue || 0,
                count: found?.count || 0,
            });
        }

        // ── Phân loại theo type ──
        const byType = await Invoice.aggregate([
            {
                $group: {
                    _id: "$type",
                    totalBilled: { $sum: "$amount" },
                    totalPaid: { $sum: "$paidAmount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { totalBilled: -1 } },
        ]);

        const TYPE_LABELS = {
            room_fee: "Phí phòng",
            electricity: "Điện",
            violation_fine: "Phí vi phạm",
            damage_compensation: "Bồi thường",
            other: "Khác",
        };
        const byTypeFormatted = byType.map(t => ({
            type: t._id,
            label: TYPE_LABELS[t._id] || t._id,
            totalBilled: t.totalBilled,
            totalPaid: t.totalPaid,
            count: t.count,
        }));

        // ── Hóa đơn gần nhất (hỗ trợ lọc theo status) ──
        const { status: statusFilter } = req.query;
        const invoiceQuery = {};
        const VALID_STATUSES = ["paid", "unpaid", "partial", "overdue"];
        if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
            invoiceQuery.status = statusFilter;
        }

        const recentInvoices = await Invoice.find(invoiceQuery)
            .sort({ createdAt: -1 })
            .limit(20)
            .populate({ path: "studentId", select: "fullName studentCode" })
            .lean();


        return res.json({
            success: true,
            data: {
                overview: {
                    totalRevenue,
                    totalBilled,
                    unpaidAmount,
                    totalInvoices,
                    paidCount,
                    unpaidCount,
                    partialCount,
                    overdueCount,
                    collectionRate: totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0,
                },
                monthlyData,
                byType: byTypeFormatted,
                recentInvoices,
            },
        });
    } catch (err) {
        console.error("getFinanceSummary error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
