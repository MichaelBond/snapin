import express from "express"
const stripeRouter = express.Router();
import * as handler from '../handlers/snapInHandler'
import logger from "../utils/logger";

stripeRouter.get('/balance', async (req, res) => {
    try {
        const balance = await handler.stripeGetBalance()
        res.status(200).send(balance)
    }
    catch (err) {
        res.status(500).send(err)
    }
})
    .post('/webhook', async (req, res) => {
        try {
            await handler.stripeWebhook(req.body)
        } catch (err) {
            logger.error(err)
        }
        res.status(200).send({ received: true })
    })

export default stripeRouter;

