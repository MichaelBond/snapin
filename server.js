// JavaScript source code
require("dotenv").config();
const fs = require("fs");
const https = require("https");
const express = require("express");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");

// Probably should not have
// const cors = require("cors");

// Need to install
// const passport = require("passport");
// const flash = require("connect-flash");
// const morgan = require("morgan");
// const multiparty = require("connect-multiparty");

// Other files that are not yet included
// var httpMsgs = require("./app/httpmsgs");
// require("./config/passport")(passport);
// require("./routes/stripe.js")(stripe, passport);
const { ENV, SNAPIN_WEBPORT } = process.env;
const arguments = process.argv.splice(2);

var settings = {
  webPort: SNAPIN_WEBPORT,
};

settings.webPort = arguments[0] ? arguments[0] : settings.webPort;
let options;
if (ENV !== "dev") {
  options = {
    key: fs.readFileSync(`${__dirname}/ssl/smartweb_key.pem`),
    cert: fs.readFileSync(`${__dirname}/ssl/smartweb_crt.pem`),
  };
}
const app = express();
app.use(express.json());

// This probably should be checked to make sure we still want this
// app.use(cors());

app.set("trust proxy", true);
const appSession = expressSession({
  secret: "cdcfd1ad28c7455ba4d626ad50b9883b34f27502dfe22347f0b5fab2154a5754",
  cookie: { secure: true, maxAge: 3600000 },
  saveUninitialized: false,
  resave: false,
});

// check what this setting does and figure out new way to do this with out bodyparser

// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );

const blockedIps = [
  "192.168.1.1",
  "10.0.2.139",
  "10.0.15.43",
  "149.36.51.12",
  "184.168.120.241",
];

app.use((req, res, next) => {
  const ip = req.ip;
  const address = req.socket.remoteAddress;
  if (blockedIps.includes(ip) || blockedIps.includes(address)) {
    console.log(`Ip blocked: ${ip} : ${address}`);
    res.status(403).send("Access denied - IP Blocked");
  } else {
    next();
  }
});

// check what this setting does and figure out new way to do this with out bodyparser

// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// app.use(bodyParser.json({ limit: "50mb" }));

// Needs to be added in again when files are ready

// app.use(appSession);
// app.use(passport.initialize());
// app.use(passport.session(appSession));

app.set("view engine", "ejs");

// This doesn't seem to be called anywhere?
const getClientAddress = function (req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    req.connection.remoteAddress
  );
};

// Check package and see if needed to be reinstalled

// const multipartyMiddleware = multiparty();
// app.use(multipartyMiddleware);

app.get("/robots.txt", function (req, res) {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /");
});

// Check to make sure we need this

// app.use("/sites", express.static(`${__dirname}/sites`));
// app.use("/secure", express.static(`${__dirname}/sites`));
// app.use("/secure/sites", express.static(`${__dirname}/sites`));
// app.use("/secure/smartwebpro9", express.static(`${__dirname}/sites`));
//app.use("/stripe", express.static(`${__dirname}/stripe`));

// check if we need this

// app.use(morgan("dev"));

app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));

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
//   console.log(hostname);
//   if (req.hostname === "www.quantrex.com") {
//     const endpoint = `${req.protocol}://gtm.smartweb-pro.com/sites/opensite/-141`;
//     return res.redirect(endpoint);
//   }
//   next();
// });

app.get("/", function (req, res) {
  res.render("auth/splash.ejs", { user: null });
});
app.get("/home", function (req, res) {
  res.render("auth/splash.ejs", { user: req.user });
});

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

// const stripe = express.Router();
// app.use("/stripe", stripe);

app.use((req, res, next) => {
  // If no previous route/method matched, we end up here (404 Not Found)
  console.log(`Route Invalid: ${req.socket.remoteAddress}, ${req.ip}`);
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
  console.log(req.socket.remoteAddress);
});

if (ENV === "dev") {
  app.listen(SNAPIN_WEBPORT, () => {
    console.log(`Example app listening on port ${SNAPIN_WEBPORT}`);
  });
} else {
  https.createServer(options, app).listen(settings.webPort, function () {
    console.log("Express server listening on port " + settings.webPort);
  });
}
