const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const contentRoutes = require("./routes/contentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const notificationRoutes = require("./routes/notification");
const quizBattleSocket = require("./sockets/quizBattleSocket");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));



app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notification", notificationRoutes);


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust as needed
        methods: ["GET", "POST"],
    },
});


app.listen(3000, () => console.log("Server running on port 3000"));
