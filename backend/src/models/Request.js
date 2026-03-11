const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        type: {
            type: String,
            enum: ["damage_report", "room_transfer", "room_retention", "other"],
            required: true,
        },
        title: {
            type: String,
            required: [true, "Tiêu đề là bắt buộc"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Mô tả là bắt buộc"],
        },
        attachments: [
            {
                type: String,
            },
        ],
        currentRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
        },
        targetRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "manager_approved",
                "manager_rejected",
                "admin_approved",
                "admin_rejected",
                "completed",
            ],
            default: "pending",
        },
        managerReview: {
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            status: {
                type: String,
                enum: ["approved", "rejected"],
            },
            note: { type: String },
            reviewedAt: { type: Date },
        },
        adminReview: {
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            status: {
                type: String,
                enum: ["approved", "rejected"],
            },
            note: { type: String },
            reviewedAt: { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Request", requestSchema);
