export class AI {
  constructor(paddle, ball) {
    this.paddle = paddle;
    this.ball = ball;
    this.difficulty = 'dynamic';
    this.reactionDelayFrames = 15;
    this.framesToSkip = 0;
    this.perfectTracking = false;
    this.reactionBuffer = [];
    this.dynamicDifficultyEnabled = false;
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.setDifficulty(e.target.id != 'dynamic' ? e.target.id: 'easy');
        this.dynamicDifficultyEnabled = (e.target.id == 'dynamic');
        console.log(e.target.id);
      });
    });
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    
    switch (difficulty) {
      case 'easy':
        this.reactionDelayFrames = 25;
        this.perfectTracking = false;
        this.paddle.maxSpeed = 300;
        break;
      case 'medium':
        this.reactionDelayFrames = 10;
        this.perfectTracking = false;
        this.paddle.maxSpeed = 450;
        break;
      case 'hard':
        this.reactionDelayFrames = 3;
        this.perfectTracking = true;
        this.paddle.maxSpeed = 600;
        break;
      default:
        this.reactionDelayFrames = 15;
        this.perfectTracking = false;
        this.paddle.maxSpeed = 300;
    }
  }

  enableDynamicDifficulty() {
    if (!this.dynamicDifficultyEnabled) {
      this.dynamicDifficultyEnabled = true;
      this.paddle.maxSpeed += 100;
      this.reactionDelayFrames = Math.max(2, this.reactionDelayFrames - 5);
    }
  }
  
  update(deltaTime) {
    this.framesToSkip--;
    if (this.framesToSkip > 0) return;
    this.framesToSkip = 2;
    
    this.reactionBuffer.push({ y: this.ball.y });
    
    if (this.reactionBuffer.length > this.reactionDelayFrames) {
      const delayedPosition = this.reactionBuffer.shift().y;
      
      if (this.ball.velocityX > 0) {
        let targetY;
        
        if (this.perfectTracking) {
          const distanceToTravel = this.paddle.x - this.ball.x;
          const timeToReach = distanceToTravel / this.ball.velocityX;
          const futureY = this.ball.y + this.ball.velocityY * timeToReach;
          
          const errorMargin = 20;
          targetY = futureY - this.paddle.height / 2 + (Math.random() * errorMargin * 2 - errorMargin);
        } else {
          targetY = delayedPosition - this.paddle.height / 2;
          const errorMargin = this.difficulty === 'easy' ? 40 : 20;
          targetY += (Math.random() * errorMargin * 2 - errorMargin);
        }
        
        this.paddle.moveTo(targetY, deltaTime);
      } else {
        const centerY = document.getElementById('game-canvas').height / 2 - this.paddle.height / 2;
        this.paddle.moveTo(centerY, deltaTime * 0.3);
      }
    }
  }
}