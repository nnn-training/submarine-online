const { Hono } = require("hono");
const { html } = require("hono/html");
const layout = require("../layout");

const app = new Hono();

app.get("/", (c) => {
  const { user } = c.get("session") ?? {};
  return c.html(layout(c, "Home", html`
    <h1>オンライン潜水艦ゲーム</h1>
    ${user ? html`
      <h4>以下のアカウントでゲームに参加できます。</h4>
      <h2>${user.name}</h2>
      ${user.picture && html`<img src="${user.picture}" />`}
      <h2>
        <a href="game">${user.name} でゲームに参加</a>
      </h2>
      <h3>
        <a href="logout">ログアウト</a>
      </h3>
    ` : html`
      <h3>記録を残すには Google でログインしてください。</h3>
      <h3>
        <a href="/auth/google">Google でログイン</a>
      </h3>
      <h3>
        <a href="game">匿名でゲームに参加</a>
      </h3>
    `}
  `));
});

module.exports = app;
