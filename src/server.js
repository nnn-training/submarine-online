const { serve } = require("@hono/node-server");

const app = require(".");

const port = parseInt(process.env.PORT || "3000", 10);
console.log(`Starting is running on http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

const { Server } = require("socket.io");
const { createWebSocketServer } = require("./game-server/webSocketServer");
const game = require("./game-server/game");

const io = new Server(server);
createWebSocketServer(io, game);
