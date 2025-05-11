export class Paddle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = '#fff';
    this.moveSpeed = 15;
    this.maxSpeed = 600;
  }
  
  moveUp() {
    this.y = Math.max(0, this.y - this.moveSpeed);
  }
  
  moveDown() {
    const canvas = document.getElementById('game-canvas');
    this.y = Math.min(canvas.height - this.height, this.y + this.moveSpeed);
  }
  
  moveTo(targetY, deltaTime) {
    const distance = targetY - this.y;
    const moveAmount = Math.min(Math.abs(distance), this.maxSpeed * deltaTime);
    
    if (distance > 0) {
      this.y += moveAmount;
    } else if (distance < 0) {
      this.y -= moveAmount;
    }
    
    const canvas = document.getElementById('game-canvas');
    this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));
  }
  setMoveSpeed(speed) {
    this.moveSpeed = speed
  }
  
  render(ctx) {
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
  }
}
