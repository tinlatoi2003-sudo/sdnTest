import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./AuthPages.css";

const STEP = { EMAIL: 1, CODE: 2, DONE: 3 };

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(STEP.EMAIL);

    // Step 1
    const [email, setEmail] = useState("");
    // Step 2
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    // Dev: hiển thị code từ response
    const [devCode, setDevCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => setAlert({ type, msg });
    const clearAlert = () => setAlert({ type: "", msg: "" });

    // ── Bước 1: Gửi email ──
    const handleSendCode = async (e) => {
        e.preventDefault();
        if (loading) return;
        clearAlert();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
            if (data.resetCode) setDevCode(data.resetCode); // dev only
            setStep(STEP.CODE);
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi mã thất bại");
        } finally {
            setLoading(false);
        }
    };

    // ── Bước 2: Đặt lại mật khẩu ──
    const handleReset = async (e) => {
        e.preventDefault();
        if (loading) return;
        clearAlert();
        if (newPassword !== confirmPassword) {
            return showAlert("error", "Mật khẩu xác nhận không khớp");
        }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", {
                email: email.trim(),
                code: code.trim(),
                newPassword,
                confirmPassword,
            });
            setStep(STEP.DONE);
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Đặt lại mật khẩu thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card">
                {/* Header */}
                <div className="auth-header">
                    <span className="auth-icon">🔑</span>
                    <h1 className="auth-title">Quên mật khẩu</h1>
                    <p className="auth-subtitle">
                        {step === STEP.EMAIL && "Nhập email để nhận mã xác nhận"}
                        {step === STEP.CODE && "Nhập mã xác nhận và mật khẩu mới"}
                        {step === STEP.DONE && "Đặt lại mật khẩu thành công!"}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="steps">
                    <div className={`step-dot ${step >= STEP.EMAIL ? "active" : ""}`}>1</div>
                    <div className="step-bar" />
                    <div className={`step-dot ${step >= STEP.CODE ? "active" : ""}`}>2</div>
                    <div className="step-bar" />
                    <div className={`step-dot ${step >= STEP.DONE ? "active" : ""}`}>✓</div>
                </div>

                {/* ── Bước 1 ── */}
                {step === STEP.EMAIL && (
                    <form className="auth-form" onSubmit={handleSendCode}>
                        <div className="form-field">
                            <label className="form-label">Email tài khoản</label>
                            <div className="input-box">
                                <span className="icon">📧</span>
                                <input
                                    type="email"
                                    placeholder="Nhập địa chỉ email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearAlert(); }}
                                    required
                                />
                            </div>
                        </div>

                        {alert.msg && (
                            <div className={`auth-alert ${alert.type}`}>
                                <span>{alert.type === "error" ? "⚠️" : "✅"}</span> {alert.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" />Đang gửi...</> : "Lấy mã xác nhận"}
                        </button>
                    </form>
                )}

                {/* ── Bước 2 ── */}
                {step === STEP.CODE && (
                    <form className="auth-form" onSubmit={handleReset}>
                        {/* Hiển thị code (dev mode) */}
                        {devCode && (
                            <div className="token-box">
                                <span className="token-label">Mã xác nhận của bạn</span>
                                <span className="token-code">{devCode}</span>
                                <span className="token-expire">⏱ Hết hạn sau 15 phút</span>
                            </div>
                        )}

                        <div className="form-field">
                            <label className="form-label">Mã xác nhận (6 chữ số)</label>
                            <div className="input-box">
                                <span className="icon">🔢</span>
                                <input
                                    type="text"
                                    placeholder="Nhập mã 6 chữ số"
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value); clearAlert(); }}
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Mật khẩu mới</label>
                            <div className="input-box">
                                <span className="icon">🔒</span>
                                <input
                                    type="password"
                                    placeholder="Ít nhất 6 ký tự"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); clearAlert(); }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Xác nhận mật khẩu</label>
                            <div className="input-box">
                                <span className="icon">🔒</span>
                                <input
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); clearAlert(); }}
                                    required
                                />
                            </div>
                        </div>

                        {alert.msg && (
                            <div className={`auth-alert ${alert.type}`}>
                                <span>{alert.type === "error" ? "⚠️" : "✅"}</span> {alert.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" />Đang cập nhật...</> : "Đặt lại mật khẩu"}
                        </button>

                        <button type="button" className="btn-ghost" onClick={() => { setStep(STEP.EMAIL); clearAlert(); }}>
                            ← Quay lại
                        </button>
                    </form>
                )}

                {/* ── Bước 3: Done ── */}
                {step === STEP.DONE && (
                    <div className="auth-form">
                        <div className="success-state">
                            <span className="success-emoji">🎉</span>
                            <p>Mật khẩu đã được cập nhật thành công!</p>
                            <Link to="/login" className="btn-primary">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                )}

                {step !== STEP.DONE && (
                    <div className="auth-footer" style={{ marginTop: 16 }}>
                        <Link to="/login" className="auth-link">← Quay lại đăng nhập</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
