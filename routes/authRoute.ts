import express from 'express';
const authRouter = express.Router();
import passport from 'passport'
import "../middleware/passport"

authRouter.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: false,
}));

authRouter.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// old log out
// app.get("/logout", function (req, res) {
//   if (req._passport.session && req._passport.session.user) {
//     req.logout();
//   }
//   req.user = null;
//   req.session.destroy(); // Destroy session
//   res.clearCookie("connect.sid"); // Clear session cookie
//   res.redirect("/");
// });


export default authRouter
