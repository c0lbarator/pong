export class Score {
  constructor() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.playerScoreElement = document.getElementById('player-score');
    this.aiScoreElement = document.getElementById('ai-score');
  }
  
  reset() {
    this.playerScore = 0;
    this.aiScore = 0;
    this.updateDisplay();
  }
  
  updateDisplay() {
    this.playerScoreElement.innerText = this.playerScore;
    this.aiScoreElement.innerText = this.aiScore;
  }
}