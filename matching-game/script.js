let matchedPairs = 0;
let offsetX, offsetY, currentElement;
let matchedCards = new Set();
let pairs = {};
let zIndexCounter = 1000; // Start with a high z-index
let gameFinished = false;
const numPairs = 5; // Number of pairs of problems and solutions

window.onload = function() {
    initGame();
};

function initGame() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.innerHTML = ''; // Clear all previous cards
    matchedPairs = 0;
    matchedCards.clear();
    pairs = {};
    zIndexCounter = 1000; // Reset z-index counter
    gameFinished = false;

    const { problems, answers } = generateProblemsAndSolutions(numPairs);
    const positions = generateRandomPositions(gameContainer, numPairs * 2);

    problems.forEach((item, index) => {
        createCard(item.problem, item.answer, `problem-${index}`, 'problem', positions[index].left, positions[index].top);
    });

    answers.forEach((item, index) => {
        createCard(item, item, `answer-${index}`, 'answer', positions[numPairs + index].left, positions[numPairs + index].top);
    });

    document.getElementById('popup').style.display = 'none'; // Ensure popup is hidden
}

function createCard(text, answer, id, type, left, top) {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.textContent = text;
    card.dataset.answer = answer;
    card.dataset.type = type;
    card.dataset.paired = 'false';
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.zIndex = zIndexCounter++; // Increment z-index for layering

    card.onmousedown = dragStart;

    document.querySelector('.game-container').appendChild(card);
}

function dragStart(event) {
    if (gameFinished) return; // Prevent dragging if the game is finished

    currentElement = event.target;

    if (currentElement.dataset.paired === 'true') {
        const pairedElement = pairs[currentElement.id];
        if (pairedElement) {
            currentElement = pairedElement;
        }
    }

    offsetX = event.clientX - currentElement.getBoundingClientRect().left;
    offsetY = event.clientY - currentElement.getBoundingClientRect().top;

    // Bring the current element and its pair to the top
    currentElement.style.zIndex = zIndexCounter++;
    if (currentElement.dataset.paired === 'true') {
        const pairedElement = pairs[currentElement.id];
        pairedElement.style.zIndex = currentElement.style.zIndex;
    }

    document.onmousemove = drag;
    document.onmouseup = dragEnd;
}

function drag(event) {
    const gameContainer = document.querySelector('.game-container').getBoundingClientRect();
    let newLeft = event.clientX - gameContainer.left - offsetX;
    let newTop = event.clientY - gameContainer.top - offsetY;

    const pairedElement = currentElement.dataset.paired === 'true' ? pairs[currentElement.id] : null;

    if (pairedElement) {
        if (currentElement.dataset.type === 'problem') {
            // When dragging the problem card, ensure the solution card doesn't go beyond the right border
            if (newLeft < 0) newLeft = 0;
            if (newLeft + currentElement.offsetWidth + pairedElement.offsetWidth > gameContainer.width) {
                newLeft = gameContainer.width - currentElement.offsetWidth - pairedElement.offsetWidth;
            }

            // Prevent dragging the pair beyond the top or bottom boundaries
            if (newTop < 0) newTop = 0;
            if (newTop + currentElement.offsetHeight > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;

            const pairedTop = newTop;
            const pairedBottom = pairedTop + pairedElement.offsetHeight;
            if (pairedTop < 0) newTop = 0;
            if (pairedBottom > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;
        } else if (currentElement.dataset.type === 'answer') {
            // When dragging the solution card, ensure the problem card doesn't go beyond the left border
            if (newLeft < pairedElement.offsetWidth) newLeft = pairedElement.offsetWidth;
            if (newLeft + currentElement.offsetWidth > gameContainer.width) {
                newLeft = gameContainer.width - currentElement.offsetWidth;
            }

            // Prevent dragging the pair beyond the top or bottom boundaries
            if (newTop < 0) newTop = 0;
            if (newTop + currentElement.offsetHeight > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;

            const pairedTop = newTop;
            const pairedBottom = pairedTop + pairedElement.offsetHeight;
            if (pairedTop < 0) newTop = 0;
            if (pairedBottom > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;
        }
    } else {
        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + currentElement.offsetWidth > gameContainer.width) newLeft = gameContainer.width - currentElement.offsetWidth;
        if (newTop + currentElement.offsetHeight > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;
    }

    currentElement.style.left = `${newLeft}px`;
    currentElement.style.top = `${newTop}px`;

    if (pairedElement) {
        pairedElement.style.left = `${newLeft + (currentElement.dataset.type === 'problem' ? currentElement.offsetWidth : -pairedElement.offsetWidth)}px`;
        pairedElement.style.top = `${newTop}px`;
        pairedElement.style.zIndex = currentElement.style.zIndex;
    }
}

function dragEnd(event) {
    document.onmousemove = null;
    document.onmouseup = null;

    const cards = document.querySelectorAll('.card');
    let matched = false;

    cards.forEach(otherCard => {
        if (otherCard !== currentElement && !matchedCards.has(otherCard.id) && checkProximity(currentElement, otherCard)) {
            if (checkMatch(currentElement, otherCard)) {
                snapTogether(currentElement, otherCard);
                matched = true;
            }
        }
    });

    if (!matched) {
        currentElement.style.zIndex = zIndexCounter++;
        if (currentElement.dataset.paired === 'true') {
            const pairedElement = pairs[currentElement.id];
            pairedElement.style.zIndex = currentElement.style.zIndex;
        }
    }
}

function checkProximity(card1, card2) {
    const proximityThreshold = 50; // Pixels
    const rect1 = card1.getBoundingClientRect();
    const rect2 = card2.getBoundingClientRect();

    return Math.abs(rect1.left - rect2.left) <= proximityThreshold && Math.abs(rect1.top - rect2.top) <= proximityThreshold;
}

function checkMatch(card1, card2) {
    return (
        card1.dataset.answer === card2.dataset.answer &&
        ((card1.dataset.type === 'problem' && card2.dataset.type === 'answer') ||
            (card1.dataset.type === 'answer' && card2.dataset.type === 'problem')) &&
        card1.dataset.paired === 'false' && card2.dataset.paired === 'false'
    );
}

function snapTogether(card1, card2) {
    const gameContainer = document.querySelector('.game-container').getBoundingClientRect();
    const problemCard = card1.dataset.type === 'problem' ? card1 : card2;
    const answerCard = card1.dataset.type === 'answer' ? card1 : card2;

    const problemRect = problemCard.getBoundingClientRect();
    const answerRect = answerCard.getBoundingClientRect();

    answerCard.style.left = `${problemRect.left - gameContainer.left + problemCard.offsetWidth}px`;
    answerCard.style.top = `${problemRect.top - gameContainer.top}px`;

    problemCard.style.left = `${problemRect.left - gameContainer.left}px`;
    problemCard.style.top = `${problemRect.top - gameContainer.top}px`;

    problemCard.draggable = false;
    answerCard.draggable = false;
    problemCard.style.backgroundColor = 'lightgreen';
    answerCard.style.backgroundColor = 'lightgreen';

    problemCard.dataset.paired = 'true';
    answerCard.dataset.paired = 'true';

    const newZIndex = zIndexCounter++;
    problemCard.style.zIndex = newZIndex;
    answerCard.style.zIndex = newZIndex;

    matchedCards.add(problemCard.id);
    matchedCards.add(answerCard.id);

    pairs[problemCard.id] = answerCard;
    pairs[answerCard.id] = problemCard;

    matchedPairs++;
    if (matchedPairs === numPairs) {
        showPopup();
    }
}

function showPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block';
    popup.style.zIndex = zIndexCounter++; // Ensure popup is on top of everything
    gameFinished = true; // Prevent further dragging
}

function resetGame() {
    matchedPairs = 0;
    matchedCards.clear();
    pairs = {};
    gameFinished = false;
    initGame();
}

function generateProblemsAndSolutions(num) {
    const problems = [];
    const answers = new Set();

    while (problems.length < num) {
        let opType = Math.random() < 0.5 ? 'addition' : 'subtraction';
        let a = Math.floor(Math.random() * 10);
        let b = Math.floor(Math.random() * 10);
        let answer;

        if (opType === 'addition') {
            answer = a + b;
            if (answer < 10) {
                const problemText = `${a} + ${b} =`;
                if (!answers.has(answer)) {
                    problems.push({ problem: problemText, answer: answer.toString() });
                    answers.add(answer);
                }
            }
        } else {
            // Ensure a >= b for subtraction to keep result positive and within single digit
            if (a < b) [a, b] = [b, a];
            answer = a - b;
            const problemText = `${a} - ${b} =`;
            if (!answers.has(answer)) {
                problems.push({ problem: problemText, answer: answer.toString() });
                answers.add(answer);
            }
        }
    }

    return { problems, answers: Array.from(answers) };
}

function generateRandomPositions(container, numCards) {
    const positions = [];
    const cardWidth = 100; // Assumed width of the card
    const cardHeight = 100; // Assumed height of the card
    const padding = 20; // Minimum padding between cards

    while (positions.length < numCards) {
        const left = Math.random() * (container.clientWidth - cardWidth - padding * 2) + padding;
        const top = Math.random() * (container.clientHeight - cardHeight - padding * 2) + padding;

        if (!positions.some(pos => isOverlapping(pos, { left, top }, cardWidth, cardHeight))) {
            positions.push({ left, top });
        }
    }

    return positions;
}

function isOverlapping(pos1, pos2, width, height) {
    return (
        pos1.left < pos2.left + width &&
        pos1.left + width > pos2.left &&
        pos1.top < pos2.top + height &&
        pos1.top + height > pos2.top
    );
}
