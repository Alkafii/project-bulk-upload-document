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