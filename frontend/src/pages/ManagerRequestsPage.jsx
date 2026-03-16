import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./ManagerRequestsPage.css";

const TYPE_LABEL = {
    damage_report: "Bao hong hoc",
    room_transfer: "Chuyen phong",
    room_retention: "Giu phong",
    room_reservation_cancel: "Huy phong da giu cho",
    other: "Khac",
};

const STATUS_MAP = {
    pending: { label: "Cho xu ly", cls: "pending" },
    manager_approved: { label: "Da duyet", cls: "manager_approved" },
    manager_rejected: { label: "Da tu choi", cls: "manager_rejected" },
    completed: { label: "Hoan thanh", cls: "completed" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

export default function ManagerRequestsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [filterType, setFilterType] = useState("");
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null);
    const [note, setNote] = useState("");
    const [nextTerm, setNextTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        const params = {};
        if (filterStatus) params.status = filterStatus;
        if (filterType) params.type = filterType;
        api.get("/manager/requests", { params })
            .then((r) => setData(r.data.data))
            .catch(() => showAlert("error", "Khong the tai danh sach yeu cau"))
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
                if (!nextTerm) {
                    setSubmitting(false);
                    return showAlert("error", "Nhap ky hoc tiep theo");
                }
                await api.put(`/manager/requests/${modal.item._id}/approve-retention`, { nextTermCode: nextTerm });
                showAlert("success", `Da duyet giu phong ky ${nextTerm}`);
            } else {
                const action = modal.mode === "approve" ? "approve" : "reject";
                await api.put(`/manager/requests/${modal.item._id}`, { action, note });
                showAlert("success", `Da ${action === "approve" ? "duyet" : "tu choi"} yeu cau`);
            }
            setModal(null);
            load();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Thao tac that bai");
        }
        setSubmitting(false);
    };

    const pending = data.filter((r) => r.status === "pending").length;
    const approved = data.filter((r) => r.status === "manager_approved" || r.status === "completed").length;

    return (
        <div className="mr-page">
            <div className="mr-header">
                <div>
                    <h1 className="mr-title">Yeu cau sinh vien</h1>
                    <p className="mr-subtitle">Duyet va quan ly yeu cau tu sinh vien KTX</p>
                </div>
            </div>

            {alert && <div className={`mr-alert ${alert.type}`}>{alert.msg}</div>}

            <div className="mr-stats">
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#d97706" }}>{pending}</div>
                    <div className="mr-stat-label">Cho xu ly</div>
                </div>
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#16a34a" }}>{approved}</div>
                    <div className="mr-stat-label">Da duyet</div>
                </div>
                <div className="mr-stat">
                    <div className="mr-stat-num" style={{ color: "#e8540a" }}>{data.length}</div>
                    <div className="mr-stat-label">Tong cong</div>
                </div>
            </div>

            <div className="mr-filters">
                <select className="mr-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Tat ca trang thai</option>
                    <option value="pending">Cho xu ly</option>
                    <option value="manager_approved">Da duyet</option>
                    <option value="manager_rejected">Da tu choi</option>
                    <option value="completed">Hoan thanh</option>
                </select>
                <select className="mr-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">Tat ca loai</option>
                    <option value="damage_report">Bao hong hoc</option>
                    <option value="room_transfer">Chuyen phong</option>
                    <option value="room_retention">Giu phong</option>
                    <option value="room_reservation_cancel">Huy phong da giu cho</option>
                    <option value="other">Khac</option>
                </select>
            </div>

            {loading ? (
                <div className="mr-loading"><div className="mr-spinner" /><p>Dang tai...</p></div>
            ) : data.length === 0 ? (
                <div className="mr-empty">Khong co yeu cau nao</div>
            ) : (
                <div className="mr-table-wrap">
                    <table className="mr-table">
                        <thead>
                            <tr>
                                <th>Sinh vien</th>
                                <th>Loai yeu cau</th>
                                <th>Tieu de</th>
                                <th>Phong hien tai</th>
                                <th>Ngay gui</th>
                                <th>Trang thai</th>
                                <th>Thao tac</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                                const sv = item.studentId;
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                                                {sv?.fullName || sv?.userId?.username || "-"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#888" }}>
                                                {sv?.studentCode || sv?.userId?.email || ""}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 13 }}>{TYPE_LABEL[item.type] || item.type}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 220 }}>{item.title}</div>
                                            <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{item.description?.slice(0, 70)}{item.description?.length > 70 ? "..." : ""}</div>
                                        </td>
                                        <td style={{ fontSize: 13, color: "#555" }}>
                                            {item.currentRoomId ? `Phong ${item.currentRoomId.roomNumber}` : "-"}
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
                                                            Duyet giu phong
                                                        </button>
                                                    ) : (
                                                        <button className="mr-btn-approve" onClick={() => openModal("approve", item)}>
                                                            Duyet
                                                        </button>
                                                    )}
                                                    <button className="mr-btn-reject" onClick={() => openModal("reject", item)}>
                                                        Tu choi
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: "#bbb" }}>Da xu ly</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div className="mr-overlay" onClick={() => setModal(null)}>
                    <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
                        {modal.mode === "retention" ? (
                            <>
                                <div className="mr-modal-title">Duyet giu phong</div>
                                <div className="mr-modal-sub">
                                    Sinh vien: <strong>{modal.item.studentId?.fullName || "-"}</strong><br />
                                    He thong se tu dong tao dang ky phong cho ky tiep theo.
                                </div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
                                    Ky hoc tiep theo <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <input
                                    className="mr-input"
                                    placeholder="VD: HK1-2026"
                                    value={nextTerm}
                                    onChange={(e) => setNextTerm(e.target.value)}
                                />
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Ghi chu</label>
                                <textarea className="mr-textarea" placeholder="Ghi chu them..." value={note} onChange={(e) => setNote(e.target.value)} />
                            </>
                        ) : (
                            <>
                                <div className="mr-modal-title">
                                    {modal.mode === "approve" ? "Duyet yeu cau" : "Tu choi yeu cau"}
                                </div>
                                <div className="mr-modal-sub">
                                    <strong>{modal.item.title}</strong><br />
                                    Sinh vien: {modal.item.studentId?.fullName || "-"}
                                </div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Ghi chu</label>
                                <textarea
                                    className="mr-textarea"
                                    placeholder="Ly do hoac ghi chu..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </>
                        )}
                        <div className="mr-modal-actions">
                            <button className="mr-btn-cancel" onClick={() => setModal(null)}>Huy</button>
                            <button className="mr-btn-confirm" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Dang xu ly..." : "Xac nhan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
