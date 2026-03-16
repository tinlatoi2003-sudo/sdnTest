const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

/**
 * Gửi mã reset password về email người dùng
 * @param {string} toEmail - Email nhận
 * @param {string} resetCode - Mã 6 chữ số
 */
const sendResetPasswordEmail = async (toEmail, resetCode) => {
    const mailOptions = {
        from: `"KTX FPT System" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Mã xác nhận đặt lại mật khẩu – KTX FPT",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <!-- Header -->
                <div style="background: #e8540a; padding: 28px 32px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 0.5px;">
                        🔐 Đặt lại mật khẩu
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
                        Hệ thống Ký túc xá Đại học FPT
                    </p>
                </div>

                <!-- Body -->
                <div style="padding: 32px;">
                    <p style="color: #444; font-size: 15px; margin: 0 0 16px;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                    </p>
                    <p style="color: #444; font-size: 15px; margin: 0 0 24px;">
                        Sử dụng mã xác nhận bên dưới để đặt lại mật khẩu. Mã có hiệu lực trong <strong>15 phút</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background: #fff4f0; border: 2px dashed #e8540a; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #e8540a;">
                            ${resetCode}
                        </span>
                    </div>

                    <p style="color: #888; font-size: 13px; margin: 0;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f8f8f8; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">
                        © 2025 KTX Đại học FPT – Hệ thống quản lý ký túc xá
                    </p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };
