const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const contentRoutes = require("./routes/contentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const notificationRoutes = require("./routes/notification");
const quizBattleSocket = require("./sockets/quizBattleSocket");
const battleRoutes = require("./routes/battleRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust as needed
        methods: ["GET", "POST"],
    },
});

// Initialize Socket.io logic for Quiz Battle
quizBattleSocket(io);

mongoose.connect("mongodb://127.0.0.1:27017/tutolink", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/battle", battleRoutes);

server.listen(3000, () => console.log("Server running on port 3000"));
