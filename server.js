// JavaScript source code
require("dotenv").config();

const arguments = process.argv.splice(2);
var settings = {
  webPort: process.env.SNAPIN_WEBPORT,
};
const fs = require("fs");
const https = require("https");
const cors = require("cors");

settings.webPort = arguments[0] ? arguments[0] : settings.webPort;

const options = {
  key: fs.readFileSync(`${__dirname}/ssl/smartweb_key.pem`),
  cert: fs.readFileSync(`${__dirname}/ssl/smartweb_crt.pem`),
};

const express = require("express");
const passport = require("passport");
const expressSession = require("express-session");
const app = express();
app.use(cors());
app.set("trust proxy", true);
const appSession = expressSession({
  secret: "cdcfd1ad28c7455ba4d626ad50b9883b34f27502dfe22347f0b5fab2154a5754",
  cookie: { secure: true, maxAge: 3600000 },
  saveUninitialized: false,
  resave: false,
});

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
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
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.use(appSession);
app.use(passport.initialize());
app.use(passport.session(appSession));

require("./config/passport")(passport);

app.set("view engine", "ejs");

const getClientAddress = function (req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    req.connection.remoteAddress
  );
};

const morgan = require("morgan");
const multiparty = require("connect-multiparty");
const multipartyMiddleware = multiparty();

app.use(multipartyMiddleware);

const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
var httpMsgs = require("./app/httpmsgs");

app.get("/robots.txt", function (req, res) {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /");
});

app.use("/sites", express.static(`${__dirname}/sites`));
app.use("/secure", express.static(`${__dirname}/sites`));
app.use("/secure/sites", express.static(`${__dirname}/sites`));
app.use("/secure/smartwebpro9", express.static(`${__dirname}/sites`));
//app.use("/stripe", express.static(`${__dirname}/stripe`));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(flash());

app.get("/healthcheck", (req, res) => {
  console.log("PORT: ", process.env.SNAPIN_WEBPORT);
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.write("loaderio-f77de18d9ec250150dd814d3933b2026");
  res.end();
});
app.get("/", (req, res, next) => {
  const hostname = req.hostname;
  console.log(hostname);
  if (req.hostname === "www.quantrex.com") {
    const endpoint = `${req.protocol}://gtm.smartweb-pro.com/sites/opensite/-141`;
    return res.redirect(endpoint);
  }
  next();
});
app.get("/", function (req, res) {
  res.render("auth/splash.ejs", { user: null });
});
app.get("/home", function (req, res) {
  res.render("auth/splash.ejs", { user: req.user });
});

app.get("/logout", function (req, res) {
  if (req._passport.session && req._passport.session.user) {
    req.logout();
  }
  req.user = null;
  req.session.destroy(); // Destroy session
  res.clearCookie("connect.sid"); // Clear session cookie
  res.redirect("/");
});
// API ROUTES

// PUBLIC ROUTES

// AUTHORIZATION ROUTES

// PROTECTED ROUTES

// const stripe = express.Router();
// require("./routes/stripe.js")(stripe, passport);
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

app.use(function (req, res) {
  console.log(req.socket.remoteAddress);
});

https.createServer(options, app).listen(settings.webPort, function () {
  console.log("Express server listening on port " + settings.webPort);
});
