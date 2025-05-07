import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./utils/db.js";
import path from "path";

// routes
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import bankRoute from "./routes/bank.route.js";
import searchFilterRoute from "./routes/searchFilter.route.js";
import messageRoute from "./routes/message.route.js";
import notificationRoute from "./routes/notification.route.js";

dotenv.config();

// Get the directory name using import.meta.url (for ES modules)
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();

// Serve static files from the frontend's dist directory
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const server = http.createServer(app); // Use HTTP server

// Set allowed origins for CORS based on the environment
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? "https://save-lives-9yue.onrender.com"
    : "http://localhost:5173";

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Set up CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Define API routes
app.use("/api/auth", authRoute);
app.use("/api/post", postRoute);
app.use("/api/bank", bankRoute);
app.use("/api/searchFilter", searchFilterRoute);
app.use("/api/messages", messageRoute);
app.use("/api/notification", notificationRoute);

// Store users and socket ids
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    users.set(userId, socket.id);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiverSocketId = users.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        senderId,
        text,
        createdAt: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Serve static frontend files after build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Serve the index.html file for any other route (single-page app fallback)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

server.listen(3000, () => {
  console.log("Server is running on port 3000");
  connectDB();
});
