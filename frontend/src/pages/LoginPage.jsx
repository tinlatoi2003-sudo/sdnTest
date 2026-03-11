import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AuthPages.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        try {
            const { data } = await api.post("/auth/login", form);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Phân quyền redirect theo role
            const role = data.user.role;
            if (role === "admin") navigate("/admin/dashboard", { replace: true });
            else if (role === "manager") navigate("/manager/dashboard", { replace: true });
            else navigate("/student/dashboard", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <span className="auth-icon">🏠</span>
                    <h1 className="auth-title">Ký Túc Xá</h1>
                    <p className="auth-subtitle">Hệ thống quản lý ký túc xá trường đại học</p>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {/* Username */}
                    <div className="form-field">
                        <label className="form-label">Tên đăng nhập / Email</label>
                        <div className="input-box">
                            <span className="icon">👤</span>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Nhập username hoặc email"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-field">
                        <label className="form-label">Mật khẩu</label>
                        <div className="input-box">
                            <span className="icon">🔒</span>
                            <input
                                id="password"
                                name="password"
                                type={showPass ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                            <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                                {showPass ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="auth-alert error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner" />Đang đăng nhập...</> : "Đăng nhập"}
                    </button>

                    {/* Forgot */}
                    <div className="auth-footer">
                        <Link to="/forgot-password" className="auth-link">
                            Quên mật khẩu?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
