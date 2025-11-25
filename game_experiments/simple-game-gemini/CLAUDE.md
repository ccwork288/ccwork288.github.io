# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based 2D platformer game built with vanilla JavaScript, HTML5, and CSS3. The game features a physics-based character that must navigate obstacles to reach an exit door. It's designed to work on both desktop (keyboard controls) and mobile (touch controls).

## Development Commands

### Version Management
```bash
make version [major|minor|patch]
```
Bumps the version in `version.txt`. The version is displayed in the game's about screen.

### Running the Game
Simply open `index.html` in a web browser. No build process or server required.

## Architecture

### Core Files
- **index.html** - DOM structure with game container, play area, HUD, mobile controls, and overlay screens
- **style.css** - All styling including responsive layout, sprite animations, and mobile controls
- **script.js** - Complete game logic with physics engine and event handling
- **version.txt** - Single source of truth for version number

### Game Physics System (script.js)

The game uses a custom physics engine that runs at 60 FPS:

**Core Physics Loop**: The `gameLoop()` function handles:
1. Animation updates (sprite frame selection)
2. Jump cooldown management
3. Ground split obstacle triggering and growth
4. Horizontal movement with acceleration/deceleration
5. Gravity and velocity updates
6. Collision detection (ground, walls, door, pit)
7. Death and level completion checks

**Key Physics Variables**:
- Player state: position (playerX, playerY), velocity (velocityX, velocityY), flags (isGrounded, isDead, isFalling)
- Movement: playerSpeed (max speed), acceleration/deceleration rates, ground/air friction coefficients
- Jump mechanics: jumpPower, gravity, jumpCooldown (prevents spam)
- Ground split: splitWidth, splitGrowthSpeed, splitTriggered flag

**Collision System**: Uses bounding box checks for:
- Ground platform (bottom 1/3 of play area)
- Ground split (deadly pit that opens mid-game)
- Exit door (can be jumped on as platform or entered from side)
- Play area boundaries

### Character Animation System

The game uses a sprite sheet technique with CSS background-position:
- 4 frames in a single SVG data URL: idle, walk1, walk2, jump
- Animation state machine switches between idle/walking/jumping
- Character flips horizontally using CSS scaleX(-1) when moving left
- Rotation effect applied when falling into pit

### Responsive Design

**Desktop (>800px)**: Keyboard controls (arrow keys + space), full game title visible

**Mobile (≤800px)**:
- Touch controls appear (left/right arrows grouped together, jump button)
- Keyboard instructions hidden
- Game scales to fit viewport using aspect-ratio and max-width

### Mobile Controls Implementation

Touch buttons use both `touchstart`/`touchend` AND `mousedown`/`mouseup` events to work on all devices. The `setupButtonEvents()` helper creates event handlers that set the same key state as keyboard input, creating a unified input system.

## Important Implementation Details

### Version Display
The version constant in script.js:19 is manually maintained and should match version.txt. Update both when bumping versions.

### Dynamic Dimensions
Game dimensions are calculated on load and window resize via `updateDimensions()`. All game logic uses these calculated values rather than hardcoded pixels to support responsive sizing.

### Ground Split Obstacle
- Triggered when player crosses the midpoint (splitTriggerX)
- Grows at splitGrowthSpeed pixels per frame up to 70% of screen width
- Creates a deadly pit in the center of the ground platform
- Player falls through if their center point is within the split zone

### Door Entry Logic
The exit door has dual collision behavior:
- Can be landed on from above (acts as platform)
- Can be entered from sides while at ground level (triggers level complete)
The `isPlayerEnteringDoorFromSide()` function carefully checks positioning to prevent false triggers.
