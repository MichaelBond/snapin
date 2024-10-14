import * as stripeController from '../controllers/stripeController'
import { StripeEvents } from '../models/stripeModels'

export const stripeGetBalance: any = async () => {
    return await stripeController.getBalance()
}

// as needed we will create cases for dealing with webhook types, for now this is good 
export const stripeWebhook: any = async (event: any) => {
    switch (event.type) {
        case StripeEvents.PAYMENT_INTENT_SUCCESS: {
            const paymentIntent = event.data.object;
            // logger.info("payment intent: ", paymentIntent)
            break;

        }
        case StripeEvents.PAYMENT_INTENT_ATTACHED: {
            const paymentMethod = event.data.object;
            // logger.info("payment method: ", paymentMethod)
            break;

        }
        case StripeEvents.CHARGE_SUCCESSFUL: {
            const charge = event.data.object;
            // logger.info("charge: ", charge)
            break;

        }
        default:
            console.log('remove this when logger is done')
        // logger.info(`Unhandled event type ${event.type}`);
    }

}