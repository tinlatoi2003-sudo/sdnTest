const crypto = require("crypto");
const PaymentSession = require("../models/PaymentSession");
const { completeQrPaymentSession } = require("../services/paymentService");

const normalizeText = (value) => String(value || "").trim();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getWebhookSecret = () => normalizeText(process.env.CASSO_WEBHOOK_SECRET);

const verifyCassoSignature = (req) => {
    const secret = getWebhookSecret();
    if (!secret) return true;

    const secureToken = normalizeText(req.headers["secure-token"]);
    if (secureToken) {
        return secureToken === secret;
    }

    const signature = normalizeText(req.headers["x-casso-signature"]);
    if (!signature) return false;

    const raw = req.rawBody || JSON.stringify(req.body || {});
    const digest = crypto
        .createHmac("sha256", secret)
        .update(raw)
        .digest("hex");

    return digest === signature;
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const extractTransactions = (body) => {
    const data = body?.data;
    return [
        ...toArray(data?.records),
        ...toArray(data?.transactions),
        ...toArray(data?.items),
        ...((!data?.records && !data?.transactions && !data?.items) ? toArray(data) : []),
    ];
};

const parseTransaction = (item) => {
    const description = normalizeText(
        item?.description ||
        item?.content ||
        item?.transactionContent ||
        item?.transaction_content ||
        item?.remark
    );

    const amount = Number(
        item?.amount ??
        item?.creditAmount ??
        item?.credit_amount ??
        item?.amountNumber ??
        0
    );

    const transactionCode = normalizeText(
        item?.tid ||
        item?.transactionID ||
        item?.transactionId ||
        item?.referenceCode ||
        item?.reference ||
        item?.id
    );

    const paidAt = item?.when || item?.transactionDate || item?.createdAt || item?.bookingDate;

    return {
        description,
        amount,
        transactionCode,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
    };
};

exports.handleCassoWebhook = async (req, res) => {
    try {
        if (!verifyCassoSignature(req)) {
            return res.status(401).json({ success: false, message: "Chu ky webhook khong hop le" });
        }

        const transactions = extractTransactions(req.body);
        if (transactions.length === 0) {
            return res.json({ success: true, message: "Khong co giao dich nao de xu ly", data: { matched: 0 } });
        }

        let matched = 0;
        let completed = 0;

        for (const rawItem of transactions) {
            const item = parseTransaction(rawItem);
            if (!item.description || !Number.isFinite(item.amount) || item.amount <= 0) continue;

            const pendingSessions = await PaymentSession.find({
                status: "pending",
                totalAmount: item.amount,
            }).sort({ createdAt: -1 });

            const session = pendingSessions.find((candidate) => {
                if (!candidate.transferContent) return false;
                const pattern = new RegExp(escapeRegex(candidate.transferContent), "i");
                return pattern.test(item.description);
            });

            if (!session) continue;
            matched += 1;

            try {
                const result = await completeQrPaymentSession({
                    session,
                    transactionCode: item.transactionCode || session.sessionCode,
                    note: `Thanh toan Casso - ${item.description}`,
                    paidAt: Number.isNaN(item.paidAt?.getTime?.()) ? new Date() : item.paidAt,
                });
                if (!result.alreadyCompleted) completed += 1;
            } catch (err) {
                console.error("handleCassoWebhook confirm error:", err.message);
            }
        }

        return res.json({
            success: true,
            message: "Da xu ly webhook Casso",
            data: { received: transactions.length, matched, completed },
        });
    } catch (err) {
        console.error("handleCassoWebhook error:", err);
        return res.status(500).json({ success: false, message: err.message || "Loi server" });
    }
};
