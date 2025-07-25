import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "../swagger-output.json";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import routes from "./routes";
import { registerSocketHandlers } from "./socket";
import path from "path";

const app = express();


dotenv.config();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/", routes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerFile);
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "images")));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: true,
  },
});

app.set("io" , io)

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  registerSocketHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
