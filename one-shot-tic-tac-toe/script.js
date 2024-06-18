const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const restartButton = document.getElementById('restartButton');
const playAgainstAI = document.getElementById('playAgainstAI');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const X_CLASS = 'x';
const O_CLASS = 'o';
let oTurn;

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

startGame();

restartButton.addEventListener('click', startGame);
closeModal.addEventListener('click', closeModalPopup);

function startGame() {
  oTurn = false;
  cells.forEach(cell => {
    cell.classList.remove(X_CLASS);
    cell.classList.remove(O_CLASS);
    cell.removeEventListener('click', handleClick);
    cell.addEventListener('click', handleClick, { once: true });
  });
  closeModalPopup();  // Ensure modal is closed at start
}

function handleClick(e) {
  const cell = e.target;
  const currentClass = oTurn ? O_CLASS : X_CLASS;
  placeMark(cell, currentClass);
  if (checkWin(currentClass)) {
    showModal(`${currentClass.toUpperCase()} Wins!`);
  } else if (isDraw()) {
    showModal('It\'s a Draw!');
  } else {
    if (playAgainstAI.checked && !oTurn) {
      swapTurns();
      setTimeout(makeAIMove, 500); // Give a small delay for AI to make it more natural
    } else {
      swapTurns();
    }
  }
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
}

function swapTurns() {
  oTurn = !oTurn;
}

function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return cells[index].classList.contains(currentClass);
    });
  });
}

function isDraw() {
  return [...cells].every(cell => {
    return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
  });
}

function showModal(message) {
  modalContent.querySelector('p').innerText = message;
  modal.style.display = 'flex';
}

function closeModalPopup() {
  modal.style.display = 'none';
}

function makeAIMove() {
  const bestMove = findBestMove();
  if (bestMove !== null) {
    placeMark(cells[bestMove], O_CLASS);
    if (checkWin(O_CLASS)) {
      showModal('O Wins!');
    } else if (isDraw()) {
      showModal('It\'s a Draw!');
    } else {
      swapTurns();
    }
  }
}

function findBestMove() {
  let bestMove = null;
  let bestScore = -Infinity;
  cells.forEach((cell, index) => {
    if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS)) {
      cell.classList.add(O_CLASS);
      const score = minimax(false);
      cell.classList.remove(O_CLASS);
      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }
  });
  return bestMove;
}

function minimax(isMaximizing) {
  if (checkWin(O_CLASS)) {
    return 1;
  } else if (checkWin(X_CLASS)) {
    return -1;
  } else if (isDraw()) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    cells.forEach(cell => {
      if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS)) {
        cell.classList.add(O_CLASS);
        const score = minimax(false);
        cell.classList.remove(O_CLASS);
        bestScore = Math.max(score, bestScore);
      }
    });
    return bestScore;
  } else {
    let bestScore = Infinity;
    cells.forEach(cell => {
      if (!cell.classList.contains(X_CLASS) && !cell.classList.contains(O_CLASS)) {
        cell.classList.add(X_CLASS);
        const score = minimax(true);
        cell.classList.remove(X_CLASS);
        bestScore = Math.min(score, bestScore);
      }
    });
    return bestScore;
  }
}
