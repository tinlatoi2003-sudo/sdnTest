import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const METHOD_LABEL = {
    cash: "💵 Tiền mặt",
    bank_transfer: "🏦 Chuyển khoản",
    e_wallet: "📱 Ví điện tử",
};

export default function PaymentHistoryPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        studentApi.getPayments()
            .then(r => setData(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const total = data.reduce((s, p) => s + (p.amount || 0), 0);

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">💳 Lịch sử thanh toán</h2>
                <p className="sd-panel-subtitle">Tất cả các khoản đã thanh toán</p>
            </div>

            {data.length > 0 && (
                <div className="sd-stats" style={{ marginBottom: 20 }}>
                    <div className="sd-stat-card">
                        <div className="sd-stat-num">{data.length}</div>
                        <div className="sd-stat-label">Lần thanh toán</div>
                    </div>
                    <div className="sd-stat-card">
                        <div className="sd-stat-num">{fmtNum(total)}đ</div>
                        <div className="sd-stat-label">Tổng đã thanh toán</div>
                    </div>
                </div>
            )}

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">💳</span>
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
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item._id}>
                                    <td>{fmtDate(item.paidAt)}</td>
                                    <td>
                                        <strong style={{ color: "#e8540a" }}>
                                            {fmtNum(item.amount)}đ
                                        </strong>
                                    </td>
                                    <td>{METHOD_LABEL[item.paymentMethod] || item.paymentMethod}</td>
                                    <td>
                                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#555" }}>
                                            {item.transactionCode || "—"}
                                        </span>
                                    </td>
                                    <td>
                                        {item.invoiceId ? (
                                            <span className="sd-badge info">
                                                {item.invoiceId.type} – {fmtNum(item.invoiceId.totalAmount)}đ
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td style={{ color: "#777", fontSize: 13 }}>{item.note || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
