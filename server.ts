import fs from 'fs'
import https from 'https'
import express, { Request, Response } from 'express'
import session from "express-session";
import cookieParser from 'cookie-parser'
import stripeRouter from './routes/stripeRoute'
import testRouter from './routes/mssqlRoute'
import authRouter from './routes/authRoute';
import configs from './configs/config'
import logger from './utils/logger'
import { requestIdMiddleware } from './middleware/requestIdMiddleware'
import requestLoggingMiddleware from './middleware/requestLoggingMiddleware';
import publicRouter from './routes/publicClientRoute';
import passport from 'passport';
import isAuthenticated from './middleware/isAuthenticated'
import privateClientRouter from './routes/privateClientRoute'

// Probably should not have especially in prod 
// const cors = require("cors");

// Need to install
// const flash = require("connect-flash");
// const morgan = require("morgan");
// const multiparty = require("connect-multiparty");

// Other files that are not yet included

// var httpMsgs = require("./app/httpmsgs");

const { ENV, SNAPIN_WEBPORT, SNAPIN_SESSION_SECRET } = configs;

const blockedIps = [
  "192.168.1.1",
  "10.0.2.139",
  "10.0.15.43",
  "149.36.51.12",
  "184.168.120.241",
];

const app = express();

// Middleware 
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

app.set("view engine", "ejs");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestIdMiddleware)
app.use(requestLoggingMiddleware)

app.use((req, res, next) => {
  const ip: any = req.ip;
  const address: any = req.socket.remoteAddress;
  if (blockedIps.includes(ip) || blockedIps.includes(address)) {
    logger.info(`Ip blocked: ${ip} : ${address}`);
    res.status(403).send("Access denied - IP Blocked");
  } else {
    next();
  }
});

app.use(
  session({
    secret: SNAPIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.set("trust proxy", true); // not sure what this does 

app.use(passport.initialize());
app.use(passport.session());

// API ROUTES
// PUBLIC ROUTES

publicRouter.get("/healthcheck", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.write("loaderio-f77de18d9ec250150dd814d3933b2026");
  res.end();
});

app.use(publicRouter)

// AUTHORIZATION ROUTES
app.use("/auth", authRouter)

app.use(isAuthenticated)

// Protected routes
app.use(privateClientRouter)
app.use('/api/test', testRouter)
app.use('/api/stripe', stripeRouter)

// This doesn't seem to be called anywhere?
// const getClientAddress = function (req: Request) {
//   return (
//     (req.headers.get("x-forwarded-for") || "").split(",")[0] ||
//     req.connection.remoteAddress
//   );
// };

// Check package and see if needed to be reinstalled

// const multipartyMiddleware = multiparty();
// app.use(multipartyMiddleware);

// app.get("/robots.txt", function (req, res) {
//   res.type("text/plain");
//   res.send("User-agent: *\nDisallow: /");
// });

// check if we need this

// app.use(morgan("dev"));


// check if needed
// app.use(flash());


// This may need to be conditional based on if not dev?

// app.get("/", (req, res, next) => {
//   const hostname = req.hostname;
//   logger.info(hostname);
//   if (req.hostname === "www.quantrex.com") {
//     const endpoint = `${req.protocol}://gtm.smartweb-pro.com/sites/opensite/-141`;
//     return res.redirect(endpoint);
//   }
//   next();
// });

app.use((req, res, next) => {
  // If no previous route/method matched, we end up here (404 Not Found)
  logger.info(`Route Invalid: ${req.socket.remoteAddress}, ${req.ip}`);
  if (req.accepts("html")) {
    res
      .status(404)
      .send(
        `<html><body><h1>404 - Not Found</h1><h2>Sorry, that route doesn't exist. Conducting reverse tracking  on  ${req.socket.remoteAddress}, ${req.ip}</h2></body></html>`
      );
  } else if (req.accepts("json")) {
    res.status(404).json({
      error: "Not Found",
      message: `<h1>Sorry, that route doesn't exist.</h1><h2>Conducting reverse tracking on  ${req.socket.remoteAddress}, ${req.ip}.</h2>`,
    });
  } else {
    res
      .status(404)
      .type("txt")
      .send(
        `<h1>Sorry, that route doesn't exist.</h1><h2>Conducting reverse tracking on  ${req.socket.remoteAddress}, ${req.ip}.</h2>`
      );
  }
});


if (ENV === "dev" || ENV === "docker") {
  // When running locally 
  app.listen(SNAPIN_WEBPORT, () => {
    // This is fine, it's only locally, but could be ran in logger as well
    logger.info(`App listening on port ${SNAPIN_WEBPORT}`);
  });
} else {
  // When running on EC2
  const options = {
    key: fs.readFileSync(`${__dirname}/ssl/smartweb_key.pem`),
    cert: fs.readFileSync(`${__dirname}/ssl/smartweb_crt.pem`),
  };
  https.createServer(options, app).listen(SNAPIN_WEBPORT, function () {
    // We should be doig a logger 
    logger.info("Express server listening on port " + SNAPIN_WEBPORT);
  });
}
