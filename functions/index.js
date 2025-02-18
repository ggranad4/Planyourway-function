/* eslint-disable max-len */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const logger = require("firebase-functions/logger");
const {onRequest} = require("firebase-functions/v2/https");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.createPaymentLink = onRequest( {cors: true}
    , async (req, res) => {
      // Dynamically pass metadata via the request body if needed
      const stripe = require("stripe")(process.env.STRIPE_SECRET);
      try {
        const {bindColor, fontStyle, letters, calendar, cost =25, isMonogrammed = false} = req.body;
        if (!bindColor) {
          res.status(400).send({error: "bindColor is required"});
          return;
        }
        if (!fontStyle) {
          res.status(400).send({error: "fontStyle is required"});
          return;
        }
        if (!letters) {
          res.status(400).send({error: "letters is required"});
          return;
        }
        if (!calendar) {
          res.status(400).send({error: "calendar is required"});
          return;
        }
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: cost * 100, // Convert dollars to cents
          product_data: {
            name: `Planner ${isMonogrammed ? "with Monogram" : "without Monogram"}`,
          },
        });

        // Create the payment link using the price ID
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price: price.id, // Use the price ID here
              quantity: 1, // Only one unit of this product
            },
          ],
          metadata: {
            bindColor,
            fontStyle,
            letters,
            calendar,
          },
        });
        res.send({
          paymentLinkUrl: paymentLink.url,
        });
      } catch (error) {
        res.status(500).send({error: `Payment link creation failed: ${error.message}`});
        logger.error(`Payment link creation failed: ${error.message}`);
      }
    });
// require("dotenv").config();

// const express = require("express");
// const app = express();
// app.use(express.json());
// const cors = require("cors");
// app.use(cors());

