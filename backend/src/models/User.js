const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username là bắt buộc"],
            unique: true,
            trim: true,
            minlength: 3,
        },
        password: {
            type: String,
            required: [true, "Password là bắt buộc"],
            minlength: 6,
        },
        email: {
            type: String,
            required: [true, "Email là bắt buộc"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ["student", "manager", "admin"],
            default: "student",
        },
        permissions: [
            {
                type: String,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Auto hash password trước khi lưu ────────────────────────────────────────
userSchema.pre("save", async function () {
    // Chỉ hash khi password bị thay đổi (hoặc tạo mới)
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
