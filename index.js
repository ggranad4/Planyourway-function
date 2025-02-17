// index.js
require('dotenv').config();

const STRIPE_SECRET = process.env.STRIPE_SECRET;
const express = require('express');
const stripe = require('stripe')(STRIPE_SECRET); 
const app = express();
const port = 3003;
app.use(express.json());
const cors = require('cors');
app.use(cors());

app.post('/create-payment-link', async (req, res) => {
    try {
        // Dynamically pass metadata via the request body if needed
        const { bindColor, fontStyle, letters, calendar, cost, isMonogrammed} = req.body;
        if(!bindColor){
            res.status(400).send({ error: 'bindColor is required' });
            return;
        }
        if(!fontStyle){
            res.status(400).send({ error: 'fontStyle is required' });
            return;
        }
        if(!letters){
            res.status(400).send({ error: 'letters is required' });
            return;
        }
        if(!calendar){
            res.status(400).send({ error: 'calendar is required' });
            return;
        }
        const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: cost, 
            product_data: {
                name: `'Planner ${isMonogrammed ? 'with Monogram' : 'without Monogram'}'`,
            },
        });

        // Create the payment link using the price ID
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: price.id,  // Use the price ID here
                    quantity: 1,  // Only one unit of this product
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
        res.status(500).send({ error: `Payment link creation failed: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
