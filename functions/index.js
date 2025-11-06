/* eslint-disable max-len */
const logger = require("firebase-functions/logger");
const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const { defineSecret } = require("firebase-functions/params");
const stripeKey = defineSecret("STRIPE_KEY");
const corsHandler = cors({
  origin: ["https://pywplanners.com", "http://localhost:5173"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

exports.createPaymentLink = onRequest(
  { secrets: [stripeKey] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      const stripe = require("stripe")(stripeKey.value());
      const missingFields = [];
      try {
        const {
          bindColor,
          fontStyle,
          letters,
          calendar,
          cost = 25,
          isMonogrammed = false,
        } = req.body;

        if (!bindColor || !fontStyle || !letters || !calendar) {
          if (!bindColor) missingFields.push("Bind Color");
          if (!fontStyle) missingFields.push("Font Style");
          if (!letters) missingFields.push("Letters");
          if (!calendar) missingFields.push("Calendar Type");
          return res
            .status(400)
            .json({ error: `Missing required...${missingFields.join(", ")}` });
        }

        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: cost * 100,
          metadata: { bindColor, fontStyle, letters, calendar },
          product_data: {
            name: `Planner ${
              isMonogrammed ? "with Monogram" : "without Monogram"
            }`,
            metadata: { bindColor, fontStyle, letters, calendar },
          },
        });

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: { bindColor, fontStyle, letters, calendar },
        });
        logger.info("Transaction complete");
        res.status(200).json({ paymentLinkUrl: paymentLink.url });
      } catch (error) {
        logger.error(`Payment link creation failed: ${error.message}`);
        res
          .status(500)
          .json({ error: `Payment link creation failed: ${error.message}` });
      }
    });
  }
);
