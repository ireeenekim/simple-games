document.addEventListener("DOMContentLoaded", () => {
    const equationTiles = document.querySelectorAll(".equation-tile");
    const answerTiles = document.querySelectorAll(".answer-tile");
    let selectedEquation = null;
    const displayEquationContainer = document.createElement('div');
    displayEquationContainer.classList.add('display-equation');
    document.querySelector('.main-content').appendChild(displayEquationContainer);

    displayEquationContainer.style.display = 'none'; // Hide initially

    answerTiles.forEach((tile, index) => {
        if (!tile.id) {
            tile.id = `answer-tile-${index + 1}`;
        }
    });

    const imageMap = {
        "52": "url('1.jpg')",
        "46": "url('3.jpg')",
        "17": "url('4.jpg')",
        "43": "url('5.jpg')",
        "10": "url('6.jpg')",
        "8": "url('8.jpg')",
        "50": "url('9.jpg')",
        "101": "url('10.jpg')",
        "60": "url('11.jpg')",
        "9": "url('12.jpg')"
    };

    answerTiles.forEach(tile => {
        const answerValue = tile.getAttribute("data-answer");
        if (imageMap[answerValue]) {
            tile.style.backgroundImage = imageMap[answerValue];
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundRepeat = 'no-repeat';
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    const answerTileArray = Array.from(answerTiles);
    shuffleArray(answerTileArray);

    const answerTilesContainer = document.querySelector('.answer-tiles');
    answerTilesContainer.innerHTML = '';
    answerTileArray.forEach(tile => {
        answerTilesContainer.appendChild(tile);
    });

    const disableTileIds = ["equation-2", "equation-7"];
    disableTileIds.forEach(id => {
        const tile = document.getElementById(id);
        if (tile) {
            tile.classList.add("unclickable");
            tile.style.pointerEvents = "none";
            tile.style.backgroundImage = id === "equation-2" ? "url('2.jpg')" : "url('7.jpg')";
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundRepeat = 'no-repeat';
            tile.style.backgroundPosition = 'center';
        }
    });

    function showCarrying(equation, correctAnswer, color = 'green') {
        const topNumElement = equation.querySelector('.number.top');
        const bottomNumElement = equation.querySelector('.number.bottom');
        const operatorElement = equation.querySelector('.operator');

        if (topNumElement && bottomNumElement && operatorElement) {
            const topNum = topNumElement.innerText;
            const bottomNum = bottomNumElement.innerText;
            const operator = operatorElement.innerText;

            if (operator === '+') {
                const topDigits = topNum.split('').reverse();
                const bottomDigits = bottomNum.split('').reverse();
                let carry = 0;
                let carryHtml = '';
                let carried = false;

                topDigits.forEach((digit, index) => {
                    const sum = parseInt(digit) + parseInt(bottomDigits[index] || 0) + carry;
                    if (sum >= 10) {
                        carryHtml = `<div class="carry">1</div>` + carryHtml;
                        carry = 1;
                        carried = true;
                    } else {
                        carry = 0;
                    }
                });

                displayEquationContainer.innerHTML = `
          <div class="horizontal-equation-popup" style="font-size: 24px; line-height: 1.1; color: ${color}; white-space: nowrap;">
            ${topNum} ${operator} ${bottomNum} = <span style="color: ${color};">${correctAnswer}</span>
          </div>`;
            }
        }
    }

    equationTiles.forEach(tile => {
        if (!disableTileIds.includes(tile.id)) {
            tile.addEventListener("click", (event) => {
                event.stopPropagation();
                if (!tile.classList.contains("placeholder")) {
                    equationTiles.forEach(t => t.classList.remove("active"));
                    equationTiles.forEach(t => t.style.outline = '');
                    answerTiles.forEach(t => t.classList.remove("correct"));

                    selectedEquation = tile;
                    tile.classList.add("active");

                    displayEquationContainer.style.display = 'flex';
                    displayEquationContainer.innerHTML = selectedEquation.innerHTML;

                    const solutionGrid = document.querySelector('.answer-tiles');
                    const solutionGridRect = solutionGrid.getBoundingClientRect();
                    const mainContentRect = document.querySelector('.main-content').getBoundingClientRect();

                    displayEquationContainer.style.top = `${solutionGridRect.top - mainContentRect.top - displayEquationContainer.clientHeight - 20}px`;
                    displayEquationContainer.style.left = `${solutionGridRect.left + solutionGridRect.width / 2 - displayEquationContainer.clientWidth / 2}px`;

                    displayEquationContainer.style.position = 'absolute';
                    displayEquationContainer.style.border = 'none';

                    const verticalEquation = selectedEquation.querySelector('.vertical-equation');
                    if (verticalEquation) {
                        displayEquationContainer.innerHTML = '';
                        const clonedEquation = verticalEquation.cloneNode(true);
                        displayEquationContainer.appendChild(clonedEquation);
                    }
                }
            });

            tile.addEventListener("dragover", (e) => {
                e.preventDefault();
                tile.classList.add("over");
            });

            tile.addEventListener("dragleave", () => {
                tile.classList.remove("over");
            });

            tile.addEventListener("drop", (e) => {
                e.preventDefault();
                tile.classList.remove("over");

                const draggedId = e.dataTransfer.getData("text/plain");
                const draggedElement = document.getElementById(draggedId);

                if (!draggedElement) {
                    console.error("Dragged element not found.");
                    return;
                }

                const correctAnswer = tile.getAttribute("data-equation");
                const selectedAnswer = draggedElement.getAttribute("data-answer");

                if (correctAnswer === selectedAnswer) {
                    tile.classList.add("correct");
                    tile.style.backgroundColor = "#f8c6dc";

                    const placeholder = document.createElement('div');
                    placeholder.classList.add('placeholder');
                    placeholder.style.width = '100px';
                    placeholder.style.height = '100px';
                    placeholder.style.border = '1px solid white';
                    placeholder.style.boxSizing = 'border-box';
                    placeholder.style.backgroundColor = 'white';
                    draggedElement.parentNode.replaceChild(placeholder, draggedElement);

                    tile.appendChild(draggedElement);
                    draggedElement.classList.add("correct");
                    draggedElement.style.position = "absolute";
                    draggedElement.style.top = "0";
                    draggedElement.style.left = "0";
                    draggedElement.style.width = "100%";
                    draggedElement.style.height = "100%";

                    tile.style.backgroundImage = draggedElement.style.backgroundImage;
                    tile.style.backgroundSize = 'cover';

                    const equationParts = tile.innerText.split(/[\s\+\-\=]/).filter(Boolean);
                    if (equationParts.length >= 2) {
                        const [num1, num2] = equationParts;
                        const operator = tile.innerText.includes('+') ? '+' : '-';
                        if (tile.querySelector('.vertical-equation')) {
                            tile.innerHTML = `
                <div class="vertical-equation" style="font-size: 24px; line-height: 1.1;">
                  <div class="number top">${num1}</div>
                  <div class="operator" style="left: 15px;">${operator}</div>
                  <div class="number bottom">${num2}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: black;">${correctAnswer}</div>
                </div>`;

                            displayEquationContainer.innerHTML = `
                <div class="vertical-equation-popup" style="font-size: 24px; line-height: 1.1; color: green;">
                  <div class="number top">${num1}</div>
                  <div class="operator" style="left: 15px;">${operator}</div>
                  <div class="number bottom">${num2}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: green;">${correctAnswer}</div>
                </div>`;
                        } else {
                            tile.innerHTML = `
                <div class="horizontal-equation">
                  ${num1} ${operator} ${num2} = ${correctAnswer}
                </div>`;

                            displayEquationContainer.innerHTML = `
                <div class="horizontal-equation-popup" style="font-size: 24px; line-height: 1.1; color: green; white-space: nowrap;">
                  ${num1} ${operator} ${num2} = <span style="color: green;">${correctAnswer}</span>
                </div>`;
                        }
                    }
                } else {
                    const equation = tile.querySelector('.vertical-equation') || tile.querySelector('.horizontal-equation');
                    if (equation) {
                        displayEquationContainer.innerHTML = '';
                        const incorrectEquation = equation.cloneNode(true);

                        if (tile.querySelector('.horizontal-equation')) {
                            const parts = incorrectEquation.innerText.split(/[\s\+\-\=]/).filter(Boolean);
                            if (parts.length >= 2) {
                                const [num1, num2] = parts;
                                const operator = incorrectEquation.innerText.includes('+') ? '+' : '-';
                                displayEquationContainer.innerHTML = `
                  <div class="horizontal-equation-popup" style="font-size: 24px; line-height: 1.1; color: red; white-space: nowrap;">
                    ${num1} ${operator} ${num2} = <span style="color: red;">${correctAnswer}</span>
                  </div>`;
                            }
                        } else if (tile.querySelector('.vertical-equation')) {
                            displayEquationContainer.innerHTML = `
                <div class="vertical-equation-popup" style="font-size: 24px; line-height: 1.1; color: red;">
                  <div class="number top">${tile.querySelector('.number.top').innerText}</div>
                  <div class="operator" style="left: 15px;">${tile.querySelector('.operator').innerText}</div>
                  <div class="number bottom">${tile.querySelector('.number.bottom').innerText}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: red;">${correctAnswer}</div>
                </div>`;
                        } else {
                            displayEquationContainer.appendChild(incorrectEquation);
                        }

                        displayEquationContainer.style.display = 'flex';

                        const solutionGrid = document.querySelector('.answer-tiles');
                        const solutionGridRect = solutionGrid.getBoundingClientRect();
                        const mainContentRect = document.querySelector('.main-content').getBoundingClientRect();

                        displayEquationContainer.style.top = `${solutionGridRect.top - mainContentRect.top - displayEquationContainer.clientHeight - 20}px`;
                        displayEquationContainer.style.left = `${solutionGridRect.left + solutionGridRect.width / 2 - displayEquationContainer.clientWidth / 2}px`;
                    }

                    draggedElement.style.display = "";
                }
            });
        }
    });

    answerTiles.forEach(tile => {
        tile.setAttribute("draggable", "true");

        tile.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", e.target.id);
            e.target.classList.add("dragging");
        });

        tile.addEventListener("dragend", (e) => {
            e.target.classList.remove("dragging");
        });

        tile.addEventListener("click", (event) => {
            event.stopPropagation();
            if (selectedEquation) {
                const correctAnswer = selectedEquation.getAttribute("data-equation");
                const selectedAnswer = tile.getAttribute("data-answer");

                if (correctAnswer === selectedAnswer) {
                    selectedEquation.classList.remove("active");
                    selectedEquation.classList.add("correct");
                    selectedEquation.style.backgroundColor = "#f8c6dc";

                    const placeholder = document.createElement('div');
                    placeholder.classList.add('placeholder');
                    placeholder.style.width = '100px';
                    placeholder.style.height = '100px';
                    placeholder.style.border = '1px solid white';
                    placeholder.style.boxSizing = 'border-box';
                    placeholder.style.backgroundColor = 'white';
                    tile.parentNode.replaceChild(placeholder, tile);

                    selectedEquation.appendChild(tile);
                    tile.style.position = "absolute";
                    tile.style.top = "0";
                    tile.style.left = "0";
                    tile.style.width = "100%";
                    tile.style.height = "100%";

                    selectedEquation.style.backgroundImage = tile.style.backgroundImage;
                    selectedEquation.style.backgroundSize = 'cover';

                    const equationParts = selectedEquation.innerText.split(/[\s\+\-\=]/).filter(Boolean);
                    if (equationParts.length >= 2) {
                        const [num1, num2] = equationParts;
                        const operator = selectedEquation.innerText.includes('+') ? '+' : '-';
                        if (selectedEquation.querySelector('.vertical-equation')) {
                            selectedEquation.innerHTML = `
                <div class="vertical-equation" style="font-size: 24px; line-height: 1.1;">
                  <div class="number top">${num1}</div>
                  <div class="operator" style="left: 15px;">${operator}</div>
                  <div class="number bottom">${num2}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: black;">${correctAnswer}</div>
                </div>`;

                            displayEquationContainer.innerHTML = `
                <div class="vertical-equation-popup" style="font-size: 24px; line-height: 1.1; color: green;">
                  <div class="number top">${num1}</div>
                  <div class="operator" style="left: 15px;">${operator}</div>
                  <div class="number bottom">${num2}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: green;">${correctAnswer}</div>
                </div>`;
                        } else {
                            selectedEquation.innerHTML = `
                <div class="horizontal-equation">
                  ${num1} ${operator} ${num2} = ${correctAnswer}
                </div>`;

                            displayEquationContainer.innerHTML = `
                <div class="horizontal-equation-popup" style="font-size: 24px; line-height: 1.1; color: green; white-space: nowrap;">
                  ${num1} ${operator} ${num2} = <span style="color: green;">${correctAnswer}</span>
                </div>`;
                        }
                    }
                } else {
                    const equation = selectedEquation.querySelector('.vertical-equation') || selectedEquation.querySelector('.horizontal-equation');
                    if (equation) {
                        displayEquationContainer.innerHTML = '';
                        const incorrectEquation = equation.cloneNode(true);

                        if (selectedEquation.querySelector('.horizontal-equation')) {
                            const parts = incorrectEquation.innerText.split(/[\s\+\-\=]/).filter(Boolean);
                            if (parts.length >= 2) {
                                const [num1, num2] = parts;
                                const operator = incorrectEquation.innerText.includes('+') ? '+' : '-';
                                displayEquationContainer.innerHTML = `
                  <div class="horizontal-equation-popup" style="font-size: 24px; line-height: 1.1; color: red; white-space: nowrap;">
                    ${num1} ${operator} ${num2} = <span style="color: red;">${correctAnswer}</span>
                  </div>`;
                            }
                        } else if (selectedEquation.querySelector('.vertical-equation')) {
                            displayEquationContainer.innerHTML = `
                <div class="vertical-equation-popup" style="font-size: 24px; line-height: 1.1; color: red;">
                  <div class="number top">${selectedEquation.querySelector('.number.top').innerText}</div>
                  <div class="operator" style="left: 15px;">${selectedEquation.querySelector('.operator').innerText}</div>
                  <div class="number bottom">${selectedEquation.querySelector('.number.bottom').innerText}</div>
                  <div class="horizontal-line"></div>
                  <div class="solution" style="font-size: 24px; color: red;">${correctAnswer}</div>
                </div>`;
                        } else {
                            displayEquationContainer.appendChild(incorrectEquation);
                        }

                        displayEquationContainer.style.display = 'flex';

                        const solutionGrid = document.querySelector('.answer-tiles');
                        const solutionGridRect = solutionGrid.getBoundingClientRect();
                        const mainContentRect = document.querySelector('.main-content').getBoundingClientRect();

                        displayEquationContainer.style.top = `${solutionGridRect.top - mainContentRect.top - displayEquationContainer.clientHeight - 20}px`;
                        displayEquationContainer.style.left = `${solutionGridRect.left + solutionGridRect.width / 2 - displayEquationContainer.clientWidth / 2}px`;
                    }
                }
            }
        });
    });

    document.addEventListener("click", (event) => {
        const equationGrid = document.querySelector(".puzzle-board");
        const solutionGrid = document.querySelector(".answer-tiles");
        if (!equationGrid.contains(event.target) && !solutionGrid.contains(event.target)) {
            equationTiles.forEach(t => t.classList.remove("active"));
            equationTiles.forEach(t => t.style.outline = '');
            displayEquationContainer.style.display = 'none';
        }
    });
});
