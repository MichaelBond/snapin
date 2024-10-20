import express from "express"
const stripeRouter = express.Router();
import * as handler from '../handlers/snapInHandler'
import logger from "../utils/logger";

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Login a user with their email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: A JWT token for the user
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials
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

