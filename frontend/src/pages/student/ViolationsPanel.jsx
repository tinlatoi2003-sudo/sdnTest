import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const TYPE_LABEL = {
    curfew: "🌙 Về muộn",
    noise: "📢 Gây ồn",
    damage: "🔨 Phá hoại tài sản",
    unauthorized_guest: "👥 Khách trái phép",
    other: "⚠️ Vi phạm khác",
};

const STATUS_MAP = {
    reported: { label: "Đã ghi nhận", cls: "reported" },
    invoiced: { label: "Đã lập hóa đơn", cls: "invoiced" },
    resolved: { label: "Đã giải quyết", cls: "resolved" },
};

export default function ViolationsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        studentApi.getViolations()
            .then(r => setData(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const totalFine = data.reduce((s, v) => s + (v.fineAmount || 0), 0);

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">⚠️ Lịch sử phạt</h2>
                <p className="sd-panel-subtitle">Các vi phạm nội quy KTX đã được ghi nhận</p>
            </div>

            {data.length > 0 && (
                <div className="sd-stats" style={{ marginBottom: 20 }}>
                    <div className="sd-stat-card">
                        <div className="sd-stat-num" style={{ color: "#dc2626" }}>{data.length}</div>
                        <div className="sd-stat-label">Tổng vi phạm</div>
                    </div>
                    <div className="sd-stat-card">
                        <div className="sd-stat-num" style={{ color: "#dc2626" }}>{fmtNum(totalFine)}đ</div>
                        <div className="sd-stat-label">Tổng tiền phạt</div>
                    </div>
                    <div className="sd-stat-card">
                        <div className="sd-stat-num" style={{ color: "#16a34a" }}>
                            {data.filter(v => v.status === "resolved").length}
                        </div>
                        <div className="sd-stat-label">Đã giải quyết</div>
                    </div>
                </div>
            )}

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">✅</span>
                    <p className="sd-empty-text">Không có lịch sử vi phạm nào. Tốt lắm!</p>
                </div>
            ) : (
                <div className="sd-list">
                    {data.map(item => {
                        const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                        return (
                            <div key={item._id} className="sd-list-item">
                                <div className="sd-list-icon" style={{ background: "rgba(239,68,68,0.1)" }}>
                                    {TYPE_LABEL[item.type]?.split(" ")[0] || "⚠️"}
                                </div>
                                <div className="sd-list-body">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="sd-list-title">
                                            {TYPE_LABEL[item.type] || item.type}
                                        </span>
                                        <span className={`sd-badge ${s.cls}`}>{s.label}</span>
                                        {item.fineAmount > 0 && (
                                            <span className="sd-badge" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                                                Phạt: {fmtNum(item.fineAmount)}đ
                                            </span>
                                        )}
                                    </div>
                                    <p className="sd-list-text">{item.description}</p>
                                    <div className="sd-list-meta">
                                        🏠 Phòng {item.roomId?.roomNumber || "—"} – {item.roomId?.building || ""} &nbsp;·&nbsp;
                                        📅 {fmtDate(item.createdAt)} &nbsp;·&nbsp;
                                        👤 Ghi nhận bởi: {item.reportedBy?.username || "—"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
