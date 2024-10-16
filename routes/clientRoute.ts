import express from 'express';
const clientRouter = express.Router();

clientRouter.get("/", function (req, res) {
    res.render("auth/splash.ejs", { user: null });
});
clientRouter.get("/home", function (req, res) {
    res.render("auth/splash.ejs", { user: req?.user });
});

clientRouter.get("/security", function (req, res) {
    res.render("public/dodsecurity.ejs", { user: req.user });
});
clientRouter.get("/privacy", function (req, res) {
    res.render("public/privacy.ejs", { user: req.user });
});
clientRouter.get("/cookies", function (req, res) {
    res.render("public/cookies.ejs", { user: req.user });
});
clientRouter.get("/refunds", function (req, res) {
    res.render("public/refunds.ejs", { user: req.user });
});
clientRouter.get("/tandc", function (req, res) {
    res.render("public/tandc.ejs", { user: req.user });
});
clientRouter.get("/license", function (req, res) {
    res.render("public/license.ejs", { user: req.user });
});
clientRouter.get("/disclaimer", function (req, res) {
    res.render("public/disclaimer.ejs", { user: req.user });
});

// Client probably needs to be overhauled
// This is place when needed 
// clientRouter.use("/secure", express.static(`/public`))
// clientRouter.use("/secure/sites", express.static(`${__dirname}/sites`))
// clientRouter.use("/secure/smartwebpro9", express.static(`${__dirname}/sites`))
// clientRouter.use("/stripe", express.static(`${__dirname}/stripe`))

export default clientRouter
