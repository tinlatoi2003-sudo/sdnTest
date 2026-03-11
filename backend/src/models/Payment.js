const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        amount: {
            type: Number,
            required: [true, "Số tiền là bắt buộc"],
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "e_wallet"],
            default: "cash",
        },
        transactionCode: {
            type: String,
            trim: true,
        },
        note: {
            type: String,
            trim: true,
        },
        paidAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
