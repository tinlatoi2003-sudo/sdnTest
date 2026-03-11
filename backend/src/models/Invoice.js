const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        invoiceCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        type: {
            type: String,
            enum: ["room_fee", "violation_fine", "damage_compensation", "electricity", "other"],
            required: true,
        },
        termCode: {
            type: String,
            trim: true,
            default: null,
        },
        description: {
            type: String,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["unpaid", "partial", "paid", "overdue"],
            default: "unpaid",
        },
        relatedRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
