// Get the word list and audio from the previous activity
const wordList = [
    'a rabbit', 'a hamster', 'a goldfish', 'a teddy bear', 'a toy sword',
    'a jump rope', 'a bicycle', 'a train', 'fast', 'slow',
    'rainy', 'cloudy', 'snowy', 'a boy', 'a girl',
    'pumpkin', 'carrot', 'an elephant', 'a dolphin', 'an octopus',
    'a turtle', 'tooth', 'teeth', 'orange', 'purple',
    'yellow', 'mouth', 'mountain', 'house'
];

let activeWords = [];
let currentTargetWord = null;
let car = null;
let carSpeed = 2;  // Base speed when moving
let carBoostSpeed = 10;  // Speed when key is held
let currentSpeed = 0;
let direction = { x: 0, y: 0 };
let gameLoop = null;
let audioContext = null;
const wordAudios = {};
let isMoving = false;
let lastDirection = { x: 0, y: 0 };  // Store last direction for continuous movement
let startTime = null;
let timerInterval = null;
let monsters = [];
let monsterSpawnInterval = null;
const MONSTER_SPAWN_TIME = 30000; // 30 seconds
const MONSTER_SPEED = 1; // Half of car's base speed (since carSpeed is 2)
const MONSTER_SIZE = 50; // Size of monster in pixels
const MONSTER_EXPLOSION_RADIUS = 100; // Radius for chain explosions
const CAR_SPIN_TIME = 2000; // Change to 2 seconds

// Initialize game
function initGame() {
    // Create audio context first
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create game elements
    createTimer();
    createCar();
    setupInitialWords();
    setupControls();
    
    // Setup mobile layout if needed
    setupMobileLayout();
    
    // Start the timer
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    // Start game loop
    startGameLoop();
    
    // Load audio files
    loadAudios();

    // Force play first word immediately
    audioContext.resume().then(() => {
        setTimeout(() => {
            if (activeWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * activeWords.length);
                currentTargetWord = activeWords[randomIndex].word;
                const audio = wordAudios[currentTargetWord];
                if (audio) {
                    audio.play().catch(err => console.log('Audio play error:', err));
                }
            }
        }, 100);
    });

    // Start monster spawning after 30 seconds
    setTimeout(() => {
        spawnMonster();
        monsterSpawnInterval = setInterval(spawnMonster, MONSTER_SPAWN_TIME);
    }, MONSTER_SPAWN_TIME);
}

// Create car
function createCar() {
    car = document.createElement('div');
    car.className = 'car';
    const gameArea = document.getElementById('game-area');
    const startX = (gameArea.clientWidth - 60) / 2;  // 60 is car width
    const startY = (gameArea.clientHeight - 40) / 2; // 40 is car height
    car.style.left = startX + 'px';
    car.style.top = startY + 'px';
    document.getElementById('game-area').appendChild(car);
}

// Load audio files
function loadAudios() {
    wordList.forEach(word => {
        let audioName = word
            .replace(/^(a|an)\s+/, '')
            .replace(/\s+/g, '_')
            .toLowerCase();
        
        // Match exactly with first activity
        switch (audioName) {
            case 'boy': audioName = 'a_boy'; break;
            case 'octopus': audioName = 'an_octopus'; break;
            case 'jump_rope': audioName = 'a_jump_rope'; break;
            case 'hamster': audioName = 'a_hamster'; break;
            case 'elephant': audioName = 'an_elephant'; break;
            case 'goldfish': audioName = 'a_goldfish'; break;
            case 'train': audioName = 'a_train'; break;
            case 'turtle': audioName = 'a_turtle'; break;
            case 'toy_sword': audioName = 'a_toy_sword'; break;
            case 'rabbit': audioName = 'a_rabbit'; break;
            case 'dolphin': audioName = 'a_dolphin'; break;
            case 'teddy_bear': audioName = 'a_teddy_bear'; break;
            case 'tooth': audioName = 'a_tooth'; break;
            case 'bicycle': audioName = 'a_bicycle'; break;
            case 'girl': audioName = 'a_girl'; break;
        }

        const audio = new Audio(`Audio/${audioName}.mp3`);
        audio.load(); // Explicitly load the audio
        wordAudios[word] = audio;
    });
}

// Create ping sound
function createPingPongSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(660, audioContext.currentTime);
    gainNode1.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.08);
    gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime + 0.08);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime + 0.08);
    oscillator1.stop(audioContext.currentTime + 0.08);
    oscillator2.stop(audioContext.currentTime + 0.25);
}

// Add the boo sound function from the first activity
function createBooSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(120, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Modify setupInitialWords for mobile
function setupInitialWords() {
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    const wordCount = isMobile ? 5 : 6;  // 5 words for mobile, 6 for desktop
    
    for (let i = 0; i < wordCount; i++) {
        addNewWord();
    }
}

// Add new word
function addNewWord() {
    if (wordList.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList.splice(randomIndex, 1)[0];
    const position = findSafePosition();
    
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    wordCard.textContent = word;
    wordCard.style.left = position.x + 'px';
    wordCard.style.top = position.y + 'px';
    document.getElementById('game-area').appendChild(wordCard);
    
    activeWords.push({ element: wordCard, word: word });
}

// Update findSafePosition to avoid car position
function findSafePosition() {
    const gameArea = document.getElementById('game-area');
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    const padding = isMobile ? 60 : 150;
    const safeDistance = 200; // Minimum distance from car
    
    const areaWidth = gameArea.clientWidth - padding;
    const areaHeight = gameArea.clientHeight - padding;
    let attempts = 0;
    let position;
    
    do {
        position = {
            x: Math.random() * areaWidth,
            y: Math.random() * areaHeight
        };
        attempts++;
    } while ((isPositionOccupied(position) || isNearCar(position, safeDistance)) && attempts < 100);
    
    return position;
}

// Add function to check distance from car
function isNearCar(position, minDistance) {
    if (!car) return false;
    
    const carRect = car.getBoundingClientRect();
    const carCenter = {
        x: carRect.left + carRect.width / 2,
        y: carRect.top + carRect.height / 2
    };
    
    const distance = Math.sqrt(
        Math.pow(position.x - carCenter.x, 2) + 
        Math.pow(position.y - carCenter.y, 2)
    );
    
    return distance < minDistance;
}

// Update isPositionOccupied for mobile
function isPositionOccupied(position) {
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    const minDistance = isMobile ? 100 : 150;  // Smaller minimum distance for mobile
    
    return activeWords.some(wordObj => {
        const rect = wordObj.element.getBoundingClientRect();
        const distance = Math.sqrt(
            Math.pow(position.x - rect.left, 2) + 
            Math.pow(position.y - rect.top, 2)
        );
        return distance < minDistance;
    });
}

// Update playRandomWordAudio function
function playRandomWordAudio() {
    if (activeWords.length === 0) return;
    
    // Only pick a new random word if there isn't a current target
    if (!currentTargetWord) {
        const randomIndex = Math.floor(Math.random() * activeWords.length);
        currentTargetWord = activeWords[randomIndex].word;
    }
    
    // Play the current target word's audio
    const audio = wordAudios[currentTargetWord];
    if (audio) {
        audio.currentTime = 0;
        audioContext.resume().then(() => {
            audio.play();
        });
    }
}

// Update setupControls function for mobile audio
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Add space bar handler for audio replay
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            playRandomWordAudio();
        }
    });
    
    // Mobile controls
    if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
        const controls = document.createElement('div');
        controls.id = 'mobile-controls';
        
        const buttons = {
            up: '↑',
            left: '←',
            center: '🔊',
            right: '→',
            down: '↓'
        };
        
        Object.entries(buttons).forEach(([dir, symbol]) => {
            const btn = document.createElement('button');
            btn.id = `${dir}-btn`;
            btn.textContent = symbol;
            
            if (dir === 'center') {
                // Center button for audio replay - same behavior as space bar
                ['touchstart', 'mousedown'].forEach(eventType => {
                    btn.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        playRandomWordAudio();
                    });
                });
            } else {
                // Direction buttons
                ['touchstart', 'mousedown'].forEach(eventType => {
                    btn.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        handleMobileControl(dir, true);
                    });
                });
                
                ['touchend', 'mouseup', 'mouseleave'].forEach(eventType => {
                    btn.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        handleMobileControl(dir, false);
                    });
                });
            }
            
            controls.appendChild(btn);
        });
        
        document.body.appendChild(controls);
    }
}

// Handle keyboard controls
function handleKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (!isMoving) {
            isMoving = true;
        }
        
        // Reset both directions first
        direction.x = 0;
        direction.y = 0;
        
        // Only set one direction at a time
        switch(e.key) {
            case 'ArrowUp': 
                direction.y = -1;
                lastDirection.y = -1;
                lastDirection.x = 0;
                break;
            case 'ArrowDown': 
                direction.y = 1;
                lastDirection.y = 1;
                lastDirection.x = 0;
                break;
            case 'ArrowLeft': 
                direction.x = -1;
                lastDirection.x = -1;
                lastDirection.y = 0;
                break;
            case 'ArrowRight': 
                direction.x = 1;
                lastDirection.x = 1;
                lastDirection.y = 0;
                break;
        }
        currentSpeed = carBoostSpeed;
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowUp': case 'ArrowDown': direction.y = 0; break;
        case 'ArrowLeft': case 'ArrowRight': direction.x = 0; break;
    }
    currentSpeed = carSpeed;
}

// Handle mobile controls
function handleMobileControl(direction, isStarting) {
    if (isStarting) {
        isMoving = true;
        currentSpeed = carBoostSpeed;
        
        // Reset directions
        direction.x = 0;
        direction.y = 0;
        
        // Set only one direction
        switch(direction) {
            case 'up': 
                direction.y = -1;
                lastDirection.y = -1;
                lastDirection.x = 0;
                break;
            case 'down': 
                direction.y = 1;
                lastDirection.y = 1;
                lastDirection.x = 0;
                break;
            case 'left': 
                direction.x = -1;
                lastDirection.x = -1;
                lastDirection.y = 0;
                break;
            case 'right': 
                direction.x = 1;
                lastDirection.x = 1;
                lastDirection.y = 0;
                break;
        }
    } else {
        isMoving = false;
        currentSpeed = carSpeed;
        direction.x = 0;
        direction.y = 0;
    }
}

// Game loop
function startGameLoop() {
    if (!car) return;
    
    gameLoop = setInterval(() => {
        if (!isMoving) return;
        
        const carRect = car.getBoundingClientRect();
        const gameArea = document.getElementById('game-area');
        const maxX = gameArea.clientWidth - carRect.width;
        const maxY = gameArea.clientHeight - carRect.height;
        
        let currentX = parseFloat(car.style.left);
        let currentY = parseFloat(car.style.top);
        
        // Use current direction if key is held, otherwise use last direction
        const moveX = direction.x !== 0 ? direction.x : lastDirection.x;
        const moveY = direction.y !== 0 ? direction.y : lastDirection.y;
        
        let newX = currentX + (moveX * currentSpeed);
        let newY = currentY + (moveY * currentSpeed);
        
        newX = Math.max(0, Math.min(maxX, newX));
        newY = Math.max(0, Math.min(maxY, newY));
        
        car.style.left = newX + 'px';
        car.style.top = newY + 'px';
        
        // Only rotate for up/down movement
        if (moveY !== 0) {
            let angle = moveY > 0 ? 90 : -90;
            car.style.transform = `rotate(${angle}deg)`;
        } else {
            car.style.transform = 'rotate(0deg)';
        }
        
        // Update monster positions
        updateMonsters();
        
        // Check monster collisions
        checkMonsterCollisions();
        
        checkCollisions();
    }, 16);
}

// Modify checkCollisions to handle spinning
function checkCollisions() {
    const carRect = car.getBoundingClientRect();
    
    activeWords.forEach((wordObj, index) => {
        const wordRect = wordObj.element.getBoundingClientRect();
        
        if (isColliding(carRect, wordRect)) {
            if (wordObj.word === currentTargetWord) {
                handleCorrectCollision(wordObj, index);
            } else {
                // Handle incorrect collision
                handleIncorrectCollision(wordObj);
            }
        }
    });

    // Check for wall collisions and bounce
    const gameArea = document.getElementById('game-area');
    const maxX = gameArea.clientWidth - carRect.width;
    const maxY = gameArea.clientHeight - carRect.height;
    
    let currentX = parseFloat(car.style.left);
    let currentY = parseFloat(car.style.top);
    
    // Bounce off walls
    if (currentX <= 0 || currentX >= maxX) {
        lastDirection.x *= -1;  // Reverse horizontal direction
        direction.x *= -1;
    }
    if (currentY <= 0 || currentY >= maxY) {
        lastDirection.y *= -1;  // Reverse vertical direction
        direction.y *= -1;
    }
}

// Check if two rectangles are colliding
function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

// Update handleCorrectCollision to handle audio properly
function handleCorrectCollision(wordObj, index) {
    createPingPongSound();
    
    wordObj.element.classList.add('exploding');
    setTimeout(() => {
        wordObj.element.remove();
    }, 500);
    
    activeWords.splice(index, 1);
    
    // Reset current target word
    currentTargetWord = null;
    
    // Add new word if there are words left
    if (wordList.length > 0) {
        setTimeout(() => {
            addNewWord();
            // Pick and play new target word
            setTimeout(() => {
                playRandomWordAudio();
            }, 200);
        }, 1000);
    } else if (activeWords.length === 0) {
        endGame();
    } else {
        // Pick and play new target from remaining words
        setTimeout(() => {
            playRandomWordAudio();
        }, 1000);
    }
}

// Add helper function to find safe drift direction
function findSafeDriftDirection(currentX, currentY) {
    const gameArea = document.getElementById('game-area');
    const carRect = car.getBoundingClientRect();
    const padding = 100; // Minimum distance from obstacles
    
    // Try 8 different directions (45-degree intervals)
    const possibleAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const safeDirections = [];
    
    for (let angle of possibleAngles) {
        const radians = angle * Math.PI / 180;
        const dirX = Math.cos(radians);
        const dirY = Math.sin(radians);
        
        // Project the path ahead
        let isPathSafe = true;
        for (let distance = padding; distance < 200; distance += 50) {
            const testX = currentX + (dirX * distance);
            const testY = currentY + (dirY * distance);
            
            // Check if path would hit wall
            if (testX < padding || testX > gameArea.clientWidth - carRect.width - padding ||
                testY < padding || testY > gameArea.clientHeight - carRect.height - padding) {
                isPathSafe = false;
                break;
            }
            
            // Check if path would hit any word cards
            const testRect = {
                left: testX,
                right: testX + carRect.width,
                top: testY,
                bottom: testY + carRect.height
            };
            
            if (activeWords.some(wordObj => isColliding(testRect, wordObj.element.getBoundingClientRect()))) {
                isPathSafe = false;
                break;
            }
        }
        
        if (isPathSafe) {
            safeDirections.push({ x: dirX, y: dirY });
        }
    }
    
    // Return a random safe direction, or if none found, return upward direction
    return safeDirections.length > 0 
        ? safeDirections[Math.floor(Math.random() * safeDirections.length)]
        : { x: 0, y: -1 };
}

// Update handleIncorrectCollision function
function handleIncorrectCollision(wordObj, duration = 2000) {
    // Only handle collision if car isn't already spinning
    if (car.classList.contains('spinning')) return;
    
    createBooSound();
    
    // Make word red
    wordObj.element.style.backgroundColor = '#ffebee';
    wordObj.element.style.borderColor = '#ff0000';
    
    // Add spinning class to car
    car.classList.add('spinning');
    
    // Get current position
    const currentX = parseFloat(car.style.left);
    const currentY = parseFloat(car.style.top);
    
    // Find safe direction to drift
    const driftDirection = findSafeDriftDirection(currentX, currentY);
    
    // Disable controls by removing event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Create drift animation
    let driftTime = 0;
    const driftSpeed = 2;
    const driftInterval = setInterval(() => {
        driftTime += 16;
        
        // Update position with drift in safe direction
        const newX = currentX + (driftDirection.x * driftSpeed * driftTime/50);
        const newY = currentY + (driftDirection.y * driftSpeed * driftTime/50);
        
        // Keep car within bounds
        const gameArea = document.getElementById('game-area');
        const carRect = car.getBoundingClientRect();
        const maxX = gameArea.clientWidth - carRect.width;
        const maxY = gameArea.clientHeight - carRect.height;
        car.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
        car.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
        
        if (driftTime >= duration) {
            clearInterval(driftInterval);
            finishSpinning();
        }
    }, 16);
    
    function finishSpinning() {
        // Reset word card appearance
        wordObj.element.style.backgroundColor = '';
        wordObj.element.style.borderColor = '';
        
        // Stop spinning
        car.classList.remove('spinning');
        
        // Restore movement state with drift direction
        isMoving = true;
        direction = { x: driftDirection.x, y: driftDirection.y };
        lastDirection = { x: driftDirection.x, y: driftDirection.y };
        
        // Re-enable controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Set to normal speed
        currentSpeed = carSpeed;
    }
}

// End game
function endGame() {
    clearInterval(gameLoop);
    clearInterval(timerInterval);
    clearInterval(monsterSpawnInterval);

    // Show completion screen
    const finalTime = formatTime(Date.now() - startTime);
    const timerCard = document.querySelector('.timer-card');
    timerCard.classList.add('completed');
    timerCard.innerHTML = `<div>Well Done!<br>You finished in ${finalTime}</div>`;

    // Create buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'completion-buttons';
    document.body.appendChild(buttonContainer);

    // Play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.className = 'play-again-button';
    playAgainButton.textContent = 'Play again?';
    playAgainButton.style.display = 'flex';
    buttonContainer.appendChild(playAgainButton);

    // Practice again button
    const practiceAgainButton = document.createElement('button');
    practiceAgainButton.className = 'practice-again-button';
    practiceAgainButton.textContent = 'Practice again?';
    practiceAgainButton.style.display = 'flex';
    buttonContainer.appendChild(practiceAgainButton);

    // Add click handlers
    playAgainButton.addEventListener('click', () => {
        window.location.reload();
    });

    practiceAgainButton.addEventListener('click', () => {
        window.location.href = 'practice.html';
    });

    // Remove all monsters
    monsters.forEach(monster => monster.remove());
    monsters = [];
}

// Add timer functions
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    document.querySelector('.timer-card .time').textContent = formatTime(elapsed);
}

// Create timer function
function createTimer() {
    const timerCard = document.createElement('div');
    timerCard.className = 'timer-card';
    timerCard.innerHTML = '<span class="time">00:00</span>';
    document.getElementById('game-area').appendChild(timerCard);
}

// Add monster functions
function spawnMonster() {
    const gameArea = document.getElementById('game-area');
    const carRect = car.getBoundingClientRect();
    const carCenter = {
        x: carRect.left + carRect.width / 2,
        y: carRect.top + carRect.height / 2
    };
    
    // Find the farthest side from the car
    const distances = [
        { side: 0, dist: carCenter.y }, // top
        { side: 1, dist: gameArea.clientWidth - carCenter.x }, // right
        { side: 2, dist: gameArea.clientHeight - carCenter.y }, // bottom
        { side: 3, dist: carCenter.x } // left
    ];
    
    // Sort by distance and take the farthest two sides
    distances.sort((a, b) => b.dist - a.dist);
    const side = distances[Math.floor(Math.random() * 2)].side;
    
    const monster = document.createElement('div');
    monster.className = 'monster';
    
    // Add monster face
    monster.innerHTML = `
        <div class="monster-eyes">
            <div class="monster-eye"></div>
            <div class="monster-eye"></div>
        </div>
        <div class="monster-mouth"></div>
    `;
    
    // Position monster on the chosen side, farthest from car
    let x, y;
    switch(side) {
        case 0: // top
            x = Math.min(Math.max(0, carCenter.x + (Math.random() > 0.5 ? 200 : -200)), gameArea.clientWidth - MONSTER_SIZE);
            y = -MONSTER_SIZE;
            break;
        case 1: // right
            x = gameArea.clientWidth;
            y = Math.min(Math.max(0, carCenter.y + (Math.random() > 0.5 ? 200 : -200)), gameArea.clientHeight - MONSTER_SIZE);
            break;
        case 2: // bottom
            x = Math.min(Math.max(0, carCenter.x + (Math.random() > 0.5 ? 200 : -200)), gameArea.clientWidth - MONSTER_SIZE);
            y = gameArea.clientHeight;
            break;
        case 3: // left
            x = -MONSTER_SIZE;
            y = Math.min(Math.max(0, carCenter.y + (Math.random() > 0.5 ? 200 : -200)), gameArea.clientHeight - MONSTER_SIZE);
            break;
    }
    
    monster.style.left = x + 'px';
    monster.style.top = y + 'px';
    gameArea.appendChild(monster);
    monsters.push(monster);
}

function updateMonsters() {
    if (!car) return;  // Safety check
    
    const gameArea = document.getElementById('game-area');
    const carRect = car.getBoundingClientRect();
    const carCenter = {
        x: carRect.left + (carRect.width / 2),
        y: carRect.top + (carRect.height / 2)
    };
    
    monsters.forEach(monster => {
        if (monster.classList.contains('exploding')) return;
        
        // Get monster's current position
        const monsterRect = monster.getBoundingClientRect();
        
        // Calculate direction to car
        const dx = carCenter.x - (monsterRect.left + monsterRect.width / 2);
        const dy = carCenter.y - (monsterRect.top + monsterRect.height / 2);
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Update monster position
        const currentX = parseFloat(monster.style.left) || monsterRect.left;
        const currentY = parseFloat(monster.style.top) || monsterRect.top;
        
        // Move monster
        const newX = currentX + (normalizedDx * MONSTER_SPEED);
        const newY = currentY + (normalizedDy * MONSTER_SPEED);
        
        // Keep monster within bounds
        const maxX = gameArea.clientWidth - MONSTER_SIZE;
        const maxY = gameArea.clientHeight - MONSTER_SIZE;
        monster.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
        monster.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
        
        // Rotate monster to face car
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        monster.style.transform = `rotate(${angle}deg)`;
    });
}

function checkMonsterCollisions() {
    const carRect = car.getBoundingClientRect();
    
    monsters.forEach((monster, index) => {
        const monsterRect = monster.getBoundingClientRect();
        
        if (isColliding(carRect, monsterRect)) {
            handleMonsterCollision(monster, index);
        }
    });
}

function handleMonsterCollision(monster, index) {
    if (car.classList.contains('spinning')) return;
    
    createBooSound();
    explodeMonster(monster, index);
    
    // Check for chain explosions
    const monsterRect = monster.getBoundingClientRect();
    const monsterCenter = {
        x: monsterRect.left + monsterRect.width / 2,
        y: monsterRect.top + monsterRect.height / 2
    };
    
    // Check other monsters for chain explosion
    monsters.slice().forEach((otherMonster, otherIndex) => {
        if (otherIndex === index) return; // Skip the original monster
        
        const otherRect = otherMonster.getBoundingClientRect();
        const otherCenter = {
            x: otherRect.left + otherRect.width / 2,
            y: otherRect.top + otherRect.height / 2
        };
        
        // Calculate distance between monsters
        const distance = Math.sqrt(
            Math.pow(monsterCenter.x - otherCenter.x, 2) +
            Math.pow(monsterCenter.y - otherCenter.y, 2)
        );
        
        // If monster is within explosion radius, trigger chain explosion
        if (distance < MONSTER_EXPLOSION_RADIUS) {
            explodeMonster(otherMonster, otherIndex);
        }
    });
    
    // Make car spin and drift for 6 seconds
    handleIncorrectCollision({
        element: monster,
        word: null
    }, CAR_SPIN_TIME);
}

// Add separate function for monster explosion
function explodeMonster(monster, index) {
    monster.classList.add('exploding');
    // Remove monster from array immediately to prevent multiple explosions
    monsters.splice(index, 1);
    setTimeout(() => {
        monster.remove();
    }, 500);
}

// Add this function to create mobile layout
function setupMobileLayout() {
    if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
        // Create controls area
        const controlsArea = document.createElement('div');
        controlsArea.className = 'controls-area';
        document.body.appendChild(controlsArea);
        
        // Move timer and controls into controls area
        const timer = document.querySelector('.timer-card');
        const controls = document.getElementById('mobile-controls');
        if (timer) controlsArea.appendChild(timer);
        if (controls) controlsArea.appendChild(controls);
    }
}

// Update DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game when page loads
    initGame();
    
    // Ensure audio context is ready
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}); 