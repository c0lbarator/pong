checkDynamicDifficulty() {
    // Проверяем, включен ли динамический режим сложности
    if (!this.isTwoPlayerMode && this.ai.dynamicDifficultyEnabled) {
      // Проверяем, достигнут ли определенный счет
      if (
        this.score.playerScore === 10 ||
        this.score.aiScore === 10 ||
        this.score.playerScore === 20 ||
        this.score.aiScore === 20
      ) {
        // Если счет достиг определенного значения и сложность еще не менялась на этом уровне
        if (!this.difficultyChanged) {
          // Пытаемся увеличить сложность
          const changed = this.ai.enableDynamicDifficulty()
          if (changed) {
            this.difficultyChanged = true
            // Обновляем отображение сложности
            this.updateDifficultyDisplay()

            // Показываем уведомление об изменении сложности
            this.showDifficultyChangeNotification()
          }
        }
      } else {
        // Сбрасываем флаг, если счет не на контрольной точке
        this.difficultyChanged = false
      }
    }
  }

  showDifficultyChangeNotification() {
    // Создаем элемент уведомления
    const notification = document.createElement("div")
    notification.className = "difficulty-notification"
    notification.textContent = "Difficulty increased!"
    notification.style.position = "absolute"
    notification.style.top = "120px"
    notification.style.left = "0"
    notification.style.width = "100%"
    notification.style.textAlign = "center"
    notification.style.color = "#ff9800"
    notification.style.fontSize = "1.5rem"
    notification.style.fontWeight = "bold"
    notification.style.textShadow = "0 0 10px rgba(255, 152, 0, 0.8)"
    notification.style.zIndex = "10"
    notification.style.opacity = "0"
    notification.style.transition = "opacity 0.5s ease"

    // Добавляем уведомление на экран
    document.getElementById("game-overlay").appendChild(notification)

    // Показываем уведомление с анимацией
    setTimeout(() => {
      notification.style.opacity = "1"

      // Скрываем и удаляем уведомление через 2 секунды
      setTimeout(() => {
        notification.style.opacity = "0"
        setTimeout(() => {
          notification.remove()
        }, 500)
      }, 2000)
    }, 100)
  }

  updateDifficultyDisplay() {
    if (!this.isTwoPlayerMode) {
      const difficultyElement = document.getElementById("current-difficulty")
      const difficultyBadge = document.querySelector(".difficulty-badge")

      if (difficultyElement && difficultyBadge) {
        const currentDifficulty = this.ai.getCurrentDifficultyName()
        difficultyElement.textContent = currentDifficulty

        // Обновляем класс для стилизации
        difficultyBadge.className = "difficulty-badge"

        if (currentDifficulty.toLowerCase().includes("easy")) {
          difficultyBadge.classList.add("easy")
        } else if (currentDifficulty.toLowerCase().includes("medium")) {
          difficultyBadge.classList.add("medium")
        } else if (currentDifficulty.toLowerCase().includes("hard")) {
          difficultyBadge.classList.add("hard")
        } else if (currentDifficulty.toLowerCase().includes("dynamic")) {
          difficultyBadge.classList.add("dynamic")
        }
      }
    }
  }