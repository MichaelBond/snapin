import Stripe from "stripe"
import logger from '../utils/logger'


export enum StripeErrorType {
  APIConnectionError = "api_connection_error",
  APIError = "api_error",
  AuthenticationError = "authentication_error",
  CardError = "card_error",
  IdempotencyError = "idempotency_error",
  InvalidRequestError = "invalid_request_error",
  RateLimitError = "rate_limit_error",
  ValidationError = "validation_error"
}

type PlanInterval = "day" | "week" | "month" | "year";
type Currency =
  | "AUD"  // Australian Dollar
  | "BRL"  // Brazilian Real
  | "CAD"  // Canadian Dollar
  | "CHF"  // Swiss Franc
  | "CNY"  // Chinese Yuan Renminbi
  | "CZK"  // Czech Koruna
  | "DKK"  // Danish Krone
  | "EUR"  // Euro
  | "GBP"  // British Pound Sterling
  | "HKD"  // Hong Kong Dollar
  | "HUF"  // Hungarian Forint
  | "IDR"  // Indonesian Rupiah
  | "ILS"  // Israeli New Shekel
  | "INR"  // Indian Rupee
  | "JPY"  // Japanese Yen
  | "MYR"  // Malaysian Ringgit
  | "MXN"  // Mexican Peso
  | "NOK"  // Norwegian Krone
  | "NZD"  // New Zealand Dollar
  | "PEN"  // Peruvian Sol
  | "PHP"  // Philippine Peso
  | "PLN"  // Polish Zloty
  | "QAR"  // Qatari Rial
  | "RUB"  // Russian Ruble
  | "SAR"  // Saudi Riyal
  | "SEK"  // Swedish Krona
  | "SGD"  // Singapore Dollar
  | "THB"  // Thai Baht
  | "TWD"  // New Taiwan Dollar
  | "TRY"  // Turkish Lira
  | "UAH"  // Ukrainian Hryvnia
  | "USD"  // United States Dollar
  | "VEF"  // Venezuelan Bolívar
  | "VND"  // Vietnamese Dong
  | "ZAR";  // South African Rand

type Product = {
  name: string
}
type Plan = {
  plan: any
}

export default class StripeServiceClass {
  readonly stripe: Stripe
  readonly apiKey: string

  constructor(stripeApiKey: string) {
    this.apiKey = stripeApiKey
    this.stripe = new Stripe(this.apiKey)
  }

  public async listPlans(limit: number = 10) {
    try {
      const plans = await this.stripe.plans.list({ limit });
      return { err: null, data: plans };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return { err: null, data: balance };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getBalanceHistoryById(id: string) {
    try {
      const balanceTransaction = await this.stripe.balanceTransactions.retrieve(id);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getPlanById(id: string) {
    try {
      const balanceTransaction = await this.stripe.plans.retrieve(id);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async createPlan(params: { amount: number, currency: Currency, interval: PlanInterval, product: Product }) {
    try {
      const plan = await this.stripe.plans.create(params);
      return { err: null, data: plan };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // can create plan type later 
  async updatePlan(id: string, plan: any) {
    try {
      const updatedPlan = await this.stripe.plans.update(id, plan);
      return { err: null, data: updatedPlan };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async deletePlan(id: string) {
    try {
      const plan = await this.stripe.plans.del(id);
      return { err: null, data: plan };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  //   // Charge Functions
  async getCharges(limit: number = 10) {
    try {
      const charges = await this.stripe.charges.list({ limit });
      return { err: null, data: charges };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getChargeById(id: string) {
    try {
      const charge = await this.stripe.charges.retrieve(id);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async makeCharge(params: { account: string, amount?: number, currency: Currency, description: string, source: string }) {
    try {
      const charge = await this.stripe.charges.create(params);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async captureChargeById(id: string) {
    try {
      const charge = await this.stripe.charges.capture(id);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // params will be typed when we know what is needed 
  async updateCharge(id: string, params: any) {
    try {
      const charge = await this.stripe.charges.capture(id, params);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  //   // Customer Functions
  async listCustomers(limit: number = 10) {
    try {
      const customers = await this.stripe.customers.list({ limit });
      return { err: null, data: customers };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getCustomerById(id: string) {
    try {
      const customer = await this.stripe.customers.retrieve(id);
      return { err: null, data: customer };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async createCustomer(params: { name: string, phone: string, email: string, desciption: string, source: string }) {
    try {
      const customer = await this.stripe.customers.create(params);
      return { err: null, data: customer };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // fill out the params later
  async updateCustomer(id: string, params: any) {
    try {
      const customer = await this.stripe.customers.update(id, params);
      return { err: null, data: customer };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async deleteCustomer(id: string) {
    try {
      const confirmation = await this.stripe.customers.del(id);
      return { err: null, data: confirmation };
    } catch (error) {
      this.errorHandler(error);
      return { err: error, data: null };
    }
  }
  // Products
  // Parameters will need to be updated as they get used, some attributes that get past are optional 
  async createProductService(params: { name: string }) {
    try {
      const product = await this.stripe.products.create(params);
      return { err: null, data: product };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }

  // this needs to be be turned into 2 functions, and the controller needs to be this so leaving in place for now 
  // createPricedProduct() {
  //   const ProdParameters = {
  //     name: req.body.name,
  //     type: req.body.type,
  //     description: req.body.description,
  //   };
  //   try {
  //     const product = await this.stripe.products.create(ProdParameters);
  //     const PriceParameters = {
  //       unit_amount: req.body.unit_amount,
  //       currency: req.body.currency,
  //       recurring: req.body.recurring,
  //       product_id: product.id,
  //     };
  //     const price = await this.stripe.prices.create(PriceParameters);
  //     return { err: null, data: { product: product, price: price } };
  //   } catch (error) {
  //     throw this.errorHandler(error)
  //   }
  // }
  async listProducts(limit: number = 10) {
    try {
      const products = await this.stripe.products.list({ limit });
      return { err: null, data: products };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async getProductById(id: string) {
    try {
      const product = await this.stripe.products.retrieve(id);
      return { err: null, data: product };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // update params when nec 
  async updateProduct(id: string, params: any) {
    try {
      const product = await this.stripe.products.update(id, params);
      return { err: null, data: product };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async deleteProduct(id: string) {
    try {
      const product = await this.stripe.products.update(id);
      return { err: null, data: product };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  //   // Stripe Subscriptions
  async getSubscriptionById(id: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(id);
      return { err: null, data: subscription };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async listSubscriptions(limit: number = 3) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({ limit });
      return { err: null, data: subscriptions };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // Plan data type needs to be updated when nec 
  async createSubscription(params: { customer: string, items: Plan[] }) {
    try {
      const subscription = await this.stripe.subscriptions.create(params);
      return { err: null, data: subscription };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // params need to be figured out later and type or interface should be added for it 
  async updateSubscription(id: string, params: any) {
    try {
      const subscription = await this.stripe.subscriptions.update(id, params);
      return { err: null, data: subscription };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  async deleteSubscription(id: string) {
    try {
      const confirmation = await this.stripe.subscriptions.cancel(id)
      return { err: null, data: confirmation };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  //   // Stripe Sources
  async createSource(params: {
    type: string
    currency: Currency,
    owner: { email: string }
    items: Plan[]
  }) {
    try {
      const subscription = await this.stripe.sources.create(params);
      return { err: null, data: subscription };
    } catch (error) {
      throw this.errorHandler(error)
    }
  }
  // This should be divided up into 2 methods, and a method in a controller should call theses 
  //async receiveToken(params: { name: string, emial: string, description: string }) {
  //   const Parameters = {
  //     name: params.name,
  //     email: params.email,
  //     description: params.description, // This is from using a token to generate a customer with a ACH set up, and to verify the account
  //   };

  //   try {
  //     const customer = await this.stripe.customers.create(Parameters);
  //     const source = await this.stripe.source.createSource(customer.id, {
  //       source: req.body.token,
  //     });
  //     const bankAccount = await this.stripe.customers.verifySource(
  //       source.customer,
  //       source.id,
  //       {
  //         amounts: [32, 45],
  //       }
  //     );

  //     return { err: null, data: bankAccount };
  //   } catch (error) {
  //     throw this.errorHandler(error)
  //   }
  // }

  //   processEvents () {
  //     const signed = req.headers["stripe-signature"];
  //     const parts = signed.split(",");
  //     let tStamp = null;
  //     let payLoad = null;
  //     let testLoad = null;
  //     parts.forEach((item, i) => {
  //       let keyvalue = item.split("=");
  //       if (keyvalue[0] === "t") {
  //         tStamp = keyvalue[1];
  //       } else if (keyvalue[0] === "v1") {
  //         payLoad = keyvalue[1];
  //       } else if (keyvalue[0] === "v0") {
  //         testLoad = keyvalue[1];
  //       }
  //     });

  //     try {
  //       const hookEvent = await this.stripe.webhooks.constructEvent(
  //         req.body,
  //         signed,
  //         this.endpointSecret
  //       );

  //       switch (hookEvent.type) {
  //         case "payment_intent.succeeded":
  //           const paymentIntent = hookEvent.data.object;
  //           break;
  //         case "payment_method.attached":
  //           const paymentMethod = hookEvent.data.object;
  //           break;
  //         // ... handle other event types
  //         default:
  //       }

  //       // Return a response to acknowledge receipt of the event
  //       res.status(200).json({ received: true });
  //     } catch (error) {
  //       this.errorHandling(error);
  //       res.sendStatus(400);
  //     }
  //   }

  // this needs to be added here still
  //   createWebhook (endpoint, events) {
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

  private errorHandler(error: any) {
    const errorType = error?.type as StripeErrorType;
    logger.error({ className: StripeServiceClass.name, status: error?.code, type: errorType, message: error?.message })

    let message: string
    switch (errorType) {
      case StripeErrorType.APIConnectionError:
        message = "Network communication with Stripe failed. Please try again later.";
      case StripeErrorType.APIError:
        message = "An internal error occurred in Stripe's servers. Please try again.";
      case StripeErrorType.AuthenticationError:
        message = "Authentication with Stripe's API failed. Please check your API keys.";
      case StripeErrorType.CardError:
        message = `Card error: ${error.message}. Please check the card details and try again.`;
      case StripeErrorType.IdempotencyError:
        message = "An idempotency error occurred. Please ensure you're not sending duplicate requests.";
      case StripeErrorType.InvalidRequestError:
        message = `Invalid request: ${error.message}. Please check your request parameters.`;
      case StripeErrorType.RateLimitError:
        message = "Too many requests made to Stripe's API too quickly. Please slow down.";
      case StripeErrorType.ValidationError:
        message = `Validation error: ${error.message}. Please correct the data and try again.`;
      default:
        message = "An unknown error occurred. Please contact support.";
    }
    return { message }
  }
}