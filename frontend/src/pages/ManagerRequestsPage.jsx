import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./ManagerRequestsPage.css";

const TYPE_LABEL = {
    damage_report: "🔧 Báo hỏng hóc",
    room_transfer: "🔄 Chuyển phòng",
    room_retention: "📌 Giữ phòng",
    other: "📝 Khác",
};

const STATUS_MAP = {
    pending: { label: "Chờ xử lý", cls: "pending" },
    manager_approved: { label: "Đã duyệt", cls: "manager_approved" },
    manager_rejected: { label: "Đã từ chối", cls: "manager_rejected" },
    completed: { label: "Hoàn thành", cls: "completed" },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export default function ManagerRequestsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterType, setFilterType] = useState("");
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null); // { mode:"approve"|"reject"|"retention", item }
    const [note, setNote] = useState("");
    const [nextTerm, setNextTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        const params = {};
        if (filterStatus) params.status = filterStatus;
        if (filterType) params.type = filterType;
        api.get("/manager/requests", { params })
            .then(r => setData(r.data.data))
            .catch(() => showAlert("error", "Không thể tải danh sách yêu cầu"))
            .finally(() => setLoading(false));
    }, [filterStatus, filterType]);

    useEffect(() => { load(); }, [load]);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    const openModal = (mode, item) => {
        setModal({ mode, item });
        setNote("");
        setNextTerm("");
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (modal.mode === "retention") {
                if (!nextTerm) { setSubmitting(false); return showAlert("error", "Nhập kỳ học tiếp theo"); }
                await api.put(`/manager/requests/${modal.item._id}/approve-retention`, { nextTermCode: nextTerm });
                showAlert("success", `✅ Đã duyệt giữ phòng kỳ ${nextTerm}`);
            } else {
                const action = modal.mode === "approve" ? "approve" : "reject";
                await api.put(`/manager/requests/${modal.item._id}`, { action, note });
                showAlert("success", `✅ Đã ${action === "approve" ? "duyệt" : "từ chối"} yêu cầu`);
            }
            setModal(null);
            load();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Thao tác thất bại");
        }
        setSubmitting(false);
    };

    const pending = data.filter(r => r.status === "pending").length;
    const approved = data.filter(r => r.status === "manager_approved" || r.status === "completed").length;

    return (
        <div className="mr-page">
            <div className="mr-header">
                <div>
                    <h1 className="mr-title">📝 Yêu cầu sinh viên</h1>
                    <p className="mr-subtitle">Duyệt và quản lý yêu cầu từ sinh viên KTX</p>
                </div>
            </div>

            {alert && (
                <div className={`mr-alert ${alert.type}`}>
                    {alert.msg}
                </div>
            )}

            {/* Stats */}
            <div className="mr-stats">
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#d97706" }}>{pending}</div>
                    <div className="mr-stat-label">Chờ xử lý</div>
                </div>
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#16a34a" }}>{approved}</div>
                    <div className="mr-stat-label">Đã duyệt</div>
                </div>
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#e8540a" }}>{data.length}</div>
                    <div className="mr-stat-label">Tổng cộng</div>
                </div>
            </div>

            {/* Filters */}
            <div className="mr-filters">
                <select className="mr-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="manager_approved">Đã duyệt</option>
                    <option value="manager_rejected">Đã từ chối</option>
                    <option value="completed">Hoàn thành</option>
                </select>
                <select className="mr-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Tất cả loại</option>
                    <option value="damage_report">Báo hỏng hóc</option>
                    <option value="room_transfer">Chuyển phòng</option>
                    <option value="room_retention">Giữ phòng</option>
                    <option value="other">Khác</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="mr-loading"><div className="mr-spinner" /><p>Đang tải...</p></div>
            ) : data.length === 0 ? (
                <div className="mr-empty">📭 Không có yêu cầu nào</div>
            ) : (
                <div className="mr-table-wrap">
                    <table className="mr-table">
                        <thead>
                            <tr>
                                <th>Sinh viên</th>
                                <th>Loại yêu cầu</th>
                                <th>Tiêu đề</th>
                                <th>Phòng hiện tại</th>
                                <th>Ngày gửi</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => {
                                const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                                const sv = item.studentId;
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                                                {sv?.fullName || sv?.userId?.username || "—"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#888" }}>
                                                {sv?.studentCode || sv?.userId?.email || ""}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 13 }}>{TYPE_LABEL[item.type] || item.type}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 200 }}>{item.title}</div>
                                            <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{item.description?.slice(0, 60)}{item.description?.length > 60 ? "..." : ""}</div>
                                        </td>
                                        <td style={{ fontSize: 13, color: "#555" }}>
                                            {item.currentRoomId
                                                ? `Phòng ${item.currentRoomId.roomNumber}`
                                                : "—"}
                                        </td>
                                        <td style={{ fontSize: 13, color: "#666" }}>{fmtDate(item.createdAt)}</td>
                                        <td>
                                            <span className={`mr-badge ${s.cls}`}>{s.label}</span>
                                            {item.managerReview?.note && (
                                                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{item.managerReview.note}</div>
                                            )}
                                        </td>
                                        <td>
                                            {item.status === "pending" ? (
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    {item.type === "room_retention" ? (
                                                        <button className="mr-btn-approve" onClick={() => openModal("retention", item)}>
                                                            📌 Duyệt giữ phòng
                                                        </button>
                                                    ) : (
                                                        <button className="mr-btn-approve" onClick={() => openModal("approve", item)}>
                                                            ✅ Duyệt
                                                        </button>
                                                    )}
                                                    <button className="mr-btn-reject" onClick={() => openModal("reject", item)}>
                                                        ✕ Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: "#bbb" }}>Đã xử lý</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="mr-overlay" onClick={() => setModal(null)}>
                    <div className="mr-modal" onClick={e => e.stopPropagation()}>
                        {modal.mode === "retention" ? (
                            <>
                                <div className="mr-modal-title">📌 Duyệt giữ phòng</div>
                                <div className="mr-modal-sub">
                                    Sinh viên: <strong>{modal.item.studentId?.fullName || "—"}</strong><br />
                                    Hệ thống sẽ tự động tạo đăng ký phòng cho kỳ tiếp theo.
                                </div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
                                    Kỳ học tiếp theo <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    className="mr-input"
                                    placeholder="VD: HK1-2025"
                                    value={nextTerm}
                                    onChange={e => setNextTerm(e.target.value)}
                                />
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Ghi chú</label>
                                <textarea className="mr-textarea" placeholder="Ghi chú thêm..." value={note} onChange={e => setNote(e.target.value)} />
                            </>
                        ) : (
                            <>
                                <div className="mr-modal-title">
                                    {modal.mode === "approve" ? "✅ Duyệt yêu cầu" : "✕ Từ chối yêu cầu"}
                                </div>
                                <div className="mr-modal-sub">
                                    <strong>{modal.item.title}</strong><br />
                                    Sinh viên: {modal.item.studentId?.fullName || "—"}
                                </div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Ghi chú (tuỳ chọn)</label>
                                <textarea
                                    className="mr-textarea"
                                    placeholder="Lý do hoặc ghi chú..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </>
                        )}
                        <div className="mr-modal-actions">
                            <button className="mr-btn-cancel" onClick={() => setModal(null)}>Hủy</button>
                            <button className="mr-btn-confirm" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
