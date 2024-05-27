const { Hono } = require("hono");
const { html } = require("hono/html");
const layout = require("../layout");

const app = new Hono();

app.get("/", (c) => {
  const { user } = c.get("session") ?? {};
  const displayName = user?.name ?? "anonymous";

  return c.html(layout(c, "潜水艦ゲーム", html`
    <canvas id="rader"></canvas>
    <canvas id="score"></canvas>
    <h3>${displayName}</h3>
    <script 
      id="main" 
      src="/javascripts/index/bundle.js" 
      data-displayName="${displayName}" 
      data-thumbUrl="${user?.picture ?? "anonymous"}" 
      data-ipAddress="${process.env.SERVER_URL}"
    ></script>
  `));
});

module.exports = app;