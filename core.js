/* core.js - v3.8.0 */
        const NAME_LIBRARY = ["Aces Adventurer", "Bouncing Bones", "Bumbling Bonus", "Chance Master", "Daring Dicer", "Dice Dynamo", "Fumble Finger", "Gambit Goblin", "Giggling Gambler", "Jolly Jiggler", "Pocket Pirate", "Roly Poly Roller", "Silly Shaker", "Straight Shooter", "Triple Threat", "Tumbling Titan", "Turbo Tumbler", "Victory Viper", "Wild Winner", "Yahtzee Yahoo"];

        window.BOT_LIBRARY = [
            { name: "Amelia Circuit [AI]", abbr: "ac" },
            { name: "Jerry Vox [AI]", abbr: "jv" },
            { name: "Junie Byte [AI]", abbr: "jb" },
            { name: "Pearlie Fae [AI]", abbr: "pf" },
            { name: "Curtis Blanchard [AI]", abbr: "cb" },
            { name: "Johnny Dynamite [AI]", abbr: "jd" },
            { name: "Countess Spatula [AI]", abbr: "cs" },
            { name: "Lady Gwendolyn [AI]", abbr: "lg" },
            { name: "Freddy Fingers [AI]", abbr: "ff" }
        ];

        function getDefaultCategories() {
            return {
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
                Y: { name: "YAY!", value: null, description: "5 of a kind (50 pts)", fixed: [0, 50] },
                C: { name: "Chance", value: null, max: 30, step: 1 },
                B: { name: "Yahtzee Bonus", value: 0, max: 300, step: 100, locked: true } 
            };
        }

        window.YAHTZEE_STATE = {
          players: [],
          setupIndex: 0,
          nameIndex: 0,
          botIndex: 0,
          currentPlayerIndex: 0,
          currentCategory: '1', // Tracks current cursor position
          inputMode: 'setup',   // 'setup', 'nav', 'score', or 'confirm_reset'
          gameMode: 'manual',
          gameOver: false,
          tempScore: 0,         // Tracks the number being dialed in 'score' mode
          lastMove: null,
          history: [],          // Array of last 5 game objects
          topScores: [],        // Array of top 10 highest game objects (sorted descending)
          dice: [1, 1, 1, 1, 1],
          heldDice: [false, false, false, false, false],
          rollsLeft: 3,
          speechRate: 'fast',
          aiVoiceMuted: false,
          audioBags: {}
        };

        window.calculateScore = function(dice, categoryKey) {
            const sum = dice.reduce((a, b) => a + b, 0);
            const counts = {};
            dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
            const countValues = Object.values(counts);
            const hasCount = (n) => countValues.some(c => c >= n);

            switch (categoryKey) {
                case '1': return (counts[1] || 0) * 1;
                case '2': return (counts[2] || 0) * 2;
                case '3': return (counts[3] || 0) * 3;
                case '4': return (counts[4] || 0) * 4;
                case '5': return (counts[5] || 0) * 5;
                case '6': return (counts[6] || 0) * 6;
                case 'T': return hasCount(3) ? sum : 0;
                case 'F': return hasCount(4) ? sum : 0;
                case 'H': return (countValues.includes(3) && countValues.includes(2)) || hasCount(5) ? 25 : 0;
                case 'S':
                    const uniqueStr = [...new Set(dice)].sort((a,b)=>a-b).join('');
                    return (uniqueStr.includes('1234') || uniqueStr.includes('2345') || uniqueStr.includes('3456')) ? 30 : 0;
                case 'L':
                    const sortedStr = [...new Set(dice)].sort((a,b)=>a-b).join('');
                    return (sortedStr === '12345' || sortedStr === '23456') ? 40 : 0;
                case 'Y': return hasCount(5) ? 50 : 0;
                case 'C': return sum;
                case 'B': 
                    const currentB = window.YAHTZEE_STATE.players[window.YAHTZEE_STATE.currentPlayerIndex].categories['B'].value || 0;
                    return hasCount(5) ? currentB + 100 : currentB;
                default: return 0;
            }
        };

        window.saveState = function() {
            localStorage.setItem('YAHTZEE_DATA', JSON.stringify(window.YAHTZEE_STATE));
        };







        window.checkGameOver = function() {
            const state = window.YAHTZEE_STATE;
            const baseKeys = ['1', '2', '3', '4', '5', '6', 'T', 'F', 'H', 'S', 'L', 'Y', 'C'];
            const isOver = state.players.every(p => baseKeys.every(k => p.categories[k].value !== null));

            if (isOver) {
                state.gameOver = true;
                const dateStr = new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'}) + ', ' + new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
                let highestScore = -1;
                let winnerName = "";
                let results = [];

                state.players.forEach(p => {
                    const pCats = p.categories;
                    const upperSub = ['1', '2', '3', '4', '5', '6'].reduce((sum, k) => sum + (pCats[k].value || 0), 0);
                    const bonus = upperSub >= 63 ? 35 : 0;
                    const lowerTotal = ['T', 'F', 'H', 'S', 'L', 'Y', 'C', 'B'].reduce((sum, k) => sum + (pCats[k].value || 0), 0);
                    const grandTotal = upperSub + bonus + lowerTotal;

                    if (grandTotal > highestScore) { highestScore = grandTotal; winnerName = p.name; }

                    const gameRecord = { name: p.name, score: grandTotal, date: dateStr };
                    state.history.unshift(gameRecord);
                    state.topScores.push(gameRecord);
                    results.push(`${p.name} scored ${grandTotal}`);
                });

                if (state.history.length > 5) state.history.length = 5;
                state.topScores.sort((a, b) => b.score - a.score);
                if (state.topScores.length > 10) state.topScores.length = 10;

                window.playGameSound('victory');
                state.inputMode = 'nav';
                window.saveState();
                window.renderScorecard();

                const resultStr = results.join('. ');
                window.announce(`Game Over! ${winnerName} wins with ${highestScore} points! ${resultStr}. Press Q to start a new game, or use arrow keys to review the board.`);
                return true;
            }
            return false;
        };

        window.getTurnAnnouncement = function(playerIndex) {

            const state = window.YAHTZEE_STATE;
            const p = state.players[playerIndex];
            const cats = p.categories;
            const baseKeys = ['1', '2', '3', '4', '5', '6', 'T', 'F', 'H', 'S', 'L', 'Y', 'C'];
            const filled = baseKeys.filter(k => cats[k].value !== null);
            const empty = baseKeys.filter(k => cats[k].value === null);

            const upperSub = ['1', '2', '3', '4', '5', '6'].reduce((sum, k) => sum + (cats[k].value || 0), 0);
            const bonus = upperSub >= 63 ? 35 : 0;
            const lowerTotal = ['T', 'F', 'H', 'S', 'L', 'Y', 'C', 'B'].reduce((sum, k) => sum + (cats[k].value || 0), 0);
            const grandTotal = upperSub + bonus + lowerTotal;

            let listStr = "";
            if (filled.length === 0) {
                listStr = "Board is empty";
            } else if (filled.length < empty.length) {
                listStr = filled.map(k => cats[k].name + " filled").join(', ');
            } else {
                listStr = empty.map(k => cats[k].name + " empty").join(', ');
            }

            const actionPrompt = state.gameMode === 'digital' ? "Press D to roll dice." : "Press Enter to set score.";

            return ` ${p.name}, score ${grandTotal}. ${listStr}. ${actionPrompt}`;

        };

        window.rollDice = function() {
            const state = window.YAHTZEE_STATE;

            if (state.rollsLeft > 0) {

                state.dice = state.dice.map((d, i) => state.heldDice[i] ? d : Math.ceil(Math.random() * 6));
                state.rollsLeft--;
                window.playGameSound('roll');

                if (state.rollsLeft === 0) {
                    // Auto-Funnel into Placement Mode
                    state.inputMode = 'placement';
                    const p = state.players[state.currentPlayerIndex];
                    const cats = p.categories;
                    const emptyKeys = ['1', '2', '3', '4', '5', '6', 'T', 'F', 'H', 'S', 'L', 'Y', 'C'];
                    if (cats['Y'].value === 50) emptyKeys.push('B');
                    const available = emptyKeys.filter(k => cats[k].value === null);

                    // Failsafe: Ensure cursor isn't stuck on a filled or total row
                    if (!available.includes(state.currentCategory)) {
                        state.currentCategory = available.length > 0 ? available[0] : '1';
                    }

                    const calcScore = window.calculateScore(state.dice, state.currentCategory);
                    window.renderScorecard();
                    window.announce(`Final roll. ${state.dice.join(', ')}. Placement mode. ${cats[state.currentCategory].name}. Potential score: ${calcScore === 0 ? 'Scratch, 0' : calcScore}.`);
                } else {
                    window.announce(`Rolled. ${state.dice.join(', ')}. ${state.rollsLeft} rolls left.`);
                    window.renderScorecard();
                }
            } else {
                window.playGameSound('limit');
                window.announce("No rolls left.");
            }
        };

        window.handleAITurn = function() {
            const state = window.YAHTZEE_STATE;
            if (state.gameOver) return;
            const p = state.players[state.currentPlayerIndex];
            if (!p.isBot) return;
            const delay = state.speechRate === 'fast' ? 3000 : (state.speechRate === 'medium' ? 4500 : 6000);

            // Phase 1: Initial Roll
            if (state.inputMode === 'nav' && state.rollsLeft === 3) {

                window.playGameSound('valueTick');
                const thinkKey = window.getGrabBagAudio(p.abbr || 'bb', 'think');
                window.playBotAudio(thinkKey, `${p.name} is thinking...`, () => {
                    window.rollDice();
                    const baseDelay = state.speechRate === 'fast' ? 2000 : (state.speechRate === 'medium' ? 3500 : 5000);
                    const randomVariance = Math.floor(Math.random() * 2000) - 1000; // +/- 1 second
                    const delay = baseDelay + randomVariance;
                    setTimeout(window.handleAITurn, delay);
                });
                return;
            }

            // Phase 2: Evaluate Holds & Re-roll (v3.0.0 Pattern Recognition)
            if (state.inputMode === 'nav' && state.rollsLeft > 0) {

                const cats = p.categories;                
                const counts = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
                state.dice.forEach(d => counts[d]++);
                const sorted = [...new Set(state.dice)].sort((a,b) => a - b);

                let holdDecision = null; // { indices: [...], label: string }

                // --- Priority A: Multiples (Yahtzee / 4-of-a-Kind / 3-of-a-Kind) ---
                const openCats = ['1', '2', '3', '4', '5', '6', 'T', 'F', 'H', 'S', 'L', 'Y', 'C'].filter(k => cats[k].value === null);

                if (openCats.length <= 3) {
                    // -- Panic Mode --
                    let panicDecision = null;

                    // Step 1: Multiples
                    if (openCats.includes('Y') || openCats.includes('F') || openCats.includes('T')) {
                        let bestFace = null;
                        let bestCount = 0;
                        for (let face = 6; face >= 1; face--) {
                            if (counts[face] > bestCount) {
                                bestCount = counts[face];
                                bestFace = face;
                            }
                        }
                        if (bestFace) {
                            panicDecision = {
                                indices: state.dice.map((d, i) => d === bestFace ? i : -1).filter(i => i !== -1),
                                label: `Desperate ${bestCount} ${bestFace}s`
                            };
                        }
                    }

                    // Step 2: Straights
                    if (!panicDecision && (openCats.includes('L') || openCats.includes('S'))) {
                        const sortedSet = [...new Set(state.dice)].sort((a,b) => a - b);
                        let bestRun = [];
                        let curRun = [sortedSet[0]];
                        for (let i = 1; i < sortedSet.length; i++) {
                            if (sortedSet[i] === sortedSet[i-1] + 1) {
                                curRun.push(sortedSet[i]);
                            } else {
                                if (curRun.length > bestRun.length) bestRun = curRun;
                                curRun = [sortedSet[i]];
                            }
                        }
                        if (curRun.length > bestRun.length) bestRun = curRun;

                        if (bestRun.length >= 3) {
                            const runSet = new Set(bestRun);
                            panicDecision = {
                                indices: [],
                                label: `Desperate run of ${bestRun.length}`
                            };
                            const held = new Set();
                            state.dice.forEach((d, i) => {
                                if (runSet.has(d) && !held.has(d)) {
                                    panicDecision.indices.push(i);
                                    held.add(d);
                                }
                            });
                        }
                    }

                    // Step 3: Full House
                    if (!panicDecision && openCats.includes('H')) {
                        let pairFace = null, tripFace = null;
                        const pairs = [];
                        for (let face = 6; face >= 1; face--) {
                            if (counts[face] >= 3 && !tripFace) tripFace = face;
                            else if (counts[face] >= 2) pairs.push(face);
                        }
                        if (tripFace || pairs.length > 0) {
                            let holdFaces = [];
                            if (tripFace) holdFaces.push(tripFace);
                            if (pairs.length > 0) holdFaces.push(pairs[0]);

                            panicDecision = {
                                indices: state.dice.map((d, i) => holdFaces.includes(d) ? i : -1).filter(i => i !== -1),
                                label: `Desperate hold`
                            };
                        }
                    }

                    // Step 4: Upper
                    if (!panicDecision) {
                        let target = null;
                        for (let i = 6; i >= 1; i--) {
                            if (openCats.includes(i.toString()) && counts[i] > 0) {
                                target = i;
                                break;
                            }
                        }
                        if (target) {
                            panicDecision = {
                                indices: state.dice.map((d, i) => d === target ? i : -1).filter(i => i !== -1),
                                label: `Desperate ${target}s`
                            };
                        }
                    }

                    holdDecision = panicDecision;

                } else {

                    // Dynamic Risk Thresholds (Mid-Turn Pivoting)
                    // On final roll (rollsLeft === 1), hold ANY pair instead of just 4s, 5s, 6s.
                    const minPairFace = state.rollsLeft === 1 ? 1 : 4; 
                    // On final roll, abandon 3-dice straights and only chase if we have 4.
                    const minRunLength = state.rollsLeft === 1 ? 4 : 3; 

                    for (let face = 6; face >= 1; face--) {
                        if (counts[face] >= 3 || (counts[face] === 2 && face >= minPairFace && cats[face.toString()].value === null)) {
                            const yahtzeeOpen = cats['Y'].value === null;
                            const fourOpen = cats['F'].value === null;
                            const threeOpen = cats['T'].value === null;
                            const upperOpen = cats[face.toString()].value === null;
                            if (yahtzeeOpen || fourOpen || threeOpen || upperOpen) {
                                holdDecision = {
                                    indices: state.dice.map((d, i) => d === face ? i : -1).filter(i => i !== -1),
                                    label: `${counts[face]} ${face}s`
                                };
                                break;
                            }
                        }
                    }

                    // --- Priority B: Straights ---
                    if (!holdDecision) {
                        const largeOpen = cats['L'].value === null;
                        const smallOpen = cats['S'].value === null;
                        if (largeOpen || smallOpen) {
                            // Find longest sequential run in sorted unique values
                            let bestRun = [sorted[0]];
                            let curRun = [sorted[0]];
                            for (let i = 1; i < sorted.length; i++) {
                                if (sorted[i] === sorted[i-1] + 1) {
                                    curRun.push(sorted[i]);
                                } else {
                                    if (curRun.length > bestRun.length) bestRun = curRun;
                                    curRun = [sorted[i]];
                                }
                            }
                            if (curRun.length > bestRun.length) bestRun = curRun;

                            if (bestRun.length >= minRunLength) {
                                const runSet = new Set(bestRun);
                                holdDecision = {
                                    indices: [],
                                    label: `a run of ${bestRun.length}`
                                };
                                // Hold one die per face in the run
                                const held = new Set();
                                state.dice.forEach((d, i) => {
                                    if (runSet.has(d) && !held.has(d)) {
                                        holdDecision.indices.push(i);
                                        held.add(d);
                                    }
                                });
                            }
                        }
                    }

                    // --- Priority C: Full House ---
                    if (!holdDecision) {
                        let pairFace = null, tripFace = null;
                        const pairs = [];
                        for (let face = 6; face >= 1; face--) {
                            if (counts[face] >= 3 && !tripFace) tripFace = face;
                            else if (counts[face] >= 2) pairs.push(face);
                        }
                        if (tripFace && pairs.length > 0) {
                            pairFace = pairs[0];
                            holdDecision = {
                                indices: state.dice.map((d, i) => (d === tripFace || d === pairFace) ? i : -1).filter(i => i !== -1),
                                label: `full house ${tripFace}s and ${pairFace}s`
                            };
                        } else if (pairs.length >= 2) {
                            const keep = new Set(pairs.slice(0, 2));
                            holdDecision = {
                                indices: state.dice.map((d, i) => keep.has(d) ? i : -1).filter(i => i !== -1),
                                label: `two pair ${pairs[0]}s and ${pairs[1]}s`
                            };
                        }
                    }

                    // --- Priority D (Fallback): Highest open upper section ---
                    if (!holdDecision) {
                        let target = null;
                        for (let i = 6; i >= 1; i--) {
                            if (cats[i.toString()].value === null && counts[i] > 0) {
                                target = i;
                                break;
                            }
                        }
                        if (target) {
                            holdDecision = {
                                indices: state.dice.map((d, i) => d === target ? i : -1).filter(i => i !== -1),
                                label: `${target}s`
                            };
                        }
                    }
                }

                // Apply hold decision
                if (holdDecision) {
                    state.heldDice = [false, false, false, false, false];
                    holdDecision.indices.forEach(i => { state.heldDice[i] = true; });
                    window.renderScorecard();
                    window.playGameSound('hold');
                    window.announce(`${p.name} holds ${holdDecision.label}. Rolling...`);
                } else {
                    state.heldDice = [false, false, false, false, false];
                    window.announce(`${p.name} holds nothing. Rolling...`);
                }

                setTimeout(() => {
                    window.rollDice();
                    setTimeout(window.handleAITurn, delay);
                }, delay);
                return;
            }

            // Phase 3: Placement Selection
            if (state.inputMode === 'placement') {

                const cats = p.categories;
                const emptyKeys = ['1', '2', '3', '4', '5', '6', 'T', 'F', 'H', 'S', 'L', 'Y', 'C'];
                if (cats['Y'].value === 50) emptyKeys.push('B');
                const available = emptyKeys.filter(k => cats[k].value === null || k === 'B');

                let bestCat = available[0];
                let bestWeightedScore = -1;
                const abbr = p.abbr || 'bb';
                const currentUpper = ['1', '2', '3', '4', '5', '6'].reduce((sum, key) => sum + (cats[key].value || 0), 0);

                const getScore = (player) => {
                    const u = ['1','2','3','4','5','6'].reduce((s, k) => s + (player.categories[k].value || 0), 0);
                    const b = u >= 63 ? 35 : 0;
                    const l = ['T','F','H','S','L','Y','C','B'].reduce((s, k) => s + (player.categories[k].value || 0), 0);
                    return u + b + l;
                };
                const myScore = getScore(p);
                const humans = state.players.filter(pl => !pl.isBot);
                const bestHumanScore = humans.length > 0 ? Math.max(...humans.map(getScore)) : 0;
                const differential = myScore - bestHumanScore;

                let humanChoked = false;
                if (humans.length > 0) {
                    // Find the human with the highest score
                    const bestHuman = humans.reduce((best, h) => getScore(h) > getScore(best) ? h : best, humans[0]);
                    const hCats = bestHuman.categories;
                    const hOpen = ['1','2','3','4','5','6','T','F','H','S','L','Y','C'].filter(k => hCats[k].value === null);
                    // If they have 3 or fewer categories, and NONE of them are "easy" safe points
                    const easyCats = ['1','2','3','4','5','6','C','T'];
                    const hasEasy = hOpen.some(k => easyCats.includes(k));
                    if (hOpen.length <= 3 && !hasEasy) {
                        humanChoked = true;
                    }
                }

                const maxBaseScore = Math.max(...available.map(k => window.calculateScore(state.dice, k)));

                const botArchetypes = {
                    'jd': 'gambler',
                    'cs': 'sniper',
                    'lg': 'aristocrat',
                    'ff': 'hustler',
                    'ac': 'grinder', 'pf': 'grinder',
                    'cb': 'dreamer', 'jv': 'dreamer',
                    'df': 'pessimist', 'op': 'pessimist'
                };
                const archetype = botArchetypes[abbr] || 'balanced';


                if (maxBaseScore === 0) {
                    const SCRATCH_PRIORITY = ['1', '2', '3', '4', 'F', 'T', '5', 'S', '6', 'L', 'H', 'Y'];
                    for (const cat of SCRATCH_PRIORITY) {
                        if (available.includes(cat)) {
                            bestCat = cat;
                            break;
                        }
                    }
                } else {
                    available.forEach(k => {
                        const score = window.calculateScore(state.dice, k);
                        let weight = score;

                        // Personality Logic Multipliers                    
                        switch (archetype) {
                            case 'gambler':
                                if (['Y', 'L'].includes(k)) weight = score * 2.5;
                                if (k === 'C') weight = score * 0.5;
                                break;
                            case 'sniper':
                                if (['5', '6'].includes(k)) weight = score * 2.0;
                                if (k === 'H') weight = score * 1.5;
                                break;
                            case 'aristocrat':
                                if (['F', 'T', 'C'].includes(k)) weight = score * 1.8;
                                break;
                            case 'hustler':
                                if (['S', 'H', '4', '3'].includes(k)) weight = score * 1.8;
                                break;
                            case 'grinder':
                                if (['1', '2', '3', '4', '5', '6'].includes(k)) weight = score * 1.6;
                                break;
                            case 'dreamer':
                                if (['Y', 'L'].includes(k)) weight = score * 2.0;
                                break;
                            case 'pessimist':
                                if (score === 0 && ['Y', 'L', 'S', 'F'].includes(k)) weight = 8;
                                break;
                            case 'balanced':
                            default:
                                if (['1', '2', '3', '4', '5', '6'].includes(k)) weight = score * 1.5;
                                break;
                        }

                        // Upper Bonus Awareness
                       if (['1', '2', '3', '4', '5', '6'].includes(k)) {
                            if (currentUpper + score >= 63) {
                                weight += 50; // Secures the bonus
                            } else if (score >= parseInt(k) * 3) {
                                weight += 15; // Stays on pace (3 of a kind)
                            }
                        }

                        // Scoreboard Awareness
                        if (differential <= -40 && !humanChoked) {
                            // Losing badly: swing for the fences
                            if (k === 'Y' && score > 0) weight += 100;
                            if (k === 'L' && score > 0) weight += 50;
                        } else if (differential >= 40 || humanChoked) {
                            // Winning comfortably: play it safe
                            if (['1','2','3','4','5','6','C'].includes(k) && score > 0) weight += 20;
                        }

                        if (weight > bestWeightedScore) {
                            bestWeightedScore = weight;
                            bestCat = k;
                        }
                    });
                }

                state.currentCategory = bestCat;
                window.renderScorecard();
                
                // Calculate true score for audio context
                const trueScore = window.calculateScore(state.dice, bestCat);
                let audioPrefix = 'standard';
                if (bestCat === 'Y' && trueScore === 50) audioPrefix = 'botyahtzee';
                else if (trueScore === 0) audioPrefix = 'botscratch';
                else if (trueScore >= 25) audioPrefix = 'excellent';
                
                const scoreKey = window.getGrabBagAudio(abbr, audioPrefix);
                window.playGameSound('valueTick');
                const scoreStr = trueScore === 0 ? 'a scratch' : `${trueScore} points`;
                window.announce(`${p.name} selects ${cats[bestCat].name} for ${scoreStr}.`);
                
                const baseDelay = state.speechRate === 'fast' ? 3000 : (state.speechRate === 'medium' ? 5000 : 7000);
                const randomVariance = Math.floor(Math.random() * 2000) - 1000; // +/- 1 second
                const delay = baseDelay + randomVariance;
                setTimeout(() => {
                    window.playBotAudio(scoreKey, null, () => {
                        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                        window.dispatchEvent(enterEvent);
                    });
                }, delay);
            }
        };
