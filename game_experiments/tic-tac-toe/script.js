const X_CLASS = 'x';
const CIRCLE_CLASS = 'circle';
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
const cellElements = document.querySelectorAll('[data-cell]');
const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningMessage');
const restartButton = document.getElementById('restartButton');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const modeSelection = document.getElementById('modeSelection');
const onePlayerButton = document.getElementById('onePlayer');
const twoPlayerButton = document.getElementById('twoPlayer');
const gameContainer = document.getElementById('gameContainer');
const changeModeButton = document.getElementById('changeModeButton');
let circleTurn;
let gameMode; // 'one-player' or 'two-player'

onePlayerButton.addEventListener('click', () => selectMode('one-player'));
twoPlayerButton.addEventListener('click', () => selectMode('two-player'));
restartButton.addEventListener('click', startGame);
changeModeButton.addEventListener('click', changeMode);

function changeMode() {
    modeSelection.classList.remove('hide');
    gameContainer.classList.add('hide');
}

function selectMode(mode) {
    gameMode = mode;
    modeSelection.classList.add('hide');
    gameContainer.classList.remove('hide');
    startGame();
}

function startGame() {
    circleTurn = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(CIRCLE_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
}

function handleClick(e) {
    if (gameMode === 'one-player' && circleTurn) {
        return; // Don't allow human to play for computer
    }
    const cell = e.target;
    const currentClass = circleTurn ? CIRCLE_CLASS : X_CLASS;
    placeMark(cell, currentClass);
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        if (gameMode === 'one-player' && circleTurn) {
            setTimeout(computerMove, 500);
        }
    }
}

function computerMove() {
    const bestMove = findBestMove();
    if (bestMove !== null) {
        const currentClass = CIRCLE_CLASS;
        placeMark(cellElements[bestMove], currentClass);
        if (checkWin(currentClass)) {
            endGame(false);
        } else if (isDraw()) {
            endGame(true);
        } else {
            swapTurns();
            setBoardHoverClass();
        }
    }
}

function findBestMove() {
    // 1. Check if computer can win
    for (let i = 0; i < 9; i++) {
        if (!cellElements[i].classList.contains(X_CLASS) && !cellElements[i].classList.contains(CIRCLE_CLASS)) {
            cellElements[i].classList.add(CIRCLE_CLASS);
            if (checkWin(CIRCLE_CLASS)) {
                cellElements[i].classList.remove(CIRCLE_CLASS);
                return i;
            }
            cellElements[i].classList.remove(CIRCLE_CLASS);
        }
    }

    // 2. Check if player can win and block
    for (let i = 0; i < 9; i++) {
        if (!cellElements[i].classList.contains(X_CLASS) && !cellElements[i].classList.contains(CIRCLE_CLASS)) {
            cellElements[i].classList.add(X_CLASS);
            if (checkWin(X_CLASS)) {
                cellElements[i].classList.remove(X_CLASS);
                return i;
            }
            cellElements[i].classList.remove(X_CLASS);
        }
    }

    // 3. Take the center
    const center = 4;
    if (!cellElements[center].classList.contains(X_CLASS) && !cellElements[center].classList.contains(CIRCLE_CLASS)) {
        return center;
    }

    // 4. Take a corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(index => {
        return !cellElements[index].classList.contains(X_CLASS) && !cellElements[index].classList.contains(CIRCLE_CLASS);
    });
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Take a side
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(index => {
        return !cellElements[index].classList.contains(X_CLASS) && !cellElements[index].classList.contains(CIRCLE_CLASS);
    });
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return null; // Should not happen
}

function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!`;
    }
    winningMessageElement.classList.add('show');
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS);
    });
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

function swapTurns() {
    circleTurn = !circleTurn;
}

function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(CIRCLE_CLASS);
    if (circleTurn) {
        board.classList.add(CIRCLE_CLASS);
    } else {
        board.classList.add(X_CLASS);
    }
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}