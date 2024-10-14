import StripeServiceClass from "../services/StripeClass";
import configs from '../configs/config'
const { STRIPE_API_KEY } = configs
console.log(STRIPE_API_KEY)

const stripeService = new StripeServiceClass(STRIPE_API_KEY)
export const getBalance = async () => {
        return await stripeService.getBalance()
}