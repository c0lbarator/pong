import { Ball } from "./ball.js"
import { Paddle } from "./paddle.js"
import { AI } from "./ai.js"
import { Score } from "./score.js"

export class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas")
    this.ctx = this.canvas.getContext("2d")
    this.isRunning = false
    this.isPaused = false
    this.winScore = 30
    this.isTwoPlayerMode = false
    this.serverUrl = "http://localhost:8000" // Update this with your Deno server URL
    this.isMobileDevice = this.checkMobileDevice()
    this.touchControls = {
      player1TouchId: null,
      player2TouchId: null,
      player1LastY: 0,
      player2LastY: 0,
    }
    this.paddleSpeed = 5 // Default paddle speed

    this.resize()

    this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2)
    this.playerPaddle = new Paddle(30, this.canvas.height / 2 - 40, 10, 80, this.paddleSpeed)
    this.aiPaddle = new Paddle(this.canvas.width - 30 - 10, this.canvas.height / 2 - 40, 10, 80, this.paddleSpeed)
    this.ai = new AI(this.aiPaddle, this.ball)
    this.score = new Score()

    this.update = this.update.bind(this)
    this.render = this.render.bind(this)
    this.gameLoop = this.gameLoop.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleKeyup = this.handleKeyup.bind(this)
    this.resize = this.resize.bind(this)
    this.saveGameResult = this.saveGameResult.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.togglePause = this.togglePause.bind(this)
    this.toggleFullscreen = this.toggleFullscreen.bind(this)
    this.setPaddleSpeed = this.setPaddleSpeed.bind(this)

    window.addEventListener("keydown", this.handleKeydown)
    window.addEventListener("keyup", this.handleKeyup)
    window.addEventListener("resize", this.resize)

    // Add touch event listeners
    this.canvas.addEventListener("touchstart", this.handleTouchStart, { passive: false })
    this.canvas.addEventListener("touchmove", this.handleTouchMove, { passive: false })
    this.canvas.addEventListener("touchend", this.handleTouchEnd)
    this.canvas.addEventListener("touchcancel", this.handleTouchEnd)

    // Add mobile control buttons event listeners
    if (document.getElementById("mobile-pause-btn")) {
      document.getElementById("mobile-pause-btn").addEventListener("click", this.togglePause)
    }

    if (document.getElementById("mobile-fullscreen-btn")) {
      document.getElementById("mobile-fullscreen-btn").addEventListener("click", this.toggleFullscreen)
    }

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      w: false,
      s: false,
    }

    // Set up event listener for the save result form
    document.getElementById("save-result-button").addEventListener("click", this.saveGameResult)

    // Set up paddle speed slider
    const paddleSpeedSlider = document.getElementById("paddle-speed-slider")
    const paddleSpeedValue = document.getElementById("paddle-speed-value")

    if (paddleSpeedSlider) {
      paddleSpeedSlider.addEventListener("input", (e) => {
        const speed = Number.parseInt(e.target.value)
        paddleSpeedValue.textContent = speed
        this.setPaddleSpeed(speed)
      })

      // Set initial paddle speed
      this.setPaddleSpeed(Number.parseInt(paddleSpeedSlider.value))
      paddleSpeedValue.textContent = paddleSpeedSlider.value
    }

    // Hide mobile controls initially
    this.updateMobileControlsVisibility()
  }

  setPaddleSpeed(speed) {
    this.paddleSpeed = speed
    this.playerPaddle.setMoveSpeed(speed)
    this.aiPaddle.setMoveSpeed(speed)
  }

  toggleFullscreen() {
    const gameContainer = document.getElementById("game-container")

    if (!document.fullscreenElement) {
      if (gameContainer.requestFullscreen) {
        gameContainer.requestFullscreen()
      } else if (gameContainer.webkitRequestFullscreen) {
        /* Safari */
        gameContainer.webkitRequestFullscreen()
      } else if (gameContainer.msRequestFullscreen) {
        /* IE11 */
        gameContainer.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        /* Safari */
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        /* IE11 */
        document.msExitFullscreen()
      }
    }
  }

  checkMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia("(max-width: 768px)").matches)
    )
  }

  updateMobileControlsVisibility() {
    const mobileControls = document.getElementById("mobile-controls")
    const mobileInstructions = document.querySelector(".mobile-instructions")

    if (mobileControls) {
      if (this.isMobileDevice && this.isRunning && !this.isPaused) {
        mobileControls.classList.remove("hidden")
      } else {
        mobileControls.classList.add("hidden")
      }
    }

    if (mobileInstructions) {
      mobileInstructions.classList.remove("visible")
    }
  }

  togglePause() {
    if (this.isPaused) {
      document.getElementById("pause-menu").classList.add("hidden")
      this.resume()
    } else {
      this.pause()
    }
  }

  handleTouchStart(e) {
    e.preventDefault()

    if (!this.isRunning || this.isPaused) return

      const canvasRect = this.canvas.getBoundingClientRect()
      const canvasMidpoint = canvasRect.left + canvasRect.width / 2

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const touchX = touch.clientX
        const touchY = touch.clientY - canvasRect.top

        // Determine which side of the screen was touched
        if (touchX < canvasMidpoint) {
          // Left side - Player 1
          if (this.touchControls.player1TouchId === null) {
            this.touchControls.player1TouchId = touch.identifier
            this.touchControls.player1LastY = touchY
            this.movePaddleToPosition(this.playerPaddle, touchY)
          }
        } else {
          // Right side - Player 2 (or AI in single player)
          if (this.isTwoPlayerMode && this.touchControls.player2TouchId === null) {
            this.touchControls.player2TouchId = touch.identifier
            this.touchControls.player2LastY = touchY
            this.movePaddleToPosition(this.aiPaddle, touchY)
          }
        }
      }
  }

  handleTouchMove(e) {
    e.preventDefault()

    if (!this.isRunning || this.isPaused) return

      const canvasRect = this.canvas.getBoundingClientRect()

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        const touchY = touch.clientY - canvasRect.top

        // Check if this touch is the one we're tracking for player 1
        if (touch.identifier === this.touchControls.player1TouchId) {
          this.touchControls.player1LastY = touchY
          this.movePaddleToPosition(this.playerPaddle, touchY)
        }
        // Check if this touch is the one we're tracking for player 2
        else if (this.isTwoPlayerMode && touch.identifier === this.touchControls.player2TouchId) {
          this.touchControls.player2LastY = touchY
          this.movePaddleToPosition(this.aiPaddle, touchY)
        }
      }
  }

  handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]

      // Check if this is the touch we're tracking for player 1
      if (touch.identifier === this.touchControls.player1TouchId) {
        this.touchControls.player1TouchId = null
      }
      // Check if this is the touch we're tracking for player 2
      else if (touch.identifier === this.touchControls.player2TouchId) {
        this.touchControls.player2TouchId = null
      }
    }
  }

  movePaddleToPosition(paddle, touchY) {
    // Calculate the center position of the paddle
    const paddleCenter = paddle.height / 2

    // Set the paddle's y position, ensuring it stays within the canvas bounds
    paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, touchY - paddleCenter))
  }

  setTwoPlayerMode(enabled) {
    this.isTwoPlayerMode = enabled
  }

  handleKeydown(e) {
    if (e.key in this.keys) {
      this.keys[e.key] = true
    }

    if (e.key === "Escape" && this.isRunning) {
      this.togglePause()
    }
  }

  handleKeyup(e) {
    if (e.key in this.keys) {
      this.keys[e.key] = false
    }
  }

  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth
    this.canvas.height = this.canvas.parentElement.clientHeight

    if (this.ball) {
      this.ball.reset(this.canvas.width / 2, this.canvas.height / 2)
      this.playerPaddle.x = 30
      this.aiPaddle.x = this.canvas.width - 30 - this.aiPaddle.width
    }

    // Check if device is mobile after resize
    this.isMobileDevice = this.checkMobileDevice()
    this.updateMobileControlsVisibility()
  }

  checkCollisions() {
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius
      this.ball.velocityY = -this.ball.velocityY
      this.playWallHitSound()
    } else if (this.ball.y + this.ball.radius > this.canvas.height) {
      this.ball.y = this.canvas.height - this.ball.radius
      this.ball.velocityY = -this.ball.velocityY
      this.playWallHitSound()
    }

    if (
      this.ball.x - this.ball.radius < this.playerPaddle.x + this.playerPaddle.width &&
      this.ball.x + this.ball.radius > this.playerPaddle.x &&
      this.ball.y + this.ball.radius > this.playerPaddle.y &&
      this.ball.y - this.ball.radius < this.playerPaddle.y + this.playerPaddle.height
    ) {
      const collidePoint =
      (this.ball.y - (this.playerPaddle.y + this.playerPaddle.height / 2)) / (this.playerPaddle.height / 2)
      const angle = (collidePoint * Math.PI) / 4

      const direction = 1
      this.ball.velocityX = direction * this.ball.speed * Math.cos(angle)
      this.ball.velocityY = this.ball.speed * Math.sin(angle)

      this.ball.speed += 20

      this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius

      this.playPaddleHitSound()
    }

    if (
      this.ball.x + this.ball.radius > this.aiPaddle.x &&
      this.ball.x - this.ball.radius < this.aiPaddle.x + this.aiPaddle.width &&
      this.ball.y + this.ball.radius > this.aiPaddle.y &&
      this.ball.y - this.ball.radius < this.aiPaddle.y + this.aiPaddle.height
    ) {
      const collidePoint = (this.ball.y - (this.aiPaddle.y + this.aiPaddle.height / 2)) / (this.aiPaddle.height / 2)
      const angle = (collidePoint * Math.PI) / 4

      const direction = -1
      this.ball.velocityX = direction * this.ball.speed * Math.cos(angle)
      this.ball.velocityY = this.ball.speed * Math.sin(angle)

      this.ball.speed += 20

      this.ball.x = this.aiPaddle.x - this.ball.radius

      this.playPaddleHitSound()
    }
  }

  checkDynamicDifficulty() {
    if (!this.isTwoPlayerMode && (this.score.playerScore === 10 || this.score.aiScore === 10)) {
      this.ai.enableDynamicDifficulty()
    }
  }

  render() {
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.beginPath()
    this.ctx.setLineDash([10, 15])
    this.ctx.moveTo(this.canvas.width / 2, 0)
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    this.ctx.setLineDash([])

    this.ball.render(this.ctx)
    this.playerPaddle.render(this.ctx)
    this.aiPaddle.render(this.ctx)

    // Render touch areas for mobile
    if (this.isMobileDevice && this.isRunning && !this.isPaused) {
      this.renderTouchAreas()
    }
  }

  renderTouchAreas() {
    // Draw semi-transparent touch areas
    const halfWidth = this.canvas.width / 2

    // Left side - Player 1
    this.ctx.fillStyle = "rgba(0, 100, 255, 0.1)"
    this.ctx.fillRect(0, 0, halfWidth, this.canvas.height)

    // Right side - Player 2 or AI
    if (this.isTwoPlayerMode) {
      this.ctx.fillStyle = "rgba(255, 100, 0, 0.1)"
      this.ctx.fillRect(halfWidth, 0, halfWidth, this.canvas.height)
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true
      this.lastTime = performance.now()
      requestAnimationFrame(this.gameLoop)
      this.updateMobileControlsVisibility()
    }
  }

  reset() {
    this.score.reset()
    this.ball.reset(this.canvas.width / 2, this.canvas.height / 2)
    this.playerPaddle.y = this.canvas.height / 2 - this.playerPaddle.height / 2
    this.aiPaddle.y = this.canvas.height / 2 - this.aiPaddle.height / 2
    this.updateScore()
  }

  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      document.getElementById("pause-menu").classList.remove("hidden")

      // Update paddle speed slider value in pause menu
      const paddleSpeedSlider = document.getElementById("paddle-speed-slider")
      const paddleSpeedValue = document.getElementById("paddle-speed-value")

      if (paddleSpeedSlider && paddleSpeedValue) {
        paddleSpeedSlider.value = this.paddleSpeed
        paddleSpeedValue.textContent = this.paddleSpeed
      }

      this.updateMobileControlsVisibility()
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false
      this.lastTime = performance.now()
      requestAnimationFrame(this.gameLoop)
      this.updateMobileControlsVisibility()
    }
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return
      if (this.isPaused) return

        const deltaTime = (timestamp - this.lastTime) / 1000
        this.lastTime = timestamp

        this.update(deltaTime)
        this.render()

        requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime) {
    // W/S for left player, Arrow keys for right player
    if (this.keys.w) this.playerPaddle.moveUp()
      if (this.keys.s) this.playerPaddle.moveDown()

        if (this.isTwoPlayerMode) {
          if (this.keys.ArrowUp) this.aiPaddle.moveUp()
            if (this.keys.ArrowDown) this.aiPaddle.moveDown()
        } else {
          this.ai.update(deltaTime)
        }

        this.ball.update(deltaTime)
        this.checkCollisions()

        if (this.ball.x < 0) {
          this.score.aiScore++
          this.updateScore()
          this.ball.reset(this.canvas.width / 2, this.canvas.height / 2)
          this.ball.velocityX = -this.ball.velocityX
          this.checkGameEnd()
          this.checkDynamicDifficulty()
        } else if (this.ball.x > this.canvas.width) {
          this.score.playerScore++
          this.updateScore()
          this.ball.reset(this.canvas.width / 2, this.canvas.height / 2)
          this.checkGameEnd()
          this.checkDynamicDifficulty()
        }
  }

  updateScore() {
    document.getElementById("player-score").innerText = this.score.playerScore
    document.getElementById("ai-score").innerText = this.score.aiScore
  }

  checkGameEnd() {
    if (this.score.playerScore >= this.winScore || this.score.aiScore >= this.winScore) {
      this.isRunning = false
      const gameEndElement = document.getElementById("game-end")
      const winnerTextElement = document.getElementById("winner-text")
      const playerNameForm = document.getElementById("player-name-form")

      if (this.score.playerScore >= this.winScore) {
        winnerTextElement.innerText = this.isTwoPlayerMode ? "Player 1 Wins!" : "You Win!"
      } else {
        winnerTextElement.innerText = this.isTwoPlayerMode ? "Player 2 Wins!" : "Computer Wins!"
      }

      // Show the appropriate name input fields based on game mode
      if (this.isTwoPlayerMode) {
        document.getElementById("player1-name-group").classList.remove("hidden")
        document.getElementById("player2-name-group").classList.remove("hidden")
        document.getElementById("single-player-name-group").classList.add("hidden")
      } else {
        document.getElementById("player1-name-group").classList.add("hidden")
        document.getElementById("player2-name-group").classList.add("hidden")
        document.getElementById("single-player-name-group").classList.remove("hidden")
      }

      playerNameForm.classList.remove("hidden")
      gameEndElement.classList.remove("hidden")
      this.updateMobileControlsVisibility()
    }
  }

  async saveGameResult(e) {
    e.preventDefault()

    const saveButton = document.getElementById("save-result-button")
    const statusMessage = document.getElementById("save-status")

    saveButton.disabled = true
    saveButton.textContent = "Saving..."
    statusMessage.textContent = ""

    try {
      let gameData

      if (this.isTwoPlayerMode) {
        const player1Name = document.getElementById("player1-name").value || "Player 1"
        const player2Name = document.getElementById("player2-name").value || "Player 2"

        gameData = {
          gameMode: "2 Players",
          player1Name,
          player2Name,
          player1Score: this.score.playerScore,
          player2Score: this.score.aiScore,
          winner: this.score.playerScore > this.score.aiScore ? player1Name : player2Name,
        }
      } else {
        const playerName = document.getElementById("single-player-name").value || "Player"

        gameData = {
          gameMode: "1 Player",
          playerName,
          playerScore: this.score.playerScore,
          computerScore: this.score.aiScore,
          winner: this.score.playerScore > this.score.aiScore ? playerName : "Computer",
          difficulty: document.querySelector(".difficulty-btn.active").id,
        }
      }

      const response = await fetch(`${this.serverUrl}/api/save-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      })

      const result = await response.json()

      if (result.success) {
        statusMessage.textContent = "Result saved successfully!"
        statusMessage.className = "success-message"

        // Show the leaderboard link
        document.getElementById("view-leaderboard-button").classList.remove("hidden")
      } else {
        throw new Error(result.error || "Failed to save result")
      }
    } catch (error) {
      console.error("Error saving game result:", error)
      statusMessage.textContent = "Failed to save result. Please try again."
      statusMessage.className = "error-message"
    } finally {
      saveButton.disabled = false
      saveButton.textContent = "Save Result"
    }
  }

  playPaddleHitSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = 600
      gainNode.gain.value = 0.1

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      setTimeout(() => oscillator.stop(), 50)
    } catch (e) {
      console.error("Audio error:", e)
    }
  }

  playWallHitSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = 300
      gainNode.gain.value = 0.05

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      setTimeout(() => oscillator.stop(), 50)
    } catch (e) {
      console.error("Audio error:", e)
    }
  }
}
