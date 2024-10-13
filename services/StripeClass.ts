import Stripe from "stripe"

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

class StripeError extends Error {
  public status: number;
  public type: string;
  constructor(params: { message: string, status: number, type: string }) {
    super();
    this.status = params.status;
    this.type = params.type;
    this.message = params.message
  }
}

export default class StripeServiceClass {
  readonly stripe: Stripe
  readonly apiKey: string

  constructor(stripeApiKey: string) {
    this.apiKey = stripeApiKey
    // this.pubKey = env['STRIPE_PUB_KEY']
    this.stripe = new Stripe(this.apiKey)
  }

  public async listPlans(limit: number = 10) {
    try {
      const plans = await this.stripe.plans.list({ limit });
      return { err: null, data: plans };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async getBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return { err: null, data: balance };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async getBalanceHistoryById(id: string) {
    try {
      const balanceTransaction = await this.stripe.balanceTransactions.retrieve(id);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async getPlanById(id: string) {
    try {
      const balanceTransaction = await this.stripe.plans.retrieve(id);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async createPlan(params: { amount: number, currency: Currency, interval: PlanInterval, product: Product }) {
    try {
      const plan = await this.stripe.plans.create(params);
      return { err: null, data: plan };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  // can create plan type later 
  async updatePlan(id: string, plan: any) {
    try {
      const updatedPlan = await this.stripe.plans.update(id, plan);
      return { err: null, data: updatedPlan };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async deletePlan(id: string) {
    try {
      const plan = await this.stripe.plans.del(id);
      return { err: null, data: plan };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  //   // Charge Functions
  async getCharges(limit: number = 10) {
    try {
      const charges = await this.stripe.charges.list({ limit });
      return { err: null, data: charges };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async getChargeById(id: string) {
    try {
      const charge = await this.stripe.charges.retrieve(id);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async makeCharge(params: { account: string, amount?: number, currency: Currency, description: string, source: string }) {
    try {
      const charge = await this.stripe.charges.create(params);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  async captureChargeById(id: string) {
    try {
      const charge = await this.stripe.charges.capture(id);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  // params will be typed when we know what is needed 
  async updateCharge(id: string, params: any) {
    try {
      const charge = await this.stripe.charges.capture(id, params);
      return { err: null, data: charge };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  //   // Customer Functions
  //   listCustomers: async function (req, res) {
  //     console.log("listCustomers");
  //     try {
  //       const customers = await this.stripe.customers.list({ limit: 10 });
  //       return { err: null, data: customers };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   getCustomerById: async function (req, res) {
  //     console.log("getCustomerById");
  //     const ID = req.params.id;
  //     try {
  //       const customer = await this.stripe.customers.retrieve(ID);
  //       return { err: null, data: customer };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   createCustomer: async function (req, res) {
  //     console.log("createCustomer");
  //     const Parameters = {
  //       name: req.body.name,
  //       phone: req.body.phone,
  //       email: req.body.email, //"brycerbond@gmail.com",
  //       description: req.body.description, //"This is a description, hehe",
  //       source: req.body.source, //"tok_visa"
  //     };
  //     try {
  //       const customer = await this.stripe.customers.create(Parameters);
  //       return { err: null, data: customer };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   updateCustomer: async function (req, res) {
  //     console.log("updateCustomer");
  //     const ID = req.params.id;
  //     const Parameters = req.body;
  //     try {
  //       const customer = await this.stripe.customers.update(ID, Parameters);
  //       return { err: null, data: customer };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   deleteCustomer: async function (req, res) {
  //     console.log("deleteCustomer");
  //     const ID = req.params.id;
  //     try {
  //       const confirmation = await this.stripe.customers.del(ID);
  //       return { err: null, data: confirmation };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   // Products
  //   createProductService: async function (req, res) {
  //     console.log("createProductService");
  //     const Parameters = {
  //       name: req.body.name,
  //       type: req.body.type,
  //     };
  //     try {
  //       const product = await this.stripe.products.create(Parameters);
  //       return { err: null, data: product };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   createPricedProduct: async function (req, res) {
  //     console.log("createPricedProduct");
  //     const ProdParameters = {
  //       name: req.body.name,
  //       type: req.body.type,
  //       description: req.body.description,
  //     };
  //     try {
  //       const product = await this.stripe.products.create(ProdParameters);
  //       const PriceParameters = {
  //         unit_amount: req.body.unit_amount,
  //         currency: req.body.currency,
  //         recurring: req.body.recurring,
  //         product_id: product.id,
  //       };
  //       const price = await this.stripe.prices.create(PriceParameters);
  //       return { err: null, data: { product: product, price: price } };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   listProducts: async function (req, res) {
  //     console.log("listProducts");
  //     try {
  //       const products = await this.stripe.products.list({ limit: 10 });
  //       return { err: null, data: customers };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   getProductById: async function (req, res) {
  //     console.log("getProductById (ID): ", req.params.id);
  //     const ID = req.params.id;
  //     try {
  //       const product = await this.stripe.products.retrieve(ID);
  //       return { err: null, data: product };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   updateProduct: async function (req, res) {
  //     console.log("updateProduct (ID): ", req.params.id);
  //     const ID = req.params.id;
  //     const Parameters = req.body;
  //     try {
  //       const product = await this.stripe.products.update(ID, Parameters);
  //       return { err: null, data: product };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   deleteProduct: async function (req, res) {
  //     console.log("deleteProduct(ID): ", req.params.id);
  //     const ID = req.params.id;
  //     try {
  //       const product = await this.stripe.products.update(ID);
  //       return { err: null, data: product };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   // Stripe Subscriptions
  async getSubscriptionById(id: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(id);
      return { err: null, data: subscription };
    } catch (error) {
      throw this.errorHander(error);
    }
  }
  //   listSubscriptions: async function (req, res) {
  //     console.log("listSubscriptions");
  //     try {
  //       const subscriptions = await this.stripe.subscriptions.list({ limit: 3 });
  //       return { err: null, data: subscriptions };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   createSubscription: async function (req, res) {
  //     console.log("createSubscription");
  //     const Parameters = {
  //       customer: req.body.customer,
  //       items: [
  //         {
  //           plan: req.body.plan,
  //         },
  //       ],
  //     };
  //     try {
  //       const subscription = await this.stripe.subscriptions.create(Parameters);
  //       return { err: null, data: customer };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   updateSubscription: async function (req, res) {
  //     console.log("updateSubscription (ID): ", req.params.id);
  //     const ID = req.params.id;
  //     const Parameters = req.body;
  //     try {
  //       const subscription = await this.stripe.subscriptions.update(ID, Parameters);
  //       return { err: null, data: subscription };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   deleteSubscription: async function (req, res) {
  //     console.log("deleteSubscription(ID): ", req.params.id);
  //     const ID = req.params.id;
  //     try {
  //       const confirmation = await this.stripe.subscription.del(ID);
  //       return { err: null, data: confirmation };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   // Stripe Sources
  //   createSource: async function (req, res) {
  //     console.log("createSource");
  //     const Parameters = {
  //       type: req.body.transaction_type,
  //       currency: req.body.currency,
  //       owner: {
  //         email: req.body.email,
  //       },
  //       items: [
  //         {
  //           plan: req.body.plan,
  //         },
  //       ],
  //     };
  //     try {
  //       const subscription = await this.stripe.sources.create(Parameters);
  //       return { err: null, data: customer };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  //   receiveToken: async function (req, res) {
  //     console.log("createSource");
  //     const Parameters = {
  //       name: req.body.name,
  //       email: req.body.email,
  //       description: req.body.description, // This is from using a token to generate a customer with a ACH set up, and to verify the account
  //     };

  //     try {
  //       const customer = await this.stripe.customers.create(Parameters);
  //       const source = await this.stripe.source.createSource(customer.id, {
  //         source: req.body.token,
  //       });
  //       const bankAccount = await this.stripe.customers.verifySource(
  //         source.customer,
  //         source.id,
  //         {
  //           amounts: [32, 45],
  //         }
  //       );

  //       return { err: null, data: bankAccount };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },

  //   processEvents: async function (req, res) {
  //     console.log("processEvents");
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
  //           console.log("PaymentIntent was successful!");
  //           break;
  //         case "payment_method.attached":
  //           const paymentMethod = hookEvent.data.object;
  //           console.log("PaymentMethod was attached to a Customer!");
  //           break;
  //         // ... handle other event types
  //         default:
  //           console.log(`Unhandled event type ${hookEvent.type}`);
  //       }

  //       // Return a response to acknowledge receipt of the event
  //       res.status(200).json({ received: true });
  //     } catch (error) {
  //       this.errorHandling(error);
  //       res.sendStatus(400);
  //     }
  //   },

  //   createWebhook: async function (endpoint, events) {
  //     console.log("createWebhook");
  //     const url = `${endpoint}`;
  //     try {
  //       const endpoint = await this.stripe.webhookEndpoints.create({
  //         url: url,
  //         enabled_events: this.ENABLED_EVENTS,
  //       });
  //       return { err: null, data: endpoint };
  //     } catch (error) {
  //       this.errorHandling(error);
  //       return { err: error, data: null };
  //     }
  //   },
  private errorHander(error: any) {
    const errorType = error.type as StripeErrorType;
    let message: string
    const status: number = error.code
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
    return new StripeError({
      message,
      type: errorType,
      status
    })
  }
}

// new StripeServiceClass("pk_test_N93rD2WkRxHsvEWWySb7redc")

// const SDK = {
//   endpointSecret: auth.stripe.endpointSecret,
//   TEMPLATES: {
//     dummyCharge: {
//       amount: 2000,
//       currency: "usd",
//       source: "tok_mastercard",
//       description: "My first payment",
//     },
//   },
//   ENABLED_EVENTS: [
//     "payment_intent.payment_failed",
//     "payment_intent.succeeded",
//     "payment_method.attached",
//   ],
//   errorHandling: function (err) {
//     const snapErr = "snapInError";
//     switch (err.type) {
//       case "StripeCardError":
//         err[snapErr] = this.MESSAGES[err.type];
//         err.message; // => e.g. "Your card's expiration year is invalid."
//         break;
//       case "RateLimitError":
//       case "StripeInvalidRequestError":
//       case "StripeAPIError":
//       case "StripeConnectionError":
//       case "StripeAuthenticationError":
//         err[snapErr] = this.MESSAGES[err.type];
//         break;
//       default:
//         err[snapErr] = this.MESSAGES.DefaultError;
//         break;
//     }
//     return err;
//   },





// };
// module.exports = {
//   SDK,
// };
