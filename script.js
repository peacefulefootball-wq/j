// script.js - Complete Scientific Calculator with Instructions Panel
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
    let pendingOperator = null; // Store operator for percentage calculation
    let pendingBaseValue = null; // Store base value for percentage

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

    // Function to get the last operator from history
    function getLastOperatorFromHistory() {
        if (!historyExpr) return null;
        
        // Find the last operator
        let operators = historyExpr.match(/[+\-×÷*/](?![^()]*\))/g);
        return operators ? operators[operators.length - 1] : null;
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
            pendingOperator = null;
            pendingBaseValue = null;
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

        // HELP button
        if (val === 'help') {
            helpModal.classList.add('show');
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
            
            // Case 1: No history - simple percentage (10% = 0.1)
            if (historyExpr === '' || historyExpr.trim() === '') {
                let result = percentValue / 100;
                currentInput = result.toString();
                historyExpr = `${percentValue}% = ${result}`;
                lastResult = result;
                updateDisplay();
                return;
            }
            
            // Case 2: Has history - get last operator and number
            let lastOperator = getLastOperatorFromHistory();
            let lastNumber = getLastNumberFromHistory();
            
            if (lastNumber !== null) {
                // Calculate based on the operator
                let calculatedValue;
                
                switch(lastOperator) {
                    case '+': // 400+10% = 400 + (400*10/100) = 440
                        calculatedValue = lastNumber * (percentValue / 100);
                        pendingValue = calculatedValue;
                        pendingOperator = '+';
                        pendingBaseValue = lastNumber;
                        currentInput = calculatedValue.toString();
                        historyExpr = historyExpr + percentValue + '%';
                        break;
                        
                    case '-': // 400-10% = 400 - (400*10/100) = 360
                        calculatedValue = lastNumber * (percentValue / 100);
                        pendingValue = calculatedValue;
                        pendingOperator = '-';
                        pendingBaseValue = lastNumber;
                        currentInput = calculatedValue.toString();
                        historyExpr = historyExpr + percentValue + '%';
                        break;
                        
                    case '×': // 400×10% = 400 * (10/100) = 40
                    case '*':
                        calculatedValue = lastNumber * (percentValue / 100);
                        pendingValue = calculatedValue;
                        pendingOperator = '×';
                        pendingBaseValue = lastNumber;
                        currentInput = calculatedValue.toString();
                        historyExpr = historyExpr + percentValue + '%';
                        break;
                        
                    case '÷': // 400÷10% = 400 / (10/100) = 4000
                    case '/':
                        if (percentValue === 0) {
                            currentInput = 'Error';
                        } else {
                            calculatedValue = lastNumber / (percentValue / 100);
                            pendingValue = calculatedValue;
                            pendingOperator = '÷';
                            pendingBaseValue = lastNumber;
                            currentInput = calculatedValue.toString();
                            historyExpr = historyExpr + percentValue + '%';
                        }
                        break;
                        
                    default:
                        // If no operator, treat as percentage of last number
                        calculatedValue = lastNumber * (percentValue / 100);
                        pendingValue = calculatedValue;
                        currentInput = calculatedValue.toString();
                        historyExpr = historyExpr + percentValue + '%';
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
            
            // If we have a pending percentage value, handle it
            if (pendingValue !== null && pendingOperator !== null && pendingBaseValue !== null) {
                // For cases like 400+10%, we already have the calculated value
                // Just update history to show the full expression
                if (pendingOperator === '+' || pendingOperator === '-') {
                    // For + and -, the percentage is added/subtracted from the base
                    let fullResult;
                    if (pendingOperator === '+') {
                        fullResult = pendingBaseValue + pendingValue;
                    } else {
                        fullResult = pendingBaseValue - pendingValue;
                    }
                    
                    historyExpr = pendingBaseValue + ' ' + pendingOperator + ' ' + pendingValue + ' =';
                    currentInput = fullResult.toString();
                    lastResult = fullResult;
                    pendingValue = null;
                    pendingOperator = null;
                    pendingBaseValue = null;
                    waitingForOperand = true;
                    equalsJustPressed = true;
                    updateDisplay();
                    return;
                } else {
                    // For × and ÷, the percentage result is the final value
                    currentInput = pendingValue.toString();
                    lastResult = pendingValue;
                    pendingValue = null;
                    pendingOperator = null;
                    pendingBaseValue = null;
                }
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
            
            // Update history to include current input and operator
            if (historyExpr === '' || waitingForOperand) {
                // Starting fresh: just show the number + operator
                historyExpr = currentInput + ' ' + val + ' ';
            } else {
                // Continuing an expression: add current number and operator
                historyExpr = historyExpr + currentInput + ' ' + val + ' ';
            }
            
            // Reset current input for next number
            currentInput = '0';
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
            
            // Handle pending percentage operations
            if (pendingValue !== null && pendingOperator !== null && pendingBaseValue !== null) {
                let finalResult;
                let fullExpr;
                
                switch(pendingOperator) {
                    case '+':
                        finalResult = pendingBaseValue + pendingValue;
                        fullExpr = pendingBaseValue + ' + ' + pendingValue + '%';
                        break;
                    case '-':
                        finalResult = pendingBaseValue - pendingValue;
                        fullExpr = pendingBaseValue + ' - ' + pendingValue + '%';
                        break;
                    case '×':
                        finalResult = pendingValue;
                        fullExpr = pendingBaseValue + ' × ' + (pendingValue / pendingBaseValue * 100) + '%';
                        break;
                    case '÷':
                        finalResult = pendingValue;
                        fullExpr = pendingBaseValue + ' ÷ ' + (100 * pendingBaseValue / pendingValue) + '%';
                        break;
                    default:
                        finalResult = pendingValue;
                        fullExpr = pendingBaseValue + ' % ' + pendingValue;
                }
                
                lastEqualsResult = finalResult;
                lastResult = finalResult;
                historyExpr = fullExpr + ' =';
                currentInput = finalResult.toString();
                waitingForOperand = true;
                equalsJustPressed = true;
                pendingValue = null;
                pendingOperator = null;
                pendingBaseValue = null;
                updateDisplay();
                return;
            }
            
            // Build full expression
            let fullExpr = historyExpr + currentInput;
            
            // Remove trailing operator if present
            fullExpr = fullExpr.replace(/\s*[+\-×÷*/]\s*$/, '');
            
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
                pendingOperator = null;
                pendingBaseValue = null;
                
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
            pendingOperator = null;
            pendingBaseValue = null;
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

    // ========== HELP MODAL FUNCTIONALITY ==========
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    const helpBody = document.getElementById('helpBody');

    // Get current year for dynamic copyright
    const currentYear = new Date().getFullYear();

    // Help content HTML with dynamic year
    const helpContentHTML = `
        <div class="help-section">
            <h3>📊 1. BASIC OPERATIONS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>0-9</td><td>Numbers</td><td>Press 5 → shows 5</td></tr>
                <tr><td>.</td><td>Decimal point</td><td>5.25: 5 → . → 25</td></tr>
                <tr><td>00</td><td>Double zero</td><td>100: 1 → 00</td></tr>
                <tr><td>C</td><td>Clear all</td><td>Reset calculator</td></tr>
                <tr><td>⌫</td><td>Backspace</td><td>123 → ⌫ = 12</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>➕ 2. BASIC MATH</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>+</td><td>Addition</td><td>5 + 3 = 8</td></tr>
                <tr><td>−</td><td>Subtraction</td><td>10 − 4 = 6</td></tr>
                <tr><td>×</td><td>Multiplication</td><td>6 × 7 = 42</td></tr>
                <tr><td>÷</td><td>Division</td><td>15 ÷ 3 = 5</td></tr>
                <tr><td>=</td><td>Equals</td><td>Shows result</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>📐 3. TRIGONOMETRY (DEG/RAD mode)</h3>
            <div class="help-note">
                <strong>DEG/RAD button:</strong> Toggles between Degrees and Radians
            </div>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example (DEG)</th></tr>
                <tr><td>sin</td><td>Sine</td><td>30 → sin = 0.5</td></tr>
                <tr><td>cos</td><td>Cosine</td><td>60 → cos = 0.5</td></tr>
                <tr><td>tan</td><td>Tangent</td><td>45 → tan = 1</td></tr>
                <tr><td>csc</td><td>Cosecant</td><td>30 → csc = 2</td></tr>
                <tr><td>sec</td><td>Secant</td><td>60 → sec = 2</td></tr>
                <tr><td>cot</td><td>Cotangent</td><td>45 → cot = 1</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>📈 4. LOGARITHMS & EXPONENTIALS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>log</td><td>Log base 10</td><td>100 → log = 2</td></tr>
                <tr><td>ln</td><td>Natural log</td><td>e → ln = 1</td></tr>
                <tr><td>10^x</td><td>10 to power x</td><td>2 → 10^x = 100</td></tr>
                <tr><td>e^x</td><td>e to power x</td><td>1 → e^x = 2.718</td></tr>
                <tr><td>^</td><td>Power (x^y)</td><td>2 → ^ → 3 = 8</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>🔢 5. ROOTS & POWERS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>x²</td><td>Square</td><td>5 → x² = 25</td></tr>
                <tr><td>x³</td><td>Cube</td><td>4 → x³ = 64</td></tr>
                <tr><td>√</td><td>Square root</td><td>16 → √ = 4</td></tr>
                <tr><td>∛</td><td>Cube root</td><td>27 → ∛ = 3</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>💯 6. PERCENTAGE (% ) - SPECIAL</h3>
            <div class="help-tip">
                <strong>400 + 10%</strong> = 440 (400 + 400×10%)<br>
                <strong>400 − 10%</strong> = 360 (400 − 400×10%)<br>
                <strong>400 × 10%</strong> = 40 (10% of 400)<br>
                <strong>400 ÷ 10%</strong> = 4000 (400 ÷ 0.10)
            </div>
        </div>

        <div class="help-section">
            <h3>💾 7. MEMORY & CONSTANTS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>Ans</td><td>Last answer</td><td>5+3=8 → Ans+2=10</td></tr>
                <tr><td>π</td><td>Pi (3.14159)</td><td>π × 10 = 31.4159</td></tr>
                <tr><td>e</td><td>Euler's number</td><td>e² = 7.389</td></tr>
                <tr><td>rand</td><td>Random number</td><td>rand = 0.456</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>🔄 8. ROUNDING FUNCTIONS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>round</td><td>Nearest integer</td><td>3.7 → round = 4</td></tr>
                <tr><td>floor</td><td>Round down</td><td>3.7 → floor = 3</td></tr>
                <tr><td>ceil</td><td>Round up</td><td>3.2 → ceil = 4</td></tr>
                <tr><td>abs</td><td>Absolute value</td><td>-5 → abs = 5</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>⚡ 9. SPECIAL FUNCTIONS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Function</th><th>Example</th></tr>
                <tr><td>n!</td><td>Factorial</td><td>5 → n! = 120</td></tr>
                <tr><td>1/x</td><td>Reciprocal</td><td>4 → 1/x = 0.25</td></tr>
                <tr><td>mod</td><td>Modulus</td><td>10 mod 3 = 1</td></tr>
                <tr><td>±</td><td>Toggle sign</td><td>5 → ± = -5</td></tr>
                <tr><td>( )</td><td>Parentheses</td><td>(2+3)×4 = 20</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>🎯 10. PRO TIPS</h3>
            <div class="help-tip">
                <strong>Chain Calculations:</strong> 5 + 3 = 8 → then + 2 = 10<br>
                <strong>Percentage Chain:</strong> 500 + 20% = 600 → then − 10% = 540<br>
                <strong>Complex Equation:</strong> sin(30°) + cos(60°) = 1<br>
                <strong>4th Root:</strong> 16 → ^ → ( → 1 → ÷ → 4 → ) → = 2
            </div>
        </div>

        <div class="help-section">
            <h3>⚠️ 11. TROUBLESHOOTING</h3>
            <table class="help-table">
                <tr><th>Problem</th><th>Solution</th></tr>
                <tr><td>Error</td><td>Press C, start over</td></tr>
                <tr><td>Infinity</td><td>Check division by zero</td></tr>
                <tr><td>undef</td><td>Use positive numbers for log</td></tr>
                <tr><td>Wrong result</td><td>Check DEG/RAD mode</td></tr>
                <tr><td>No sound</td><td>Press any button again</td></tr>
            </table>
        </div>

        <div class="help-section">
            <h3>⌨️ 12. KEYBOARD SHORTCUTS</h3>
            <table class="help-table">
                <tr><th>Button</th><th>Keyboard</th></tr>
                <tr><td>Numbers</td><td>0-9</td></tr>
                <tr><td>Add</td><td>+</td></tr>
                <tr><td>Subtract</td><td>-</td></tr>
                <tr><td>Multiply</td><td>*</td></tr>
                <tr><td>Divide</td><td>/</td></tr>
                <tr><td>Clear</td><td>Esc or C</td></tr>
                <tr><td>Backspace</td><td>← or Delete</td></tr>
            </table>
        </div>

        <div class="help-footer" style="text-align: center; margin-top: 20px; color: #666;">
            <p>World's #1 Scientific Calculator by <strong>Mahedi Hassan Anik</strong></p>
            <p>© ${currentYear} All Rights Reserved</p>
        </div>
    `;

    // Load help content
    helpBody.innerHTML = helpContentHTML;

    // Show help modal
    helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        playClickSound();
        helpModal.classList.add('show');
    });

    // Close help modal
    closeHelp.addEventListener('click', function() {
        helpModal.classList.remove('show');
    });

    // Close modal when clicking outside
    helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            helpModal.classList.remove('show');
        }
    });

    // Prevent closing when clicking inside content
    document.querySelector('.help-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Handle Escape key to close help modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && helpModal.classList.contains('show')) {
            helpModal.classList.remove('show');
        }
    });
})();