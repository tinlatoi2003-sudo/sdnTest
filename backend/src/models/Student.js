const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userId là bắt buộc"],
        },
        studentCode: {
            type: String,
            required: [true, "Mã sinh viên là bắt buộc"],
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "Họ tên là bắt buộc"],
            trim: true,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        identityNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        faculty: {
            type: String,
            required: true,
            trim: true,
        },
        major: {
            type: String,
            required: true,
            trim: true,
        },
        classCode: {
            type: String,
            required: true,
            trim: true,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        emergencyContact: {
            name: { type: String },
            phone: { type: String },
            relationship: { type: String },
        },
        currentRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "graduated", "suspended"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Student", studentSchema);
