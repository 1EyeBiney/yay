
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