const { html } = require("hono/html");

function layout(c, title, body) {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="/stylesheets/style.css" />
      </head>
      <body>
        ${body}
      </body>
    </html>
  `;
}

module.exports = layout;
