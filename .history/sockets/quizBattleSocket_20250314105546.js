const QuizBattle = require("../models/quizbattle");
const Question = require("../models/questions");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins a battle room
    socket.on("joinBattle", async ({ battleId, userId }) => {
      try {
        socket.join(battleId);
        console.log(`User ${userId} joined Battle Room: ${battleId}`);
        // Optionally emit the current battle details here if needed
      } catch (error) {
        console.error("Error joining battle:", error);
        socket.emit("error", { message: "Error joining battle", details: error.message });
      }
    });

    // Event: Get Battle Details
    socket.on("getBattleDetails", async ({ battleId }) => {
      try {
        const battle = await QuizBattle.findById(battleId)
          .populate("player1", "name avatar")
          .populate("player2", "name avatar")
          .populate("questions")
          .populate("player1Answers.questionId", "question correctAnswer")
          .populate("player2Answers.questionId", "question correctAnswer");
        if (!battle) {
          return socket.emit("error", { message: "Battle not found" });
        }
        // Emit battle details back to the requesting socket
        socket.emit("battleDetails", battle);
      } catch (error) {
        console.error("Error fetching battle details:", error);
        socket.emit("error", { message: "Error fetching battle details", details: error.message });
      }
    });

    // Handling answer submission
    socket.on("submitAnswer", async ({ battleId, userId, questionId, answer }) => {
      try {
        const battle = await QuizBattle.findById(battleId);
        if (!battle) {
          return socket.emit("error", { message: "Battle not found" });
        }

        const isCorrect = await checkAnswer(questionId, answer);
        const points = isCorrect ? 10 : 0;

        if (battle.player1.toString() === userId) {
          battle.player1Score += points;
          battle.player1Answers.push({ questionId, answer, isCorrect });
        } else if (battle.player2.toString() === userId) {
          battle.player2Score += points;
          battle.player2Answers.push({ questionId, answer, isCorrect });
        }

        await battle.save();
        io.to(battleId).emit("battleUpdated", battle);

        if (await allQuestionsAnswered(battle)) {
          battle.status = "Completed";
          if (battle.player1Score > battle.player2Score) {
            battle.winner = battle.player1;
          } else if (battle.player1Score < battle.player2Score) {
            battle.winner = battle.player2;
          } else {
            battle.winner = null; // Handle tie as needed
          }
          await battle.save();
          io.to(battleId).emit("battleCompleted", { battle });
        }
      } catch (error) {
        console.error("Error processing answer:", error);
        socket.emit("error", { message: "Error submitting answer", details: error.message });
      }
    });

    socket.on("leaveBattle", async ({ battleId, userId }) => {
      try {
        const battle = await QuizBattle.findById(battleId);
        if (!battle) {
          return socket.emit("error", { message: "Battle not found" });
        }
        battle.status = "Ended";
        await battle.save();
        socket.leave(battleId);
        io.to(battleId).emit("battleUpdated", battle);
      } catch (error) {
        console.error("Error leaving battle:", error);
        socket.emit("error", { message: "Error leaving battle", details: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

// Asynchronous checkAnswer function
async function checkAnswer(questionId, providedAnswer) {
  try {
    const question = await Question.findById(questionId).lean();
    if (!question) return false;
    return question.correctAnswer.trim().toUpperCase() === providedAnswer.trim().toUpperCase();
  } catch (error) {
    console.error("Error in checkAnswer:", error);
    return false;
  }
}

// Function to check if all questions have been answered
async function allQuestionsAnswered(battle) {
  try {
    // Example: Check if the sum of answers equals the total number of questions.
    const totalAnswers = battle.player1Answers.length + battle.player2Answers.length;
    return totalAnswers >= battle.questions.length;
  } catch (error) {
    console.error("Error in allQuestionsAnswered:", error);
    return false;
  }
}
