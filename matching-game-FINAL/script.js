document.addEventListener("DOMContentLoaded", () => {
    const equationTiles = document.querySelectorAll(".equation-tile");
    const answerTiles = document.querySelectorAll(".answer-tile");
    let selectedEquation = null;
    const displayEquationContainer = document.createElement('div');
    displayEquationContainer.classList.add('display-equation');
    document.querySelector('.main-content').appendChild(displayEquationContainer);

    displayEquationContainer.style.display = 'none'; // Hide initially

    // Add unique IDs to answer tiles if they don't already have one
    answerTiles.forEach((tile, index) => {
        if (!tile.id) {
            tile.id = `answer-tile-${index + 1}`;
        }
    });

    // Map images to answer tiles
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

    // Set background images for answer tiles
    answerTiles.forEach(tile => {
        const answerValue = tile.getAttribute("data-answer");
        if (imageMap[answerValue]) {
            tile.style.backgroundImage = imageMap[answerValue];
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundRepeat = 'no-repeat';
        }
    });

    // Shuffle the answer tiles
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Convert NodeList to array for shuffling
    const answerTileArray = Array.from(answerTiles);
    shuffleArray(answerTileArray);

    // Append shuffled tiles to answer-tiles container
    const answerTilesContainer = document.querySelector('.answer-tiles');
    answerTilesContainer.innerHTML = ''; // Clear current order
    answerTileArray.forEach(tile => {
        answerTilesContainer.appendChild(tile);
    });

    // Disable interaction for specific equation tiles
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

    equationTiles.forEach(tile => {
        if (!disableTileIds.includes(tile.id)) {
            tile.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent click from propagating to document
                if (!tile.classList.contains("placeholder")) {
                    equationTiles.forEach(t => t.classList.remove("active"));
                    equationTiles.forEach(t => t.style.outline = ''); // Remove outlines from all tiles
                    answerTiles.forEach(t => t.classList.remove("correct"));

                    selectedEquation = tile;
                    tile.classList.add("active");

                    // Display the equation in the fixed section
                    displayEquationContainer.style.display = 'flex';
                    displayEquationContainer.innerHTML = selectedEquation.innerHTML;

                    // Adjust position to be above the solution grid
                    const solutionGrid = document.querySelector('.answer-tiles');
                    const solutionGridRect = solutionGrid.getBoundingClientRect();
                    const mainContentRect = document.querySelector('.main-content').getBoundingClientRect();

                    // Position displayEquationContainer relative to solutionGrid
                    displayEquationContainer.style.top = `${solutionGridRect.top - mainContentRect.top - displayEquationContainer.clientHeight - 20}px`;
                    displayEquationContainer.style.left = `${solutionGridRect.left + solutionGridRect.width / 2 - displayEquationContainer.clientWidth / 2}px`;

                    // Ensure the outline is a complete square
                    displayEquationContainer.style.position = 'absolute';
                    displayEquationContainer.style.border = 'none'; // Remove border

                    // Match the alignment for vertical equations
                    if (selectedEquation.querySelector('.vertical-equation')) {
                        displayEquationContainer.innerHTML = '';
                        const clonedEquation = selectedEquation.querySelector('.vertical-equation').cloneNode(true);
                        displayEquationContainer.appendChild(clonedEquation);
                    }
                }
            });

            // Drag and drop logic for equation tiles
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
                    tile.style.backgroundColor = "#f8c6dc"; // Light pink

                    // Snap solution card on top of the equation card
                    draggedElement.style.display = "none"; // Hide the answer tile
                    tile.appendChild(draggedElement);
                    draggedElement.classList.add("correct");
                    draggedElement.style.position = "absolute";
                    draggedElement.style.top = "0";
                    draggedElement.style.left = "0";
                    draggedElement.style.width = "100%";
                    draggedElement.style.height = "100%";

                    // Set the background image
                    tile.style.backgroundImage = draggedElement.style.backgroundImage;
                    tile.style.backgroundSize = 'cover';

                    // Display the full equation
                    const equationParts = tile.textContent.split(/[\s\+\-\=]/).filter(Boolean);
                    if (equationParts.length >= 2) {
                        const [num1, num2] = equationParts;
                        const operator = tile.textContent.includes('+') ? '+' : '-';
                        if (tile.querySelector('.vertical-equation')) {
                            // For vertical equations
                            tile.innerHTML = `
                                <div class="vertical-equation" style="font-size: 24px; line-height: 1.1;">
                                    <div class="number top">${num1}</div>
                                    <div class="operator" style="left: 15px;">${operator}</div>
                                    <div class="number bottom">${num2}</div>
                                    <div class="horizontal-line"></div>
                                    <div class="solution" style="font-size: 24px;">${correctAnswer}</div>
                                </div>`;
                        } else {
                            // For horizontal equations
                            const fullEquation = `${num1} ${operator} ${num2} = ${correctAnswer}`;
                            tile.innerHTML = `<div style="font-size: 14px;">${fullEquation}</div>`;
                        }
                    }
                    draggedElement.classList.remove("correct");
                } else {
                    // If incorrect, return the answer tile to its original position
                    draggedElement.style.display = ""; // Show the answer tile again
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
            event.stopPropagation(); // Prevent click from propagating to document
            if (selectedEquation) {
                const correctAnswer = selectedEquation.getAttribute("data-equation");
                const selectedAnswer = tile.getAttribute("data-answer");

                if (correctAnswer === selectedAnswer) {
                    selectedEquation.classList.remove("active");
                    selectedEquation.classList.add("correct");
                    selectedEquation.style.backgroundColor = "#f8c6dc"; // Light pink

                    // Hide the answer tile and snap it on top of the equation tile
                    tile.style.display = "none";
                    selectedEquation.appendChild(tile);
                    tile.style.position = "absolute";
                    tile.style.top = "0";
                    tile.style.left = "0";
                    tile.style.width = "100%";
                    tile.style.height = "100%";

                    // Set the background image
                    selectedEquation.style.backgroundImage = tile.style.backgroundImage;
                    selectedEquation.style.backgroundSize = 'cover';

                    // Display the full equation
                    const equationParts = selectedEquation.textContent.split(/[\s\+\-\=]/).filter(Boolean);
                    if (equationParts.length >= 2) {
                        const [num1, num2] = equationParts;
                        const operator = selectedEquation.textContent.includes('+') ? '+' : '-';
                        if (selectedEquation.querySelector('.vertical-equation')) {
                            // For vertical equations
                            selectedEquation.innerHTML = `
                                <div class="vertical-equation" style="font-size: 24px; line-height: 1.1;">
                                    <div class="number top">${num1}</div>
                                    <div class="operator" style="left: 15px;">${operator}</div>
                                    <div class="number bottom">${num2}</div>
                                    <div class="horizontal-line"></div>
                                    <div class="solution" style="font-size: 24px;">${correctAnswer}</div>
                                </div>`;
                        } else {
                            // For horizontal equations
                            const fullEquation = `${num1} ${operator} ${num2} = ${correctAnswer}`;
                            selectedEquation.innerHTML = `<div style="font-size: 14px;">${fullEquation}</div>`;
                        }
                    }
                }
            }
        });
    });

    // Hide equation display and remove blue outline on clicking outside
    document.addEventListener("click", (event) => {
        // Check if the click happened outside the equation grid and solution grid
        const equationGrid = document.querySelector(".puzzle-board");
        const solutionGrid = document.querySelector(".answer-tiles");
        if (!equationGrid.contains(event.target) && !solutionGrid.contains(event.target)) {
            // Remove active class from all equation tiles
            equationTiles.forEach(t => t.classList.remove("active"));
            equationTiles.forEach(t => t.style.outline = ''); // Remove outlines from all tiles

            // Hide the displayed equation
            displayEquationContainer.style.display = 'none';
        }
    });
});
