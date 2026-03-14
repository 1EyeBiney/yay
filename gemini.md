
# YES! ACCESSIBLE YAHTZEE: MASTER WATCHDOG DIRECTIVE

## SYSTEM INSTRUCTION FOR AI AGENTS:
You are the Systems Architect and Lead Developer for "Yes! Accessible Yahtzee," a web-based scoring application designed strictly for screen reader users (JAWS, NVDA).

### 1. The Prime Directive: Zero Standard Inputs
- **No Text Fields**: You must NEVER use standard `<input type="text">`, `<input type="number">`, or traditional form fields. Screen reader "forms mode" introduces cognitive load and keybinding conflicts.
- **The Focus Trap**: The entire application lives inside a single `<div id="game-container" tabindex="0" role="application">`. This forces the screen reader into a controlled focus mode. If focus is lost (blur event), it must immediately be forced back to this container.
- **Audio Output is Mandatory**: Every player action must result in a definitive auditory response via a hidden ARIA live region (`aria-live="polite"` or `assertive`). Use a centralized `window.announce("...")` function.

### 2. State Management (The Single Source of Truth)
The UI is only a visual reflection of `window.YAHTZEE_STATE`. You must never read the DOM to determine the score or game state.

```javascript
window.YAHTZEE_STATE = {
  // null = empty/unused. 0 = deliberately scratched.
  categories: {
    1: { name: "Aces", value: null, max: 5, step: 1 },
    2: { name: "Twos", value: null, max: 10, step: 2 },
    3: { name: "Threes", value: null, max: 15, step: 3 },
    4: { name: "Fours", value: null, max: 20, step: 4 },
    5: { name: "Fives", value: null, max: 25, step: 5 },
    6: { name: "Sixes", value: null, max: 30, step: 6 },
    T: { name: "Three of a Kind", value: null, max: 30, step: 1 },
    F: { name: "Four of a Kind", value: null, max: 30, step: 1 },
    H: { name: "Full House", value: null, fixed: [0, 25] },
    S: { name: "Small Straight", value: null, fixed: [0, 30] },
    L: { name: "Large Straight", value: null, fixed: [0, 40] },
    Y: { name: "Yahtzee", value: null, fixed: [0, 50] },
    C: { name: "Chance", value: null, max: 30, step: 1 },
    B: { name: "Yahtzee Bonus", value: 0, max: 300, step: 100, locked: true } // Unlocks if Y >= 50
  },
  currentCategory: '1', // Tracks current cursor position
  inputMode: 'nav',     // 'nav', 'score', or 'confirm_reset'
  tempScore: 0,         // Tracks the number being dialed in 'score' mode
  history: [],          // Array of last 5 game objects
  topScores: []         // Array of top 10 highest game objects (sorted descending)
};
```

### 3. The Interaction Loop & Keybindings
All input is captured by a global keydown listener attached to window. You must use e.preventDefault() on handled keys to stop screen readers from hijacking them.

**Navigation Mode (`inputMode === 'nav'`):**
- **Up/Down Arrows**: Moves the cursor sequentially through the categories. Announces category name and current status (Empty or Used/Score).
- **1-6**: Jumps directly to Upper Section categories.
- **T, F, H, S, L, Y, C, B**: Jumps directly to Lower Section categories.
- **Enter**: Switches to Score Mode for the currently focused category. (Announces: "Set score for [Category]. [Current Value or 0].")

**Score Mode (`inputMode === 'score'`):**
- **Up/Down Arrows**: Steps the tempScore up or down based on the valid numbers for that category (e.g., Twos go 0, 2, 4, 6. Full house toggles 0, 25).
- **Shift + Up/Down Arrows**: Jumps the tempScore by chunks of 5 (for Chance, 3-of-a-kind, etc.).
- **Escape**: Cancels scoring, reverts to Navigation Mode.
- **Enter**: Commits the tempScore to the State, updates subtotals/totals, auto-saves to localStorage, and reverts to Navigation Mode. (Announces: "[Score] points saved in [Category].")

**Dice Control (Digital Mode only):**
- **Spacebar**: Rolls the dice (if rolls are available).
- **Z, X, C, V, B**: Toggles Hold/Release for Die 1 through Die 5 respectively.

### 4. Game History, Leaderboards, and Reset Logic
The application must track historical scores in localStorage.
- **Recent Scores (E)**: Pressing E in Navigation Mode announces the last 5 scores. (e.g., "Recent games: 240, 195, 310...").
- **Top 10 Leaderboard (0)**: Pressing 0 (Zero on the number row) in Navigation Mode announces the top 10 all-time scores with their dates.
- **Triggering Reset (Q)**: Pressing Q changes the inputMode to 'confirm_reset'.
    - **Evaluation**: The system checks if the current grand total qualifies for the `topScores` array.
    - **Announcement (High Score)**: "You are about to reset the board. Your score of [Total] is a new Top 10 high score! Press Y to save and reset, or N to cancel."
    - **Announcement (Normal)**: "You are about to reset the board with a score of [Total]. Press Y to save and reset, or N to cancel."
- **Confirm Reset (Y/N)**: If `inputMode` is 'confirm_reset', pressing Y saves the score to history (and `topScores` if applicable), wipes the current scorecard, saves the blank state to localStorage, and returns to Navigation Mode. Pressing N cancels and returns to Navigation Mode.

### 5. Architectural Integrity & Developer Tools
- **Autosave**: Every time a score is committed or the board is reset, the `YAHTZEE_STATE` must be stringified and saved to localStorage. On page load, it must hydrate this state.
- **Separation of Concerns**:
    - `input.js`: Only handles keystrokes and updates `tempScore`, `inputMode`, or `currentCategory`.
    - `logic.js`: Only handles saving scores, calculating the 63-point upper bonus, grand totals, and managing history arrays.
    - `ui.js`: Only renders the DOM table visually and triggers `window.announce()`.
- **Developer Shortcuts**: To facilitate rapid testing, implement the following strict keybindings (only active when Ctrl + Shift are held together):
    - **Ctrl + Shift + 1**: Instantly fills the Upper Section with maximum values to test the 63-point Upper Bonus logic. (Announces: "Dev Mode: Upper Section Maxed.")
    - **Ctrl + Shift + 2**: Instantly fills the Lower Section with maximum values to test grand total math. (Announces: "Dev Mode: Lower Section Maxed.")
    - **Ctrl + Shift + 9**: Wipes the localStorage entirely and reloads the page to test first-time user experience.
    - **Ctrl + Shift + 0**: Automatically inserts a fake score of 500 into the Top 10 leaderboard to test high-score displacement.

### 6. Strict Anti-Patterns (What NOT to do)
- **Zero Mouse Events**: You must NOT implement `onclick`, `onmouseover`, or any mouse-based event listeners. The application is strictly keyboard-driven.
- **No Focus Hopping**: Do not use `tabindex` values other than 0 on the main container. Do not manage focus by moving the DOM's active element between rows. The focus must remain statically on the `#game-container` while JavaScript tracks the "virtual" focus (`currentCategory`).
- **No alert() or prompt()**: Native browser dialogs disrupt the screen reader buffer. Use the `inputMode` state and `window.announce()` to handle all confirmations (like the Reset prompt).

### 7. Core Logic & Math Rules
- **Dynamic Totals**: Upper Subtotal, Upper Bonus (35 points if Upper Subtotal >= 63), Lower Total, and Grand Total must be calculated dynamically based on the categories object. Do not store them statically in the state.
- **Yahtzee Bonus Lock**: The "Yahtzee Bonus" category can ONLY be modified if the main "Yahtzee" category has a saved value of exactly 50. If Yahtzee is 0 or null, the Bonus category is locked and skipped during navigation.

### 8. HTML Boilerplate Requirements
The `index.html` file must contain exactly this structure for the core interface:

```html
<body>
  <div id="game-container" tabindex="0" role="application" aria-label="Yahtzee Scorecard. Press Up and Down arrows to navigate.">
  </div>
  <div id="aria-announce" class="sr-only" aria-live="assertive"></div>
</body>
```
 ### 9. The Web Audio Engine Specs
The game requires `window.playGameSound(action)` to be implemented with the following specifications (Global Gain ~0.4):
- `startup`: Tri-tonal sequence `[400, 523, 659]` at 0ms delay.
- `nav`: High-pitched blip (880Hz).
- `limit`: Low-pitched thud (220Hz) for boundary alerts/errors.
- `select`: Ascending chime `[660, 880]`.
- `save`: C-Major chord `[523.25, 659.25, 783.99, 1046.50]`.
- `undo`: Descending sequence `[1046.50, 783.99, 523.25]`.
- `cancel`: Descending tone `[440, 220]`.
*Note: `initAudio()` must be called immediately on the first user gesture (the Start button) and at the top of the `keydown` listener.*

### 10. Production Deployment & Updated Boilerplate
- **Filenaming**: The primary application file must always be named `index.html`.
- **Boilerplate Override**: The HTML must include a Start button to unlock the Web Audio API context prior to focusing the `#game-container`:
  ```html
  <body>
    <button id="initBtn" autofocus onclick="initGame()">Start Yahtzee</button>
    <div id="game-container" tabindex="0" role="application" aria-label="Yahtzee Scorecard."></div>
    <div id="aria-announce" class="sr-only" aria-live="assertive"></div>
  </body>
```

### 11. Multiplayer Architecture & Undo System (v1.3.4 Additions)
- **Multiplayer State Refactor**: The `categories` object in `window.YAHTZEE_STATE` (from Section 2) is NOW OFFICIALLY replaced by a `players` array containing 6 player objects (e.g., `[{ id: 1, categories: {...} }, ...]`). You MUST use `state.players[state.currentPlayerIndex].categories` to access the active board.
- **Horizontal Navigation**: Left/Right arrows navigate between Player 1 through Player 6 columns. The screen reader MUST announce the "Player [X]" string first for spatial orientation before reading the category.
- **Grand Total Hotkey (R)**: Dynamically calculates and announces the active player's grand total from anywhere on the board.
- **Category Locking**: Inside Navigation Mode, pressing `Enter` on a category where `value !== null` MUST be rejected. Play the `limit` sound and announce "Category already played." When entering Score Mode on a fresh category, force `tempScore = 0` and announce "Scratch, 0".
- **The Undo Feature (U)**: When a score is committed, record it to `state.lastMove = { playerIndex, categoryKey }`. Pressing `U` checks this memory, reverts the target category to `null`, clears the memory, shifts focus back to that cell, and plays the `undo` sound.

# YAY Dev Log: March 12, 2026

## Current State
* **Active Version:** v2.6.0
* **Files Modified:** index.html, core.js, audio.js

## Changelog (What we accomplished)
* **Spacebar Roll:** Reassigned the "Roll Dice" command from `D` to `Spacebar` for better ergonomics and to prevent conflicts with alphabetical keys.
* **Setup Mode Update:** Reassigned the digital/manual mode selection key from `D` to `Spacebar` during the setup phase.
* **Smart Dice Audio:** Implemented `window.playDiceAudio()` in `audio.js` with a buffer system to prevent repetitive sounds and a graceful synthesizer fallback if MP3s fail.

# YAY Dev Log: March 11, 2026

## Current State
* **Active Version:** v1.4.4
* **Files Modified:** index.html

## Changelog (What we accomplished)
* **The Help Menu:** Added a comprehensive audio instruction manual triggered by the `?` key.
* **The Auto-Scoring Math Engine:** Built `window.calculateScore` to automatically validate Yahtzees, Straights, Full Houses, and all other categories.
* **The "Two Roads" Master Toggle:** Added a setup prompt allowing players to choose between Digital Dice (Auto-Scoring) or Manual Dice (Physical dice with manual score dialing).
* **Digital Placement Mode:** In Digital mode, pressing Enter on a category (or running out of rolls) enters a `placement` mode where the Up/Down arrows filter only empty categories and announce auto-calculated score previews.
* **The Auto-Funnel:** Taking the 3rd roll automatically shifts the game into `placement` mode.
* **Auto-Turn Progression:** Locking in a score automatically passes the dice to the next player and moves the cursor to their first available empty category.
* **End Game Detection:** The engine now automatically detects when all 13 rounds are finished, calculates grand totals, announces the winner, and saves the records to the Leaderboard.

## Core Architecture Notes
* **State Management:** `window.YAHTZEE_STATE` now includes `gameMode` ('digital' or 'manual') and `gameOver` (boolean).
* **Input Modes:** We now have `setup`, `setup_choice`, `setup_dice_choice`, `nav`, `score` (for manual dialing), `placement` (for auto-scoring previews), and `confirm_reset`.
* **Game Over Lockdown:** If `state.gameOver` is true, `nav` mode intentionally intercepts and blocks the `D`, `Enter`, `U`, and hold keys to protect the final board state, while still allowing arrow keys for review.
* **Leaderboard Names:** The `gameRecord` object specifically loops through all active players during a game over or a valid `Q` reset to save everyone's name, score, and date to `state.history` and `state.topScores`.

## Known Issues (What is still broken)
* The game logic and keyboard interface are pristine, but the UI is not yet optimized for iOS VoiceOver touch controls.

## Next Steps for Tomorrow
* **Feature:** Build the Mobile VoiceOver Touchpad interface so the game can be played via swiping and double-tapping on an iPhone screen.
* **Suggested Starting Prompt:** `@workspace Please read gemini.md and index.html. We are on v1.4.4. Our next goal is to build an on-screen grid of buttons (Up, Down, Roll, Hold 1-5, Enter) that only appears on mobile screens to allow iOS VoiceOver users to play without a physical keyboard. Please suggest the HTML/CSS structure for this mobile control pad.`

# YAY Dev Log: March 11, 2026 (Part 2)

## Current State
* **Active Version:** v1.5.1
* **Files Modified:** index.html

## Changelog (What we accomplished)
* **The "Joker Rule" Yahtzee Bonus:** Implemented official Yahtzee rules where scoring the Bonus acts as a "Free Action," adding 100 points without consuming a turn or resetting the dice, allowing the player to fulfill the Joker Rule.
* **The Audio Overhaul:** Integrated complex synthesizer sequences from the v2.0 Audio Laboratory directly into the game engine, including:
    * `startup` (Sound 119 - Hologram On)
    * `gameStart` (Sound 37 - Bouncing Confirm)
    * `roll` (Sound 137 - Signal Lost, timed cascade)
    * `hold`/`release` (Sounds 72/73 - Directional toggles)
    * `valueTick` (Sound 63 - Rapid step for value dialing)
    * `victory` (Sound 149 - Full arpeggio and sustained chord sequence)
* **Streamlined Verbosity:** Reduced screen reader chatter during high-speed actions (e.g., toggling dice now only reads the value and status, not the index).
* **Browser Compatibility:** Explicitly released the `F5` key from the global `e.preventDefault()` lock, allowing users to refresh the page normally.
* **The AI Automation Engine:** Built an asynchronous, self-driving logic loop (`window.handleAITurn`) that allows computer-controlled opponents to play the game natively.
* **The "Bumbling Bot" Personality:** Added an AI archetype (The Grinder) that heavily weights the Upper Section Bonus, holds dice to build 3-of-a-kinds, and automatically selects the highest-scoring category.
* **Variable AI Pacing:** Introduced a global `speechRate` variable (Fast: 3s, Medium: 4.5s, Slow: 6s) controlled by the `P` hotkey. This specifically spaces out the AI's `setTimeout` chains to prevent ARIA live region queuing and audio overlap.

## Core Architecture Notes
* **End Game Simulator (Developer Tool):** Added a new shortcut (`Ctrl + Shift + 3`) that instantly fills the board to Round 13, setting Player 1 for a perfect minimum game (63 upper) and cutting all other players' scores in half, leaving only 'Chance' empty for immediate end-game testing.
* **AI Integration:** `state.players` objects now support an `isBot: true` boolean.
* **UI Polish:** The initial start button text was updated to "Press Enter to Begin" and the main container's `aria-label` was branded to "Application: YAY! Accessible Yahtzee". A visual pacing indicator was added to the top right of the DOM.

## Known Issues (What is still broken)
* The game logic, AI, and keyboard interface are pristine, but the UI is not yet optimized for iOS VoiceOver or Android TalkBack touch controls.

## Next Steps for Tomorrow
* **Feature:** Build the Mobile VoiceOver Touchpad interface so the game can be played via swiping and double-tapping on a smartphone screen without a physical keyboard.
* **Suggested Starting Prompt:** `@workspace Please read gemini.md and index.html. We are on v1.5.1. Our next goal is to build an on-screen grid of buttons (Up, Down, Roll, Hold 1-5, Enter, Undo) that only appears on mobile screens to allow touch-based screen reader users to play natively. Please suggest the HTML/CSS structure and touch-event mappings for this mobile control pad.`
# YAY! ACCESSIBLE DICE: MASTER WATCHDOG DIRECTIVE

## SYSTEM INSTRUCTION FOR AI AGENTS:
You are the Systems Architect and Lead Developer for "YAY! Accessible Dice," a web-based scoring application and game engine designed strictly for screen reader users (JAWS, NVDA, VoiceOver).

### 1. The Prime Directive: Zero Standard Inputs
- **No Text Fields**: You must NEVER use standard `<input type="text">`, `<input type="number">`, or traditional form fields. Screen reader "forms mode" introduces cognitive load and keybinding conflicts.
- **The Focus Trap**: The entire application lives inside a single `<div id="game-container" tabindex="0" role="application">`. This forces the screen reader into a controlled focus mode. If focus is lost (blur event), it must immediately be forced back to this container.
- **Audio Output is Mandatory**: Every player action must result in a definitive auditory response via a hidden ARIA live region (`aria-live="polite"` or `assertive`) or the dynamic audio engine. Use a centralized `window.announce("...")` function.

### 2. State Management (The Single Source of Truth)
The UI is only a visual reflection of `window.YAHTZEE_STATE`. You must never read the DOM to determine the score or game state.

```javascript
window.YAHTZEE_STATE = {
  // null = empty/unused. 0 = deliberately scratched.
  categories: {
    1: { name: "Aces", value: null, max: 5, step: 1 },
    2: { name: "Twos", value: null, max: 10, step: 2 },
    3: { name: "Threes", value: null, max: 15, step: 3 },
    4: { name: "Fours", value: null, max: 20, step: 4 },
    5: { name: "Fives", value: null, max: 25, step: 5 },
    6: { name: "Sixes", value: null, max: 30, step: 6 },
    'T': { name: "3 of a kind", value: null },
    'F': { name: "4 of a kind", value: null },
    'H': { name: "Full House", value: null, max: 25, step: 25 },
    'S': { name: "Sm. Straight", value: null, max: 30, step: 30 },
    'L': { name: "Lg. Straight", value: null, max: 40, step: 40 },
    'Y': { name: "YAY!", value: null, description: "5 of a kind (50 pts)" }, // Trademark safe
    'C': { name: "Chance", value: null },
    'B': { name: "YAY! Bonus", value: null } 
  },
  players: [], // Array of player objects {id, name, isBot, abbr, categories, score, etc.}
  setupIndex: 0,
  nameIndex: 0,
  botIndex: 0,
  currentPlayerIndex: 0,
  currentCategory: '1',
  gameMode: 'manual', // or 'digital'
  gameOver: false,
  dice: [1, 1, 1, 1, 1],
  heldDice: [false, false, false, false, false],
  rollsLeft: 3,
  inputMode: 'setup', // 'setup', 'setup_choice', 'setup_bot_choice', 'nav', 'placement', 'game_over'
  speechRate: 'medium',
  history: [], 
  topScores: [],
  aiVoiceMuted: false,
  audioBags: {} // State for Shuffle Bag non-repeating audio logic
};
# YAY Dev Log: March 14, 2026 (The AI Brain Overhaul)

## Current State
* **Active Version:** v3.4.0
* **Files Modified:** index.html, core.js, audio.js

## Changelog (What we accomplished)
* **v3.0.0 - Pattern Recognition (Phase 2):** Rewrote the AI holding logic. Bots now actively look for Straights, Full Houses, and Multiples before falling back to holding single high numbers. They also check if the target category is actually empty (`cats[key].value === null`) before chasing a pattern.
* **v3.1.0 - Scratch Hierarchy (Phase 3):** If a bot's best possible score is 0, it bypasses its personality multipliers and scratches based on a strict priority array (`['1', '2', '3', '4', 'F', 'T', '5', 'S', '6', 'L', 'H', 'Y']`) to protect high-value targets.
* **v3.1.2 - Audio Pacing:** Fine-tuned `botDelay` and `baseDelay` transition timers to prevent the bot's MP3 audio from bleeding over the screen reader's `aria-live` TTS announcements.
* **v3.2.0 - Upper Bonus Awareness:** Bots calculate their `currentUpper` subtotal. If a placement secures the 63-point threshold, `weight += 50`. If it stays on pace (scores $\ge$ 3 of a kind), `weight += 15`. Bots also aggressively hold pairs of 4s, 5s, and 6s to chase the bonus.
* **v3.3.0 - Endgame Desperation:** If a bot has $\le 3$ empty categories remaining, it enters "Panic Mode." It bypasses standard hold priorities and exclusively holds dice that build toward its specific remaining categories.
* **v3.4.0 - Scoreboard Awareness:** Bots calculate the `differential` between their score and the leading human player. If trailing by 40+, they take massive risks (Yahtzee `weight += 100`, Large Straight `weight += 50`). If leading by 40+, they play conservatively (Upper section/Chance `weight += 20`).

## Core Architecture Notes
* **The Heuristic Engine:** The AI is not a machine learning model; it uses strict conditional logic in `window.handleAITurn`. 
* **Performance Constraints:** All array manipulations (`filter`, `reduce`, `Set`) used in the Phase 2/Phase 3 AI logic were heavily optimized to ensure the browser's main thread does not hang and interrupt the screen reader.

## Next Steps for Tomorrow
* **Feature:** Now that the core logic is incredibly smart, we need to assign specific mathematical risk/reward personalities to the four new voice actors (Johnny Dynamite, Countess Spatula, Lady Gwendolyn, and Freddy Fingers) in Phase 3 of `core.js`. Right now, they all default to the "Grinder" archetype.
* **Suggested Starting Prompt:** `@workspace Please read gemini.md and core.js. We are on v3.4.0. I want to assign unique personality multipliers to the new bots in Phase 3 of window.handleAITurn. For example, Johnny Dynamite ('jd') should be a Gambler, and Lady Gwendolyn ('lg') should be highly conservative.`