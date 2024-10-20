import express from 'express';
const authRouter = express.Router();
import passport from 'passport'
import "../middleware/passport"

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user using local strategy
 *     description: Authenticates the user with a JSON body containing username and password using the 'local' passport strategy. If successful, redirects to the profile page; if unsuccessful, redirects back to the login page.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user.
 *                 example: johndoe@gmail.com
 *               password:
 *                 type: string
 *                 description: The password of the user.
 *                 example: Passw0rd!
 *     responses:
 *       302:
 *         description: Redirect to either /profile or /login depending on success or failure.
 *       401:
 *         description: Unauthorized, invalid credentials.
 */


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
