import express from "express"
const stripeRouter = express.Router();

stripeRouter.get('/', (req, res, next) => {
    res.send('this is from stripe')
})

export default stripeRouter;

