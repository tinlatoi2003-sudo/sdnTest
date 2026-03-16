import { useState } from "react";
import "./ChangePasswordModal.css";
import api from "../services/api";

export default function ChangePasswordModal({ onClose }) {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [show, setShow] = useState({
        current: false,
        newPw: false,
        confirm: false,
    });
    const [alert, setAlert] = useState(null); // { type: "error"|"success", msg }
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setAlert({ type: "error", msg: "Vui lòng điền đầy đủ thông tin" });
            return;
        }
        const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!pwRegex.test(form.newPassword)) {
            setAlert({ type: "error", msg: "Mật khẩu chưa đạt yêu cầu độ bảo mật" });
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setAlert({ type: "error", msg: "Mật khẩu xác nhận không khớp" });
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.put("/auth/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
            });
            if (!data.success) {
                setAlert({ type: "error", msg: data.message });
            } else {
                setAlert({ type: "success", msg: "Đổi mật khẩu thành công! 🎉" });
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setTimeout(() => onClose(), 1800);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Lỗi kết nối, vui lòng thử lại";
            setAlert({ type: "error", msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cpw-overlay" onClick={onClose}>
            <div className="cpw-card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="cpw-header">
                    <span className="cpw-icon">🔐</span>
                    <div>
                        <h2 className="cpw-title">Đổi mật khẩu</h2>
                        <p className="cpw-subtitle">Nhập mật khẩu hiện tại và mật khẩu mới</p>
                    </div>
                    <button className="cpw-close" onClick={onClose} aria-label="Đóng">✕</button>
                </div>

                {/* Alert */}
                {alert && (
                    <div className={`cpw-alert ${alert.type}`}>
                        {alert.type === "error" ? "⚠️" : "✅"} {alert.msg}
                    </div>
                )}

                <form className="cpw-form" onSubmit={handleSubmit}>
                    {/* Current password */}
                    <div className="cpw-field">
                        <label className="cpw-label">Mật khẩu hiện tại</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔑</span>
                            <input
                                type={show.current ? "text" : "password"}
                                name="currentPassword"
                                value={form.currentPassword}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu hiện tại"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="cpw-eye"
                                onClick={() => toggleShow("current")}
                            >
                                {show.current ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div className="cpw-field">
                        <label className="cpw-label">Mật khẩu mới</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔒</span>
                            <input
                                type={show.newPw ? "text" : "password"}
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="ít nhất 6 ký tự, có hoa, thường, số"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="cpw-eye"
                                onClick={() => toggleShow("newPw")}
                            >
                                {show.newPw ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Confirm */}
                    <div className="cpw-field">
                        <label className="cpw-label">Xác nhận mật khẩu mới</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔒</span>
                            <input
                                type={show.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhập lại mật khẩu mới"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="cpw-eye"
                                onClick={() => toggleShow("confirm")}
                            >
                                {show.confirm ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Password requirements checklist */}
                    {form.newPassword && (
                        <div className="cpw-rules">
                            {[
                                { test: form.newPassword.length >= 6, label: "Ít nhất 6 ký tự" },
                                { test: /[A-Z]/.test(form.newPassword), label: "Có chữ hoa (A-Z)" },
                                { test: /[a-z]/.test(form.newPassword), label: "Có chữ thường (a-z)" },
                                { test: /[0-9]/.test(form.newPassword), label: "Có chữ số (0-9)" },
                            ].map(({ test, label }) => (
                                <div key={label} className={`cpw-rule ${test ? "pass" : "fail"}`}>
                                    <span className="cpw-rule-icon">{test ? "✅" : "○"}</span>
                                    {label}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="cpw-actions">
                        <button type="button" className="cpw-btn-ghost" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="cpw-btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="cpw-spinner" /> Đang lưu...
                                </>
                            ) : (
                                "Đổi mật khẩu"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
