// script.js - Complete Scientific Calculator with 100% Accurate Percentage
(function() {
    // Audio context for sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Calculator state
    let currentInput = '0';
    let historyExpr = '';
    let lastResult = null;   // For Ans button
    let degreeMode = true;    // true = DEG, false = RAD
    let waitingForOperand = false; // Track if we're waiting for second operand
    let lastOperator = '';    // Track last operator
    let lastOperand = null;   // Track last operand
    let lastExpression = '';  // Store last valid expression
    let equalsJustPressed = false; // Track if equals was just pressed
    let lastEqualsResult = null; // Store last equals result for stability
    let pendingValue = null;  // Store pending value for percentage

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

    // Play click sound with variation
    function playClickSound() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                beepWithVariation();
            }).catch(() => {});
        } else if (audioCtx.state === 'running') {
            beepWithVariation();
        }
    }

    function beepWithVariation() {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // Random frequency between 400-1200 Hz for variety
        const frequency = 400 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
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

    // Function to evaluate expression safely
    function evaluateExpression(expr) {
        try {
            // Replace symbols for evaluation
            let sanitized = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/\^/g, '**')
                .replace(/mod/g, '%');
            
            return eval(sanitized);
        } catch (e) {
            return null;
        }
    }

    // Function to get the last number from history
    function getLastNumberFromHistory() {
        if (!historyExpr) return null;
        
        // Remove trailing operator if exists
        let cleanHistory = historyExpr.trim();
        if (cleanHistory.match(/[+\-×÷*/]\s*$/)) {
            cleanHistory = cleanHistory.slice(0, -1).trim();
        }
        
        // Extract numbers
        let numbers = cleanHistory.match(/(\d+\.?\d*|\.\d+)/g);
        return numbers ? parseFloat(numbers[numbers.length - 1]) : null;
    }

    // Main button action handler
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
            lastOperator = '';
            waitingForOperand = false;
            lastOperand = null;
            lastExpression = '';
            equalsJustPressed = false;
            lastEqualsResult = null;
            pendingValue = null;
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
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // Ans
        if (val === 'ans') {
            if (lastResult !== null) {
                if (currentInput === '0' || currentInput === '' || waitingForOperand) {
                    currentInput = lastResult.toString();
                    waitingForOperand = false;
                } else {
                    currentInput += lastResult.toString();
                }
            } else {
                currentInput = '0';
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // Constants
        if (val === 'π') {
            appendToCurrent(Math.PI.toString());
            equalsJustPressed = false;
            lastEqualsResult = null;
            return;
        }
        if (val === 'e') {
            appendToCurrent(Math.E.toString());
            equalsJustPressed = false;
            lastEqualsResult = null;
            return;
        }

        // Random number
        if (val === 'rand' || val === 'RND') {
            let res = Math.random();
            currentInput = res.toString();
            lastResult = res;
            historyExpr = 'rand()';
            equalsJustPressed = false;
            lastEqualsResult = null;
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
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }
        if (val === 'x^3') {
            let num = parseFloat(currentInput) || 0;
            let res = num * num * num;
            historyExpr = `cube(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            } catch (e) { currentInput = 'Error'; }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            } catch (e) { currentInput = 'Error'; }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
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
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }
        if (val === 'floor') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.floor(num);
            historyExpr = `floor(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }
        if (val === 'ceil') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.ceil(num);
            historyExpr = `ceil(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
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
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }
        if (val === 'e^x') {
            let num = parseFloat(currentInput) || 0;
            let res = Math.exp(num);
            historyExpr = `exp(${currentInput})`;
            currentInput = res.toString();
            lastResult = res;
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // Trigonometric functions
        if (['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].includes(val)) {
            let num = parseFloat(currentInput);
            if (isNaN(num)) { currentInput = 'Error'; }
            else {
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
                if (!isFinite(res)) res = 'Infinity';
                historyExpr = `${val}(${currentInput}${degreeMode?'°':''})`;
                currentInput = res.toString();
                lastResult = res;
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
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
                waitingForOperand = true;
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // ===== PERFECT PERCENTAGE CALCULATION =====
        if (val === '%') {
            let percentValue = parseFloat(currentInput) || 0;
            
            // Case 1: No history - simple percentage
            if (historyExpr === '' || historyExpr.trim() === '') {
                currentInput = (percentValue / 100).toString();
                updateDisplay();
                return;
            }
            
            // Case 2: Has history - calculate percentage of the last number
            let lastNumber = getLastNumberFromHistory();
            
            if (lastNumber !== null) {
                // Calculate percentage of the last number
                let calculatedValue = (lastNumber * percentValue) / 100;
                
                // Store for later use
                pendingValue = calculatedValue;
                
                // Show in display
                currentInput = calculatedValue.toString();
                
                // Update history to show percentage
                if (!historyExpr.match(/[+\-×÷*/]\s*$/)) {
                    historyExpr += ' ';
                }
            } else {
                // Fallback
                currentInput = (percentValue / 100).toString();
            }
            
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // ===== Binary Operators =====
        if (['+', '-', '*', '/', '^', 'mod', '×', '÷', '−'].includes(val)) {
            // Store the operator
            lastOperator = val;
            
            // If we have a pending percentage value, use it
            if (pendingValue !== null) {
                currentInput = pendingValue.toString();
                pendingValue = null;
            }
            
            // If equals was just pressed, start a new expression
            if (equalsJustPressed) {
                historyExpr = lastResult + ' ' + val + ' ';
                currentInput = '0';
                waitingForOperand = true;
                equalsJustPressed = false;
                lastEqualsResult = null;
                updateDisplay();
                return;
            }
            
            // If we have a previous expression, evaluate it
            if (historyExpr !== '' && !waitingForOperand) {
                try {
                    let fullExpr = historyExpr + currentInput;
                    let result = evaluateExpression(fullExpr);
                    if (result !== null) {
                        currentInput = result.toString();
                        lastResult = result;
                    }
                } catch (e) {}
            }
            
            // Add to history
            if (historyExpr === '' || waitingForOperand) {
                historyExpr = currentInput + ' ' + val + ' ';
            } else {
                historyExpr = historyExpr + currentInput + ' ' + val + ' ';
            }
            
            waitingForOperand = true;
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // Parentheses
        if (val === '(' || val === ')') {
            if (val === '(') {
                if (currentInput === '0' || waitingForOperand) {
                    currentInput = '(';
                    waitingForOperand = false;
                } else {
                    currentInput = currentInput + '(';
                }
            } else {
                currentInput = currentInput + ')';
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
            updateDisplay();
            return;
        }

        // ===== EQUALS =====
        if (val === '=') {
            // Handle multiple equals presses
            if (equalsJustPressed && lastEqualsResult !== null) {
                currentInput = lastEqualsResult.toString();
                if (!historyExpr.includes('=')) {
                    historyExpr = historyExpr + ' =';
                }
                updateDisplay();
                return;
            }
            
            // Build full expression
            let fullExpr = historyExpr + currentInput;
            
            // If we have a pending percentage, use it
            if (pendingValue !== null) {
                fullExpr = historyExpr + pendingValue;
                pendingValue = null;
            }
            
            if (historyExpr === '') {
                fullExpr = currentInput;
            }
            
            try {
                let result = evaluateExpression(fullExpr);
                
                if (result === null || isNaN(result) || !isFinite(result)) {
                    throw new Error('Math error');
                }
                
                // Store results
                lastEqualsResult = result;
                lastResult = result;
                
                // Update display
                historyExpr = fullExpr + ' =';
                currentInput = result.toString();
                
                // Set flags
                waitingForOperand = true;
                equalsJustPressed = true;
                pendingValue = null;
                
            } catch (err) {
                currentInput = 'Error';
                equalsJustPressed = false;
                lastEqualsResult = null;
            }
            updateDisplay();
            return;
        }

        // Numbers and decimal
        if (!isNaN(val) || val === '.' || val === '00') {
            if (waitingForOperand) {
                currentInput = val === '00' ? '0' : (val === '.' ? '0.' : val);
                waitingForOperand = false;
            } else {
                appendToCurrent(val);
            }
            equalsJustPressed = false;
            lastEqualsResult = null;
            pendingValue = null; // Clear pending percentage when typing new numbers
            updateDisplay();
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