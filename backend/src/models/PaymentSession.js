const mongoose = require("mongoose");

const paymentSessionSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        invoiceIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Invoice",
                required: true,
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["bank_transfer"],
            default: "bank_transfer",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "expired", "cancelled"],
            default: "pending",
        },
        transferContent: {
            type: String,
            required: true,
            trim: true,
        },
        qrUrl: {
            type: String,
            required: true,
            trim: true,
        },
        sessionCode: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PaymentSession", paymentSessionSchema);
