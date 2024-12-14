import express from "express";
import taskRoutes from "./routes/tasksRouter";
import urlRoute, { ensureFileExists, loadWordCounts } from "./routes/urlRouter";
import authRouter from "./routes/authRouter";
import connectUserDB from "./connections/userDB";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware";
import userRouter from "./routes/userRouter";
import { authenticate } from "./middleware/authMiddleware";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

interface UserBasicInfo {
  _id: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserBasicInfo | null;
    }
  }
}
const app = express();
const port = process.env.PORT || 8000;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(errorHandler);

app.use(express.json());
app.use("/url", urlRoute);
app.use(authRouter);
app.use("/users", authenticate, userRouter);

const httpServer = createServer(app);
let users: any[] = [];

const socketIO = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("message", (data) => {
    socketIO.emit("messageResponse", data);
  });

  //Listens when a new user joins the server
  socket.on("newUser", (data) => {
    users.push(data);
    console.log(data, "data");
    socketIO.emit("newUserResponse", users);
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
    users = users.filter((user) => user.socketID !== socket.id);
    socketIO.emit("newUserResponse", users);
    socket.disconnect();
  });
});

httpServer.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
});
connectUserDB();
