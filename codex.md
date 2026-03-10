# YAY! Accessible Yahtzee - Code Codex

## Overview
YAY! is a fully accessible web-based Yahtzee scoring application designed exclusively for screen reader users. The application implements a complete Yahtzee game with persistent state, audio feedback, and keyboard-only navigation.

## Architecture

### Core Components
1. **HTML Structure**: Single-page application with a focus-trapped container
2. **CSS Styling**: High-contrast dark theme optimized for accessibility
3. **JavaScript Engine**: State-driven architecture with audio synthesis and ARIA announcements

### Key Files
- `index.html`: Main application file containing HTML, CSS, and JavaScript
- `gemini.md`: Master directives and architectural guidelines
- `brandee mega prompt.md`: System prompts for code generation
- `.changelog.MD`: Version history and feature tracking

## State Management

### Global State Object
```javascript
window.YAHTZEE_STATE = {
  players: [],           // Array of player objects with names and categories
  setupIndex: 0,         // Current player being set up
  nameIndex: 0,          // Current name selection index
  currentPlayerIndex: 0, // Active player during gameplay
  currentCategory: '1',  // Currently focused category ('1'-'6', 'T','F','H','S','L','Y','C','B')
  inputMode: 'setup',    // 'setup', 'nav', 'score', 'confirm_reset'
  tempScore: 0,          // Temporary score during scoring mode
  lastMove: null,        // Last move for undo functionality
  history: [],           // Last 5 game records
  topScores: []          // Top 10 high scores
};
```

### Player Structure
Each player object contains:
- `id`: Player number
- `name`: Selected name from NAME_LIBRARY
- `categories`: Object with all Yahtzee categories

### Category Structure
Each category has:
- `name`: Display name
- `value`: null (empty), 0 (scratched), or number (score)
- `max`: Maximum possible score
- `step`: Increment for scoring
- `fixed`: Array of fixed values (for special categories)
- `locked`: Boolean for locked categories

## Input Modes

### Setup Mode (`inputMode: 'setup'`)
- Player name selection using arrow keys
- Up/Down: Cycle through NAME_LIBRARY
- Shift+Up/Down: Jump 5 names
- Enter: Confirm name selection
- Transitions to 'setup_choice' after first player

### Setup Choice Mode (`inputMode: 'setup_choice'`)
- After naming a player, choose to add another or start
- Enter: Add another player
- S: Start game with current players

### Navigation Mode (`inputMode: 'nav'`)
- Arrow keys: Navigate categories
- Number keys: Jump to specific categories
- Enter: Enter scoring mode for current category
- Special keys: History (E), Leaderboard (0), Undo (U), Reset (Q)

### Scoring Mode (`inputMode: 'score'`)
- Arrow keys: Adjust temporary score
- Shift+Arrows: Large increments
- Enter: Commit score
- Escape: Cancel scoring

### Confirm Reset Mode (`inputMode: 'confirm_reset'`)
- Y: Confirm reset and save score
- N: Cancel reset

## Audio System

### Web Audio API Integration
- `initAudio()`: Initializes AudioContext
- `playTone()`: Generates sine wave tones
- `playEcho()`: Tones with delay effect
- `playSequence()`: Multiple tones in sequence
- `playChord()`: Simultaneous tones

### Sound Effects
- `startup`: Tri-tonal startup sequence
- `nav`: Navigation feedback
- `select`: Selection confirmation
- `save`: Score saving
- `undo`: Undo action
- `cancel`: Cancellation
- `limit`: Boundary reached

## Accessibility Features

### ARIA Implementation
- `role="application"`: Application landmark
- `aria-live="assertive"`: Immediate announcements
- `aria-label`: Descriptive labels
- Screen reader optimized navigation

### Focus Management
- Single focus point on game container
- Automatic focus restoration on blur
- Keyboard-only interaction model

### Audio Feedback
- Every action produces sound
- Announcements for all state changes
- Tonal feedback for navigation

## Persistence

### LocalStorage Integration
- Automatic save on score commits
- State hydration on page load
- History and leaderboard persistence
- Graceful handling of corrupted data

### Data Structure
- Full game state serialization
- Player data with names and scores
- Historical game records
- Top scores with timestamps

## Scoring Logic

### Category Types
1. **Upper Section** (1-6): Sum of specific dice values
2. **Lower Section Special**:
   - Three/Four of a Kind: Sum of all dice
   - Full House: 25 points
   - Small/Large Straight: 30/40 points
   - Yahtzee: 50 points
   - Chance: Sum of all dice
   - Yahtzee Bonus: Additional 100 points (unlocks after Yahtzee)

### Bonus Calculation
- Upper Bonus: 35 points if upper section ≥ 63
- Yahtzee Bonus: Unlocks after scoring Yahtzee

### Validation
- Categories can only be scored once
- Fixed categories have predefined values
- Dynamic clamping for variable categories

## Developer Tools

### Keyboard Shortcuts (Ctrl+Shift)
- **1**: Max upper section scores
- **9**: Clear localStorage and reload
- **0**: Inject fake high score

### Debug Features
- Console warnings for hydration issues
- State validation on load
- Error handling for audio failures

## Code Organization

### Functions
- `initGame()`: Game initialization and state setup
- `renderScorecard()`: DOM table generation
- `saveState()`: Persistence to localStorage
- `announce()`: ARIA live region updates
- `playGameSound()`: Audio feedback system

### Event Handling
- Global keydown listener
- Mode-specific key processing
- Prevent default on handled keys

### Rendering
- Dynamic table generation
- Player-specific score display
- Current category highlighting
- Total row calculations

## Version History Integration

### Changelog Tracking
- Semantic versioning (1.3.5.x series)
- Feature additions and bug fixes
- Structural improvements
- Accessibility enhancements

### Migration Handling
- Backward compatibility for saved states
- Hydration validation
- Graceful degradation for old data

## Future Roadmap Considerations

### Potential Enhancements
- Multiplayer support expansion
- Additional game modes
- Enhanced audio customization
- Performance optimizations

### Architectural Scalability
- Modular code structure
- Configuration-driven features
- Extensible category system

This codex provides a comprehensive overview of the YAY! Accessible Yahtzee codebase, serving as both documentation and architectural reference for developers working on the project.</content>
<parameter name="filePath">c:\nbs\yay\codex.md