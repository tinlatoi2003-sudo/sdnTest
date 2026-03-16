import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

import "./AdminReports.css";

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

export default function AdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");    // "pending" | "reviewed"
    const [filterType, setType] = useState("");
    const [selected, setSelected] = useState(null);          // report đang duyệt / xem
    const [modal, setModal] = useState(null);          // "review" | "detail"
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status: tab };
            if (filterType) params.type = filterType;
            const { data } = await api.get("/reports", { params });
            setReports(data.reports);
        } catch {
            showAlert("error", "Không thể tải danh sách báo cáo");
        } finally {
            setLoading(false);
        }
    }, [tab, filterType]);

    useEffect(() => { load(); }, [load]);

    const openReview = (r) => { setSelected(r); setModal("review"); };
    const openDetail = (r) => { setSelected(r); setModal("detail"); };
    const closeModal = () => { setSelected(null); setModal(null); };

    const handleReviewSuccess = () => {
        closeModal();
        load();
        showAlert("success", "Đã duyệt báo cáo thành công!");
    };

    const pending = reports.filter(r => r.status === "pending").length;
    const reviewed = reports.filter(r => r.status === "reviewed").length;

    return (
        <div className="ar-page">
            {/* Header */}
            <div className="ar-header">
                <div>
                    <h1 className="ar-title">📑 Duyệt báo cáo</h1>
                    <p className="ar-subtitle">Xem xét và phản hồi báo cáo từ quản lý</p>
                </div>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`ar-alert ${alert.type}`}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            {/* Tab + filter row */}
            <div className="ar-toolbar">
                <div className="ar-tabs">
                    <button
                        className={`ar-tab ${tab === "pending" ? "active" : ""}`}
                        onClick={() => setTab("pending")}
                    >
                        ⏳ Chờ duyệt
                        {pending > 0 && <span className="ar-badge">{pending}</span>}
                    </button>
                    <button
                        className={`ar-tab ${tab === "reviewed" ? "active" : ""}`}
                        onClick={() => setTab("reviewed")}
                    >
                        ✅ Đã duyệt
                    </button>
                </div>
                <select className="ar-select" value={filterType} onChange={e => setType(e.target.value)}>
                    <option value="">Tất cả loại</option>
                    <option value="general">Tổng quát</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="incident">Sự cố</option>
                    <option value="monthly">Hàng tháng</option>
                </select>
            </div>

            {/* Report list */}
            <div className="ar-list">
                {loading ? (
                    <div className="ar-empty">Đang tải...</div>
                ) : reports.length === 0 ? (
                    <div className="ar-empty">
                        {tab === "pending" ? "🎉 Không có báo cáo nào chờ duyệt!" : "Chưa có báo cáo nào được duyệt"}
                    </div>
                ) : (
                    reports.map(r => (
                        <ReportRow
                            key={r._id}
                            report={r}
                            onReview={() => openReview(r)}
                            onView={() => openDetail(r)}
                        />
                    ))
                )}
            </div>

            {/* Modal duyệt */}
            {modal === "review" && selected && (
                <ReviewModal
                    report={selected}
                    onClose={closeModal}
                    onSuccess={handleReviewSuccess}
                    onError={msg => showAlert("error", msg)}
                />
            )}

            {/* Modal xem chi tiết */}
            {modal === "detail" && selected && (
                <DetailModal report={selected} onClose={closeModal} />
            )}
        </div>
    );
}

/* ── Row báo cáo ── */
function ReportRow({ report, onReview, onView }) {
    const col = TYPE_COLORS[report.type] || "#6366f1";
    return (
        <div className="ar-row">
            <div className="ar-row-accent" style={{ background: col }} />
            <div className="ar-row-body">
                <div className="ar-row-top">
                    <span className="ar-type" style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>
                        {TYPE_LABELS[report.type]}
                    </span>
                    <span className="ar-sender">
                        👤 {report.managerId?.username} &nbsp;·&nbsp; 🏢 {report.buildingId?.name}
                    </span>
                    <span className="ar-date">{new Date(report.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <h3 className="ar-row-title">{report.title}</h3>
                <p className="ar-row-preview">{report.content.slice(0, 120)}{report.content.length > 120 ? "..." : ""}</p>

                {/* Admin note nếu đã duyệt */}
                {report.adminReview?.note && (
                    <div className="ar-note">
                        💬 Phản hồi: {report.adminReview.note}
                    </div>
                )}
            </div>
            <div className="ar-row-actions">
                <button className="btn-view" onClick={onView}>👁️ Xem</button>
                {report.status === "pending" && (
                    <button className="btn-approve" onClick={onReview}>✅ Duyệt</button>
                )}
            </div>
        </div>
    );
}

/* ── Modal Duyệt ── */
function ReviewModal({ report, onClose, onSuccess, onError }) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/reports/${report._id}/review`, { note });
            onSuccess();
        } catch (err) {
            onError(err.response?.data?.message || "Duyệt thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✅ Duyệt báo cáo</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Preview báo cáo */}
                <div className="review-preview">
                    <div className="rp-row">
                        <span className="rp-label">Tiêu đề</span>
                        <span className="rp-val">{report.title}</span>
                    </div>
                    <div className="rp-row">
                        <span className="rp-label">Người gửi</span>
                        <span className="rp-val">{report.managerId?.username} &nbsp;·&nbsp; {report.buildingId?.name}</span>
                    </div>
                    <div className="rp-row">
                        <span className="rp-label">Nội dung</span>
                        <span className="rp-val content-preview">{report.content}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="review-form">
                    <div className="form-row">
                        <label>Ghi chú phản hồi (tuỳ chọn)</label>
                        <textarea
                            rows={4}
                            placeholder="Nhập phản hồi gửi lại cho quản lý..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-approve-modal" disabled={loading}>
                            {loading ? "Đang duyệt..." : "✅ Xác nhận duyệt"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal Chi Tiết ── */
function DetailModal({ report, onClose }) {
    const col = TYPE_COLORS[report.type] || "#6366f1";
    const isPending = report.status === "pending";
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📄 Chi tiết báo cáo</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="d-label">Loại</span>
                        <span className="d-val">
                            <span style={{ background: col + "20", color: col, padding: "3px 10px", borderRadius: 20, fontSize: 13 }}>{TYPE_LABELS[report.type]}</span>
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="d-label">Trạng thái</span>
                        <span className={`d-badge ${isPending ? "pending" : "reviewed"}`}>
                            {isPending ? "⏳ Chờ duyệt" : "✅ Đã duyệt"}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="d-label">Người gửi</span>
                        <span className="d-val">{report.managerId?.username}</span>
                    </div>
                    <div className="detail-item">
                        <span className="d-label">Tòa nhà</span>
                        <span className="d-val">{report.buildingId?.name} — {report.buildingId?.address}</span>
                    </div>
                    <div className="detail-item">
                        <span className="d-label">Ngày gửi</span>
                        <span className="d-val">{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                </div>

                <div className="detail-content-box">
                    <span className="d-label">Nội dung báo cáo</span>
                    <p>{report.content}</p>
                </div>

                {report.adminReview?.note && (
                    <div className="detail-admin-note">
                        <span className="d-label">💬 Phản hồi từ Admin</span>
                        <p>{report.adminReview.note}</p>
                        <span className="note-meta">
                            — {report.adminReview.reviewedBy?.username} | {new Date(report.adminReview.reviewedAt).toLocaleString("vi-VN")}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
