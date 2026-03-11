/* audio.js - v2.1.0 */
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
                case 'roll': [0, 300, 600, 900, 1100, 1300, 1500].forEach((t, i) => { setTimeout(() => playTone('sine', 600, null, 0.08 - i*0.008, 0.2 - i*0.025), t); }); break;
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
            let path = window.BOT_AUDIO[key];

            const executeFallback = () => {
                if (fallbackText) window.announce(fallbackText);
                const state = window.YAHTZEE_STATE;
                const delay = state.speechRate === 'fast' ? 3000 : (state.speechRate === 'medium' ? 4500 : 6000);
                setTimeout(() => { if (callback) callback(); }, delay);
            };

            if (!path) {
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
