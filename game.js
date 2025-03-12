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
let carSpeed = 1.5;  // Slower base speed
let carBoostSpeed = 3;  // Double speed when holding
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
const MONSTER_SPEED = 0.5; // Reduced speed (half of previous value)
const MONSTER_SIZE = 25; // Half the original size (was 50)
const MONSTER_EXPLOSION_RADIUS = 100; // Radius for chain explosions
const CAR_SPIN_TIME = 2000; // Change to 2 seconds

// Add holdTimer as a global variable
let holdTimer = null;

// Add a global audio player variable and flag
let currentAudioPlayer = null;
let isAudioPlaying = false;

// Add a function to stop all audio
function stopAllAudio() {
    // Stop the current audio player if it exists
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer.currentTime = 0;
        currentAudioPlayer.onended = null;
        currentAudioPlayer.oncanplaythrough = null;
        currentAudioPlayer.onerror = null;
        currentAudioPlayer = null;
    }
    
    // Also stop any other audio elements that might be playing
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        
        // Remove all event listeners
        const newAudio = audio.cloneNode(false);
        if (audio.parentNode) {
            audio.parentNode.replaceChild(newAudio, audio);
        }
    });
    
    // Reset the flag
    isAudioPlaying = false;
}

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

    // Force play first word after a longer delay to ensure everything is loaded
    setTimeout(() => {
        if (activeWords.length > 0) {
            // Make sure audio context is running
            audioContext.resume().then(() => {
                // Stop any existing audio
                stopAllAudio();
                
                // Play the first word with a longer delay to ensure everything is ready
                setTimeout(() => {
                    // Select a target word and play its audio
                    playRandomWordAudio();
                }, 300); // Increased from 100ms to 300ms
            });
        }
    }, 2500); // Increased from 2000ms to 2500ms

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
    car.style.backgroundColor = '#dc3545'; // Explicitly set red color
    
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

// Modify setupInitialWords to always have exactly 4 words
function setupInitialWords() {
    // Always have exactly 4 words on screen
    const wordCount = 4;
    
    // Add words one by one with a slight delay to ensure proper spacing
    let wordsAdded = 0;
    
    function addNextWord() {
        if (wordsAdded < wordCount && wordList.length > 0) {
            addNewWord();
            wordsAdded++;
            setTimeout(addNextWord, 50);
        }
    }
    
    addNextWord();
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
    
    // Set position with CSS variables for better positioning
    wordCard.style.setProperty('--left', `${position.x}px`);
    wordCard.style.setProperty('--top', `${position.y}px`);
    wordCard.style.left = position.x + 'px';
    wordCard.style.top = position.y + 'px';
    
    // Add a subtle shadow and improved styling
    wordCard.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16)';
    wordCard.style.border = '2px solid #ddd'; // Ensure all words have the same border
    wordCard.style.transition = 'transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease';
    
    // Add hover effect for desktop
    if (!/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
        wordCard.addEventListener('mouseenter', () => {
            wordCard.style.transform = 'scale(1.05)';
            wordCard.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
        });
        
        wordCard.addEventListener('mouseleave', () => {
            wordCard.style.transform = 'scale(1)';
            wordCard.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16)';
        });
    }
    
    document.getElementById('game-area').appendChild(wordCard);
    
    activeWords.push({ element: wordCard, word: word });
}

// Update findSafePosition to ensure new words appear far from the car
function findSafePosition() {
    const gameArea = document.getElementById('game-area');
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    
    // Increase padding from edges
    const edgePadding = isMobile ? 80 : 100;
    
    // Increase minimum distance between words
    const minWordDistance = isMobile ? 150 : 200;
    
    // Increase minimum distance from car to ensure words appear far away
    const carSafeDistance = 300; // Increased from 200 to 300
    
    // Calculate available area
    const areaWidth = gameArea.clientWidth - (2 * edgePadding);
    const areaHeight = gameArea.clientHeight - (2 * edgePadding);
    
    // Grid-based positioning to ensure even distribution
    const gridCols = Math.floor(areaWidth / minWordDistance);
    const gridRows = Math.floor(areaHeight / minWordDistance);
    
    // Create a list of all possible grid positions
    const gridPositions = [];
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            gridPositions.push({
                x: edgePadding + (col * minWordDistance) + (Math.random() * 50 - 25),
                y: edgePadding + (row * minWordDistance) + (Math.random() * 50 - 25)
            });
        }
    }
    
    // Shuffle the grid positions
    for (let i = gridPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
    }
    
    // Try each position until we find one that works
    for (const position of gridPositions) {
        if (!isPositionOccupied(position) && !isNearCar(position, carSafeDistance)) {
            return position;
        }
    }
    
    // If no grid position works, fall back to random positioning with more attempts
    let attempts = 0;
    let position;
    
    do {
        position = {
            x: edgePadding + Math.random() * areaWidth,
            y: edgePadding + Math.random() * areaHeight
        };
        attempts++;
    } while ((isPositionOccupied(position) || isNearCar(position, carSafeDistance)) && attempts < 200);
    
    // If we still can't find a position far from the car after many attempts,
    // gradually reduce the safe distance to ensure we can place the word somewhere
    if (isNearCar(position, carSafeDistance)) {
        let reducedDistance = carSafeDistance;
        while (reducedDistance > 100 && isNearCar(position, reducedDistance)) {
            reducedDistance -= 50;
            attempts = 0;
            do {
                position = {
                    x: edgePadding + Math.random() * areaWidth,
                    y: edgePadding + Math.random() * areaHeight
                };
                attempts++;
            } while ((isPositionOccupied(position) || isNearCar(position, reducedDistance)) && attempts < 100);
        }
    }
    
    return position;
}

// Update isPositionOccupied for better spacing
function isPositionOccupied(position) {
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    const minDistance = isMobile ? 150 : 200;  // Increased minimum distance between words
    
    return activeWords.some(wordObj => {
        const rect = wordObj.element.getBoundingClientRect();
        const wordCenterX = rect.left + rect.width / 2;
        const wordCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(position.x - wordCenterX, 2) + 
            Math.pow(position.y - wordCenterY, 2)
        );
        
        return distance < minDistance;
    });
}

// Update isNearCar for better car avoidance
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

// Update playRandomWordAudio to remove highlighting
function playRandomWordAudio() {
    if (activeWords.length === 0) return;
    
    // Cancel any currently playing audio
    stopAllAudio();
    
    // Set a flag to prevent multiple plays
    if (isAudioPlaying) return;
    isAudioPlaying = true;
    
    // Always pick a random word from the active words
    const randomIndex = Math.floor(Math.random() * activeWords.length);
    currentTargetWord = activeWords[randomIndex].word;
    
    // Get the audio source
    const audioSrc = wordAudios[currentTargetWord].src;
    
    // Create a new audio element each time to avoid any issues with reusing elements
    const newAudio = new Audio();
    
    // Set up event listeners before setting the source
    newAudio.oncanplaythrough = () => {
        // Play the audio once it's loaded
        newAudio.play().catch(err => {
            console.log('Audio play error:', err);
            isAudioPlaying = false;
        });
    };
    
    newAudio.onended = () => {
        // Reset the flag when audio finishes
        isAudioPlaying = false;
    };
    
    newAudio.onerror = () => {
        console.log('Audio error occurred');
        isAudioPlaying = false;
    };
    
    // Set the current player to the new audio element
    if (currentAudioPlayer) {
        currentAudioPlayer.onended = null; // Remove previous event listener
    }
    currentAudioPlayer = newAudio;
    
    // Set the source last (this triggers the load)
    newAudio.src = audioSrc;
    
    console.log("Current target word: " + currentTargetWord); // Debug log - keep for testing
    
    // Remove highlight call
    // highlightTargetWord();
}

// Update setupControls function for mobile audio
function setupControls() {
    // Keyboard controls for desktop
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Add space bar handler for audio replay
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            playRandomWordAudio();
        }
    });
    
    // Mobile controls - tap to move
    if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
        // Remove any existing mobile controls
        const existingControls = document.getElementById('mobile-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Setup touch controls
        setupTouchControls();
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

// Handle tap to move functionality
function handleTapToMove(e) {
    e.preventDefault();
    
    // Get tap coordinates
    const touchX = e.touches ? e.touches[0].clientX : e.clientX;
    const touchY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Get car position
    const carRect = car.getBoundingClientRect();
    const carCenterX = carRect.left + carRect.width / 2;
    const carCenterY = carRect.top + carRect.height / 2;
    
    // Check if tap is on the car itself
    if (touchX >= carRect.left && touchX <= carRect.right && 
        touchY >= carRect.top && touchY <= carRect.bottom) {
        // Play audio if tapped on car - but only if not already playing and not spinning
        if (!isAudioPlaying && !car.classList.contains('spinning')) {
            // Stop any existing audio first to be extra safe
            stopAllAudio();
            
            // Small delay before playing to ensure previous audio is fully stopped
            setTimeout(() => {
                playRandomWordAudio();
            }, 50);
        }
        return;
    }
    
    // Don't allow movement if car is spinning
    if (car.classList.contains('spinning')) return;
    
    // Calculate direction to move
    const dx = touchX - carCenterX;
    const dy = touchY - carCenterY;
    
    // Normalize direction
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return;
    
    // Set direction
    direction.x = dx / distance;
    direction.y = dy / distance;
    
    // Update last direction
    lastDirection.x = direction.x;
    lastDirection.y = direction.y;
    
    // Start moving if not already moving
    if (!isMoving) {
        isMoving = true;
    }
    
    // Set normal speed initially
    currentSpeed = carSpeed;
    
    // Rotate car to face direction of movement
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    car.style.transform = `rotate(${angle}deg)`;
    
    // For touchstart/mousedown, start a timer to detect hold
    if (e.type === 'touchstart' || e.type === 'mousedown') {
        // Clear any existing hold timer
        if (holdTimer) {
            clearTimeout(holdTimer);
        }
        
        // Set a timer to detect hold after 200ms
        holdTimer = setTimeout(() => {
            // Double the speed for hold
            currentSpeed = carBoostSpeed;
        }, 200);
    }
}

// Add touch move and touch end handlers
function setupTouchControls() {
    const gameArea = document.getElementById('game-area');
    
    // Touch start - initial tap or change direction
    gameArea.addEventListener('touchstart', (e) => {
        handleTapToMove(e);
    });
    
    // Mouse down - for testing on desktop
    gameArea.addEventListener('mousedown', (e) => {
        handleTapToMove(e);
    });
    
    // Touch end - release hold
    gameArea.addEventListener('touchend', () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        // Return to normal speed but keep moving
        currentSpeed = carSpeed;
    });
    
    // Mouse up - for testing on desktop
    gameArea.addEventListener('mouseup', () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
        // Return to normal speed but keep moving
        currentSpeed = carSpeed;
    });
    
    // Touch move - update direction while holding and moving
    gameArea.addEventListener('touchmove', (e) => {
        if (isMoving && e.touches && e.touches.length > 0) {
            // Only update direction if finger is held down and moving
            handleTapToMove(e);
        }
    });
    
    // Mouse move - for testing on desktop
    gameArea.addEventListener('mousemove', (e) => {
        // Only update if mouse button is pressed
        if (isMoving && e.buttons === 1) {
            handleTapToMove(e);
        }
    });
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
        
        // For mobile tap-to-move, we already set the rotation in handleTapToMove
        // Only apply rotation for keyboard controls
        if (!(/Mobile|Android|iPhone/i.test(navigator.userAgent))) {
            // Only rotate for up/down movement with keyboard
            if (moveY !== 0 && moveX === 0) {
                let angle = moveY > 0 ? 90 : -90;
                car.style.transform = `rotate(${angle}deg)`;
            } else if (moveX !== 0 && moveY === 0) {
                // For left/right movement
                let angle = moveX > 0 ? 0 : 180;
                car.style.transform = `rotate(${angle}deg)`;
            } else if (moveX !== 0 && moveY !== 0) {
                // For diagonal movement
                let angle = Math.atan2(moveY, moveX) * (180 / Math.PI);
                car.style.transform = `rotate(${angle}deg)`;
            }
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

// Update handleCorrectCollision to remove visual indicator
function handleCorrectCollision(wordObj, index) {
    createPingPongSound();
    
    wordObj.element.classList.add('exploding');
    setTimeout(() => {
        wordObj.element.remove();
    }, 500);
    
    activeWords.splice(index, 1);
    
    // Reset current target word
    currentTargetWord = null;
    
    // Always add a new word to maintain exactly 4 words
    if (wordList.length > 0) {
        setTimeout(() => {
            // Add a new word to maintain 4 words on screen
            addNewWord();
            
            // After adding a new word, select a new target word and play its audio
            setTimeout(() => {
                // Stop any existing audio
                stopAllAudio();
                
                // Play the new audio with a small delay
                setTimeout(() => {
                    playRandomWordAudio();
                }, 100);
            }, 200);
        }, 1000);
    } else if (activeWords.length === 0) {
        // End game if no more words
        endGame();
    } else {
        // If no more words in wordList but still have active words,
        // pick and play new target from remaining words
        setTimeout(() => {
            // Stop any existing audio
            stopAllAudio();
            
            // Play the new audio with a small delay
            setTimeout(() => {
                playRandomWordAudio();
            }, 100);
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
    
    // Get word position
    const wordRect = wordObj.element.getBoundingClientRect();
    const wordCenterX = wordRect.left + wordRect.width / 2;
    const wordCenterY = wordRect.top + wordRect.height / 2;
    
    // Calculate bounce direction (opposite of approach direction)
    const carRect = car.getBoundingClientRect();
    const carCenterX = carRect.left + carRect.width / 2;
    const carCenterY = carRect.top + carRect.height / 2;
    
    // Vector from word to car (bounce direction)
    let bounceX = carCenterX - wordCenterX;
    let bounceY = carCenterY - wordCenterY;
    
    // Normalize the bounce vector
    const bounceLength = Math.sqrt(bounceX * bounceX + bounceY * bounceY);
    if (bounceLength > 0) {
        bounceX /= bounceLength;
        bounceY /= bounceLength;
    }
    
    // Add a slight random variation to the bounce direction to avoid hitting the same word again
    const randomAngle = (Math.random() * 0.5 - 0.25) * Math.PI; // Random angle between -45 and 45 degrees
    const cosAngle = Math.cos(randomAngle);
    const sinAngle = Math.sin(randomAngle);
    
    // Apply rotation to the bounce vector
    const rotatedBounceX = bounceX * cosAngle - bounceY * sinAngle;
    const rotatedBounceY = bounceX * sinAngle + bounceY * cosAngle;
    
    // Use the rotated bounce vector as the drift direction
    const driftDirection = {
        x: rotatedBounceX,
        y: rotatedBounceY
    };
    
    // Disable controls by removing event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // For mobile, temporarily disable tap-to-move
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile) {
        const gameArea = document.getElementById('game-area');
        gameArea.removeEventListener('touchstart', handleTapToMove);
        gameArea.removeEventListener('touchmove', handleTapToMove);
        gameArea.removeEventListener('touchend', handleTapToMove);
        gameArea.removeEventListener('mousedown', handleTapToMove);
        gameArea.removeEventListener('mousemove', handleTapToMove);
        gameArea.removeEventListener('mouseup', handleTapToMove);
        
        // Clear any hold timer
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    }
    
    // Create drift animation
    let driftTime = 0;
    const driftSpeed = 2;
    const driftInterval = setInterval(() => {
        driftTime += 16;
        
        // Update position with drift in bounce direction
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
        
        // For mobile, re-enable tap-to-move
        if (isMobile) {
            // Re-setup touch controls
            setupTouchControls();
        }
        
        // Set to normal speed
        currentSpeed = carSpeed;
        
        // Rotate car to face direction of movement
        const angle = Math.atan2(driftDirection.y, driftDirection.x) * (180 / Math.PI);
        car.style.transform = `rotate(${angle}deg)`;
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
    
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds}`;
    }
}

// Create timer function
function createTimer() {
    // Use the existing timer div instead of creating a new one
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.innerHTML = '00:00';
        
        // For mobile, ensure timer is at top left
        if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
            timerElement.style.position = 'absolute';
            timerElement.style.top = '20px';
            timerElement.style.left = '20px';
            timerElement.style.zIndex = '1000';
        }
    }
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
    
    // Set monster size explicitly
    monster.style.width = `${MONSTER_SIZE}px`;
    monster.style.height = `${MONSTER_SIZE}px`;
    
    // Calculate eye and mouth sizes proportionally
    const eyeSize = Math.max(6, Math.floor(MONSTER_SIZE * 0.24)); // 24% of monster size, minimum 6px
    const pupilSize = Math.max(3, Math.floor(eyeSize * 0.5)); // 50% of eye size, minimum 3px
    
    // Add monster face with inline styles for proper scaling
    monster.innerHTML = `
        <div class="monster-eyes" style="top: ${MONSTER_SIZE * 0.25}px;">
            <div class="monster-eye" style="width: ${eyeSize}px; height: ${eyeSize}px;">
                <div class="monster-pupil" style="width: ${pupilSize}px; height: ${pupilSize}px; top: ${(eyeSize - pupilSize) / 2}px; left: ${(eyeSize - pupilSize) / 2}px;"></div>
            </div>
            <div class="monster-eye" style="width: ${eyeSize}px; height: ${eyeSize}px;">
                <div class="monster-pupil" style="width: ${pupilSize}px; height: ${pupilSize}px; top: ${(eyeSize - pupilSize) / 2}px; left: ${(eyeSize - pupilSize) / 2}px;"></div>
            </div>
        </div>
        <div class="monster-mouth" style="width: ${MONSTER_SIZE * 0.6}px; height: ${MONSTER_SIZE * 0.3}px; bottom: ${MONSTER_SIZE * 0.1}px; left: ${MONSTER_SIZE * 0.2}px;"></div>
    `;
    
    // Add CSS for the monster parts
    const style = document.createElement('style');
    style.textContent = `
        .monster-eyes {
            position: absolute;
            width: 100%;
            display: flex;
            justify-content: space-around;
        }
        .monster-eye {
            background: white;
            border-radius: 50%;
            position: relative;
        }
        .monster-pupil {
            position: absolute;
            background: black;
            border-radius: 50%;
        }
        .monster-mouth {
            position: absolute;
            overflow: hidden;
            animation: chomp 1s infinite;
        }
        .monster-mouth::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: black;
            border-radius: 50% 50% 0 0;
            bottom: -50%;
        }
    `;
    document.head.appendChild(style);
    
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
        // Ensure the car is red
        if (car) {
            car.style.backgroundColor = '#dc3545';
        }
        
        // Position timer at the top left
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.style.position = 'absolute';
            timerElement.style.top = '20px';
            timerElement.style.left = '20px';
            timerElement.style.zIndex = '1000';
            timerElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            timerElement.style.padding = '5px 10px';
            timerElement.style.borderRadius = '5px';
            timerElement.style.fontWeight = 'bold';
        }
        
        // Remove any existing control panel
        const controlsArea = document.getElementById('controls');
        if (controlsArea) {
            controlsArea.remove();
        }
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