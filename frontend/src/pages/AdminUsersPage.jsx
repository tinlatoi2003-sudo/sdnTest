import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

import "./AdminUsers.css";

const ROLE_LABELS = { admin: "Admin", manager: "Quản lý", student: "Sinh viên" };
const ROLE_COLORS = { admin: "#f59e0b", manager: "#6366f1", student: "#22c55e" };
const DEFAULT_PERMISSIONS = {
    admin: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
    manager: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
    student: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
};
const PERM_LABELS = {
    manage_users: "Quản lý người dùng", manage_students: "Quản lý sinh viên",
    manage_buildings: "Quản lý tòa nhà", manage_rooms: "Quản lý phòng",
    manage_settings: "Cài đặt hệ thống", view_revenue: "Xem doanh thu",
    approve_reports: "Duyệt báo cáo", assign_permissions: "Cấp quyền",
    send_notifications: "Gửi thông báo", view_room_list: "Xem danh sách phòng",
    view_unpaid_students: "Xem SV chưa đóng tiền",
    manage_requests: "Quản lý yêu cầu", send_reports: "Gửi báo cáo",
    submit_requests: "Gửi yêu cầu", register_room: "Đăng ký phòng",
    make_payment: "Thanh toán", view_own_history: "Xem lịch sử cá nhân",
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [modal, setModal] = useState(null); // "create" | "edit" | "perm"
    const [selected, setSelected] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    // ── Tải danh sách users ──
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (search) params.search = search;
            const { data } = await api.get("/users", { params });
            setUsers(data.users);
        } catch {
            showAlert("error", "Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    }, [roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    // ── Xóa user ──
    const handleDelete = async (user) => {
        if (!window.confirm(`Xóa tài khoản "${user.username}"? Không thể hoàn tác.`)) return;
        try {
            await api.delete(`/users/${user._id}`);
            showAlert("success", "Đã xóa tài khoản thành công");
            loadUsers();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Xóa thất bại");
        }
    };

    // ── Toggle isActive ──
    const handleToggleActive = async (user) => {
        try {
            await api.put(`/users/${user._id}`, { isActive: !user.isActive });
            showAlert("success", user.isActive ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản");
            loadUsers();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Cập nhật thất bại");
        }
    };

    return (
        <div className="au-page">
            {/* Header */}
            <div className="au-header">
                <div>
                    <h1 className="au-title">👥 Quản lý tài khoản</h1>
                    <p className="au-subtitle">Tạo, chỉnh sửa và cấp quyền cho người dùng</p>
                </div>
                <button className="btn-create" onClick={() => setModal("create")}>
                    + Tạo tài khoản
                </button>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`au-alert ${alert.type}`}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            {/* Filters */}
            <div className="au-filters">
                <input
                    className="au-search"
                    placeholder="🔍  Tìm theo username hoặc email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="au-role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">Tất cả role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Quản lý</option>
                    <option value="student">Sinh viên</option>
                </select>
            </div>

            {/* Table */}
            <div className="au-table-wrap">
                {loading ? (
                    <div className="au-loading">Đang tải...</div>
                ) : users.length === 0 ? (
                    <div className="au-empty">Không tìm thấy tài khoản nào</div>
                ) : (
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Role</th>
                                <th>Trạng thái</th>
                                <th>Phân quyền</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar" style={{ background: ROLE_COLORS[u.role] }}>
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="user-name">{u.username}</div>
                                                <div className="user-email">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge" style={{ background: ROLE_COLORS[u.role] + "22", color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44` }}>
                                            {ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`status-toggle ${u.isActive ? "active" : "inactive"}`}
                                            onClick={() => handleToggleActive(u)}
                                        >
                                            {u.isActive ? "✅ Hoạt động" : "⛔ Bị khóa"}
                                        </button>
                                    </td>
                                    <td>
                                        <span className="perm-count">{u.permissions?.length || 0} quyền</span>
                                        <button className="btn-perm" onClick={() => { setSelected(u); setModal("perm"); }}>
                                            Chỉnh sửa
                                        </button>
                                    </td>
                                    <td>
                                        <button className="btn-del" onClick={() => handleDelete(u)}>🗑️ Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal — Tạo tài khoản */}
            {modal === "create" && (
                <CreateUserModal
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); loadUsers(); showAlert("success", "Tạo tài khoản thành công"); }}
                    onError={(msg) => showAlert("error", msg)}
                />
            )}

            {/* Modal — Phân quyền */}
            {modal === "perm" && selected && (
                <PermissionModal
                    user={selected}
                    onClose={() => { setModal(null); setSelected(null); }}
                    onSuccess={() => { setModal(null); setSelected(null); loadUsers(); showAlert("success", "Cập nhật quyền thành công"); }}
                    onError={(msg) => showAlert("error", msg)}
                />
            )}
        </div>
    );
}

// ───────────── Modal Tạo Tài Khoản ─────────────
function CreateUserModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({
        username: "", password: "", email: "", phone: "", role: "student",
        // Trường sinh viên
        fullName: "", studentCode: "", gender: "male",
        dateOfBirth: "", faculty: "", major: "", classCode: "", academicYear: "",
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setErr("");
        try {
            await api.post("/users", form);
            onSuccess();
        } catch (error) {
            const msg = error.response?.data?.message || "Tạo thất bại";
            setErr(msg);
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header">
                    <h2>➕ Tạo tài khoản mới</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    {/* ── Thông tin tài khoản ── */}
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Thông tin tài khoản</p>
                    <div className="form-row">
                        <label>Username <span className="req">*</span></label>
                        <input name="username" placeholder="Nhập username" value={form.username} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Email <span className="req">*</span></label>
                        <input name="email" type="email" placeholder="Nhập email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Mật khẩu <span className="req">*</span></label>
                        <input name="password" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Số điện thoại</label>
                        <input name="phone" placeholder="Nhập SĐT (tuỳ chọn)" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <label>Role <span className="req">*</span></label>
                        <select name="role" value={form.role} onChange={handleChange}>
                            <option value="student">Sinh viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* ── Thông tin sinh viên (chỉ hiện khi role = student) ── */}
                    {form.role === "student" && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0" }}>Thông tin sinh viên</p>
                            <div className="form-row">
                                <label>Họ và tên <span className="req">*</span></label>
                                <input name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <label>Mã sinh viên</label>
                                <input name="studentCode" placeholder="VD: SE180001" value={form.studentCode} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Giới tính</label>
                                <select name="gender" value={form.gender} onChange={handleChange}>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Ngày sinh</label>
                                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Khoa</label>
                                <input name="faculty" placeholder="VD: Công nghệ thông tin" value={form.faculty} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Chuyên ngành</label>
                                <input name="major" placeholder="VD: Kỹ thuật phần mềm" value={form.major} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Lớp</label>
                                <input name="classCode" placeholder="VD: SE1801" value={form.classCode} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Năm học</label>
                                <input name="academicYear" placeholder="VD: 2024" value={form.academicYear} onChange={handleChange} />
                            </div>
                        </>
                    )}

                    {err && <div className="modal-err">⚠️ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Đang tạo..." : "Tạo tài khoản"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// ───────────── Modal Phân Quyền ─────────────
function PermissionModal({ user, onClose, onSuccess, onError }) {
    const allPerms = DEFAULT_PERMISSIONS[user.role] || [];
    const [selected, setSelected] = useState(new Set(user.permissions || []));
    const [loading, setLoading] = useState(false);

    const toggle = (p) => setSelected((prev) => {
        const next = new Set(prev);
        next.has(p) ? next.delete(p) : next.add(p);
        return next;
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/users/${user._id}`, { permissions: [...selected] });
            onSuccess();
        } catch (err) {
            onError(err.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔑 Phân quyền — {user.username}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <p className="perm-desc">Role: <strong>{ROLE_LABELS[user.role]}</strong></p>
                <div className="perm-list">
                    {allPerms.map((p) => (
                        <label key={p} className={`perm-item ${selected.has(p) ? "checked" : ""}`}>
                            <input
                                type="checkbox"
                                checked={selected.has(p)}
                                onChange={() => toggle(p)}
                            />
                            <span className="perm-name">{PERM_LABELS[p] || p}</span>
                            <span className="perm-key">{p}</span>
                        </label>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="btn-submit" onClick={handleSave} disabled={loading}>
                        {loading ? "Đang lưu..." : `Lưu quyền (${selected.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
