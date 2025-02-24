// Sound effects and audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const wordAudios = {};  // Add this back

function createPingPongSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);
    
    // First sound: short "be"
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(660, audioContext.currentTime); // Medium-high pitch
    gainNode1.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08); // Short duration
    
    // Second sound: longer "bing"
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.08); // Higher pitch
    gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime + 0.08);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25); // Longer duration
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime + 0.08);
    oscillator1.stop(audioContext.currentTime + 0.08);
    oscillator2.stop(audioContext.currentTime + 0.25);
}

function createBooSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Single long "boooo" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(120, audioContext.currentTime + 0.5); // Longer slide down
    
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime + 0.3); // Hold the volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

let currentWord = null;
let remainingWords = [
    'a rabbit', 'a hamster', 'a goldfish', 'a teddy bear', 'a toy sword',
    'a jump rope', 'a bicycle', 'a train', 'fast', 'slow',
    'rainy', 'cloudy', 'snowy', 'a boy', 'a girl',
    'pumpkin', 'carrot', 'an elephant', 'a dolphin', 'an octopus',
    'a turtle', 'tooth', 'teeth', 'orange', 'purple',
    'yellow', 'mouth', 'mountain', 'house'
];

// Add these variables at the top with the other declarations
let startTime = null;
let timerInterval = null;

// Add this at the top with other variables
const originalWords = [...remainingWords]; // Store original word list

// Load audio files with better error handling
remainingWords.forEach(word => {
    let audioName = word
        .replace(/^(a|an)\s+/, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    
    // Special case handling for specific words
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

    const audioPath = `Audio/${audioName}.mp3`;  // Changed to match your folder name
    
    const audio = new Audio(audioPath);
    
    // Add loading success listener
    audio.addEventListener('canplaythrough', () => {
        console.log(`Audio loaded successfully: ${audioPath}`);
    });
    
    // Add error listener with more detailed error reporting
    audio.addEventListener('error', (e) => {
        console.error(`Error loading audio ${audioPath}:`, e.target.error);
        console.error('Error details:', {
            word: word,
            audioName: audioName,
            path: audioPath,
            errorCode: e.target.error ? e.target.error.code : 'unknown'
        });
    });
    
    wordAudios[word] = audio;
});

// Add audio preload check
function checkAudioLoading() {
    console.log('Checking audio loading status:');
    remainingWords.forEach(word => {
        const audio = wordAudios[word];
        if (audio) {
            console.log(`${word}: ${audio.readyState}`);
            // readyState: 0 = HAVE_NOTHING, 4 = HAVE_ENOUGH_DATA
            if (audio.readyState === 0) {
                console.warn(`Audio not loaded for: ${word}`);
            }
        } else {
            console.error(`No audio object for: ${word}`);
        }
    });
}

// Call check after a short delay
setTimeout(checkAudioLoading, 2000);

function playAudioOnce(audio) {
    if (!audio) {
        console.error('No audio provided to playAudioOnce');
        return;
    }
    
    try {
        const audioClone = audio.cloneNode();
        const playPromise = audioClone.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio started playing successfully');
                })
                .catch(error => {
                    console.error('Audio playback failed:', error);
                });
        }
    } catch (error) {
        console.error('Error in playAudioOnce:', error);
    }
}

// Add this function to format the time
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Add this function to update the timer
function updateTimer() {
    if (!startTime) return;
    const elapsed = Date.now() - startTime;
    document.querySelector('.timer-card .time').textContent = formatTime(elapsed);
}

// Add this function to create fireworks
function createFirework() {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.setProperty('--x', `${Math.random() * 100 - 50}%`);
    firework.style.setProperty('--initialY', '60%');
    firework.style.setProperty('--finalY', `${Math.random() * 50 - 60}%`);
    document.body.appendChild(firework);
    
    // Remove the firework element when animation ends
    setTimeout(() => firework.remove(), 2000);
}

function playNextWord() {
    if (remainingWords.length === 0) {
        // Stop the timer
        clearInterval(timerInterval);
        
        // Hide the audio button
        document.querySelector('.audio-button').style.display = 'none';
        
        // Show completion animation
        const timerCard = document.querySelector('.timer-card');
        timerCard.classList.add('completed');
        
        // Add completion message
        const finalTime = formatTime(Date.now() - startTime);
        timerCard.innerHTML = `<div>Well Done!<br>You finished in ${finalTime}</div>`;
        
        // Show try again button
        const tryAgainButton = document.createElement('button');
        tryAgainButton.className = 'try-again-button';
        tryAgainButton.textContent = 'Try again?';
        tryAgainButton.style.display = 'flex';
        document.body.appendChild(tryAgainButton);
        
        // Add click handler for try again
        tryAgainButton.addEventListener('click', () => {
            // Reset words with new random order
            remainingWords = [...originalWords].sort(() => Math.random() - 0.5);
            // Remove try again button
            tryAgainButton.remove();
            // Reset and recreate flashcards
            startTime = null;
            currentWord = null;
            createFlashcards();
        });
        
        // Create fireworks
        for (let i = 0; i < 10; i++) {
            setTimeout(createFirework, i * 200);
        }
        return;
    }

    const randomIndex = Math.floor(Math.random() * remainingWords.length);
    currentWord = remainingWords[randomIndex];
    console.log('Selected word:', currentWord);
    
    // Play audio after 1 second
    if (wordAudios[currentWord]) {
        console.log('Scheduling audio for:', currentWord);
        setTimeout(() => {
            console.log('Attempting to play audio for:', currentWord);
            playAudioOnce(wordAudios[currentWord]);
        }, 1000);
    } else {
        console.error('No audio found for word:', currentWord);
    }
}

function handleCardClick(flashcard, word) {
    if (word === currentWord) {
        createPingPongSound();
        remainingWords = remainingWords.filter(w => w !== word);
        flashcard.style.transform = 'scale(0)';
        setTimeout(() => {
            flashcard.remove();
            playNextWord();
        }, 300);
    } else {
        createBooSound();
        flashcard.style.backgroundColor = '#ffebee';
        setTimeout(() => {
            flashcard.style.backgroundColor = 'white';
            if (wordAudios[currentWord]) {
                playAudioOnce(wordAudios[currentWord]);
            }
        }, 500);
    }
}

function createFlashcards() {
    const container = document.querySelector('.flashcards-container');
    
    // First remove any existing cards and timer
    container.innerHTML = '';
    
    // Add the start/audio button first
    const startButton = document.createElement('button');
    startButton.className = 'start-button';
    startButton.textContent = "Let's start!";
    container.appendChild(startButton);
    
    const audioButton = document.createElement('button');
    audioButton.className = 'audio-button';
    audioButton.style.display = 'none';
    audioButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Listen again?</span>';
    container.appendChild(audioButton);
    
    // Add all flashcards
    [...remainingWords].sort(() => Math.random() - 0.5).forEach(word => {
        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';
        flashcard.textContent = word;
        flashcard.addEventListener('click', () => handleCardClick(flashcard, word));
        container.appendChild(flashcard);
    });
    
    // Add timer card last
    const timerCard = document.createElement('div');
    timerCard.className = 'timer-card';
    timerCard.style.display = 'none';
    timerCard.innerHTML = '<span class="time">00:00</span>';
    container.appendChild(timerCard);
    
    // Add event listeners
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        try {
            playNextWord();
            startButton.style.display = 'none';
            audioButton.style.display = 'flex';
            timerCard.style.display = 'flex';
            
            // Start the timer
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
        } catch (error) {
            console.error('Error in start button handler:', error);
        }
    });
    
    audioButton.addEventListener('click', () => {
        console.log('Audio button clicked');
        if (currentWord && wordAudios[currentWord]) {
            console.log('Playing audio again for:', currentWord);
            playAudioOnce(wordAudios[currentWord]);
        } else {
            console.error('No current word or audio found');
        }
    });
}

// Remove the separate event listeners since they're now in createFlashcards
document.addEventListener('DOMContentLoaded', createFlashcards); 