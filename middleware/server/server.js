const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const PORT = process.env.RELAY_SERVER_PORT || 5000;

const app = express();
app.use(express.json());

app.use(cors());
app.options("*", cors());

app.use("/", require("./routes/index"));

const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ------------------------- SOCKET.IO ------------------------- //
const io = new Server(server, {
	cors: { origin: "*" },
});

require("./controllers/socketController.js")(io);
