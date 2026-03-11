const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        receiverType: {
            type: String,
            enum: ["role", "building", "individual"],
            required: true,
        },
        targetRole: {
            type: String,
            enum: ["all", "student", "manager", "admin"],
            default: null,
        },
        targetBuildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Building",
            default: null,
        },
        title: {
            type: String,
            required: [true, "Tiêu đề là bắt buộc"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Nội dung là bắt buộc"],
        },
        type: {
            type: String,
            enum: ["general", "payment_reminder", "maintenance", "announcement"],
            default: "general",
        },
        readBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                readAt: {
                    type: Date,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
