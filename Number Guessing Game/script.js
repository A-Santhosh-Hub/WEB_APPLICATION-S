let secretNumber;
let attempts = 0;
let startTime;
let maxNumber = 50;

const feedback = document.getElementById("feedback");
const guessInput = document.getElementById("guessInput");
const guessButton = document.getElementById("guessButton");
const attemptsLabel = document.getElementById("attempts");
const timeLabel = document.getElementById("time");
const playAgainButton = document.getElementById("playAgainButton");
const difficultySelect = document.getElementById("difficultySelect");
const modeToggle = document.getElementById("modeToggle");
const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");

function startGame() {
  secretNumber = Math.floor(Math.random() * maxNumber) + 1;
  attempts = 0;
  startTime = new Date();
  feedback.textContent = `Guess a number between 1 and ${maxNumber}`;
  guessInput.value = "";
  guessInput.disabled = false;
  guessButton.disabled = false;
  playAgainButton.disabled = true;
  attemptsLabel.textContent = "Attempts: 0";
  timeLabel.textContent = "⏱️ Time: 0.0 sec";
}

guessButton.addEventListener("click", () => {
  const guess = parseInt(guessInput.value);
  if (isNaN(guess)) {
    feedback.textContent = "❗ Please enter a valid number.";
    return;
  }

  attempts++;
  if (guess < secretNumber) {
    feedback.textContent = "Too low! 🔽";
    wrongSound.play();
    navigator.vibrate?.(200);
  } else if (guess > secretNumber) {
    feedback.textContent = "Too high! 🔼";
    wrongSound.play();
    navigator.vibrate?.(200);
  } else {
    const endTime = new Date();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    feedback.textContent = `🎉 Correct! The number was ${secretNumber}`;
    timeLabel.textContent = `⏱️ Time: ${timeTaken} sec`;
    guessInput.disabled = true;
    guessButton.disabled = true;
    playAgainButton.disabled = false;
    correctSound.play();
  }
  attemptsLabel.textContent = `Attempts: ${attempts}`;
  guessInput.value = "";
});

playAgainButton.addEventListener("click", startGame);

difficultySelect.addEventListener("change", () => {
  maxNumber = difficultySelect.value === "hard" ? 200 : 50;
  startGame();
});

modeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light-mode", modeToggle.checked);
});

startGame();
