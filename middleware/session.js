<<<<<<< HEAD
import session from "express-session";
import flash from "connect-flash";
import connectPgSimple from "connect-pg-simple";
import db from "./../config/database.js";


const PgSession = connectPgSimple(session);

const sessionMiddleware = session({
  store: new PgSession({
    pool: db,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),

  secret: process.env.SESSION_SECRET,

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
});

const flashMiddleware = flash();


export {sessionMiddleware, flashMiddleware};
=======
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
>>>>>>> a173ff136bcb27a53e072e5812b634f8cad284f3
