document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    const finalScore = document.getElementById('final-score');
    const pauseScreen = document.getElementById('pause-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const restartBtn = document.getElementById('restart-btn');
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const soundBtn = document.getElementById('sound-btn');
    const gun = document.getElementById('gun');
    const backgroundMusic = document.getElementById('background-music');
    const plasmaGunSound = document.getElementById('plasma-gun-sound');
    const explosionSound = document.getElementById('explosion-sound');

    let score = 0;
    let isPaused = false;
    let isGameOver = false;
    let soundOn = true;
    let animationFrameId;
    let enemySpeed = 20; // Initial slow speed (20 pixels per second)
    let targetEnemySpeed = 100; // Target speed (100 pixels per second)
    let plasmaShots = [];
    let enemies = [];
    let lastTime = performance.now(); // Initialize with current time
    let speedIncrement = 0.1; // Speed increase per second (very gradual)
    let firstSchoolCreated = false; // Flag to track if the first school has been created
    let speedIncreaseDelay = 2000; // Delay before speed starts increasing (2 seconds)

    // Start game on first interaction
    document.addEventListener('click', startOnInteraction);
    document.addEventListener('keydown', startOnInteraction);
    document.addEventListener('touchstart', startOnInteraction);

    function startOnInteraction() {
        startGame();
        document.removeEventListener('click', startOnInteraction);
        document.removeEventListener('keydown', startOnInteraction);
        document.removeEventListener('touchstart', startOnInteraction);
    }

    function startGame() {
        score = 0;
        isPaused = false;
        isGameOver = false;
        enemySpeed = 20; // Reset to initial slow speed
        targetEnemySpeed = 100; // Reset target speed
        scoreDisplay.textContent = score;
        finalScore.textContent = score;
        gameOverScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        if (soundOn) backgroundMusic.play();

        plasmaShots = [];
        enemies = [];
        gameContainer.querySelectorAll('.enemy, .plasma, .explosion, .enemy-group').forEach(el => el.remove());

        // Initialize lastTime to the current time
        lastTime = performance.now();

        // Create the first school immediately but with controlled speed
        createContinuousSchool();
        firstSchoolCreated = true;

        createUnderwaterEffects();
        gameLoop(performance.now());
    }

    function createContinuousSchool() {
        if (isGameOver || isPaused) return;

        const enemyTypes = ['shark', 'shark', 'shark', 'shark', 'octopus', 'octopus', 'octopus', 'octopus', 'fish', 'fish', 'fish'];
        const schoolSize = 120; // Large school
        const baseX = window.innerWidth; // Start at right edge
        const baseY = window.innerHeight / 2 - 400; // Higher on screen
        const spacing = 100; // Gap

        const enemyGroup = document.createElement('div');
        enemyGroup.classList.add('enemy-group');
        enemyGroup.style.position = 'absolute';
        enemyGroup.style.left = `${baseX}px`;
        enemyGroup.style.top = `${baseY}px`;

        const shuffledTypes = [];
        for (let i = 0; i < schoolSize; i++) {
            shuffledTypes.push(enemyTypes[i % enemyTypes.length]);
        }
        shuffledTypes.sort(() => Math.random() - 0.5);

        for (let i = 0; i < schoolSize; i++) {
            const enemyType = shuffledTypes[i];
            const enemy = document.createElement('div');
            enemy.classList.add('enemy', enemyType);

            const row = Math.floor(i / 20); // 20 per row
            const col = i % 20;
            const offsetX = col * spacing + (Math.random() * 50 - 25);
            const offsetY = row * spacing + (Math.random() * 50 - 25);
            enemy.style.left = `${offsetX}px`;
            enemy.style.top = `${offsetY}px`;

            enemy.dataset.offsetX = offsetX;
            enemy.dataset.offsetY = offsetY;
            enemy.dataset.phase = Math.random() * Math.PI * 2;

            enemyGroup.appendChild(enemy);
            enemies.push(enemy);
        }

        const groupWidth = 20 * spacing;
        enemyGroup.style.left = `${baseX - groupWidth}px`; // Span screen

        gameContainer.appendChild(enemyGroup);
    }

    function moveSchool(timestamp) {
        const enemyGroup = gameContainer.querySelector('.enemy-group');
        if (!enemyGroup || isGameOver || isPaused) return;

        const deltaTime = (timestamp - lastTime) / 1000; // Seconds
        lastTime = timestamp;

        // Delay speed increase for the first few seconds
        if (timestamp - lastTime < speedIncreaseDelay) {
            enemySpeed = 20; // Keep initial slow speed
        } else {
            // Gradually increase speed to target speed
            if (enemySpeed < targetEnemySpeed) {
                enemySpeed += speedIncrement * deltaTime; // Increase speed gradually
                if (enemySpeed > targetEnemySpeed) {
                    enemySpeed = targetEnemySpeed; // Cap at target speed
                }
            }
        }

        console.log(`Current Speed: ${enemySpeed}`); // Debugging: Log the current speed

        const currentX = parseFloat(enemyGroup.style.left) || (window.innerWidth - (20 * 100));
        const newX = currentX - (enemySpeed * deltaTime); // Move at pixels per second

        // Reset the school to the right side when it moves off the left side
        if (newX + (20 * 100) < 0) {
            enemyGroup.style.left = `${window.innerWidth}px`;
        } else {
            enemyGroup.style.left = `${newX}px`;
        }

        // Add swaying motion to enemies
        enemies.forEach(enemy => {
            const phase = parseFloat(enemy.dataset.phase);
            const offsetY = parseFloat(enemy.dataset.offsetY);
            const sway = Math.sin(timestamp / 500 + phase) * 10;
            enemy.style.top = `${offsetY + sway}px`;
        });
    }

    function createUnderwaterEffects() {
        setInterval(() => {
            if (isGameOver || isPaused) return;
            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            bubble.style.left = `${Math.random() * 100}%`;
            gameContainer.appendChild(bubble);
            bubble.addEventListener('animationend', () => bubble.remove());
        }, 500);

        for (let i = 0; i < 3; i++) {
            const lightRay = document.createElement('div');
            lightRay.classList.add('light-ray');
            lightRay.style.left = `${Math.random() * 100}%`;
            gameContainer.appendChild(lightRay);
        }
    }

    function shootPlasma() {
        if (isGameOver || isPaused) return;

        const plasma = document.createElement('div');
        plasma.classList.add('plasma');
        const gunRect = gun.getBoundingClientRect();
        const startLeft = gunRect.right - gameContainer.getBoundingClientRect().left;
        plasma.style.left = `${startLeft}px`;
        plasma.style.top = `${gunRect.top + gunRect.height / 2 - 5}px`;
        plasma.style.setProperty('--start-left', `${startLeft}px`);
        gameContainer.appendChild(plasma);

        if (soundOn) {
            plasmaGunSound.currentTime = 0;
            plasmaGunSound.play();
        }

        plasmaShots.push(plasma);
        plasma.addEventListener('animationend', () => {
            plasma.remove();
            plasmaShots = plasmaShots.filter(p => p !== plasma);
        });
    }

    function createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.classList.add('explosion');
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        gameContainer.appendChild(explosion);

        if (soundOn) {
            explosionSound.currentTime = 0;
            explosionSound.play();
        }

        setTimeout(() => explosion.remove(), 300);
    }

    function increaseDifficulty() {
        if (score % 5 === 0 && score > 0) {
            targetEnemySpeed += 20; // Increase target speed by 20 pixels per second
        }
    }

    function gameLoop(timestamp) {
        if (isGameOver || isPaused) {
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }

        moveSchool(timestamp); // Move school with consistent speed

        plasmaShots.forEach((plasma, pIndex) => {
            const plasmaRect = plasma.getBoundingClientRect();
            enemies.forEach((enemy, eIndex) => {
                const enemyRect = enemy.getBoundingClientRect();
                if (
                    plasmaRect.left < enemyRect.right &&
                    plasmaRect.right > enemyRect.left &&
                    plasmaRect.top < enemyRect.bottom &&
                    plasmaRect.bottom > enemyRect.top &&
                    !enemy.classList.contains('hit')
                ) {
                    enemy.classList.add('hit');
                    createExplosion(enemyRect.left, enemyRect.top);
                    if (enemy.classList.contains('shark') || enemy.classList.contains('octopus')) {
                        score += 1;
                        scoreDisplay.textContent = score;
                        increaseDifficulty();
                    } else if (enemy.classList.contains('fish')) {
                        finalScore.textContent = score;
                        gameOver();
                    }
                    enemy.style.opacity = '0';
                    setTimeout(() => enemy.remove(), 300);
                    enemies.splice(eIndex, 1);
                    plasma.remove();
                    plasmaShots.splice(pIndex, 1);
                }
            });
        });

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        isGameOver = true;
        gameOverScreen.style.display = 'block';
        backgroundMusic.pause();
        cancelAnimationFrame(animationFrameId);
    }

    document.addEventListener('mousemove', (e) => {
        if (isGameOver || isPaused) return;
        gun.style.left = `${e.clientX - gun.offsetWidth / 2}px`;
        gun.style.top = `${e.clientY - gun.offsetHeight / 2}px`;
    });

    document.addEventListener('touchmove', (e) => {
        if (isGameOver || isPaused) return;
        e.preventDefault();
        const touch = e.touches[0];
        gun.style.left = `${touch.clientX - gun.offsetWidth / 2}px`;
        gun.style.top = `${touch.clientY - gun.offsetHeight / 2}px`;
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
        if (isGameOver || isPaused) return;
        if (e.code === 'Space') shootPlasma();
    });

    gun.addEventListener('click', shootPlasma);
    gun.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootPlasma();
    });

    pauseBtn.addEventListener('click', () => {
        if (isGameOver) return;
        isPaused = true;
        pauseScreen.style.display = 'block';
        backgroundMusic.pause();
    });

    resumeBtn.addEventListener('click', () => {
        isPaused = false;
        pauseScreen.style.display = 'none';
        if (soundOn) backgroundMusic.play();
        gameLoop(performance.now());
    });

    soundBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
        if (soundOn && !isPaused && !isGameOver) backgroundMusic.play();
        else backgroundMusic.pause();
    });

    restartBtn.addEventListener('click', startGame);
    pauseRestartBtn.addEventListener('click', startGame);
});
