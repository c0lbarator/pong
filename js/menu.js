export class Menu {
  constructor() {
    this.menuElement = document.getElementById('menu');
    this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.difficultyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }
  
  show() {
    this.menuElement.style.display = 'flex';
    this.menuElement.style.opacity = '1';
  }
  
  hide() {
    this.menuElement.style.opacity = '0';
    setTimeout(() => {
      this.menuElement.style.display = 'none';
    }, 500);
  }
  
  getCurrentDifficulty() {
    const activeButton = document.querySelector('.difficulty-btn.active');
    return activeButton ? activeButton.id : 'easy';
  }
}