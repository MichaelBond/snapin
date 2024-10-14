const auth = require("../../config/auth.js");
const STRIPE = require("stripe")(auth.stripe.testSecretKey);

const SDK = {
  endpointSecret: auth.stripe.endpointSecret,
  MESSAGES: {
    StripeCardError: "A declined card error",
    StripeRateLimitError: "Too many requests made to the API too quickly",
    StripeInvalidRequestError:
      "Invalid parameters were supplied to Stripe's API",
    StripeAPIError: "An error occurred internally with Stripe's API",
    StripeConnectionError:
      "Some kind of error occurred during the HTTPS communication",
    StripeAuthenticationError: "You probably used an incorrect API key",
    DefaultError: "Handle any other types of unexpected errors",
  },
  TEMPLATES: {
    dummyCharge: {
      amount: 2000,
      currency: "usd",
      source: "tok_mastercard",
      description: "My first payment",
    },
  },
  ENABLED_EVENTS: [
    "payment_intent.payment_failed", 
    "payment_intent.succeeded",
    "payment_method.attached",
  ],
  errorHandling: function (err) {
    const snapErr = "snapInError";
    switch (err.type) {
      case "StripeCardError":
        err[snapErr] = this.MESSAGES[err.type];
        err.message; // => e.g. "Your card's expiration year is invalid."
        break;
      case "RateLimitError":
      case "StripeInvalidRequestError":
      case "StripeAPIError":
      case "StripeConnectionError":
      case "StripeAuthenticationError":
        err[snapErr] = this.MESSAGES[err.type];
        break;
      default:
        err[snapErr] = this.MESSAGES.DefaultError;
        break;
    }
    return err;
  },

  processEvents: async function (req, res) {
    console.log("processEvents");
    const signed = req.headers['stripe-signature'];
    const parts = signed.split(',');
    let tStamp = null;
    let payLoad = null;
    let testLoad = null;
    parts.forEach((item, i) => {
        let keyvalue = item.split('=');
        if ( keyvalue[0] === 't') {
            tStamp = keyvalue[1];
        }
        else if ( keyvalue[0] === 'v1') {
            payLoad = keyvalue[1];
        }
        else if ( keyvalue[0] === 'v0') {
            testLoad = keyvalue[1];
        }
    });

    try {
      const hookEvent = await STRIPE.webhooks.constructEvent(req.body, signed, this.endpointSecret);

      switch (hookEvent.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = hookEvent.data.object;
          console.log('PaymentIntent was successful!');
          break;
        case 'payment_method.attached':
          const paymentMethod = hookEvent.data.object;
          console.log('PaymentMethod was attached to a Customer!');
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${hookEvent.type}`);
      }
    
      // Return a response to acknowledge receipt of the event
      res.status(200).json({received: true});
    } catch (error) {
      this.errorHandling(error);
      res.sendStatus(400)
    }
  },
  
  createWebhook: async function (endpoint, events) {
    console.log("createWebhook");
    const url = `${endpoint}`;
    try {
      const endpoint = await STRIPE.webhookEndpoints.create({
        url: url,
        enabled_events: this.ENABLED_EVENTS,
      });
      return { err: null, data: endpoint };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  listPlans: async function (req, res) {
    console.log("listPlans");
    try {
      const plans = await STRIPE.plans.list({ limit: 10 });
      return { err: null, data: plans };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getBalance: async function (req, res) {
    console.log("getBalance");
    try {
      const balance = await STRIPE.balance.retrieve();
      return { err: null, data: balance };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getBalanceHistoryById: async function (req, res) {
    console.log("getBalanceHistoryById (ID):", req.params.id);
    const ID = req.params.id;
    try {
      const balanceTransaction = await STRIPE.balanceTransactions.retrieve(ID);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getPlanById: async function (req, res) {
    console.log("getBalanceHistoryById (ID):", req.params.id);
    const ID = req.params.id;
    try {
      const balanceTransaction = await STRIPE.plans.retrieve(ID);
      return { err: null, data: balanceTransaction };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  createPlan: async function (req, res) {
    /*  amount: number, like 999 is $9.99
            currency: "usd", Three-letter ISO currency code
            interval: "day", "week", "month", "year"
            product: {
                name: string,
            }
        */
    console.log("createPlan:");
    const Parameters = {
      amount: req.body.amount,
      currency: req.body.currency,
      interval: req.body.interval,
      product: {
        name: req.body.name,
      },
    };
    try {
      const plan = await STRIPE.plans.create(Parameters);
      return { err: null, data: plan };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  updatePlan: async function (req, res) {
    console.log("updatePlan (ID):", req.params.id);
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const plan = await STRIPE.plans.update(ID, Parameters);
      return { err: null, data: plan };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  deletePlan: async function (req, res) {
    console.log("deletePlan (ID):", req.params.id);
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const plan = await STRIPE.plans.del(ID);
      return { err: null, data: plan };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  // Charge Functions
  getCharges: async function (req, res) {
    console.log("getCharges:");
    try {
      const charges = await STRIPE.charges.list({ limit: 10 });
      return { err: null, data: charges };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getChargeById: async function (req, res) {
    console.log("getChargeById:");
    const ID = req.params.id;
    try {
      const charge = await STRIPE.charges.retrieve(ID);
      return { err: null, data: charge };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  makeCharge: async function (req, res) {
    console.log("makeCharge:");
    const ID = req.params.id;
    const Parameters = {
      amount: req.body.amount,
      currency: req.body.currency, // "usd"
      description: req.body.description, // "Example Charge
      source: req.body.stripeToken, // source:'tok_visa'
      // source: stripeToken.id
    };
    try {
      const charge = await STRIPE.charges.create(Parameters);
      return { err: null, data: charge };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  captureChargeById: async function (req, res) {
    console.log("captureChargeById:");
    const ID = req.params.id;
    try {
      const charge = await STRIPE.charges.capture(ID);
      return { err: null, data: charge };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  updateCharge: async function (req, res) {
    console.log("updateCharge:");
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const charge = await STRIPE.charges.capture(ID, Parameters);
      return { err: null, data: charge };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  // Customer Functions
  listCustomers: async function (req, res) {
    console.log("listCustomers");
    try {
      const customers = await STRIPE.customers.list({ limit: 10 });
      return { err: null, data: customers };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getCustomerById: async function (req, res) {
    console.log("getCustomerById");
    const ID = req.params.id;
    try {
      const customer = await STRIPE.customers.retrieve(ID);
      return { err: null, data: customer };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  createCustomer: async function (req, res) {
    console.log("createCustomer");
    const Parameters = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email, //"brycerbond@gmail.com",
      description: req.body.description, //"This is a description, hehe",
      source: req.body.source, //"tok_visa"
    };
    try {
      const customer = await STRIPE.customers.create(Parameters);
      return { err: null, data: customer };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  updateCustomer: async function (req, res) {
    console.log("updateCustomer");
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const customer = await STRIPE.customers.update(ID, Parameters);
      return { err: null, data: customer };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  deleteCustomer: async function (req, res) {
    console.log("deleteCustomer");
    const ID = req.params.id;
    try {
      const confirmation = await STRIPE.customers.del(ID);
      return { err: null, data: confirmation };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  // Products
  createProductService: async function (req, res) {
    console.log("createProductService");
    const Parameters = {
      name: req.body.name,
      type: req.body.type,
    };
    try {
      const product = await STRIPE.products.create(Parameters);
      return { err: null, data: product };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  createPricedProduct: async function (req, res) {
    console.log("createPricedProduct");
    const ProdParameters = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description
    };
    try {
      const product = await STRIPE.products.create(ProdParameters);
      const PriceParameters = {
        unit_amount: req.body.unit_amount,
        currency: req.body.currency,
        recurring: req.body.recurring,
        product_id: product.id
      };
      const price = await STRIPE.prices.create(PriceParameters);
      return { err: null, data: { product: product, price: price } };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }

  },
  listProducts: async function (req, res) {
    console.log("listProducts");
    try {
      const products = await STRIPE.products.list({ limit: 10 });
      return { err: null, data: customers };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  getProductById: async function (req, res) {
    console.log("getProductById (ID): ", req.params.id);
    const ID = req.params.id;
    try {
      const product = await STRIPE.products.retrieve(ID);
      return { err: null, data: product };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  updateProduct: async function (req, res) {
    console.log("updateProduct (ID): ", req.params.id);
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const product = await STRIPE.products.update(ID, Parameters);
      return { err: null, data: product };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  deleteProduct: async function (req, res) {
    console.log("deleteProduct(ID): ", req.params.id);
    const ID = req.params.id;
    try {
      const product = await STRIPE.products.update(ID);
      return { err: null, data: product };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  // Stripe Subscriptions
  getSubscriptionById: async function (req, res) {
    console.log("updateProduct (ID): ", req.params.id);
    const ID = req.params.id;
    try {
      const subscription = await STRIPE.subscriptions.retrieve(ID);
      return { err: null, data: subscription };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  listSubscriptions: async function (req, res) {
    console.log("listSubscriptions");
    try {
      const subscriptions = await STRIPE.subscriptions.list({ limit: 3 });
      return { err: null, data: subscriptions };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  createSubscription: async function (req, res) {
    console.log("createSubscription");
    const Parameters = {
      customer: req.body.customer,
      items: [
        {
          plan: req.body.plan,
        },
      ],
    };
    try {
      const subscription = await STRIPE.subscriptions.create(Parameters);
      return { err: null, data: customer };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  updateSubscription: async function (req, res) {
    console.log("updateSubscription (ID): ", req.params.id);
    const ID = req.params.id;
    const Parameters = req.body;
    try {
      const subscription = await STRIPE.subscriptions.update(ID, Parameters);
      return { err: null, data: subscription };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  deleteSubscription: async function (req, res) {
    console.log("deleteSubscription(ID): ", req.params.id);
    const ID = req.params.id;
    try {
      const confirmation = await STRIPE.subscription.del(ID);
      return { err: null, data: confirmation };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  // Stripe Sources
  createSource: async function (req, res) {
    console.log("createSource");
    const Parameters = {
      type: req.body.transaction_type,
      currency: req.body.currency,
      owner: {
        email: req.body.email,
      },
      items: [
        {
          plan: req.body.plan,
        },
      ],
    };
    try {
      const subscription = await STRIPE.sources.create(Parameters);
      return { err: null, data: customer };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
  receiveToken: async function (req, res) {
    console.log("createSource");
    const Parameters = {
      name: req.body.name,
      email: req.body.email,
      description: req.body.description, // This is from using a token to generate a customer with a ACH set up, and to verify the account
    };

    try {
      const customer = await STRIPE.customers.create(Parameters);
      const source = await STRIPE.source.createSource(customer.id, {
        source: req.body.token,
      });
      const bankAccount = await STRIPE.customers.verifySource(
        source.customer,
        source.id,
        {
          amounts: [32, 45],
        }
      );

      return { err: null, data: bankAccount };
    } catch (error) {
      this.errorHandling(error);
      return { err: error, data: null };
    }
  },
};
module.exports = {
  SDK,
};
