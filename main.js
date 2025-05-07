import { Game } from "/js/game.js"

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game()

  const singlePlayerBtn = document.getElementById("single-player")
  const twoPlayerBtn = document.getElementById("two-player")
  const startButton = document.getElementById("start-button")
  const restartButton = document.getElementById("restart-button")
  const resumeButton = document.getElementById("resume-button")
  const quitButton = document.getElementById("quit-button")
  const mobileInstructions = document.querySelector(".mobile-instructions")
  singlePlayerBtn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((btn) => btn.classList.remove("active"))
    singlePlayerBtn.classList.add("active")
    game.setTwoPlayerMode(false)
    document.querySelector(".difficulty-container").classList.remove("hidden")
  })

  twoPlayerBtn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((btn) => btn.classList.remove("active"))
    twoPlayerBtn.classList.add("active")
    game.setTwoPlayerMode(true)
    document.querySelector(".difficulty-container").classList.add("hidden")
  })

  startButton.addEventListener("click", () => {
    document.getElementById("menu").classList.add("hidden")
    game.reset()
    game.start()
  })
  if (game.isMobileDevice) {
    mobileInstructions.classList.add("visible")
    setTimeout(() => {
      mobileInstructions.classList.remove("visible")
    }, 3000)
  }
  restartButton.addEventListener("click", () => {
    document.getElementById("game-end").classList.add("hidden")
    document.getElementById("player-name-form").classList.add("hidden")
    document.getElementById("save-status").textContent = ""
    document.getElementById("view-leaderboard-button").classList.add("hidden")
    game.reset()
    game.start()
  })

  resumeButton.addEventListener("click", () => {
    document.getElementById("pause-menu").classList.add("hidden")
    game.resume()
  })

  quitButton.addEventListener("click", () => {
    document.getElementById("pause-menu").classList.add("hidden")
    document.getElementById("menu").classList.remove("hidden")
    game.isRunning = false
  })
  // Set up difficulty buttons
  document.querySelectorAll(".difficulty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".difficulty-btn").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
    })
  })
})
