import * as mssqlControllers from '../controllers/mssqlController'
import * as mysqlControllers from '../controllers/mysqlController'
import * as stripeController from '../controllers/stripeController'
import { StripeEvents } from '../models/stripeModels'
import logger from '../utils/logger'

// This file will have all controllers feeding into it
// All routes will call a function in here abstracting 

export const stripeGetBalance: any = async () => {
    return await stripeController.getBalance()
}

export const mssqlTest: any = async () => {
    return await mssqlControllers.getPageList()
}

export const mysqlTest: any = async () => {
    return await mysqlControllers.getLeadInfo()
}

export const mssqlCube: any = async (id: number) => {
    return await mssqlControllers.getCube({ cubeId: id })
}

export const mysqlCube: any = async (content: { id: number, params: any }) => {
    console.log(content.id)
    const response = await mssqlControllers.getCube({ cubeId: content.id })
    return await mysqlControllers.getQuery({ query: response.data, parameters: content.params })
}
export const mssqlCubeData: any = async (id: number) => {
    return await mssqlControllers.getCubeData({ cubeId: id })
}

// as needed we will create cases for dealing with webhook types, for now this is good 
export const stripeWebhook: any = async (event: any) => {
    switch (event.type) {
        case StripeEvents.PAYMENT_INTENT_SUCCESS: {
            const paymentIntent = event.data.object;
            logger.info("payment intent: ", paymentIntent)
            break;

        }
        case StripeEvents.PAYMENT_INTENT_ATTACHED: {
            const paymentMethod = event.data.object;
            logger.info("payment method: ", paymentMethod)
            break;

        }
        case StripeEvents.CHARGE_SUCCESSFUL: {
            const charge = event.data.object;
            logger.info("charge: ", charge)
            break;

        }
        default:
            logger.info(`Unhandled event type ${event.type}`);
    }
}