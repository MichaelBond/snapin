import express from "express"
const stripeRouter = express.Router();
import * as stripeController from '../controllers/stripeController'

stripeRouter.get('/balance', async (req, res) => {
    try {
        const balance = await stripeController.getBalance()
        res.send(balance)
    }
    catch (err) {
        res.status(500).send(err)
    }
})

export default stripeRouter;

