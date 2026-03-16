import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

import "./ManagerReports.css";

const TYPE_LABELS = {
    general: "📋 Tổng quát",
    maintenance: "🔧 Bảo trì",
    incident: "⚠️ Sự cố",
    monthly: "📅 Hàng tháng",
};
const TYPE_COLORS = {
    general: "#6366f1",
    maintenance: "#f59e0b",
    incident: "#ef4444",
    monthly: "#22c55e",
};
const STATUS_CONFIG = {
    pending: { label: "Chờ duyệt", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
    reviewed: { label: "Đã duyệt", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

export default function ManagerReportsPage() {
    const [reports, setReports] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // "create" | "detail"
    const [selected, setSelected] = useState(null);
    const [filterStatus, setFilter] = useState("");
    const [filterType, setFilterType] = useState("");
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;
            const [repRes, bldRes] = await Promise.all([
                api.get("/reports", { params }),
                api.get("/reports/my-buildings"),
            ]);
            setReports(repRes.data.reports);
            setBuildings(bldRes.data.buildings);
        } catch {
            showAlert("error", "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id) => {
        if (!window.confirm("Xoá báo cáo này?")) return;
        try {
            await api.delete(`/reports/${id}`);
            showAlert("success", "Đã xoá báo cáo");
            loadData();
        } catch (e) {
            showAlert("error", e.response?.data?.message || "Xoá thất bại");
        }
    };

    return (
        <div className="mr-page">
            {/* Header */}
            <div className="mr-header">
                <div>
                    <h1 className="mr-title">📄 Báo cáo</h1>
                    <p className="mr-subtitle">Gửi và theo dõi báo cáo đến Ban quản lý</p>
                </div>
                <button className="btn-new" onClick={() => setModal("create")}>
                    + Gửi báo cáo mới
                </button>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`mr-alert ${alert.type}`}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            {/* Stats bar */}
            <div className="mr-stats">
                <div className="stat-card" onClick={() => setFilter("")}>
                    <span className="stat-num">{reports.length}</span>
                    <span className="stat-label">Tổng báo cáo</span>
                </div>
                <div className="stat-card pending" onClick={() => setFilter("pending")}>
                    <span className="stat-num">{reports.filter(r => r.status === "pending").length}</span>
                    <span className="stat-label">Chờ duyệt</span>
                </div>
                <div className="stat-card reviewed" onClick={() => setFilter("reviewed")}>
                    <span className="stat-num">{reports.filter(r => r.status === "reviewed").length}</span>
                    <span className="stat-label">Đã duyệt</span>
                </div>
            </div>

            {/* Filters */}
            <div className="mr-filters">
                <select className="mr-select" value={filterStatus} onChange={e => setFilter(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="reviewed">Đã duyệt</option>
                </select>
                <select className="mr-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Tất cả loại</option>
                    <option value="general">Tổng quát</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="incident">Sự cố</option>
                    <option value="monthly">Hàng tháng</option>
                </select>
            </div>

            {/* Report list */}
            <div className="mr-list">
                {loading ? (
                    <div className="mr-empty">Đang tải...</div>
                ) : reports.length === 0 ? (
                    <div className="mr-empty">Chưa có báo cáo nào</div>
                ) : (
                    reports.map(r => (
                        <ReportCard
                            key={r._id}
                            report={r}
                            onView={() => { setSelected(r); setModal("detail"); }}
                            onDelete={() => handleDelete(r._id)}
                        />
                    ))
                )}
            </div>

            {/* Modal tạo báo cáo */}
            {modal === "create" && (
                <CreateReportModal
                    buildings={buildings}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); loadData(); showAlert("success", "Gửi báo cáo thành công!"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}

            {/* Modal chi tiết */}
            {modal === "detail" && selected && (
                <DetailModal
                    report={selected}
                    onClose={() => { setModal(null); setSelected(null); }}
                />
            )}
        </div>
    );
}

/* ── Report Card ── */
function ReportCard({ report, onView, onDelete }) {
    const st = STATUS_CONFIG[report.status];
    const col = TYPE_COLORS[report.type] || "#6366f1";
    return (
        <div className="r-card" onClick={onView}>
            <div className="r-card-left" style={{ borderColor: col }} />
            <div className="r-card-body">
                <div className="r-card-top">
                    <span className="r-type-badge" style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>
                        {TYPE_LABELS[report.type]}
                    </span>
                    <span className="r-status" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                    </span>
                </div>
                <h3 className="r-title">{report.title}</h3>
                <p className="r-content">{report.content.slice(0, 140)}{report.content.length > 140 ? "..." : ""}</p>
                <div className="r-footer">
                    <span className="r-building">🏢 {report.buildingId?.name || "—"}</span>
                    <span className="r-date">{new Date(report.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                {report.adminReview?.note && (
                    <div className="r-review-note">
                        💬 Admin: {report.adminReview.note}
                    </div>
                )}
            </div>
            {report.status === "pending" && (
                <button className="r-del-btn" onClick={e => { e.stopPropagation(); onDelete(); }}>🗑️</button>
            )}
        </div>
    );
}

/* ── Modal Tạo Báo Cáo ── */
function CreateReportModal({ buildings, onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ title: "", content: "", type: "general", buildingId: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.buildingId) { setErr("Vui lòng chọn tòa nhà"); return; }
        setLoading(true); setErr("");
        try {
            await api.post("/reports", form);
            onSuccess();
        } catch (error) {
            const msg = error.response?.data?.message || "Gửi thất bại";
            setErr(msg); onError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📝 Gửi báo cáo mới</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    {/* Tòa nhà */}
                    <div className="form-row">
                        <label>Tòa nhà <span className="req">*</span></label>
                        {buildings.length === 0 ? (
                            <p className="warn-text">⚠️ Bạn chưa được phân công quản lý tòa nhà nào</p>
                        ) : (
                            <select value={form.buildingId} onChange={e => setForm(p => ({ ...p, buildingId: e.target.value }))} required>
                                <option value="">-- Chọn tòa nhà --</option>
                                {buildings.map(b => <option key={b._id} value={b._id}>{b.name} — {b.address}</option>)}
                            </select>
                        )}
                    </div>
                    {/* Loại báo cáo */}
                    <div className="form-row">
                        <label>Loại báo cáo</label>
                        <div className="type-btns">
                            {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                <button
                                    key={k} type="button"
                                    className={`type-btn ${form.type === k ? "active" : ""}`}
                                    style={form.type === k ? { background: TYPE_COLORS[k] + "22", border: `1px solid ${TYPE_COLORS[k]}` } : {}}
                                    onClick={() => setForm(p => ({ ...p, type: k }))}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Tiêu đề */}
                    <div className="form-row">
                        <label>Tiêu đề <span className="req">*</span></label>
                        <input
                            placeholder="Nhập tiêu đề báo cáo"
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            required
                        />
                    </div>
                    {/* Nội dung */}
                    <div className="form-row">
                        <label>Nội dung <span className="req">*</span></label>
                        <textarea
                            rows={6}
                            placeholder="Mô tả chi tiết tình trạng, vấn đề cần báo cáo..."
                            value={form.content}
                            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                            required
                        />
                    </div>
                    {err && <div className="modal-err">⚠️ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={loading || buildings.length === 0}>
                            {loading ? "Đang gửi..." : "📤 Gửi báo cáo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Chi Tiết ── */
function DetailModal({ report, onClose }) {
    const st = STATUS_CONFIG[report.status];
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📄 Chi tiết báo cáo</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="detail-body">
                    <div className="detail-row">
                        <span className="detail-label">Tiêu đề</span>
                        <span className="detail-val bold">{report.title}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Loại</span>
                        <span className="detail-val">{TYPE_LABELS[report.type]}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Tòa nhà</span>
                        <span className="detail-val">{report.buildingId?.name} — {report.buildingId?.address}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Ngày gửi</span>
                        <span className="detail-val">{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Trạng thái</span>
                        <span className="detail-val">
                            <span className="r-status" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 13 }}>
                                {st.label}
                            </span>
                        </span>
                    </div>
                    <div className="detail-content">
                        <span className="detail-label">Nội dung</span>
                        <p>{report.content}</p>
                    </div>
                    {report.adminReview?.note && (
                        <div className="admin-review">
                            <span className="detail-label">💬 Phản hồi từ Admin</span>
                            <p>{report.adminReview.note}</p>
                            <span className="review-date">— {report.adminReview.reviewedBy?.username} | {new Date(report.adminReview.reviewedAt).toLocaleString("vi-VN")}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
