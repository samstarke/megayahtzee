document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('roll-button').addEventListener('click', rollDice);
    document.getElementById('sort-button').addEventListener('click', sortDice);
    document.getElementById('score-bonus').style.visibility = 'hidden';
    document.querySelectorAll('.score-info').forEach(item => {
        item.addEventListener('click', function(event) {
            const tooltipId = this.getAttribute('data-tooltip-id');
            const tooltip = document.getElementById(tooltipId);

            // Close all other tooltips
            document.querySelectorAll('.tooltip-content').forEach(tooltip => {
                tooltip.style.display = 'none';
            });
            
            // Get mouse click coordinates and position the tooltip
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            tooltip.style.left = mouseX + 'px';
            tooltip.style.top = mouseY + 'px';
            tooltip.style.display = 'block';
        });
    });

    // Close tooltip on clicking anywhere else on the document
    document.addEventListener('click', function(event) {
        if (!event.target.classList.contains('score-info')) {
            closeAllTooltips();
        }
    });

    // Close button for each tooltip
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });

    createDice();
});

function startGame() {
    const playerContainer = document.getElementById('player-container');
    const gameLinkContainer = document.getElementById('game-link-container');
    const gameLink = document.getElementById('game-link');

    const gameId = Math.random().toString(36).substring(2, 8);

    gameLinkContainer.style.display = 'block';
    gameLink.value = window.location.href + '?game=' + gameId;

    playerContainer.innerHTML = `
      <div>Player 1: You</div>
      <div>Player 2: <button onclick="addBotPlayer()">Add Bot Player</button></div>
    `;

    // Disable the start button
    this.disabled = true;
}

function addBotPlayer() {
    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML += `<div>Player 2: Bot</div>`;
}

let rollCount = 0;
const maxRolls = 4; 
let isRolling = false;
let bonusAwarded = false;

function rollDice() {
    if (rollCount < maxRolls && !isRolling) {
        // Instantly update rolls left and disable buttons
        document.getElementById('roll-button').disabled = true;
        document.getElementById('sort-button').disabled = true;
        isRolling = true; // Indicate that rolling has started
        disableScoreSelection(); // Disable interaction with score boxes
        rollCount++; // Increment roll count immediately
        document.getElementById('roll-button').innerHTML = `<b>Roll! </b>(${4 - rollCount} left)`;

        let dice = document.querySelectorAll('.dice:not(.reserved)');
        let animationDelay = 20;
        let stopSteps = [];

        for (let i = 0; i < dice.length; i++) {
            stopSteps[i] = Math.random() * (maxRolls - rollCount + 1) * 5 + 10;
        }

        dice.forEach(die => die.classList.remove('stopped'));

        const animateRoll = (animationStep) => {
            dice.forEach((die, index) => {
                if (!die.classList.contains('stopped')) {
                    let rollResult = getRandomNumber();
                    die.src = `assets/megayahtzee/dice-${rollResult}.png`;
                    die.dataset.value = rollResult;

                    if (animationStep >= stopSteps[index]) {
                        die.classList.add('stopped');
                    }
                }
            });

            if (Array.from(dice).every(die => die.classList.contains('stopped'))) {
                isRolling = false; // Rolling has completed
                enableScoreSelection(); // Re-enable interaction with score boxes
                calculatePotentialScores(); // Now calculate and display potential scores

                // Re-enable sort button after rolling is done
                document.getElementById('sort-button').disabled = false;

                // If no rolls left, change text and disable roll button
                if (rollCount >= maxRolls) {
                    document.getElementById('roll-button').disabled = true;
                    updateTotalScore();
                } else {
                    document.getElementById('roll-button').disabled = false;
                    updateTotalScore();
                }
            } else {
                animationDelay += 5;
                setTimeout(() => animateRoll(animationStep + 1), animationDelay);
            }
        };

        animateRoll(0);
    } else {
        document.getElementById('roll-button').disabled = true;
        
    }

}

function disableScoreSelection() {
    document.querySelectorAll('.score').forEach(scoreElement => {
        // Ignore already selected scores and the bonus score box
        if (!scoreElement.classList.contains('selected') && scoreElement.id !== 'score-bonus') {
            scoreElement.textContent = ""; // Clear text content for unselected scores
            scoreElement.style.backgroundColor = "#fff"; // Set background to white for unselected scores
            scoreElement.classList.remove('clickable');
            scoreElement.classList.add('disabled');
        }
    });
}


function enableScoreSelection() {
    // Reinstate click events for score selection where applicable
    document.querySelectorAll('.score').forEach(scoreElement => {
        if (!scoreElement.classList.contains('selected')) {
            const scoreType = scoreElement.id.replace('score-', '');
            const potentialScore = scoreElement.getAttribute('data-potential-score');
            if (potentialScore !== null) {
                scoreElement.classList.add('clickable');
                scoreElement.onclick = function() { selectScore(scoreType, parseInt(potentialScore)); };
            }
        }
    });

    // Re-enable tooltips for .score-info elements
    document.querySelectorAll('.score-info').forEach(item => {
        item.addEventListener('click', function(event) {
            const tooltipId = this.getAttribute('data-tooltip-id');
            const tooltip = document.getElementById(tooltipId);
            document.querySelectorAll('.tooltip-content').forEach(tooltip => tooltip.style.display = 'none');
            tooltip.style.display = 'block';
        });
    });
}

function startNewTurn() {
    rollCount = 0; // Reset roll count for the new turn
    document.querySelectorAll('.dice').forEach(die => {
        die.addEventListener('click', function() {
            if (!isRolling) { // Only allow toggling reservation if not currently rolling
                this.classList.toggle('reserved');
                toggleDiceImage(this);
            }
        });
    });
}

function createDice() {
    // Reference to all the dice containers
    const diceContainers = [
        document.getElementById('dice-container-1'),
        document.getElementById('dice-container-2'),
        document.getElementById('dice-container-3')
    ];

    // Clear existing dice first
    diceContainers.forEach(container => container.innerHTML = '');

    // Get the container
    const container = document.createElement('img');
    container.id = `container-dice`;
    container.src = "assets/megayahtzee/dice-container.png";

    // Keep count of dice for ID assignment
    let diceCount = 1;

    // Create and append dice to their respective containers
    diceContainers.forEach(container => {
        // Depending on the container, we assign a different number of dice
        let numberOfDice = container === document.getElementById('dice-container-2') ? 3 : 2;

        for (let i = 0; i < numberOfDice; i++) {
            if (diceCount > 7) break; // Ensure only 7 dice are created in total
            
            const die = document.createElement('img');
            die.id = `dice-${diceCount}`; // Assign ID based on diceCount for easy identification
            die.classList.add('dice');
            die.dataset.value = '1'; // Set a default value
            die.addEventListener('click', function() {
                if (!isRolling && rollCount > 0) { // Only allow toggling of 'reserved' class if not currently rolling and at least one roll has been made
                    this.classList.toggle('reserved');
                    toggleDiceImage(this);
                }
            });

            // Apply specific styles for dice 2, 4, 5, and 7
            if (diceCount === 2 || diceCount === 4 || diceCount === 5 || diceCount === 7) {
                die.style.marginLeft = "5px";
            }

            container.appendChild(die);
            diceCount++;
        }
    });
}

function toggleDiceImage(die) {
    let value = die.dataset.value; // Get the current value of the die
    if (die.classList.contains('reserved')) {
        // Change the source to the reserved image
        die.src = `assets/megayahtzee/dice_reserved-${value}.png`;
    } else {
        // Revert back to the regular image
        die.src = `assets/megayahtzee/dice-${value}.png`;
    }
}

document.getElementById('start-game').addEventListener('click', function() {
    const playerContainer = document.getElementById('player-container');
    const gameLinkContainer = document.getElementById('game-link-container');
    const gameLink = document.getElementById('game-link');

    const gameId = Math.random().toString(36).substring(2, 8);

    gameLinkContainer.style.display = 'block';
    gameLink.value = window.location.href + '?game=' + gameId;

    playerContainer.innerHTML = `
      <div>Player 1: You</div>
      <div>Player 2: <button onclick="addBotPlayer()">Add Bot Player</button></div>
    `;

    this.disabled = true;
});
let diceCount = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
    '7': 0
};

function calculatePotentialScores() {
    const dice = document.querySelectorAll('.dice');
    const diceValues = Array.from(dice).map(die => parseInt(die.dataset.value));
    const scorecard = {
        'aces': calculateUpperSection(diceValues, 1),
        'twos': calculateUpperSection(diceValues, 2),
        'threes': calculateUpperSection(diceValues, 3),
        'fours': calculateUpperSection(diceValues, 4),
        'fives': calculateUpperSection(diceValues, 5),
        'sixes': calculateUpperSection(diceValues, 6),
        'sevens': calculateUpperSection(diceValues, 7),

        '4-of-a-kind': calculateFourOfAKind(diceValues),
        '5-of-a-kind': calculateFiveOfAKind(diceValues),
        'full-house': calculateFullHouse(diceValues),
        'small-straight': calculateSmallStraight(diceValues),
        'large-straight': calculateLargeStraight(diceValues),

        'oddball': calculateOddball(diceValues),
        'even-steven': calculateEvenSteven(diceValues),
        'prime-parade': calculatePrimeParade(diceValues),
        'binary-blast': calculateBinaryBlast(diceValues),
        'whatever': calculateWhatever(diceValues),

        'triple-double': calculateTripleDouble(diceValues),
        'double-triple': calculateDoubleTriple(diceValues),
        'full-full-house': calculateFullFullHouse(diceValues),
        'straight-straight': calculateStraightStraight(diceValues),
        'packed-house': calculatePackedHouse(diceValues),
        'larger-straight': calculateLargerStraight(diceValues),
        '6-of-a-kind': calculateSixOfAKind(diceValues),

        'party-boat': calculatePartyBoat(diceValues),
        'meteor-shower': calculateMeteorShower(diceValues),
        'the-great-pyramids': calculateTheGreatPyramids(diceValues),
        'the-meaning-of-life': calculateTheMeaningOfLife(diceValues),
        'lucky-sevens': calculateLuckySevens(diceValues),
        'comet-in-the-sky': calculateCometInTheSky(diceValues),
        'seventh-wheel': calculateSeventhWheel(diceValues),
        'odd-one-out': calculateOddOneOut(diceValues),
        'largest-straight': calculateLargestStraight(diceValues),
        'megayahtzee': calculateMegayahtzee(diceValues),
    };

    // Calculate the bonus if the upper section total score is 112 or higher
    let upperTotal = scorecard.aces + scorecard.twos + scorecard.threes + 
                     scorecard.fours + scorecard.fives + scorecard.sixes +
                     scorecard.sevens;
    scorecard.bonus = upperTotal >= 112 ? 75 : 0;

    // Update the scorecard on the page
    for (let scoreType in scorecard) {
        const scoreElement = document.getElementById(`score-${scoreType}`);
        if (scoreElement && !scoreElement.classList.contains('selected')) {
            scoreElement.textContent = scorecard[scoreType];
            scoreElement.classList.add('clickable');
            // Only add click listener if it hasn't been selected
            scoreElement.onclick = function() { selectScore(scoreType, scorecard[scoreType]); };
        }
    }

    Object.keys(scorecard).forEach(scoreType => {
        const scoreValue = scorecard[scoreType];
        const scoreElement = document.getElementById(`score-${scoreType}`);
        if (scoreElement && !scoreElement.classList.contains('selected')) {
            scoreElement.textContent = scoreValue;
            scoreElement.classList.add('clickable');
            scoreElement.onclick = function() { selectScore(scoreType, scoreValue); };

            // Change background color based on score value
            if (scoreValue > 0) {
                scoreElement.style.backgroundColor = "#feefa8"; // Faint yellow for non-zero scores
            } else {
                scoreElement.style.backgroundColor = "#ffffff"; // White for zero scores
            }
        }
    });
}

function selectScore(scoreType, scoreValue) {
    if (scoreType === 'bonus') return;
    if (isRolling) return;
    const scoreElement = document.getElementById(`score-${scoreType}`);
    if (scoreElement && !scoreElement.classList.contains('selected')) {
        scoreElement.classList.add('selected', 'finalScore');
        scoreElement.classList.remove('clickable');
        scoreElement.onclick = null;
        scoreElement.textContent = scoreValue; // Update the score for the selected category
        scoreElement.style.backgroundColor = "#ffffff"; // Reset this element's background to white
        

        document.querySelectorAll('.dice').forEach(die => die.classList.remove('reserved'));

        // Reset roll count for a new turn
        rollCount = 0;

        // Blank out unselected scores and reset their backgrounds to white
        document.querySelectorAll('.score').forEach(element => {
            if (!element.classList.contains('selected')) {
                element.textContent = "";
                element.classList.remove('clickable');
                element.onclick = null;
                element.style.backgroundColor = "#ffffff"; // Reset background to white
            }
        });

        // Re-enable the roll button for a new turn
        document.getElementById('roll-button').disabled = false;
        document.getElementById('roll-button').innerHTML = "<b>Roll!</b>"; // Reset the button text

        // Recalculate and update the total score based on all selected categories
        updateTotalScore();
    }
    if (checkIfGameEnded()) {
        displayFinalScore();
    }
}

// Function to blank out scores for unselected categories
function blankOutUnselectedScores() {
    document.querySelectorAll('.score').forEach(scoreElement => {
        // Check if the score element is not selected
        if (!scoreElement.classList.contains('selected')) {
            scoreElement.textContent = "";
            scoreElement.classList.remove('clickable');
            scoreElement.onclick = null;
        }
    });

    clearPotentialScores();
}

function clearPotentialScores() {
    // This function clears the calculated potential scores from the UI
    const potentialScoreElements = document.querySelectorAll('.potential-score');
    potentialScoreElements.forEach(element => {
        element.textContent = ""; // Blank out the potential score
    });
}


function updateTotalScore() {
    let totalScore = 0;
    const bonusElement = document.getElementById('score-bonus');
    const upperSectionScore = calculateUpperSectionTotal();

    if (upperSectionScore >= 112) {
        bonusAwarded = true;
        bonusElement.innerHTML = "<strong>+75</strong>";
        bonusElement.style.visibility = 'visible';
        bonusElement.style.backgroundColor = 'e9e9e9';
    } else if (areAllTalliesScored() && !bonusAwarded) {
        bonusElement.innerHTML = "<strong>+0</strong>";
        bonusElement.style.visibility = 'visible';
        bonusElement.style.backgroundColor = '#e9e9e9';
    } else {
        // Hide the bonus score if the conditions aren't met
        bonusElement.style.visibility = 'hidden';
    }

    // Include the bonus in the total score if it's been awarded
    if (bonusAwarded) {
        totalScore += 75;
    }

    document.querySelectorAll('.score.selected').forEach(scoreElement => {
        totalScore += parseInt(scoreElement.textContent) || 0;
    });

    // Update tooltip for Basic Tallies Bonus
    const upperTotalDisplay = document.getElementById('upper-total-display');
    upperTotalDisplay.textContent = upperSectionScore;

    document.getElementById('score-total').innerHTML = `<strong>${totalScore}</strong>`;
}




function areAllTalliesScored() {
    const upperSectionIds = ['score-aces', 'score-twos', 'score-threes', 'score-fours', 'score-fives', 'score-sixes', 'score-sevens'];
    return upperSectionIds.every(id => document.getElementById(id).classList.contains('selected'));
}

function calculateUpperSectionTotal() {
    const upperSectionIds = ['score-aces', 'score-twos', 'score-threes', 'score-fours', 'score-fives', 'score-sixes', 'score-sevens'];
    let upperSectionScore = 0;
    upperSectionIds.forEach(id => {
        const scoreElement = document.getElementById(id);
        if (scoreElement.classList.contains('selected')) {
            upperSectionScore += parseInt(scoreElement.textContent) || 0;
        }
    });
    return upperSectionScore;
}

function calculateUpperSection(diceValues, number) {
    return diceValues.filter(dieValue => dieValue === number).length * number;
}

function calculateFourOfAKind(diceValues) {
    const counts = getDiceCounts(diceValues);
    let score = 0;

    for (let number in counts) {
        if (counts[number] >= 4) {
            // Calculate score as 8 times the number for the four of a kind
            score = 8 * parseInt(number);

            // If there are more than 4 of the same number, add the value of the additional dice
            if (counts[number] > 4) {
                // Calculate the number of dice not contributing directly to the four of a kind
                let extraDice = counts[number] - 4;
                score += extraDice * parseInt(number);
            }

            break;
        }
    }
    return score;
}

function calculateFiveOfAKind(diceValues) {
    const counts = getDiceCounts(diceValues);
    let score = 0;

    for (let number in counts) {
        if (counts[number] >= 5) {
            // Calculate score as 10 times the number for the five of a kind
            score = 10 * parseInt(number);

            // If there are more than 5 of the same number, add the value of the additional dice
            if (counts[number] > 5) {
                // Calculate the number of dice not contributing directly to the five of a kind
                let extraDice = counts[number] - 5;
                score += extraDice * parseInt(number);
            }

            break;
        }
    }
    return score;
}


function calculateSixOfAKind(diceValues) {
    const counts = getDiceCounts(diceValues);
    for (let number in counts) {
        if (counts[number] >= 6) {
            return 100; // Return 90 if 6 of a kind is found
        }
    }
    return 0; // Return 0 if no 6 of a kind is found
}

function calculateFullHouse(diceValues) {
    const counts = getDiceCounts(diceValues);
    let threeOfAKindFound = false;
    let secondPairOrThreeOfAKindFound = false;

    Object.values(counts).forEach(count => {
        if (count >= 3) {
            if (!threeOfAKindFound) {
                threeOfAKindFound = true; // First three of a kind
            } else {
                secondPairOrThreeOfAKindFound = true; // Additional three or a pair
            }
        } else if (count == 2) {
            secondPairOrThreeOfAKindFound = true; // A pair that's not part of the first three of a kind
        }
    });

    return (threeOfAKindFound && secondPairOrThreeOfAKindFound) ? 25 : 0;
}


function calculateFullFullHouse(diceValues) {
    const counts = getDiceCounts(diceValues);
    
    // Determine if there is at least one three-of-a-kind
    let hasThreeOfAKind = false;
    let pairsCount = 0;
    Object.values(counts).forEach(count => {
        if (count >= 3) {
            hasThreeOfAKind = true;
            // Any count beyond 3 contributes to an additional pair
            const extraPairs = Math.floor((count - 3) / 2);
            pairsCount += extraPairs;
        }
        // Count pairs that are not part of a three-of-a-kind
        if (count === 2) {
            pairsCount++;
        }
    });

    // Valid Full Full House requires at least one three-of-a-kind and at least two pairs
    return hasThreeOfAKind && pairsCount >= 2 ? 60 : 0;
}


function calculatePackedHouse(diceValues) {
    const counts = getDiceCounts(diceValues);
    const uniqueCounts = new Set(Object.values(counts));

    // Special case: All dice are the same number
    if (uniqueCounts.size === 1 && Object.values(counts)[0] === 7) {
        return 80; // Return the score for a Packed House
    }

    let hasFourOfAKind = false;
    let hasThreeOfAKind = false;

    Object.values(counts).forEach(count => {
        if (count === 4) hasFourOfAKind = true;
        if (count === 3) hasThreeOfAKind = true;
    });

    return hasFourOfAKind && hasThreeOfAKind ? 80 : 0;
}

function calculateMeteorShower(diceValues) {
    const counts = getDiceCounts(diceValues);
    let sequenceOfFourExists = false;
    let threeOrFourOfAKindValue = null;
    let extraPoints = 0;

    // Sort dice values to find sequences more easily
    const sortedValues = diceValues.slice().sort((a, b) => a - b);

    // Check for sequence of 4
    for (let i = 0; i <= sortedValues.length - 4; i++) {
        if (sortedValues[i] + 1 === sortedValues[i + 1] &&
            sortedValues[i] + 2 === sortedValues[i + 2] &&
            sortedValues[i] + 3 === sortedValues[i + 3]) {
            sequenceOfFourExists = true;
            break;
        }
    }

    // Check for 3 or 4 of a kind and capture the value
    Object.entries(counts).forEach(([value, count]) => {
        if (count >= 3) {
            threeOrFourOfAKindValue = parseInt(value);
            if (count === 4) {
                extraPoints = 10; // Give 10 more points for a 4 of a kind
            }
        }
    });

    if (sequenceOfFourExists && threeOrFourOfAKindValue !== null) {
        // Calculate score with extra points for 4 of a kind
        return 50 + (5 * threeOrFourOfAKindValue) + extraPoints;
    }

    return 0; // Conditions not met, return 0
}

// Helper function to check for a sequence of 4
function checkForSequenceOfFour(diceValues) {
    const sortedUniqueValues = [...new Set(diceValues)].sort((a, b) => a - b);
    for (let i = 0; i < sortedUniqueValues.length - 3; i++) {
        if (sortedUniqueValues[i + 3] === sortedUniqueValues[i] + 3) {
            return true; // Found a sequence of 4
        }
    }
    return false; // No sequence of 4 found
}

function calculateSmallStraight(diceValues) {
    // Sort the unique values and check for a sequence of 4
    const uniqueValues = [...new Set(diceValues)].sort((a, b) => a - b);
    for (let i = 0; i < uniqueValues.length - 3; i++) {
        if (uniqueValues[i + 3] === uniqueValues[i] + 3) {
            return 30; // Return 30 points if a small straight is found
        }
    }
    return 0; // Return 0 if no small straight is found
}

function calculateLargeStraight(diceValues) {
    // Sort the unique values and check for a sequence of 5
    const uniqueValues = [...new Set(diceValues)].sort((a, b) => a - b);
    for (let i = 0; i < uniqueValues.length - 4; i++) {
        if (uniqueValues[i + 4] === uniqueValues[i] + 4) {
            return 40; // Return 40 points if a large straight is found
        }
    }
    return 0; // Return 0 if no large straight is found
}

function calculateLargerStraight(diceValues) {
    // Sort the unique values and check for a sequence of 4
    const uniqueValues = [...new Set(diceValues)].sort((a, b) => a - b);
    for (let i = 0; i < uniqueValues.length - 5; i++) {
        if (uniqueValues[i + 5] === uniqueValues[i] + 5) {
            return 90; // Return 30 points if a small straight is found
        }
    }
    return 0; // Return 0 if no small straight is found
}

function calculateWhatever(diceValues) {
    return sum(diceValues);
}

function calculateOddball(diceValues) {
    // Sum all odd-numbered dice
    return diceValues.filter(value => value % 2 !== 0).reduce((acc, value) => acc + value, 0);
}

function calculateEvenSteven(diceValues) {
    // Sum all even-numbered dice
    return diceValues.filter(value => value % 2 === 0).reduce((acc, value) => acc + value, 0);
}

function isPrime(number) {
    const primes = [2, 3, 5, 7];
    return primes.includes(number);
}

function calculatePrimeParade(diceValues) {
    // Filter out the prime numbers from the dice values
    const primeDice = diceValues.filter(isPrime);

    // Sum the prime dice and return the result
    return primeDice.reduce((acc, value) => acc + value, 0);
}

function isBinary(number) {
    const binary = [1,2,4];
    return binary.includes(number);
}

function calculateBinaryBlast(diceValues) {
    // Filter out the binary numbers from the dice values
    const binaryDice = diceValues.filter(isBinary);

    // Sum the prime dice and return the result
    return binaryDice.reduce((acc, value) => acc + value, 0);
}



function calculateTripleDouble(diceValues) {
    const counts = getDiceCounts(diceValues);
    let pairs = [];
    for (let number in counts) {
        if (counts[number] >= 2) {
            pairs.push(parseInt(number));
        }
    }
    // There should be at least three pairs
    if (pairs.length >= 3) {
        // Sort and take the first three pairs
        pairs.sort((a, b) => a - b);
        pairs = pairs.slice(0, 3);
        return 15 + pairs.reduce((acc, value) => acc + (2 * value), 0);
    }
    return 0;
}

function calculateDoubleTriple(diceValues) {
    const counts = getDiceCounts(diceValues);
    let triples = [];
    for (let number in counts) {
        if (counts[number] >= 3) {
            triples.push(parseInt(number));
        }
    }
    // There should be at least two triples
    if (triples.length >= 2) {
        // Sort and take the first two triples
        triples.sort((a, b) => a - b);
        triples = triples.slice(0, 2);
        return 25 + triples.reduce((acc, value) => acc + (3 * value), 0);
    }
    return 0;
}

function calculateStraightStraight(diceValues) {
    // Count occurrences of each number
    const counts = diceValues.reduce((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});

    // Function to check if a sequence exists in the counts
    function sequenceExists(start) {
        return counts[start] && counts[start + 1] && counts[start + 2];
    }

    // Attempt to find and remove two identical sequences
    for (let i = 1; i <= 5; i++) { // Sequence start can only be from 1 to 5 for a 3-length sequence
        if (sequenceExists(i)) {
            // First sequence found, reduce counts
            counts[i]--;
            counts[i + 1]--;
            counts[i + 2]--;

            if (sequenceExists(i)) {
                // Second identical sequence found
                return 70;
            } else {
                // Restore counts if the second sequence isn't found
                counts[i]++;
                counts[i + 1]++;
                counts[i + 2]++;
            }
        }
    }

    return 0; // No two identical sequences found
}

function calculatePartyBoat(diceValues) {
    // Get counts of each dice value
    const counts = getDiceCounts(diceValues);

    // Variables to track five of a kind and a pair
    let hasFiveOfAKind = false;
    let hasPair = false;
    let fiveOfAKindValue = null;
    let pairValue = null;

    // Iterate through counts to check for five of a kind and a pair
    Object.keys(counts).forEach(number => {
        if (counts[number] === 5) {
            hasFiveOfAKind = true;
            fiveOfAKindValue = number;
        } else if (counts[number] === 2) {
            hasPair = true;
            pairValue = number;
        }
    });

    // Check if both conditions are met
    if (hasFiveOfAKind && hasPair) {
        return 50 + (5 * parseInt(fiveOfAKindValue)) + (2 * parseInt(pairValue));
    }

    return 0; // Conditions for "party boat" not met
}



function calculateTheGreatPyramids(diceValues) {
    const counts = getDiceCounts(diceValues);

    // Check for palindrome sequence with exactly one or no odd count and no repeats on either side
    let oddCount = 0;
    let palindromeCentralValue = null;
    for (const [diceValue, count] of Object.entries(counts)) {
        // If any count is not 1 or 2 (or potentially one single value being odd), it's not valid
        if (count !== 2 && count !== 1) return 0;
        if (count === 1) {
            oddCount++;
            palindromeCentralValue = parseInt(diceValue);
            // More than one odd count means it's not a valid palindrome
            if (oddCount > 1) return 0;
        }
    }

    // Ensure the numbers form a continuous sequence without gaps
    const sortedValues = Object.keys(counts).map(Number).sort((a, b) => a - b);
    for (let i = 0; i < sortedValues.length - 1; i++) {
        if (sortedValues[i + 1] !== sortedValues[i] + 1) {
            return 0;
        }
    }


    if (parseInt(palindromeCentralValue) === parseInt(Math.max(...diceValues)) 
    ||  parseInt(palindromeCentralValue) === parseInt(Math.min(...diceValues))) {
        // If we get here, it's a valid sequential palindrome
        return 50 + (7 * (palindromeCentralValue || 0)); // Adjust for case with no central value
    } else {
        return 0; // Nothing found
    }
}


function calculateTheMeaningOfLife(diceValues) {
    const total = sum(diceValues);
    return total === 42 ? 64 : 0;
}

function calculateLuckySevens(diceValues) {
    const allDivisibleBySeven = diceValues.every(value => value === 1 || value === 7);
    return allDivisibleBySeven ? 77 : 0;
}

function calculateCometInTheSky(diceValues) {
    const counts = getDiceCounts(diceValues);
    const sequenceCounts = [0, 0, 0, 0, 0, 0, 0]; // To track sequences

    // Fill sequence counts
    diceValues.forEach(value => {
        sequenceCounts[value - 1]++;
    });

    // Check for sequence of 5 and 3 sevens
    const hasSequenceOfFive = sequenceCounts.some((count, index) => 
        index < sequenceCounts.length - 4 && 
        sequenceCounts.slice(index, index + 5).every(c => c > 0)
    );

    return hasSequenceOfFive && counts['7'] >= 3 ? 96 : 0;
}

function calculateSeventhWheel(diceValues) {
    const counts = getDiceCounts(diceValues);
    const pairs = Object.values(counts).filter(count => count === 2).length;
    return pairs === 3 && counts['1'] === 1 ? 85 : 0;
}

function calculateOddOneOut(diceValues) {
    const counts = getDiceCounts(diceValues);
    let hasSixOfAKind = false;
    let hasOneAsExtra = false;

    for (let number in counts) {
        if (counts[number] === 6) hasSixOfAKind = true;
        if (number === '1' && counts[number] === 1) hasOneAsExtra = true;
    }

    return hasSixOfAKind && hasOneAsExtra ? 111 : 0;
}

function calculateLargestStraight(diceValues) {
    // Sort the unique values and check for a sequence of 7
    const uniqueValues = [...new Set(diceValues)].sort((a, b) => a - b);
    for (let i = 0; i < uniqueValues.length - 6; i++) {
        if (uniqueValues[i + 6] === uniqueValues[i] + 6) {
            return 123; // Return 123 points if a largest straight is found
        }
    }
    return 0; // Return 0 if no largest straight is found
}

function calculateMegayahtzee(diceValues) {
    const counts = getDiceCounts(diceValues);
    for (let number in counts) {
        if (counts[number] >= 7) {
            return 200; // Return 200 points if 7 of a kind is found
        }
    }
    return 0; // Return 0 if no 7 of a kind is found
}

function getDiceCounts(diceValues) {
    const counts = {};
    diceValues.forEach(value => {
        counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
}

function sum(diceValues) {
    return diceValues.reduce((acc, value) => acc + value, 0);
}

// Utility function to get a random number between 1 and 7
function getRandomNumber() {
    return Math.floor(Math.random() * 7) + 1; // Returns a number between 1 and 7
}

function sortDice() {
    // Collect dice from all containers
    const allDice = document.querySelectorAll('.dice');
    
    // Convert NodeList to Array and sort based on dataset value
    const sortedDice = Array.from(allDice).sort((a, b) => parseInt(a.dataset.value) - parseInt(b.dataset.value));
    
    // Reference to all the dice containers
    const diceContainers = [
        document.getElementById('dice-container-1'),
        document.getElementById('dice-container-2'),
        document.getElementById('dice-container-3')
    ];
    
    // Clear existing dice from all containers first
    diceContainers.forEach(container => container.innerHTML = '');

    // Keep track of how many dice have been placed to distribute them evenly
    let dicePlaced = 0;
    
    // Iterate over the sorted dice and append them back to the containers
    sortedDice.forEach((die, index) => {
        // Calculate which container to place the die in
        let containerIndex = 0;
        if(index >= 5) { // For dice 6 and 7
            containerIndex = 2;
        } else if(index >= 2) { // For dice 3, 4, and 5
            containerIndex = 1;
        }
        // Append the die to the correct container
        diceContainers[containerIndex].appendChild(die);
        
        dicePlaced++;
        
        // Add margin style if needed based on the original design
        if ([2, 4, 5, 7].includes(dicePlaced)) {
            die.style.marginLeft = "5px";
        } else {
            die.style.marginLeft = "0px"; // Reset margin if not one of the specified dice
        }
    });
}

document.getElementById('sort-button').addEventListener('click', sortDice);

// Function to close all tooltips
function closeAllTooltips() {
    document.querySelectorAll('.tooltip-content').forEach(tooltip => {
        tooltip.style.display = 'none';
    });
}


function displayFinalScore() {
    const totalScoreElement = document.getElementById('score-total');
    const totalContainer = document.getElementById('total-container');
    const finalScore = parseInt(totalScoreElement.textContent) || 0; // Ensure we're working with an integer
    let starRating = '';

    if (finalScore >= 2000) {
        starRating = '★★★★ MEGA PLAYER!!';
        // Set foreground and background colors for 2000+
        totalScoreElement.style.color = "#3c78d8";
        totalContainer.style.backgroundColor = "#cfe2f3";
    } else if (finalScore >= 1875) {
        starRating = '★★★ Amazing!!';
        // Set foreground and background colors for 1875+
        totalScoreElement.style.color = "#bf9000";
        totalContainer.style.backgroundColor = "#ffe599";
    } else if (finalScore >= 1750) {
        starRating = '★★ Great!';
        // Set foreground and background colors for 1750+
        totalScoreElement.style.color = "#666666";
        totalContainer.style.backgroundColor = "#d9d9d9";
    } else if (finalScore >= 1500) {
        starRating = '★ Nice!';
        // Set foreground and background colors for 1500+
        totalScoreElement.style.color = "#b45f03";
        totalContainer.style.backgroundColor = "#fce5cd";
    }

    // Update the grand total display with the final score, star rating, and any special message
    const finalText = `${finalScore} ${starRating}`;
    totalScoreElement.innerHTML = `<strong>${finalText}</strong>`;

    // Disable the roll and sort buttons to prevent further actions
    document.getElementById('roll-button').disabled = true;
    document.getElementById('sort-button').disabled = true;
}



function checkIfGameEnded() {
    const allScoresSelected = Array.from(document.querySelectorAll('.score')).every(score => score.classList.contains('selected'));
    return allScoresSelected;
}


document.getElementById('background-selector').addEventListener('change', function() {
    const selectedBackground = this.value;
    const body = document.body;
    
    if (selectedBackground === "default") {
        body.style.backgroundImage = '';
        body.style.backgroundColor = '#585858';
    } else {
        body.style.backgroundColor = ''; // Clear any background color
        body.style.backgroundImage = `url('assets/megayahtzee/bg/${selectedBackground}')`;
    }
});
