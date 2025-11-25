document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const exit = document.getElementById('exit');
    const playArea = document.querySelector('.play-area');
    const levelUpOverlay = document.getElementById('level-up-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const groundSplit = document.getElementById('ground-split');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const jumpBtn = document.getElementById('jump-btn');

    // Player state
    let playerX = 20;
    let playerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let isGrounded = true; // Track if player is on ground or platform
    let isDead = false;
    let isFalling = false; // Track if player is falling into the pit

    // Game dimensions (will be updated on resize)
    let playAreaHeight, groundHeight, playAreaWidth, splitMaxWidth, splitTriggerX;

    const groundLevel = 0; // Player's Y position when on the ground platform

    // Game constants
    const playerSpeed = 4; // Max horizontal speed
    const playerAcceleration = 0.5; // How quickly player speeds up
    const playerDeceleration = 0.3; // How quickly player slows down when no input
    const groundFriction = 0.85; // Friction when on ground (higher = less friction)
    const airFriction = 0.98; // Friction in air (higher = less friction)
    const jumpPower = 12;
    const gravity = 0.4;
    const splitGrowthSpeed = 5; // Pixels per frame

    // Element dimensions
    const playerWidth = player.offsetWidth;
    const playerHeight = player.offsetHeight;

    // Input state
    const keys = {
        ArrowRight: false,
        ArrowLeft: false,
    };
    let spacePressed = false;
    let jumpCooldown = 0; // Prevents rapid jump spam
    const jumpCooldownFrames = 10; // Must wait this many frames between jumps

    // Ground split obstacle state
    let splitTriggered = false;
    let splitWidth = 0;

    function updateDimensions() {
        playAreaHeight = playArea.offsetHeight;
        playAreaWidth = playArea.offsetWidth;
        groundHeight = playAreaHeight / 3;
        splitMaxWidth = playAreaWidth / 2;
        splitTriggerX = playAreaWidth / 2;
    }


    function gameLoop() {
        // Don't update game if player is dead
        if (isDead) return;

        // Decrement jump cooldown
        if (jumpCooldown > 0) {
            jumpCooldown--;
        }

        // Check if player has reached midpoint to trigger ground split
        if (!splitTriggered && playerX >= splitTriggerX) {
            splitTriggered = true;
        }

        // Grow the ground split slowly
        if (splitTriggered && splitWidth < splitMaxWidth) {
            splitWidth += splitGrowthSpeed;
            groundSplit.style.width = `${splitWidth}px`;
        }

        // Handle horizontal movement based on keys pressed (unless falling into pit)
        if (!isFalling) {
            if (keys.ArrowRight) {
                velocityX = Math.min(playerSpeed, velocityX + playerAcceleration);
            } else if (keys.ArrowLeft) {
                velocityX = Math.max(-playerSpeed, velocityX - playerAcceleration);
            } else {
                // Decelerate when no key is pressed (only when grounded)
                if (isGrounded) {
                    if (Math.abs(velocityX) < playerDeceleration) {
                        velocityX = 0; // Stop completely if very slow
                    } else if (velocityX > 0) {
                        velocityX = Math.max(0, velocityX - playerDeceleration);
                    } else if (velocityX < 0) {
                        velocityX = Math.min(0, velocityX + playerDeceleration);
                    }
                }
            }

            // Apply friction (different for ground vs air)
            const currentFriction = isGrounded ? groundFriction : airFriction;
            velocityX *= currentFriction;
        }

        // Apply gravity
        velocityY -= gravity;

        // Update player position
        playerX += velocityX;
        playerY += velocityY;

        // --- Collision Detection and Response ---

        // Assume not grounded initially
        isGrounded = false;

        // Check if player falls into the ground split
        const splitLeftEdge = (playArea.offsetWidth / 2) - (splitWidth / 2);
        const splitRightEdge = (playArea.offsetWidth / 2) + (splitWidth / 2);
        const playerCenter = playerX + (playerWidth / 2);
        const playerInSplitZone = playerCenter >= splitLeftEdge && playerCenter <= splitRightEdge;

        // If player is in the split zone and at ground level - start falling animation
        if (playerY <= groundLevel && playerInSplitZone && splitWidth > 10 && !isFalling) {
            isFalling = true;
            velocityX *= 0.5; // Slow down horizontal movement
        }

        // If falling into pit, keep falling and add rotation
        if (isFalling) {
            // Add rotation based on how far they've fallen
            const rotationDegrees = Math.min(360, Math.abs(playerY) * 5);
            player.style.transform = `rotate(${rotationDegrees}deg)`;

            // Once fallen far enough, trigger death
            if (playerY < -100) {
                handleDeath();
                return;
            }
        } else {
            // Reset rotation when not falling
            player.style.transform = 'rotate(0deg)';
        }

        // 1. Ground and play area bounds collision (only if not falling into pit)
        if (playerY <= groundLevel && !playerInSplitZone && !isFalling) {
            playerY = groundLevel;
            velocityY = 0;
            isGrounded = true;
        }
        if (playerX < 0) {
            playerX = 0;
            velocityX = 0;
        }
        if (playerX + playerWidth > playAreaWidth) {
            playerX = playAreaWidth - playerWidth;
            velocityX = 0;
        }

        // 2. Door collision - get door position dynamically
        // Calculate door position relative to playArea's content area
        const exitRect = exit.getBoundingClientRect();
        const playAreaRect = playArea.getBoundingClientRect();
        const exitX = exitRect.left - playAreaRect.left;
        const exitWidth = exit.offsetWidth;
        const exitHeight = exit.offsetHeight;

        // Check if player's center is over the door (more strict than just any overlap)
        const playerCenterX = playerX + (playerWidth / 2);
        const isOverExit = playerCenterX > exitX && playerCenterX < exitX + exitWidth;

        // Check if player crossed through the door platform from above
        const previousY = playerY - velocityY;

        // Landing on the door: center is over door, was above it, now at or below it, and falling
        if (isOverExit && previousY >= exitHeight && playerY <= exitHeight && velocityY < 0) {
            playerY = exitHeight;
            velocityY = 0;
            isGrounded = true;
        }

        // If player is standing on the door platform (center over door, at door height)
        if (isOverExit && Math.abs(playerY - exitHeight) < 2 && velocityY <= 0) {
            isGrounded = true;
            playerY = exitHeight; // Ensure player stays on door platform
        }

        // 3. Entering the door - only from the sides while grounded at ground level
        if (isPlayerEnteringDoorFromSide(exitX, exitWidth, exitHeight)) {
            handleLevelComplete();
        }


        // Update player's style
        player.style.left = `${playerX}px`;
        player.style.bottom = `${groundHeight + playerY}px`;
    }

    function jump() {
        // Only allow jump if player is grounded and cooldown has expired (no air jumps)
        if (isGrounded && Math.abs(velocityY) < 0.1 && jumpCooldown === 0) {
            velocityY = jumpPower;
            jumpCooldown = jumpCooldownFrames; // Set cooldown
        }
    }

    function isPlayerEnteringDoorFromSide(exitX, exitWidth, exitHeight) {
        const playerTop = playerY + playerHeight;
        const atGroundLevel = Math.abs(playerY - groundLevel) < 2;
        const playerCenterX = playerX + (playerWidth / 2);
        const horizontalOverlap = playerCenterX > exitX && playerCenterX < exitX + exitWidth;
        const withinDoorHeight = playerTop > groundLevel && playerY < exitHeight;

        return atGroundLevel && horizontalOverlap && withinDoorHeight && isGrounded;
    }

    function handleDeath() {
        isDead = true;
        setTimeout(() => {
            player.style.opacity = '0';
            gameOverOverlay.style.display = 'flex';
        }, 300);
    }

    function handleLevelComplete() {
        isDead = true; // Stop game loop
        player.style.opacity = '0';
        levelUpOverlay.style.display = 'flex';
    }

    function resetGame() {
        playerX = 20;
        playerY = 0;
        velocityX = 0;
        velocityY = 0;
        isGrounded = true;
        jumpCooldown = 0;
        isDead = false;
        isFalling = false;

        splitTriggered = false;
        splitWidth = 0;
        groundSplit.style.width = '0px';

        player.style.transform = 'rotate(0deg)';
        player.style.opacity = '1';

        gameOverOverlay.style.display = 'none';
        levelUpOverlay.style.display = 'none';
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (keys.hasOwnProperty(event.key)) {
                keys[event.key] = true;
            }
            if (event.code === 'Space' && !spacePressed) {
                spacePressed = true;
                jump();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (keys.hasOwnProperty(event.key)) {
                keys[event.key] = false;
            }
            if (event.code === 'Space') {
                spacePressed = false;
            }
        });

        // Combined touch and mouse events for on-screen controls
        const setupButtonEvents = (button, key) => {
            const startEvent = (e) => {
                e.preventDefault();
                keys[key] = true;
            };
            const endEvent = (e) => {
                e.preventDefault();
                keys[key] = false;
            };
            button.addEventListener('touchstart', startEvent);
            button.addEventListener('touchend', endEvent);
            button.addEventListener('mousedown', startEvent);
            button.addEventListener('mouseup', endEvent);
        };

        setupButtonEvents(leftBtn, 'ArrowLeft');
        setupButtonEvents(rightBtn, 'ArrowRight');

        const jumpStart = (e) => {
            e.preventDefault();
            if (!spacePressed) {
                spacePressed = true;
                jump();
            }
        };
        const jumpEnd = (e) => {
            e.preventDefault();
            spacePressed = false;
        };
        jumpBtn.addEventListener('touchstart', jumpStart);
        jumpBtn.addEventListener('touchend', jumpEnd);
        jumpBtn.addEventListener('mousedown', jumpStart);
        jumpBtn.addEventListener('mouseup', jumpEnd);

        tryAgainBtn.addEventListener('click', resetGame);
        nextLevelBtn.addEventListener('click', resetGame);

        window.addEventListener('resize', updateDimensions);
    }

    // --- Initialization ---
    updateDimensions();
    setupEventListeners();
    setInterval(gameLoop, 1000 / 60); // Run at ~60 FPS
});