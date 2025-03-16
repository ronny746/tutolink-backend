const QuizBattle = require("../models/quizbattle");
const Question = require("../models/questions");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins a battle room
    socket.on("joinBattle", async ({ battleId, userId }) => {
      try {
        socket.join(battleId);
        console.log(`User ${userId} joined Battle Room: ${battleId}`);

        // Optionally, send the current battle details to the user who joined.
        const battle = await QuizBattle.findById(battleId)
          .populate("player1", "name")
          .populate("player2", "name");
        io.to(battleId).emit("battleUpdated", battle);
      } catch (error) {
        console.error("Error joining battle:", error);
      }
    });

    // Handling answer submission
    socket.on("submitAnswer", async ({ battleId, userId, questionId, answer }) => {
      try {
        const battle = await QuizBattle.findById(battleId);
        if (!battle) {
          return socket.emit("error", { message: "Battle not found" });
        }

        // Asynchronously check if the answer is correct
        const isCorrect = await checkAnswer(questionId, answer);
        const points = isCorrect ? 10 : 0;

        // Update score and record the answer in the corresponding player's answer array
        if (battle.player1.toString() === userId) {
          battle.player1Score += points;
          battle.player1Answers.push({ questionId, answer, isCorrect });
        } else if (battle.player2.toString() === userId) {
          battle.player2Score += points;
          battle.player2Answers.push({ questionId, answer, isCorrect });
        }

        await battle.save();

        // Emit updated battle details (including scores) to everyone in the room
        io.to(battleId).emit("battleUpdated", battle);

        // Check if battle is complete (for example, if all questions have been answered)
        if (await allQuestionsAnswered(battle)) {
          battle.status = "Completed";
          if (battle.player1Score > battle.player2Score) {
            battle.winner = battle.player1;
          } else if (battle.player1Score < battle.player2Score) {
            battle.winner = battle.player2;
          } else {
            battle.winner = null; // In case of a tie, implement your tie-breaker logic
          }
          await battle.save();
          io.to(battleId).emit("battleCompleted", { battle });
        }
      } catch (error) {
        console.error("Error processing answer:", error);
        socket.emit("error", { message: "Error submitting answer", details: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

// Asynchronous function to check if the provided answer is correct
async function checkAnswer(questionId, providedAnswer) {
  try {
    const question = await Question.findById(questionId).lean();
    if (!question) return false;
    // Compare the stored correctAnswer with the provided answer (ignoring case and extra spaces)
    return question.correctAnswer.trim().toUpperCase() === providedAnswer.trim().toUpperCase();
  } catch (error) {
    console.error("Error in checkAnswer:", error);
    return false;
  }
}

// Asynchronous function to determine if all questions have been answered in the battle
async function allQuestionsAnswered(battle) {
  try {
    // Example logic: consider battle complete if the total number of answers recorded for both players
    // equals the number of questions assigned.
    const totalAnswers = battle.player1Answers.length + battle.player2Answers.length;
    return totalAnswers >= battle.questions.length;
  } catch (error) {
    console.error("Error in allQuestionsAnswered:", error);
    return false;
  }
}
