import session from 'express-session';
import flash from 'connect-flash';

export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    }
});

export const flashMiddleware = flash();