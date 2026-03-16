const express = require("express");
const router = express.Router();
const { handleCassoWebhook } = require("../controllers/paymentWebhookController");

router.post("/casso", handleCassoWebhook);

module.exports = router;
