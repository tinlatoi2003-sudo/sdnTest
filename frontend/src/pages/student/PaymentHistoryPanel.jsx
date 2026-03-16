import { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "-");
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const METHOD_LABEL = {
    cash: "Tiền mặt",
    bank_transfer: "Chuyển khoản",
    e_wallet: "Ví điện tử",
};

const TYPE_LABEL = {
    room_fee: "Tiền Phòng",
    violation_fine: "Tiền Phạt",
    damage_compensation: "Bồi Thường",
    electricity: "Điện nước",
    other: "Khác",
};

const STATUS_LABEL = {
    paid: "Đã thanh toán",
    unpaid: "Chưa thanh toán",
    partial: "Thanh Toán một phần",
    overdue: "Quá Hạn",
};

const STATUS_BADGE_CLASS = {
    paid: "approved",
    unpaid: "pending",
    partial: "info",
    overdue: "rejected",
};

export default function PaymentHistoryPanel() {
    const [payments, setPayments] = useState([]);
    const [outstanding, setOutstanding] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [qrSession, setQrSession] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const loadData = async ({ keepLoading = true } = {}) => {
        if (keepLoading) setLoading(true);
        try {
            const [paymentRes, outstandingRes] = await Promise.all([
                studentApi.getPayments(),
                studentApi.getOutstandingPayments(),
            ]);

            const paymentData = paymentRes.data.data || [];
            const outstandingData = outstandingRes.data.data || [];

            setPayments(paymentData);
            setOutstanding(outstandingData);
            setSelectedIds((current) =>
                current.filter((id) => outstandingData.some((item) => item._id === id))
            );
        } catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.message || "Không tải được dữ liệu thanh toán",
            });
        } finally {
            if (keepLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!qrSession?._id || qrSession.status !== "pending") return undefined;

        const interval = setInterval(async () => {
            try {
                const res = await studentApi.getPaymentQrSession(qrSession._id);
                const nextSession = res.data.data;
                setQrSession((current) => (current ? { ...current, ...nextSession } : nextSession));

                if (nextSession.status === "completed") {
                    setMessage({ type: "success", text: "Thanh toán QR thành công" });
                    await loadData({ keepLoading: false });
                }
            } catch {
                // Ignore polling errors to keep modal stable.
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [qrSession?._id, qrSession?.status]);

    const totalPaid = useMemo(
        () => payments.reduce((sum, item) => sum + (item.amount || 0), 0),
        [payments]
    );

    const totalDebt = useMemo(
        () => outstanding.reduce((sum, item) => sum + (item.remainingAmount || 0), 0),
        [outstanding]
    );

    const selectedTotal = useMemo(
        () =>
            outstanding
                .filter((item) => selectedIds.includes(item._id))
                .reduce((sum, item) => sum + (item.remainingAmount || 0), 0),
        [outstanding, selectedIds]
    );

    const allSelected = outstanding.length > 0 && selectedIds.length === outstanding.length;

    const toggleSelect = (invoiceId) => {
        setSelectedIds((current) =>
            current.includes(invoiceId)
                ? current.filter((id) => id !== invoiceId)
                : [...current, invoiceId]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : outstanding.map((item) => item._id));
    };

    const handleDirectPay = async (invoiceIds) => {
        if (!invoiceIds.length) {
            setMessage({ type: "error", text: "Vui lòng chọn ít nhất một khoản nợ" });
            return;
        }

        setPaying(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await studentApi.payOutstandingPayments({
                invoiceIds,
                paymentMethod,
            });

            setMessage({
                type: "success",
                text: res.data.message || "Thanh toán thành công",
            });
            setSelectedIds([]);
            await loadData({ keepLoading: false });
        } catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.message || "Thanh toán thất bại",
            });
        } finally {
            setPaying(false);
        }
    };

    const handleCreateQr = async (invoiceIds) => {
        if (!invoiceIds.length) {
            setMessage({ type: "error", text: "Vui lòng chọn ít nhất một khoản nợ" });
            return;
        }

        setPaying(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await studentApi.createPaymentQrSession({ invoiceIds });
            setQrSession(res.data.data);
        } catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.message || "Không tạo được mã QR thanh toán",
            });
        } finally {
            setPaying(false);
        }
    };

    const startPayment = (invoiceIds) => {
        if (paymentMethod === "bank_transfer") {
            return handleCreateQr(invoiceIds);
        }
        return handleDirectPay(invoiceIds);
    };

    const handleConfirmQr = async () => {
        if (!qrSession?._id) return;

        setPaying(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await studentApi.confirmPaymentQrSession(qrSession._id);
            setQrSession((current) =>
                current
                    ? {
                        ...current,
                        status: "completed",
                        confirmedAt: res.data.data?.confirmedAt,
                    }
                    : current
            );
            setSelectedIds([]);
            setMessage({ type: "success", text: res.data.message || "Thanh toan QR thanh cong" });
            await loadData({ keepLoading: false });
        } catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.message || "Không xác nhận được giao dịch QR",
            });
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <span>Đang tải...</span>
            </div>
        );
    }

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">Thanh toán</h2>
                <p className="sd-panel-subtitle">Xem công nợ hiện tại và lịch sử thanh toán</p>
            </div>

            {message.text && <div className={`sd-alert ${message.type}`}>{message.text}</div>}

            <div className="sd-stats" style={{ marginTop: 16 }}>
                <div className="sd-stat-card">
                    <div className="sd-stat-num">{outstanding.length}</div>
                    <div className="sd-stat-label">Khoản nợ chưa thanh toán</div>
                </div>
                <div className="sd-stat-card">
                    <div className="sd-stat-num">{fmtNum(totalDebt)}d</div>
                    <div className="sd-stat-label">Tổng công nợ</div>
                </div>
                <div className="sd-stat-card">
                    <div className="sd-stat-num">{fmtNum(totalPaid)}d</div>
                    <div className="sd-stat-label">Tổng đã thanh toán</div>
                </div>
            </div>

            <div className="sd-card" style={{ marginBottom: 20 }}>
                <div className="sd-payment-toolbar">
                    <div>
                        <div className="sd-form-title">Các khoản nợ hiện tại</div>
                        <div className="sd-list-text">
                            Chọn từng khoản để thanh toán hoặc bấm thanh toán tất cả.
                        </div>
                    </div>

                    <div className="sd-payment-actions">
                        <select
                            className="sd-select sd-payment-method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={paying}
                        >
                            {Object.entries(METHOD_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <button
                            className="sd-btn-secondary"
                            onClick={() => startPayment(selectedIds)}
                            disabled={paying || selectedIds.length === 0}
                        >
                            {paymentMethod === "bank_transfer"
                                ? `Tạo QR đã chọn (${fmtNum(selectedTotal)}d)`
                                : `Thanh toán đã chọn (${fmtNum(selectedTotal)}d)`}
                        </button>
                        <button
                            className="sd-btn-primary"
                            onClick={() => startPayment(outstanding.map((item) => item._id))}
                            disabled={paying || outstanding.length === 0}
                        >
                            {paymentMethod === "bank_transfer" ? "Tạo QR thanh toán tất cả" : "Thanh toán tất cả"}
                        </button>
                    </div>
                </div>

                {outstanding.length === 0 ? (
                    <div className="sd-empty" style={{ paddingBottom: 12 }}>
                        <span className="sd-empty-icon">OK</span>
                        <p className="sd-empty-text">Bạn không còn khoản nợ nào cần thanh toán</p>
                    </div>
                ) : (
                    <div className="sd-table-wrap" style={{ marginTop: 16 }}>
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 44 }}>
                                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                                    </th>
                                    <th>Ma hoa don</th>
                                    <th>Loai</th>
                                    <th>Mo ta</th>
                                    <th>Han thanh toan</th>
                                    <th>Con no</th>
                                    <th>Trang thai</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {outstanding.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item._id)}
                                                onChange={() => toggleSelect(item._id)}
                                            />
                                        </td>
                                        <td>{item.invoiceCode}</td>
                                        <td>{TYPE_LABEL[item.type] || item.type}</td>
                                        <td>{item.description || "-"}</td>
                                        <td>{fmtDate(item.dueDate)}</td>
                                        <td>
                                            <strong style={{ color: "#e8540a" }}>
                                                {fmtNum(item.remainingAmount)}d
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={`sd-badge ${item.status === "overdue" ? "rejected" : "pending"}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="sd-btn-secondary sd-btn-inline"
                                                onClick={() => startPayment([item._id])}
                                                disabled={paying}
                                            >
                                                {paymentMethod === "bank_transfer" ? "Tạo QR" : "Thanh toán"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="sd-panel-header">
                <h3 className="sd-form-title">Lịch sử thanh toán</h3>
            </div>

            {payments.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">--</span>
                    <p className="sd-empty-text">Chưa có lịch sử thanh toán</p>
                </div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Số tiền</th>
                                <th>Hình thức</th>
                                <th>Mã giao dịch</th>
                                <th>Hóa đơn</th>
                                <th>Trạng thái</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((item) => (
                                <tr key={item._id}>
                                    <td>{fmtDate(item.paidAt)}</td>
                                    <td>
                                        <strong style={{ color: "#e8540a" }}>{fmtNum(item.amount)}d</strong>
                                    </td>
                                    <td>{METHOD_LABEL[item.paymentMethod] || item.paymentMethod}</td>
                                    <td>
                                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#555" }}>
                                            {item.transactionCode || "-"}
                                        </span>
                                    </td>
                                    <td>
                                        {item.invoiceId ? (
                                            <span className="sd-badge info">
                                                {TYPE_LABEL[item.invoiceId.type] || item.invoiceId.type}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            className={`sd-badge ${STATUS_BADGE_CLASS[item.invoiceId?.status] || "approved"}`}
                                        >
                                            {STATUS_LABEL[item.invoiceId?.status] || "Da thanh toan"}
                                        </span>
                                    </td>
                                    <td style={{ color: "#777", fontSize: 13 }}>{item.note || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {qrSession && (
                <div className="sd-qr-overlay" onClick={() => setQrSession(null)}>
                    <div className="sd-qr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sd-qr-header">
                            <div>
                                <h3 className="sd-form-title">Thanh toán bằng mã QR</h3>
                                <p className="sd-panel-subtitle">
                                    Hệ thống sẽ tự động cập nhật khi nhận webhook thanh toán từ Casso.
                                </p>
                            </div>
                            <button className="sd-qr-close" onClick={() => setQrSession(null)}>
                                x
                            </button>
                        </div>

                        <div className="sd-qr-body">
                            <img
                                className="sd-qr-image"
                                src={qrSession.qrUrl}
                                alt="QR thanh toan"
                            />

                            <div className="sd-qr-details">
                                <div className="sd-qr-row">
                                    <span>Số tiền</span>
                                    <strong>{fmtNum(qrSession.totalAmount)}d</strong>
                                </div>
                                <div className="sd-qr-row">
                                    <span>Nội dung CK</span>
                                    <strong>{qrSession.transferContent}</strong>
                                </div>
                                <div className="sd-qr-row">
                                    <span>Tài khoản</span>
                                    <strong>{qrSession.accountNo || "-"}</strong>
                                </div>
                                <div className="sd-qr-row">
                                    <span>Chủ tài khoản</span>
                                    <strong>{qrSession.accountName || "-"}</strong>
                                </div>
                                <div className="sd-qr-row">
                                    <span>Hết hạn</span>
                                    <strong>{fmtDateTime(qrSession.expiresAt)}</strong>
                                </div>
                                <div className="sd-qr-row">
                                    <span>Trạng thái</span>
                                    <span className={`sd-badge ${qrSession.status === "completed" ? "approved" : qrSession.status === "expired" ? "rejected" : "pending"}`}>
                                        {qrSession.status === "completed"
                                            ? "Đã thanh toán"
                                            : qrSession.status === "expired"
                                                ? "Đã hết hạn"
                                                : "Đang chờ xác nhận"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="sd-alert" style={{ marginTop: 16 }}>
                            Quét QR để chuyển khoản đúng số tiền và đúng nội dung CK. Sau khi Casso nhận giao dịch, hóa đơn sẽ tự chuyển sang đã thanh toán.
                        </div>

                        <div className="sd-form-actions" style={{ marginTop: 16 }}>
                            <button className="sd-btn-secondary" onClick={() => setQrSession(null)}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
