export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.speed = 300;
    this.velocityX = -this.speed;
    this.velocityY = 0;
    this.color = '#fff';
    this.trailPositions = [];
    this.maxTrailLength = 5;
  }
  
  update(deltaTime) {
    this.trailPositions.unshift({ x: this.x, y: this.y });
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.pop();
    }
    
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }
  
  render(ctx) {
    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      const alpha = 0.3 - (i / this.trailPositions.length) * 0.3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.radius * (1 - i * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 300;
    
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.random() * Math.PI / 4 - Math.PI / 8;
    
    this.velocityX = direction * this.speed * Math.cos(angle);
    this.velocityY = this.speed * Math.sin(angle);
    
    this.trailPositions = [];
  }
}