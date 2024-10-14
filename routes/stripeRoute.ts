import express from "express"
const stripeRouter = express.Router();
import * as handler from '../handlers/snapInHandler'

stripeRouter.get('/balance', async (req, res) => {
    try {
        const balance = await handler.stripeGetBalance()
        res.send(balance)
    }
    catch (err) {
        res.status(500).send(err)
    }
})

// This just needs to be a route in StripeRoutes
//   createWebhook (endpoint, events) {
//     console.log("createWebhook");
//     const url = `${endpoint}`;
//     try {
//       const endpoint = await this.stripe.webhookEndpoints.create({
//         url: url,
//         enabled_events: this.ENABLED_EVENTS,
//       });
//       return { err: null, data: endpoint };
//     } catch (error) {
// throw this.errorHandler(error)
//     }
//   }
stripeRouter.post('/webhook', async (req, res) => {
    try {

    } catch (err) {

    }

})

export default stripeRouter;

