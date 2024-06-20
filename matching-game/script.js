let matchedPairs = 0;
let offsetX, offsetY, currentElement;
let matchedCards = new Set();
let pairs = {};
let zIndexCounter = 1000;
let gameFinished = false;
const numPairs = 5;
const appleImagePath = 'apple.png';
let score = 0;
let isMatching = false; // Track if a match is being processed

window.onload = function() {
    initGame();
};

function initGame() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.innerHTML = '';
    matchedPairs = 0;
    matchedCards.clear();
    pairs = {};
    zIndexCounter = 1000;
    gameFinished = false;
    score = 0;

    const { problems, answers } = generateProblemsAndSolutions(numPairs);
    const positions = generateRandomPositions(gameContainer, numPairs * 2);

    problems.forEach((item, index) => {
        createCard(item.problem, item.answer, `problem-${index}`, 'problem', positions[index].left, positions[index].top);
    });

    answers.forEach((item, index) => {
        createCard(item, item, `answer-${index}`, 'answer', positions[numPairs + index].left, positions[numPairs + index].top);
    });

    document.getElementById('popup').style.display = 'none';
}

function createCard(content, answer, id, type, left, top) {
    const card = document.createElement('div');
    card.className = 'card puzzle-piece';
    card.id = id;
    card.dataset.answer = answer;
    card.dataset.type = type;
    card.dataset.paired = 'false';
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.zIndex = zIndexCounter++;

    card.innerHTML = type === 'problem' ? createProblemHTML(content) : createAnswerHTML(answer);

    card.onmousedown = dragStart;
    card.onclick = () => {
        if (!isMatching) { // Prevent reading if a match is being processed
            if (card.dataset.paired === 'true') {
                const pairedCard = pairs[card.id];
                if (pairedCard) {
                    // If the clicked card is part of a matched pair, read the full equation
                    const problemCard = card.dataset.type === 'problem' ? card : pairedCard;
                    const answerCard = card.dataset.type === 'answer' ? card : pairedCard;
                    const problem = formatEquationForSpeech(problemCard.innerText.trim().split('=').slice(0, -1).join(' equals '));
                    const answer = answerCard.dataset.answer;
                    const equationText = `${problem} equals ${formatAnswerForSpeech(answer)}`;
                    speakText(equationText);
                }
            } else {
                // Otherwise, read the individual card's text
                speakText(type === 'problem' ? formatEquationForSpeech(content) : formatAnswerForSpeech(answer));
            }
        }
    };

    document.querySelector('.game-container').appendChild(card);
}

function createProblemHTML(problem) {
    const [left, operator, right] = problem.split(' ');
    return `
        <div class="puzzle-content-horizontal">
            <div class="equation-part">${left}</div>
            <div class="equation-part operator">${operator}</div>
            <div class="equation-part">${right}</div>
            <div class="equation-part operator">=</div> <!-- Added equal sign -->
        </div>
    `;
}

function createAnswerHTML(answer) {
    const apples = organizeInRows(parseInt(answer, 10), appleImagePath);
    return `<div class="puzzle-content">${apples}</div>`;
}

function organizeInRows(count, imagePath) {
    const apples = [];
    for (let i = 0; i < count; i++) {
        apples.push(`<img src="${imagePath}" class="shape">`);
    }
    const rows = [];
    while (apples.length > 0) {
        rows.push(`<div class="row">${apples.splice(0, 5).join('')}</div>`); // 5 apples per row
    }
    return rows.join('');
}

function formatEquationForSpeech(equation) {
    // Replace '-' with 'minus', '+' with 'plus', '=' with 'equals'
    return equation.replace('-', ' minus ').replace('+', ' plus ').replace('=', ' equals');
}

function formatAnswerForSpeech(answer) {
    // Format the answer text to handle singular and plural cases
    const count = parseInt(answer, 10);
    return `${count} ${count === 1 ? 'apple' : 'apples'}`;
}

function speakText(text, onEndCallback = null) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }
    speechSynthesis.speak(utterance);
}

function dragStart(event) {
    if (gameFinished) return;

    currentElement = event.target.closest('.card');

    if (currentElement.dataset.paired === 'true') {
        const pairedElement = pairs[currentElement.id];
        if (pairedElement) {
            currentElement = pairedElement;
        }
    }

    offsetX = event.clientX - currentElement.getBoundingClientRect().left;
    offsetY = event.clientY - currentElement.getBoundingClientRect().top;

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
            if (newLeft < 0) newLeft = 0;
            if (newLeft + currentElement.offsetWidth + pairedElement.offsetWidth > gameContainer.width) {
                newLeft = gameContainer.width - currentElement.offsetWidth - pairedElement.offsetWidth;
            }
            if (newTop < 0) newTop = 0;
            if (newTop + currentElement.offsetHeight > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;
        } else if (currentElement.dataset.type === 'answer') {
            if (newLeft < pairedElement.offsetWidth) newLeft = pairedElement.offsetWidth;
            if (newLeft + currentElement.offsetWidth > gameContainer.width) {
                newLeft = gameContainer.width - currentElement.offsetWidth;
            }
            if (newTop < 0) newTop = 0;
            if (newTop + currentElement.offsetHeight > gameContainer.height) newTop = gameContainer.height - currentElement.offsetHeight;
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
                matched = true;
                snapTogether(currentElement, otherCard);
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
    const proximityThreshold = 50;
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
    isMatching = true; // Indicate that a match is being processed

    const gameContainer = document.querySelector('.game-container').getBoundingClientRect();
    const problemCard = card1.dataset.type === 'problem' ? card1 : card2;
    const answerCard = card1.dataset.type === 'answer' ? card1 : card2;

    // Position answer card relative to the problem card
    answerCard.style.left = `${problemCard.offsetLeft + problemCard.offsetWidth}px`;
    answerCard.style.top = `${problemCard.offsetTop}px`;

    // Ensure both cards are within the container bounds
    ensureInView(problemCard, gameContainer);
    ensureInView(answerCard, gameContainer);

    // Mark cards as matched
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
        // Read the complete matched equation and then show the popup
        const problem = formatEquationForSpeech(problemCard.innerText.trim().split('=').slice(0, -1).join(' equals '));
        const answer = answerCard.dataset.answer;
        const equationText = `${problem} equals ${formatAnswerForSpeech(answer)}`;
        speakText(equationText, showPopup);
    } else {
        // Read the complete matched equation
        const problem = formatEquationForSpeech(problemCard.innerText.trim().split('=').slice(0, -1).join(' equals '));
        const answer = answerCard.dataset.answer;
        const equationText = `${problem} equals ${formatAnswerForSpeech(answer)}`;
        speakText(equationText);
    }

    // Allow subsequent text-to-speech after a brief delay to prevent overlapping announcements
    setTimeout(() => isMatching = false, 1000);
}

function ensureInView(card, container) {
    const cardRect = card.getBoundingClientRect();

    // Calculate the new position if the card is out of the container bounds
    let newLeft = card.offsetLeft;
    let newTop = card.offsetTop;

    if (cardRect.left < container.left) {
        newLeft = 0; // Align with the left edge of the container
    } else if (cardRect.right > container.right) {
        newLeft = container.width - cardRect.width; // Align with the right edge of the container
    }

    if (cardRect.top < container.top) {
        newTop = 0; // Align with the top edge of the container
    } else if (cardRect.bottom > container.bottom) {
        newTop = container.height - cardRect.height; // Align with the bottom edge of the container
    }

    // Update card position if necessary
    card.style.left = `${newLeft}px`;
    card.style.top = `${newTop}px`;
}

function showPopup() {
    const popup = document.getElementById('popup');
    const gameContainer = document.querySelector('.game-container').getBoundingClientRect();
    popup.style.display = 'block';
    popup.style.left = `${(gameContainer.width - popup.offsetWidth) / 2}px`;
    popup.style.top = `${(gameContainer.height - popup.offsetHeight) / 2}px`;
    popup.style.zIndex = zIndexCounter++;
    gameFinished = true;
}

function resetGame() {
    matchedPairs = 0;
    matchedCards.clear();
    pairs = {};
    gameFinished = false;
    score = 0; // Reset score
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
                const problemText = `${a} + ${b}`;
                if (!answers.has(answer)) {
                    problems.push({ problem: problemText, answer: answer.toString() });
                    answers.add(answer);
                }
            }
        } else {
            if (a < b) [a, b] = [b, a];
            answer = a - b;
            const problemText = `${a} - ${b}`;
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
    const cardWidth = 200;
    const cardHeight = 150;
    const padding = 20;

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
