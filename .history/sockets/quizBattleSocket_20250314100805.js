const QuizBattle = require("../models/quizbattle"); // Import your QuizBattle model

module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // User joins a battle room
        socket.on("joinBattle", ({ battleId, userId }) => {
            socket.join(battleId);
            console.log(`User ${userId} joined Battle Room: ${battleId}`);
        });

        // Handling answer submission
        socket.on("submitAnswer", async ({ battleId, userId, questionId, answer }) => {
            try {
                const battle = await QuizBattle.findById(battleId);
                if (!battle) return;

                const isCorrect = checkAnswer(questionId, answer); // Function to check answer
                let points = isCorrect ? 10 : 0; // Example point system

                if (battle.player1.toString() === userId) {
                    battle.player1Score += points;
                } else if (battle.player2.toString() === userId) {
                    battle.player2Score += points;
                }

                await battle.save();
                io.to(battleId).emit("updateScores", { 
                    player1Score: battle.player1Score, 
                    player2Score: battle.player2Score 
                });

                if (allQuestionsAnswered(battle)) {
                    battle.status = "Completed";
                    battle.winner = battle.player1Score > battle.player2Score ? battle.player1 : battle.player2;
                    await battle.save();
                    io.to(battleId).emit("battleCompleted", { winner: battle.winner });
                }
            } catch (error) {
                console.error("Error processing answer:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};

// Function to check if the answer is correct (dummy function)
function checkAnswer(questionId, answer) {
    // Implement logic to check correct answer from database
    return Math.random() > 0.5; // Example: Random true/false
}

// Function to check if all questions have been answered
function allQuestionsAnswered(battle) {
    // Implement logic to check if quiz is completed
    return battle.player1Score + battle.player2Score > 50; // Example condition
}
