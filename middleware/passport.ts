import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

// Mock users database for simplicity
const users = [{ id: 1, username: 'admin', password: 'password' }];

passport.use(new LocalStrategy((username, password, done) => {
    const user = users.find(user => user.username === username);

    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }
    if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
}));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser((id: number, done) => {
    const user = users.find((u) => u.id === id);
    if (user) {
        done(null, user);
    } else {
        done(null, false);
    }
});