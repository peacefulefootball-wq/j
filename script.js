// script.js - Complete Scientific Calculator (Unchanged Functionality)
(function() {
    // Audio context for sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Calculator state
    let currentInput = '0';
    let historyExpr = '';
    let lastResult = null;   // For Ans button
    let degreeMode = true;    // true = DEG, false = RAD

    const displayElement = document.getElementById('currentInput');
    const historyElement = document.getElementById('historyExpr');
    const modeIndicator = document.getElementById('modeIndicator');

    function updateDisplay() {
        displayElement.value = currentInput;
        historyElement.innerText = historyExpr;
        modeIndicator.innerText = degreeMode ? 'DEG' : 'RAD';
    }

    // Initial display
    updateDisplay();

    // Play short click sound
    function playClickSound() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                beep();
            }).catch(() => {});
        } else if (audioCtx.state === 'running') {
            beep();
        }
    }

    function beep() {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Attach event listeners to all buttons
    const buttons = document.querySelectorAll('.calc-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            playClickSound();

            const val = this.dataset.value;
            if (!val) return;

            handleButtonAction(val);
        });
    });

    // Main button action handler - Complete Mathematical Functions
    function handleButtonAction(val) {
        // Mode switch
        if (val === 'DEG/RAD') {
            degreeMode = !degreeMode;
            updateDisplay();
            return;
        }

        // Clear
        if (val === 'C') {
            currentInput = '0';
            historyExpr = '';
            updateDisplay();
            return;
        }

        // Backspace
        if (val === 'backspace') {
            if (currentInput.length > 1 && currentInput !== '0') {
                currentInput = currentInput.slice(0, -1);
            } else {
                currentInput = '0';
            }
            updateDisplay();
            return;
        }

        // Ans
        if (val === 'ans') {
            if (lastResult !== null) {
                if (currentInput === '0' || currentInput === '') {
                    currentInput = lastResult.toString();
                } else {
                    currentInput += lastResult.toString();
                }
            } else {
                currentInput = '0';
            }
            updateDisplay();
            return;
        }

        // ± (toggle sign)
        if (val === '±') {
            if (currentInput !== '0' && currentInput !== '') {
                if (currentInput.startsWith('-')) {
                    currentInput = currentInput.substring(1);
                } else {
                    currentInput = '-' + currentInput;
                }
            }
            updateDisplay();
            return;
        }

        // Constants
        if (val === 'π') {
            appendToCurrent(Math.PI.toString());
            return;
        }
        if (val === 'e') {
            appendToCurrent(Math.E.toString());
            return;
        }

        // Random number
        if (val === 'rand' || val === 'RND') {
            let res = Math.random();
            currentInput = res.toString();
            lastResult = res;
            historyExpr = 'rand()';
            updateDisplay();
            return;
        }

        // ===== Unary Functions =====
        
        // Square, Cube
        if (val === 'x^2') {
            let num = parseFloat(currentInput) || 0;
            let res = num * num;
            historyExpr = `sqr(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }
        if (val === 'x^3') {
            let num = parseFloat(currentInput) || 0;
            let res = num * num * num;
            historyExpr = `cube(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }

        // Square root, Cube root
        if (val === '√') {
            try {
                let num = parseFloat(currentInput) || 0;
                if (num < 0) throw new Error('Negative sqrt');
                let res = Math.sqrt(num);
                historyExpr = `√(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            } catch (e) { currentInput = 'Error'; }
            updateDisplay();
            return;
        }
        if (val === '∛') {
            try {
                let num = parseFloat(currentInput) || 0;
                let res = Math.cbrt(num);
                historyExpr = `∛(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            } catch (e) { currentInput = 'Error'; }
            updateDisplay();
            return;
        }

        // Reciprocal
        if (val === '1/x') {
            let num = parseFloat(currentInput) || 0;
            if (num === 0) { currentInput = 'Infinity'; } else {
                let res = 1 / num;
                historyExpr = `1/(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            }
            updateDisplay();
            return;
        }

        // Factorial
        if (val === '!') {
            let num = parseInt(currentInput);
            if (isNaN(num) || num < 0) { currentInput = 'NaN'; }
            else {
                let fact = 1;
                for (let i = 2; i <= num; i++) fact *= i;
                historyExpr = `${currentInput}!`;
                currentInput = fact.toString();
                lastResult = fact;
            }
            updateDisplay();
            return;
        }

        // Absolute value
        if (val === 'abs') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.abs(num);
            historyExpr = `|${currentInput}|`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }

        // Rounding functions
        if (val === 'round') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.round(num);
            historyExpr = `round(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }
        if (val === 'floor') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.floor(num);
            historyExpr = `floor(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }
        if (val === 'ceil') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.ceil(num);
            historyExpr = `ceil(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }

        // 10^x, e^x
        if (val === '10^x') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.pow(10, num);
            historyExpr = `10^(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }
        if (val === 'e^x') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.exp(num);
            historyExpr = `exp(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            updateDisplay();
            return;
        }

        // Logarithms
        if (val === 'log') {
            let num = parseFloat(currentInput);
            if (num <= 0) { currentInput = 'undef'; } else {
                let res = Math.log10(num);
                historyExpr = `log(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            }
            updateDisplay();
            return;
        }
        if (val === 'ln') {
            let num = parseFloat(currentInput);
            if (num <= 0) { currentInput = 'undef'; } else {
                let res = Math.log(num);
                historyExpr = `ln(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            }
            updateDisplay();
            return;
        }

        // Trigonometric functions (with degree/radian support)
        if (['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].includes(val)) {
            let num = parseFloat(currentInput);
            if (isNaN(num)) { currentInput = 'Error'; }
            else {
                // Convert to radians if in degree mode
                let rad = degreeMode ? num * Math.PI / 180 : num;
                let res;
                switch(val) {
                    case 'sin': res = Math.sin(rad); break;
                    case 'cos': res = Math.cos(rad); break;
                    case 'tan': res = Math.tan(rad); break;
                    case 'csc': res = 1 / Math.sin(rad); break;
                    case 'sec': res = 1 / Math.cos(rad); break;
                    case 'cot': res = 1 / Math.tan(rad); break;
                }
                // Handle potential infinite results
                if (!isFinite(res)) res = 'Infinity';
                historyExpr = `${val}(${currentInput}${degreeMode?'°':''})`;
                currentInput = res.toString();
                lastResult = res;
            }
            updateDisplay();
            return;
        }

        // Hyperbolic functions
        if (['sinh', 'cosh', 'tanh'].includes(val)) {
            let num = parseFloat(currentInput);
            if (isNaN(num)) { currentInput = 'Error'; }
            else {
                let res;
                switch(val) {
                    case 'sinh': res = Math.sinh(num); break;
                    case 'cosh': res = Math.cosh(num); break;
                    case 'tanh': res = Math.tanh(num); break;
                }
                historyExpr = `${val}(${currentInput})`;
                currentInput = res.toString();
                lastResult = res;
            }
            updateDisplay();
            return;
        }

        // ===== Binary Operators =====
        if (val === '^') {
            historyExpr += currentInput + ' ^ ';
            currentInput = '0';
            updateDisplay();
            return;
        }
        if (val === 'mod') {
            historyExpr += currentInput + ' mod ';
            currentInput = '0';
            updateDisplay();
            return;
        }

        // Basic operators and parentheses
        if (['+', '-', '*', '/', '(', ')'].includes(val)) {
            if (val === '(' || val === ')') {
                if (currentInput === '0' && val === '(') {
                    currentInput = val;
                } else {
                    currentInput = currentInput === '0' ? val : currentInput + val;
                }
                updateDisplay();
            } else {
                // operator
                historyExpr += currentInput + ' ' + val + ' ';
                currentInput = '0';
                updateDisplay();
            }
            return;
        }

        // Equals - Evaluate the full expression
        if (val === '=') {
            let fullExpr = historyExpr + currentInput;
            try {
                // Replace symbols for evaluation
                let sanitized = fullExpr
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/−/g, '-')
                    .replace(/\^/g, '**')
                    .replace(/mod/g, '%');
                
                // Use Function for safer evaluation
                let result = new Function('return ' + sanitized)();
                if (isNaN(result) || !isFinite(result)) throw new Error('Math error');
                
                historyExpr = fullExpr + ' =';
                currentInput = result.toString();
                lastResult = result;
            } catch (err) {
                currentInput = 'Error';
            }
            updateDisplay();
            return;
        }

        // Numbers and decimal
        if (!isNaN(val) || val === '.' || val === '00') {
            appendToCurrent(val);
            return;
        }
    }

    function appendToCurrent(ch) {
        if (ch === '00') {
            if (currentInput === '0') currentInput = '0';
            else currentInput += '00';
        } else if (ch === '.') {
            if (!currentInput.includes('.')) currentInput += '.';
        } else {
            if (currentInput === '0') currentInput = ch;
            else currentInput += ch;
        }
        updateDisplay();
    }

    // Resume audio context on first user interaction
    function resumeAudio() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
    document.body.addEventListener('touchstart', resumeAudio, { once: true });
    document.body.addEventListener('mousedown', resumeAudio, { once: true });
})();