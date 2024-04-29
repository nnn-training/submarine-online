"use strict";

const { Hono } = require("hono");
const { logger } = require("hono/logger");
const { html } = require("hono/html");
const { secureHeaders } = require("hono/secure-headers");
const { serveStatic } = require("@hono/node-server/serve-static");
const { googleAuth } = require("@hono/oauth-providers/google");
const { getIronSession } = require("iron-session");
const layout = require("./layout");

const indexRouter = require("./routes/index");
const gameRouter = require("./routes/game");

const app = new Hono();

app.use(logger());
app.use(serveStatic({ root: "./public" }));
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      imgSrc: ["'self'", "*.googleusercontent.com"],
    },
  })
);

app.use(async (c, next) => {
  const session = await getIronSession(c.req.raw, c.res, {
    password: process.env.SESSION_PASSWORD,
    cookieName: "session",
  });
  c.set("session", session);
  await next();
});

app.get(
  "/auth/google",
  googleAuth({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    scope: ["profile"],
  }),
  async (c) => {
    const session = c.get("session");
    session.user = c.get("user-google");
    await session.save();
    return c.redirect("/");
  }
);

app.get("/logout", async (c) => {
  const session = c.get("session");
  session.destroy();
  return c.redirect("/");
})

app.route("/", indexRouter);
app.route("/game", gameRouter);

module.exports = app;
