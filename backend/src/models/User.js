const mongoose = require("mongoose");

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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);
