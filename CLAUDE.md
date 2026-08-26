# YAY! Accessible Dice — Project Guide

A web-based, fully accessible Yahtzee-style dice game ("YAY!") built **exclusively for screen
reader users** (JAWS, NVDA, VoiceOver). Single-page static site, no build step, no framework.

- **Live site:** https://1eyebiney.github.io/yay/ (GitHub Pages, served from `main` branch root)
- **Repo:** https://github.com/1EyeBiney/yay
- **Current version:** v3.10.0 (version strings live in the header comments of `core.js`,
  `audio.js`, and the inline script of `index.html`, plus the two spoken welcome strings in
  `index.html` — keep them in sync when bumping)

## The Prime Directives (do not violate)

These come from `gemini.md` (the full master directive — read it before big changes):

1. **Zero standard inputs.** Never use `<input>` fields of any kind. No forms mode.
2. **Single focus trap.** Everything lives in `<div id="game-container" tabindex="0"
   role="application">`. Focus is forced back on blur. No tabindex elsewhere, no moving
   the DOM's active element around — JS tracks a *virtual* cursor (`state.currentCategory`).
3. **Every action produces audio** — an announcement via `window.announce()` (writes to the
   `#aria-announce` assertive live region) and/or a sound via `window.playGameSound()`.
4. **State is the single source of truth.** `window.YAHTZEE_STATE` drives everything; never
   read the DOM to determine game state. UI is a pure render of state (`renderScorecard()`).
5. **No mouse events, no `alert()`/`prompt()`/native dialogs.** Keyboard only; confirmations
   are handled by switching `state.inputMode`.
6. **`e.preventDefault()` on handled keys** so screen readers don't hijack them — but `F5`
   is deliberately released for page refresh.
7. **Timing is accessibility.** Bot MP3 audio must never talk over `aria-live` TTS. Pacing
   delays (`botDelay`, `baseDelay`, `speechRate`) have been hand-tuned over many
   playtests — change them only deliberately and note it in the changelog.

## Files

| File | Role |
|---|---|
| `index.html` | Page shell, CSS, `announce()`, `initGame()`, `renderScorecard()`, and the global keydown listener with all input-mode handling (~line 289 on) |
| `core.js` | Game logic: `NAME_LIBRARY`, `getDefaultCategories()`, `calculateScore()`, `saveState()`, `checkGameOver()`, `getTurnAnnouncement()`, `rollDice()`, and the big AI engine `handleAITurn()` |
| `audio.js` | `AUDIO_COUNTS` (grab-bag clip limits), `getGrabBagAudio()` (Fisher-Yates shuffle-bag, non-repeating), Web Audio synth helpers, `playGameSound()`, `playBotAudio()` (MP3 with TTS fallback + callback chaining) |
| `audio/` | ~515 MP3s. Naming: `{action}_{n}{botAbbr}.mp3` (e.g. `behind_2jd.mp3`). Bot abbrs: jd, cs, lg, ff, pf, jb, ac, cb, jv. Only `audio/*.mp3` is exempt from the global `*.mp3` gitignore |
| `gemini.md` | Master architectural directive + historical dev logs (append-style; other AI tools have used it) |
| `codex.md` | Prose architecture overview (somewhat stale — predates digital dice / AI engine) |
| `.changelog.MD` | Version history, newest first, keep-a-changelog style (`## [x.y.z] - date` with Added/Changed/Fixed). **Add an entry here for every change.** |
| `.brain.txt`, `.temp.MD`, `.tuning table.xlsx`, `.audio_bank_1.2.xlsx`, `.soundtester v2.0.html` | Owner's working notes / audio lab — reference only, don't edit |

## State & input model (quick reference)

- `state.players[]` — up to 6 players, each `{id, name, abbr, isBot, categories}`; active
  board is `state.players[state.currentPlayerIndex].categories`.
- Category keys: `'1'`–`'6'` upper, `'T','F','H','S','L','Y','C','B'` lower. `'Y'` displays
  as "YAY!" (trademark-safe rebrand) but the key stays `'Y'` for localStorage back-compat.
  `value: null` = empty, `0` = scratched.
- `state.inputMode` values: `setup`, `setup_choice`, `setup_bot_choice`, `setup_dice_choice`,
  `nav`, `score` (manual dialing), `placement` (digital auto-score preview), `confirm_reset`,
  and game-over lockdown behavior when `state.gameOver` is true.
- `state.gameMode`: `'digital'` (app rolls dice, auto-scores) or `'manual'` (physical dice,
  dial scores in).
- Key bindings (nav mode): arrows navigate (Left/Right = players, announcing "Player X"
  first), 1–6/T/F/H/S/L/Y/C/B jump to categories, Enter = score/place, Space = roll,
  Z/X/C/V/B = hold dice 1–5, U = undo last commit, R = grand total, E = recent games,
  0 = leaderboard, Q = reset (Y/N confirm), P = speech rate, ? = help.
- Dev shortcuts (Ctrl+Shift+…): 1 = max upper, 2 = max lower, 3 = end-game simulator,
  9 = wipe localStorage + reload, 0 = inject fake 500 high score.
- **Help overlay** (`?`): handled at the very top of the keydown listener, before any mode
  dispatch, via a separate `state.helpOpen` flag — deliberately *not* an `inputMode`, because
  bot turns mutate `inputMode` from async `setTimeout` chains and would clobber it. Content
  lives in `window.HELP_SECTIONS`, flattened by `buildHelpEntries()` into `HELP_ENTRIES`
  (headings are stops in the arrow flow). Each section's `modes` array drives which section
  the cursor lands on when help opens. **When you add or change a keybinding, update
  `HELP_SECTIONS`** — it is the single source of truth for the shortcut list.
- Persistence: full `YAHTZEE_STATE` (including shuffle-bag state) auto-saved to
  localStorage on every commit/reset; hydrated on load with legacy-save handling.

## Workflow conventions

- **Versioning:** semantic-ish `x.y.z`. Bump the header comments in every file you touch
  (and the two spoken version strings in `index.html` if user-facing). Commit messages
  historically look like `v3.10.0 <short description>`.
- **Changelog:** every change gets a `.changelog.MD` entry (newest at top).
- **Deployment:** push to `main` → GitHub Pages redeploys automatically. Owner may ask
  Claude to handle git/GitHub tasks; `gh` CLI is authenticated as `1EyeBiney`.
- **Testing:** open `index.html` locally (or the live URL). Remember the audio context
  needs the Start button gesture. Screen-reader semantics matter more than visuals —
  verify announcements and heading/live-region behavior, not just appearance.
- The owner is a screen reader user: keep replies and any UI text screen-reader friendly
  (clear prose, no ASCII art, no info conveyed by layout alone).
