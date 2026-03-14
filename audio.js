/* audio.js - v3.0.0 */

        // The master limits for the Grab Bag based on the CSV
        window.AUDIO_COUNTS = {
            'intro': 3, 'start': 3, 'roll': 3, 'think': 8, 'hold': 3, 'standard': 6,
            'excellent': 3, 'botscratch': 3, 'botyahtzee': 2, 'botbonus': 3, 'dice': 6,
            'grief': 4, 'humanyahtzee': 2, 'humanscratch': 3, 'botlead': 3,
            'behind': 3, 'passed': 3, 'passes': 3, 'wins': 3, 'loses': 4
            , 'jd_roll': 3, 'jd_think': 8, 'jd_score': 8, 'jd_wins': 5, 'jd_loses': 5, 'jd_ad': 5
            , 'cs_roll': 3, 'cs_think': 8, 'cs_score': 8, 'cs_wins': 5, 'cs_loses': 5
            , 'lg_roll': 3, 'lg_think': 8, 'lg_score': 8, 'lg_wins': 5, 'lg_loses': 5
            , 'ff_roll': 3, 'ff_think': 8, 'ff_score': 8, 'ff_wins': 5, 'ff_loses': 5
        };
   
        // The Shuffle Bag logic
        window.getGrabBagAudio = function(botAbbr, actionType) {
            const state = window.YAHTZEE_STATE;
            if (!state.audioBags) state.audioBags = {};
            const bagKey = `${botAbbr}_${actionType}`;
   
            // Refill bag if empty or doesn't exist
            if (!state.audioBags[bagKey] || state.audioBags[bagKey].length === 0) {
                const maxCount = window.AUDIO_COUNTS[bagKey] || window.AUDIO_COUNTS[actionType] || 3;
                let newBag = [];
                for (let i = 1; i <= maxCount; i++) newBag.push(i);
   
                // Fisher-Yates Shuffle
                for (let i = newBag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
                }
                state.audioBags[bagKey] = newBag;
            }
   
            // Pull from bag
            const selectedNum = state.audioBags[bagKey].pop();
            if (window.saveState) window.saveState(); // Persist the bag state
            return `audio/${actionType}_${selectedNum}${botAbbr}.mp3`;
        };
        window.audioCtx = null;
        function initAudio() { 
            if(!window.audioCtx) { window.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } 
            if(window.audioCtx.state === 'suspended') window.audioCtx.resume(); 
        }

        function playTone(type, f1, f2, dur, vol) {
            initAudio(); const osc = window.audioCtx.createOscillator(); const gain = window.audioCtx.createGain();
            osc.type = type; const now = window.audioCtx.currentTime;
            osc.frequency.setValueAtTime(f1, now);
            if (f2) { try { osc.frequency.exponentialRampToValueAtTime(f2, now + dur); } catch(e) { osc.frequency.setValueAtTime(f2, now+dur); } }
            gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
            osc.connect(gain); gain.connect(window.audioCtx.destination);
            osc.start(now); osc.stop(now + dur);
        }

        function playEcho(type, f1, f2, dur, vol, del) {
            initAudio(); const osc = window.audioCtx.createOscillator(); const gain = window.audioCtx.createGain();
            const delay = window.audioCtx.createDelay(); const feedback = window.audioCtx.createGain();
            osc.type = type; const now = window.audioCtx.currentTime;
            osc.frequency.setValueAtTime(f1, now);
            if (f2) { try { osc.frequency.exponentialRampToValueAtTime(f2, now + dur); } catch(e) { osc.frequency.setValueAtTime(f2, now+dur); } }
            gain.gain.setValueAtTime(vol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
            delay.delayTime.value = del; feedback.gain.value = 0.4;
            osc.connect(gain); gain.connect(window.audioCtx.destination);
            gain.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(window.audioCtx.destination);
            osc.start(now); osc.stop(now + dur);
        }

        function playSequence(types, freqs, dur, vol) {
            initAudio(); freqs.forEach((f, i) => { setTimeout(() => playTone(types[i]||'sine', f, null, dur, vol), i * (dur * 1000)); });
        }

        function playChord(freqs, duration, vol) {
            initAudio(); freqs.forEach(f => playTone('sine', f, null, duration, vol / freqs.length));
        }

        function playArpeggio(freqs, dur, vol, type) {
            initAudio(); freqs.forEach((f, i) => { setTimeout(() => playTone(type || 'sine', f, null, dur, vol), i * (dur * 1000)); });
        }

        window.playGameSound = function(action) {
            switch(action) {
                case 'startup': playSequence(['sine','sine','sine','sine'], [800,1000,1200,1600], 0.04, 0.18); break;
                case 'nav': playTone('sine', 880, 440, 0.05, 0.4); break;
                case 'select': playSequence(['sine','sine'], [660, 880], 0.08, 0.4); break;
                case 'save': playChord([523.25, 659.25, 783.99, 1046.50], 0.3, 0.5); break;
                case 'undo': playSequence(['sine','sine','sine'], [1046.50, 783.99, 523.25], 0.1, 0.4); break;
                case 'cancel': playTone('sine', 440, 220, 0.1, 0.4); break;
                case 'limit': playTone('sine', 220, 110, 0.1, 0.5); break;
                case 'roll': 
                    const path = window.getGrabBagAudio('', 'dice');
                    new Audio(path).play().catch(e => console.warn(e));
                    break;
                case 'hold': playTone('sine', 400, 700, 0.1, 0.2); break;
                case 'release': playTone('sine', 700, 400, 0.1, 0.2); break;
                case 'valueTick': playSequence(['sine','sine','sine'], [100, 200, 300], 0.05, 0.3); break;
                case 'gameStart': playEcho('sine', 600, 800, 0.2, 0.3, 0.2); break;
                case 'victory': playArpeggio([523, 659, 784, 1047], 0.12, 0.2, 'sine'); setTimeout(() => { playChord([262, 330, 392, 523], 1.5, 0.3); }, 600); setTimeout(() => { playChord([523, 659, 784, 1047], 2.0, 0.3); }, 2200); break;
            }
        };

        window.BOT_AUDIO = {
            'bot_intro': 'audio/bot_intro.mp3',
            'bot_think': 'audio/bot_think.mp3',
            'bot_score': 'audio/bot_score.mp3'
        };

        window.activeBotAudio = null;
        window.botAudioCallback = null;

        window.playBotAudio = function(key, fallbackText, callback) {
            let path = window.BOT_AUDIO[key] || (key.endsWith('.mp3') ? key : null);

            const executeFallback = () => {
                if (fallbackText) window.announce(fallbackText);
                const state = window.YAHTZEE_STATE;
                const delay = state.speechRate === 'fast' ? 3000 : (state.speechRate === 'medium' ? 4500 : 6000);
                setTimeout(() => { if (callback) callback(); }, delay);
            };

            if (!path || window.YAHTZEE_STATE.aiVoiceMuted) {
                executeFallback();
                return;
            }

            if (window.activeBotAudio) {
                window.activeBotAudio.pause();
                window.activeBotAudio.currentTime = 0;
            }

            const audio = new Audio(path);
            audio.volume = 1.0;
            window.activeBotAudio = audio;
            window.botAudioCallback = callback;

            audio.onended = () => {
                window.activeBotAudio = null;
                if (window.botAudioCallback) {
                    const cb = window.botAudioCallback;
                    window.botAudioCallback = null;
                    cb();
                }
            };

            audio.play().catch(e => {
                console.warn("Audio Play Error:", e);
                window.activeBotAudio = null;
                executeFallback();
            });
        };
