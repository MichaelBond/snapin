import express from "express"
const stripeRouter = express.Router();
import * as stripeController from '../controllers/stripeController'

stripeRouter.get('/balance', async (req, res) => {
    const balance = await stripeController.getBalance()
    res.send(balance)
})

export default stripeRouter;

