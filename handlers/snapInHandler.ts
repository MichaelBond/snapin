import * as mssqlController from '../controllers/mssqlController'
import * as mysqlController from '../controllers/mysqlController'
import * as stripeController from '../controllers/stripeController'
import * as chatgptController from '../controllers/chatgptController'
import * as neo4jController from '../controllers/neo4jController'
import * as s3Controller from '../controllers/s3Controller'
import { StripeEvents } from '../models/stripeModels'
import logger from '../utils/logger'

// This file will have all controllers feeding into it
// All routes will call a function in here abstracting 

export const bryceTest: any = async () => {
    await mssqlController.bryceSeeAllDbs()
    await neo4jController.getQuery("query")
    return await s3Controller.getBuckets()
}

export const stripeGetBalance: any = async () => {
    return await stripeController.getBalance()
}

export const mssqlTest: any = async () => {
    return await mssqlController.getPageList()
}

export const mysqlTest: any = async () => {
    return await mysqlController.getLeadInfo()
}

export const chatgptTest: any = async () => {
    return await chatgptController.askQuestion()
}

export const mssqlCube: any = async (id: number) => {
    return await mssqlController.getCube({ cubeId: id })
}

export const mysqlCube: any = async (content: { id: number, params: any }) => {
    console.log(content.id)
    const response = await mssqlController.getCube({ cubeId: content.id })
    return await mysqlController.getQuery({ query: response.data, parameters: content.params })
}
export const mssqlCubeData: any = async (id: number) => {
    return await mssqlController.getCubeData({ cubeId: id })
}

export const neo4jCube: any = async (content: { id: number }) => {
    console.log(content.id)
    const response = await mssqlController.getCube({ cubeId: content.id })
    return await neo4jController.getQuery(response.data)
}

export const crmDbQuery = async (options: any, params: any) => {
    const cubeQuery = await mssqlController.getCube(options);
    const Parameters = mysqlController.extractParameters(params);

    if (cubeQuery.err) {
        throw { status: 403, data: cubeQuery.err }
    }

    const results = await mysqlController.getQuery({ query: cubeQuery.data, parameters: Parameters });
    if (results.err) {
        throw { status: 500, data: results.err }
    }
    return (results)
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
            logger.info(event.data)
    }
}