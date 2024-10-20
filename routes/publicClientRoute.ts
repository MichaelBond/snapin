import express from 'express';
const router = express.Router();

router.get("/login", (req, res) => {
    res.render("auth/login.ejs", { user: req.user, message: 'Test' });
});

router.get("/", function (req, res) {
    res.render("auth/splash.ejs", { user: null });
});
router.get("/home", function (req, res) {
    res.render("auth/splash.ejs", { user: req?.user });
});
router.get("/signup", function (req, res) {
    res.render("auth/signup.ejs", { user: req?.user, message: "Signup" });
});
router.get("/change-password", function (req, res) {
    res.render("auth/changepassword.ejs", { user: req?.user, message: "Change Password" });
});
router.get("/chat", function (req, res) {
    res.render("public/chat.ejs", { user: req?.user, message: "Chat" });
});
router.get("/reset-password", function (req, res) {
    res.render("auth/resetpassword.ejs", { user: req?.user, message: "Reset Password" });
});
router.get("/security", function (req, res) {
    res.render("public/dodsecurity.ejs", { user: req.user });
});
router.get("/privacy", function (req, res) {
    res.render("public/privacy.ejs", { user: req.user });
});
router.get("/image-upload", function (req, res) {
    res.render("public/image_upload.ejs", { user: req.user });
});

router.get("/cookies", function (req, res) {
    res.render("public/cookies.ejs", { user: req.user });
});
router.get("/refunds", function (req, res) {
    res.render("public/refunds.ejs", { user: req.user });
});
router.get("/tandc", function (req, res) {
    res.render("public/tandc.ejs", { user: req.user });
});
router.get("/license", function (req, res) {
    res.render("public/license.ejs", { user: req.user });
});
router.get("/disclaimer", function (req, res) {
    res.render("public/disclaimer.ejs", { user: req.user });
});

// Client probably needs to be overhauled
// This is place when needed 

// router.use("/secure", express.static(`/public`))
// router.use("/secure/sites", express.static(`${__dirname}/sites`))
// router.use("/secure/smartwebpro9", express.static(`${__dirname}/sites`))
// router.use("/stripe", express.static(`${__dirname}/stripe`))

export default router
