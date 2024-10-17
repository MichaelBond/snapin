import fs from 'fs'
import https from 'https'
import express from 'express'
import expressSession from "express-session";
import cookieParser from 'cookie-parser'
import stripeRouter from './routes/stripeRoute'
import mssqlRouter from './routes/mssqlRoute'
import configs from './configs/config'
import logger from './utils/logger'
import { requestIdMiddleware } from './middleware/requestIdMiddleware'
import requestLoggingMiddleware from './middleware/requestLoggingMiddleware';
import clientRouter from './routes/clientRoute';

// Probably should not have especially in prod 
// const cors = require("cors");

// Need to install
// const passport = require("passport");
// const flash = require("connect-flash");
// const morgan = require("morgan");
// const multiparty = require("connect-multiparty");

// Other files that are not yet included

// var httpMsgs = require("./app/httpmsgs");
// require("./config/passport")(passport);

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
const appSession = expressSession({
  secret: SNAPIN_SESSION_SECRET || "",
  cookie: { secure: true, maxAge: 3600000 },
  saveUninitialized: false,
  resave: false,
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(appSession);
app.use(requestIdMiddleware)
app.use(requestLoggingMiddleware)
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.set("view engine", "ejs");
app.set("trust proxy", true); // not sure what this does 

// This probably should be checked to make sure we still want this, maybe put this in the client router if so? 
// app.use(cors());

// Routers
app.use('/', clientRouter)
app.use('/api/stripe', stripeRouter)
app.use('/api/mssql', mssqlRouter)


// when implementing passport enable this  
// app.use(passport.initialize());
// app.use(passport.session(appSession));


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

// Check to make sure we need this


// check if we need this

// app.use(morgan("dev"));


// check if needed
// app.use(flash());

app.get("/healthcheck", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.write("loaderio-f77de18d9ec250150dd814d3933b2026");
  res.end();
});
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



// app.get("/logout", function (req, res) {
//   if (req._passport.session && req._passport.session.user) {
//     req.logout();
//   }
//   req.user = null;
//   req.session.destroy(); // Destroy session
//   res.clearCookie("connect.sid"); // Clear session cookie
//   res.redirect("/");
// });
// API ROUTES

// PUBLIC ROUTES

// AUTHORIZATION ROUTES

// PROTECTED ROUTES



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
// WE Should look into a dedicated logger for logs, set different levels of logging
// Look into Winston.js
app.use(function (req, res) {
  logger.info(req.socket.remoteAddress);
});

if (ENV === "dev" || ENV === "docker") {
  // When running locally 
  app.listen(SNAPIN_WEBPORT, () => {
    // This is fine, it's only locally, but could be ran in logger as well
    logger.info(`Example app listening on port ${SNAPIN_WEBPORT}`);
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
