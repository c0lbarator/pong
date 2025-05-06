import './style.css';
import { Game } from './js/game.js';
import { Menu } from './js/menu.js';

const menu = new Menu();
const game = new Game();

// Handle game mode selection
document.getElementById('single-player').addEventListener('click', () => {
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('single-player').classList.add('active');
  game.setTwoPlayerMode(false);
  document.querySelector('.difficulty-container').style.display = 'block';
});

document.getElementById('two-player').addEventListener('click', () => {
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('two-player').classList.add('active');
  game.setTwoPlayerMode(true);
  document.querySelector('.difficulty-container').style.display = 'none';
});

document.getElementById('start-button').addEventListener('click', () => {
  menu.hide();
  game.start();
});

document.getElementById('restart-button').addEventListener('click', () => {
  document.getElementById('game-end').classList.add('hidden');
  game.reset();
  game.start();
});

document.getElementById('resume-button').addEventListener('click', () => {
  document.getElementById('pause-menu').classList.add('hidden');
  game.resume();
});

document.getElementById('quit-button').addEventListener('click', () => {
  document.getElementById('pause-menu').classList.add('hidden');
  game.reset();
  menu.show();
});