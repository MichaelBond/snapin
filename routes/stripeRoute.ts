import express from "express"
const stripeRouter = express.Router();
import * as handler from '../handlers/snapInHandler'
import logger from "../utils/logger";

/**
 * @swagger
 * /api/stripe/balance:
 *   get:
 *     summary: Retrieve Stripe account balance
 *     description: Fetches the current balance of the Stripe account.
 *     tags:
 *       - Stripe
 *     responses:
 *       200:
 *         description: Successfully retrieved the Stripe balance.
 *       500:
 *         description: Internal server error.
 */
stripeRouter.get('/balance', async (req, res) => {
    try {
        const balance = await handler.stripeGetBalance()
        res.status(200).send(balance)
    }
    catch (err) {
        res.status(500).send(err)
    }
})

stripeRouter.post('/webhook', async (req, res) => {
    try {
        await handler.stripeWebhook(req.body)
    } catch (err) {
        logger.error(err)
    }
    res.status(200).send({ received: true })
})

export default stripeRouter;

