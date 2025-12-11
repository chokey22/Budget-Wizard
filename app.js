document.addEventListener("DOMContentLoaded", () => {
  try {
  // ============= ENCRYPTION & SECURITY =============
  const pinScreen = document.getElementById('pin-screen');
  const pinInput = document.getElementById('pin-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const setupPinBtn = document.getElementById('setup-pin-btn');
  let isUnlocked = false;
  let encryptionKey = null;

  // Simple encryption using XOR cipher (for demonstration - use crypto.subtle for production)
  function simpleEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }

  function simpleDecrypt(encrypted, key) {
    try {
      const decoded = atob(encrypted);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  // Secure localStorage wrapper
  function secureSetItem(key, value) {
    if (encryptionKey) {
      const encrypted = simpleEncrypt(JSON.stringify(value), encryptionKey);
      localStorage.setItem(key, encrypted);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  function secureGetItem(key) {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    if (encryptionKey) {
      const decrypted = simpleDecrypt(stored, encryptionKey);
      return decrypted ? JSON.parse(decrypted) : null;
    } else {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
  }

  // PIN management
  function checkPinExists() {
    return localStorage.getItem('appPinHash') !== null;
  }

  function hashPin(pin) {
    // Simple hash (use crypto.subtle.digest for production)
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  function setupPin() {
    const pin1 = prompt('Enter 4-digit PIN:');
    if (!pin1 || pin1.length !== 4 || !/^\d{4}$/.test(pin1)) {
      alert('Invalid PIN. Must be 4 digits.');
      return;
    }
    
    const pin2 = prompt('Confirm PIN:');
    if (pin1 !== pin2) {
      alert('PINs do not match');
      return;
    }
    
    localStorage.setItem('appPinHash', hashPin(pin1));
    encryptionKey = pin1 + 'budget-secret-2025'; // Derive key from PIN
    alert('PIN set successfully');
    unlockApp();
  }

  function verifyPin(pin) {
    const storedHash = localStorage.getItem('appPinHash');
    return hashPin(pin) === storedHash;
  }

  function unlockApp() {
    isUnlocked = true;
    pinScreen.style.display = 'none';
    document.querySelector('.app').style.display = 'block';
    initializeApp();
  }

  function lockApp() {
    isUnlocked = false;
    pinScreen.style.display = 'block';
    document.querySelector('.app').style.display = 'none';
  }

  // Initialize PIN screen
  if (checkPinExists()) {
    pinScreen.style.display = 'block';
    document.querySelector('.app').style.display = 'none';
    setupPinBtn.style.display = 'none';
    
    unlockBtn.addEventListener('click', () => {
      const pin = pinInput.value;
      if (verifyPin(pin)) {
        encryptionKey = pin + 'budget-secret-2025';
        unlockApp();
      } else {
        alert('Incorrect PIN');
        pinInput.value = '';
      }
    });
    
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') unlockBtn.click();
    });
  } else {
    // First time - show setup
    pinScreen.style.display = 'block';
    document.querySelector('.app').style.display = 'none';
    unlockBtn.style.display = 'none';
    pinInput.style.display = 'none';
    setupPinBtn.style.display = 'block';
    
    setupPinBtn.addEventListener('click', setupPin);
  }

  // ============= MAIN APP INITIALIZATION =============
  function initializeApp() {
    
  let chart; // Chart.js instance
  let reviewChart; // Chart.js instance for review panel

  const addIncomeBtn = document.getElementById('add-income-btn');
  const incomeList = document.getElementById('income-list');
  const multipleIncomeCB = document.getElementById('multipleIncome');
  const addExpenseBtn = document.getElementById('add-expense-btn');
  const expenseList = document.getElementById('expense-list');
  const calculateBtn = document.getElementById('calculate-btn');
  const langSelect = document.getElementById('langSelect');
  const restoreBanner = document.getElementById('restore-banner');
  const restoreText = document.getElementById('restore-text');
  const loadPreviousBtn = document.getElementById('load-previous-btn');
  const startFreshBtn = document.getElementById('start-fresh-btn');
  const resultsDiv = document.getElementById('results');
  const totalIncomeText = document.getElementById('total-income');
  const totalExpensesText = document.getElementById('total-expenses');
  const remainingText = document.getElementById('remaining');
  const monthSelect = document.getElementById('monthSelect');
  const startMenu = document.getElementById('start-menu');
  const remakeBtn = document.getElementById('remake-btn');
  const reviewBtn = document.getElementById('review-btn');
  const trendsBtn = document.getElementById('trends-btn');
  const trendsContainer = document.getElementById('trends-container');
  const trendsBackBtn = document.getElementById('trends-back-btn');
  const trendsMonthsSelect = document.getElementById('trends-months-select');
  const savingsGoalInput = document.getElementById('savings-goal-input');
  const setGoalBtn = document.getElementById('set-goal-btn');
  const autoFillBtn = document.getElementById('auto-fill-btn');
  const debtCalcBtn = document.getElementById('debt-calc-btn');
  const debtContainer = document.getElementById('debt-container');
  const debtBackBtn = document.getElementById('debt-back-btn');
  const addDebtBtn = document.getElementById('add-debt-btn');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const reviewContainer = document.getElementById('review-container');

  // ============= UNDO/REDO FUNCTIONALITY =============
  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 50;

  function captureState() {
    const state = {
      incomes: [],
      expenses: []
    };
    
    // Capture all income rows
    const incomeRows = incomeList.querySelectorAll('.income-row');
    incomeRows.forEach(row => {
      state.incomes.push({
        name: row.querySelector('.income-name').value,
        amount: row.querySelector('.income-amount').value,
        frequency: row.querySelector('.income-frequency').value,
        note: row.querySelector('.income-note').value
      });
    });
    
    // Capture all expense rows
    const expenseRows = expenseList.querySelectorAll('.expense-row');
    expenseRows.forEach(row => {
      state.expenses.push({
        name: row.querySelector('.expense-name').value,
        amount: row.querySelector('.expense-amount').value,
        frequency: row.querySelector('.expense-frequency').value,
        note: row.querySelector('.expense-note').value
      });
    });
    
    return state;
  }

  function restoreState(state) {
    // Clear existing
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    
    // Restore incomes
    if (state.incomes.length > 0) {
      state.incomes.forEach(inc => {
        const row = createInputRow('income-name', 'income-amount');
        row.querySelector('.income-name').value = inc.name || '';
        row.querySelector('.income-amount').value = inc.amount || '';
        row.querySelector('.income-frequency').value = inc.frequency || 'monthly';
        row.querySelector('.income-note').value = inc.note || '';
        incomeList.appendChild(row);
      });
    } else {
      incomeList.appendChild(createInputRow('income-name', 'income-amount'));
    }
    
    // Restore expenses
    if (state.expenses.length > 0) {
      state.expenses.forEach(exp => {
        const row = createInputRow('expense-name', 'expense-amount');
        row.querySelector('.expense-name').value = exp.name || '';
        row.querySelector('.expense-amount').value = exp.amount || '';
        row.querySelector('.expense-frequency').value = exp.frequency || 'monthly';
        row.querySelector('.expense-note').value = exp.note || '';
        expenseList.appendChild(row);
      });
    } else {
      expenseList.appendChild(createInputRow('expense-name', 'expense-amount'));
    }
    
    updateUndoRedoButtons();
  }

  function saveHistory() {
    const state = captureState();
    undoStack.push(state);
    
    // Limit history size
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    redoStack = [];
    updateUndoRedoButtons();
  }

  function undo() {
    if (undoStack.length === 0) return;
    
    // Save current state to redo stack
    const currentState = captureState();
    redoStack.push(currentState);
    
    // Restore previous state
    const previousState = undoStack.pop();
    restoreState(previousState);
  }

  function redo() {
    if (redoStack.length === 0) return;
    
    // Save current state to undo stack
    const currentState = captureState();
    undoStack.push(currentState);
    
    // Restore redo state
    const nextState = redoStack.pop();
    restoreState(nextState);
  }

  function updateUndoRedoButtons() {
    if (undoBtn) {
      undoBtn.disabled = undoStack.length === 0;
      undoBtn.style.opacity = undoStack.length === 0 ? '0.5' : '1';
    }
    if (redoBtn) {
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.style.opacity = redoStack.length === 0 ? '0.5' : '1';
    }
  }

  // Undo/Redo button handlers
  if (undoBtn) {
    undoBtn.addEventListener('click', undo);
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', redo);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

  // Track changes when rows are added
  function addIncomeRowWithHistory(name = '', amount = '', note = '') {
    saveHistory();
    addIncomeRow(name, amount, note);
  }

  function addExpenseRowWithHistory(name = '', amount = '', note = '') {
    saveHistory();
    addExpenseRow(name, amount, note);
  }
  const reviewMonth = document.getElementById('review-month');
  const reviewIncomes = document.getElementById('review-incomes');
  const reviewExpenses = document.getElementById('review-expenses');
  const reviewSaveBtn = document.getElementById('review-save-btn');
  const reviewBackBtn = document.getElementById('review-back-btn');
  const reviewTotalIncomeEl = document.getElementById('review-total-income');
  const reviewTotalExpensesEl = document.getElementById('review-total-expenses');
  const reviewRemainingEl = document.getElementById('review-remaining');
  // removed percent elements; using remaining-after elements instead
  const save5AmountEl = document.getElementById('save5-amount');
  const save10AmountEl = document.getElementById('save10-amount');
  const reviewSave5AmountEl = document.getElementById('review-save5-amount');
  const reviewSave10AmountEl = document.getElementById('review-save10-amount');
  const remainingAfter5El = document.getElementById('remaining-after5-amount');
  const remainingAfter10El = document.getElementById('remaining-after10-amount');
  const reviewRemainingAfter5El = document.getElementById('review-remaining-after5-amount');
  const reviewRemainingAfter10El = document.getElementById('review-remaining-after10-amount');

  let currentReview = null; // { key, incomes, expenses }
  let currentLang = 'en';
  let currentCurrency = 'SEK'; // display currency
  let currentTheme = 'dark-minimal'; // default theme
  const currencySelect = document.getElementById('currencySelect');
  const themeSelect = document.getElementById('themeSelect');

  // exchange rates: map currency -> units per SEK (e.g. USD: 0.1 means 1 SEK = 0.1 USD)
  let rates = { USD: null, EUR: null, JPY: null, GBP: null };

  async function fetchRates() {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=SEK&symbols=USD,EUR,JPY,GBP');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      rates.USD = data.rates.USD;
      rates.EUR = data.rates.EUR;
      rates.JPY = data.rates.JPY;
      rates.GBP = data.rates.GBP;
    } catch (e) {
      // fallback static-ish rates if fetch fails
      rates = { USD: 0.094, EUR: 0.088, JPY: 14.5, GBP: 0.076 };
    }
  }

  function convertToSEK(amount, currency) {
    if (!amount) return 0;
    if (!currency || currency === 'SEK') return Number(amount);
    const rate = rates[currency];
    if (!rate || rate === 0) return Number(amount); // fallback: treat as SEK
    return Number(amount) / rate; // amount (currency) -> SEK
  }

  function convertFromSEK(amountSEK, currency) {
    if (!currency || currency === 'SEK') return Number(amountSEK);
    const rate = rates[currency];
    if (!rate) return Number(amountSEK);
    return Number(amountSEK) * rate; // SEK -> target currency
  }

  function currencySymbol(code) {
    switch (code) {
      case 'JPY': return '¥';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SEK': return 'kr';
      case 'GBP': return '£';
      default: return code;
    }
  }

  // Apply theme
  function applyTheme(themeName) {
    currentTheme = themeName;
    localStorage.setItem('theme', themeName);
    document.body.className = `theme-${themeName}`;
  }

  // Auto-detect system theme preference
  function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark-minimal';
    } else {
      return 'light-minimal';
    }
  }

  // placeholders (used when creating new rows)
  let phIncomeName = 'Income name (e.g., Salary)';
  let phIncomeAmount = 'Amount (SEK)';
  let phExpenseName = 'Expense name (e.g., Rent)';
  let phExpenseAmount = 'Amount (SEK)';

  const translations = {
    en: {
      appTitle: 'Monthly Budget',
      startMenuTitle: 'What would you like to do?',
      remakeBtn: 'Remake calculation',
      reviewBtn: 'Review / Edit current budget',
      reviewTitle: 'Review & Edit',
      loadPrev: 'Load previous data',
      startFresh: 'Start fresh',
      restoreFound: 'Found saved data for {month}. Load and review previous entries?',
      incomeHeader: 'Income',
      multipleIncomeLabel: 'I have multiple income sources',
      addIncome: 'Add income source',
      expensesHeader: 'Expenses / Bills',
      addExpense: 'Add expense',
      calculate: 'Calculate',
      resultsTitle: 'Results',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      remaining: 'Remaining',
      compareLabel: 'Compare with past months:',
      reviewIncomes: 'Incomes',
      reviewExpenses: 'Expenses',
      monthLabel: 'Month: {month}',
      saveChanges: 'Save Changes',
      back: 'Back',
      editIncomeNamePrompt: 'Edit income name:',
      editAmountPrompt: 'Edit amount:',
      deleteConfirm: 'Are you sure you want to delete "{name}"?',
      deleteBtn: 'Delete',
      noSavedBudget: 'No saved budget found. Please create a calculation first.'
      ,recRangeLabel: 'Recommended savings (5% - 10%):'
      ,save5Label: 'Save 5%'
      ,save10Label: 'Save 10%'
      ,basedOnIncome: 'Based on income'
      ,basedOnRemaining: 'Based on remaining'
      ,confirmReset: 'A calculation already exists. Reset the budget and start fresh?'
      ,budgetSummary: 'Budget Summary'
      ,monthColon: 'Month:'
      ,summaryColon: 'Summary:'
      ,afterSaving5: 'After saving 5%:'
      ,afterSaving10: 'After saving 10%:'
      ,duplicateDetected: 'Duplicate names detected!'
      ,mergeSuggestion: 'You entered "{name}" multiple times. Merge them into one entry?'
      ,mergeYes: 'Yes, merge'
      ,mergeNo: 'No, keep separate'
      ,monthly: 'Monthly'
      ,weekly: 'Weekly'
      ,biWeekly: 'Bi-weekly'
      ,yearly: 'Yearly'
      ,frequency: 'Frequency'
      ,trendsBtn: 'View expense trends'
      ,trendsTitle: 'Expense Trends'
      ,trendsDesc: 'Compare your expenses across different months'
      ,selectMonths: 'Select months to compare (hold Ctrl/Cmd for multiple):'
      ,insights: 'Insights:'
      ,savingsGoal: 'Savings Goal'
      ,setSavingsTarget: 'Set monthly savings target:'
      ,setGoal: 'Set Goal'
      ,goal: 'Goal'
      ,actualSavings: 'Actual Savings'
      ,ofGoalAchieved: 'of goal achieved'
      ,goalMet: '🎉 Congratulations! You met your savings goal!'
      ,goalNotMet: 'Keep going! You need {amount} more to reach your goal.'
      ,noTrendsData: 'Not enough data. Create budgets for multiple months to see trends.'
      ,categoryIncreased: '{category} increased by {amount} ({percent}%)'
      ,categoryDecreased: '{category} decreased by {amount} ({percent}%)'
      ,predictions: 'Predictions'
      ,nextMonthPrediction: 'Next Month Prediction'
      ,basedOnAverage: 'Based on average of last {months} months'
      ,predictedExpenses: 'Predicted Expenses'
      ,predictedRemaining: 'Predicted Remaining'
      ,warnings: 'Warnings'
      ,expensesIncreased: 'Your expenses increased by {percent}% this month'
      ,expensesDecreased: 'Your expenses decreased by {percent}% this month'
      ,negativeRemainingWarning: 'Your remaining money will be negative next month if trends continue'
      ,lowSavingsWarning: 'Your savings are below the recommended 5% ({amount})'
      ,excellentSavings: 'Excellent! You are saving {percent}% of your income'
      ,autoFillBtn: 'Auto-fill from last month'
      ,autoFillSuccess: 'Pre-filled with last month\'s data. Edit as needed.'
      ,noDataToFill: 'No previous month data available'
      ,setPinTitle: 'Set PIN'
      ,enterPin: 'Enter 4-digit PIN:'
      ,confirmPin: 'Confirm PIN:'
      ,pinMismatch: 'PINs do not match'
      ,pinSet: 'PIN set successfully'
      ,unlockApp: 'Unlock App'
      ,incorrectPin: 'Incorrect PIN'
      ,changePin: 'Change PIN'
      ,debtCalculator: 'Debt Payoff Calculator'
      ,addDebt: 'Add Debt'
      ,debtName: 'Debt Name'
      ,debtAmount: 'Amount Owed'
      ,interestRate: 'Interest Rate (%)'
      ,minimumPayment: 'Minimum Payment'
      ,snowballMethod: 'Snowball Method (Smallest first)'
      ,avalancheMethod: 'Avalanche Method (Highest interest first)'
      ,monthsToPayoff: 'Months to payoff'
      ,totalInterest: 'Total interest paid'
      ,undo: 'Undo'
      ,redo: 'Redo'
      ,recurring: 'Recurring'
      ,monthlySummary: 'Monthly Summary'
      ,biggestCategory: 'Biggest Category'
      ,comparedToLastMonth: 'Compared to last month'
      ,exportPdf: 'Export as PDF'
    },
    sv: {
      appTitle: 'Månadsbudget',
      startMenuTitle: 'Vad vill du göra?',
      remakeBtn: 'Gör om kalkyl',
      reviewBtn: 'Granska / Redigera budget',
      reviewTitle: 'Granska & Redigera',
      loadPrev: 'Ladda tidigare data',
      startFresh: 'Börja från början',
      restoreFound: 'Hittade sparad data för {month}. Ladda och granska tidigare poster?',
      incomeHeader: 'Inkomst',
      multipleIncomeLabel: 'Jag har flera inkomstkällor',
      addIncome: 'Lägg till inkomst',
      expensesHeader: 'Kostnader / Räkningar',
      addExpense: 'Lägg till utgift',
      calculate: 'Beräkna',
      resultsTitle: 'Resultat',
      totalIncome: 'Total inkomst',
      totalExpenses: 'Totala kostnader',
      remaining: 'Kvar',
      compareLabel: 'Jämför med tidigare månader:',
      reviewIncomes: 'Inkomster',
      reviewExpenses: 'Utgifter',
      monthLabel: 'Månad: {month}',
      saveChanges: 'Spara ändringar',
      back: 'Tillbaka',
      editIncomeNamePrompt: 'Redigera inkomsnamn:',
      editAmountPrompt: 'Redigera belopp:',
      deleteConfirm: 'Är du säker på att du vill ta bort "{name}"?',
      deleteBtn: 'Ta bort',
      noSavedBudget: 'Ingen sparad budget hittades. Skapa en uträkning först.'
      ,recRangeLabel: 'Rekommenderat sparande (5% - 10%):'
      ,save5Label: 'Spara 5%'
      ,save10Label: 'Spara 10%'
      ,basedOnIncome: 'Baserad på inkomst'
      ,basedOnRemaining: 'Baserat på återstående'
      ,confirmReset: 'En kalkyl finns redan. Återställ budgeten och börja om?'
      ,budgetSummary: 'Budgetsammanfattning'
      ,monthColon: 'Månad:'
      ,summaryColon: 'Sammanfattning:'
      ,afterSaving5: 'Efter sparande 5%:'
      ,afterSaving10: 'Efter sparande 10%:'
      ,duplicateDetected: 'Dubbletter hittat!'
      ,mergeSuggestion: 'Du angav "{name}" flera gånger. Slå samman dem?'
      ,mergeYes: 'Ja, slå samman'
      ,mergeNo: 'Nej, håll separata'
      ,monthly: 'Månad'
      ,weekly: 'Vecka'
      ,biWeekly: 'Två veckor'
      ,yearly: 'År'
      ,frequency: 'Frekvens'
      ,trendsBtn: 'Visa utgiftstrender'
      ,trendsTitle: 'Utgiftstrender'
      ,trendsDesc: 'Jämför dina utgifter över olika månader'
      ,selectMonths: 'Välj månader att jämföra (håll Ctrl/Cmd för flera):'
      ,insights: 'Insikter:'
      ,savingsGoal: 'Sparmål'
      ,setSavingsTarget: 'Ange månatligt sparmål:'
      ,setGoal: 'Sätt mål'
      ,goal: 'Mål'
      ,actualSavings: 'Faktiskt sparande'
      ,ofGoalAchieved: 'av målet uppnått'
      ,goalMet: '🎉 Grattis! Du nådde ditt sparmål!'
      ,goalNotMet: 'Fortsätt! Du behöver {amount} mer för att nå ditt mål.'
      ,noTrendsData: 'Inte tillräckligt med data. Skapa budgetar för flera månader för att se trender.'
      ,categoryIncreased: '{category} ökade med {amount} ({percent}%)'
      ,categoryDecreased: '{category} minskade med {amount} ({percent}%)'
      ,predictions: 'Prognoser'
      ,nextMonthPrediction: 'Nästa månads prognos'
      ,basedOnAverage: 'Baserad på genomsnitt av senaste {months} månaderna'
      ,predictedExpenses: 'Förutsedda utgifter'
      ,predictedRemaining: 'Förutseende återstående'
      ,warnings: 'Varningar'
      ,expensesIncreased: 'Dina utgifter ökade med {percent}% denna månad'
      ,expensesDecreased: 'Dina utgifter minskade med {percent}% denna månad'
      ,negativeRemainingWarning: 'Dina återstående pengar blir negativa nästa månad om trenderna fortsätter'
      ,lowSavingsWarning: 'Ditt sparande är under rekommenderade 5% ({amount})'
      ,excellentSavings: 'Utmärkt! Du sparar {percent}% av din inkomst'
      ,autoFillBtn: 'Autofyll från förra månaden'
      ,autoFillSuccess: 'Förfylld med förra månadens data. Redigera efter behov.'
      ,noDataToFill: 'Ingen tidigare månadsdata tillgänglig'
      ,setPinTitle: 'Ange PIN'
      ,enterPin: 'Ange 4-siffrig PIN:'
      ,confirmPin: 'Bekräfta PIN:'
      ,pinMismatch: 'PIN-koderna matchar inte'
      ,pinSet: 'PIN har ställts in'
      ,unlockApp: 'Lås upp appen'
      ,incorrectPin: 'Felaktig PIN'
      ,changePin: 'Ändra PIN'
      ,debtCalculator: 'Skuldavbetalningskalkylator'
      ,addDebt: 'Lägg till skuld'
      ,debtName: 'Skuldnamn'
      ,debtAmount: 'Skuldsumma'
      ,interestRate: 'Ränta (%)'
      ,minimumPayment: 'Minimibetalning'
      ,snowballMethod: 'Snöbollsmetod (Minsta först)'
      ,avalancheMethod: 'Lavinmetod (Högsta ränta först)'
      ,monthsToPayoff: 'Månader att betala av'
      ,totalInterest: 'Total ränta betald'
      ,undo: 'Ångra'
      ,redo: 'Gör om'
      ,recurring: 'Återkommande'
      ,monthlySummary: 'Månadssammanfattning'
      ,biggestCategory: 'Största kategori'
      ,comparedToLastMonth: 'Jämfört med förra månaden'
      ,exportPdf: 'Exportera som PDF'
    },
    ja: {
      appTitle: '月次予算',
      startMenuTitle: '何をしたいですか？',
      remakeBtn: '新しく計算する',
      reviewBtn: '予算を確認 / 編集',
      reviewTitle: '確認と編集',
      loadPrev: '前のデータを読み込む',
      startFresh: '最初から始める',
      restoreFound: '{month} の保存データが見つかりました。読み込んで確認しますか？',
      incomeHeader: '収入',
      multipleIncomeLabel: '収入源が複数あります',
      addIncome: '収入を追加',
      expensesHeader: '支出 / 請求',
      addExpense: '支出を追加',
      calculate: '計算する',
      resultsTitle: '結果',
      totalIncome: '総収入',
      totalExpenses: '総支出',
      remaining: '残高',
      compareLabel: '過去の月と比較:',
      reviewIncomes: '収入',
      reviewExpenses: '支出',
      monthLabel: '月: {month}',
      saveChanges: '変更を保存',
      back: '戻る',
      editIncomeNamePrompt: '収入名を編集:',
      editAmountPrompt: '金額を編集:',
      deleteConfirm: '「{name}」を削除してもよろしいですか？',
      deleteBtn: '削除',
      noSavedBudget: '保存された予算が見つかりません。まず計算を作成してください。'
      ,recRangeLabel: '推奨貯蓄（5% - 10%）:'
      ,save5Label: '5%を貯める'
      ,save10Label: '10%を貯める'
      ,basedOnIncome: '収入に基づいて'
      ,basedOnRemaining: '残高に基づいて'
      ,confirmReset: '既に計算が存在します。予算をリセットして最初から始めますか？'
      ,budgetSummary: '予算サマリー'
      ,monthColon: '月:'
      ,summaryColon: 'サマリー:'
      ,afterSaving5: '5%を貯めた後:'
      ,afterSaving10: '10%を貯めた後:'
      ,duplicateDetected: '重複する名前が検出されました！'
      ,mergeSuggestion: '"{name}"を複数回入力しました。統合しますか？'
      ,mergeYes: 'はい、統合'
      ,mergeNo: 'いいえ、別のままにする'
      ,monthly: '月次'
      ,weekly: '週次'
      ,biWeekly: '隔週'
      ,yearly: '年次'
      ,frequency: '頻度'
      ,trendsBtn: '支出トレンドを表示'
      ,trendsTitle: '支出トレンド'
      ,trendsDesc: '異なる月の支出を比較'
      ,selectMonths: '比較する月を選択（複数選択は Ctrl/Cmd）:'
      ,insights: 'インサイト:'
      ,savingsGoal: '貯蓄目標'
      ,setSavingsTarget: '月次貯蓄目標を設定:'
      ,setGoal: '目標を設定'
      ,goal: '目標'
      ,actualSavings: '実際の貯蓄'
      ,ofGoalAchieved: '目標達成'
      ,goalMet: '🎉 おめでとう！貯蓄目標を達成しました！'
      ,goalNotMet: '頑張って！目標まであと {amount} 必要です。'
      ,noTrendsData: 'データ不足。トレンドを表示するには複数月の予算を作成してください。'
      ,categoryIncreased: '{category}が{amount}増加 ({percent}%)'
      ,categoryDecreased: '{category}が{amount}減少 ({percent}%)'
      ,predictions: '予測'
      ,nextMonthPrediction: '来月の予測'
      ,basedOnAverage: '過去{months}ヶ月の平均に基づく'
      ,predictedExpenses: '予測支出'
      ,predictedRemaining: '予測残高'
      ,warnings: '警告'
      ,expensesIncreased: '今月の支出が{percent}%増加しました'
      ,expensesDecreased: '今月の支出が{percent}%減少しました'
      ,negativeRemainingWarning: 'トレンドが続くと来月の残高がマイナスになります'
      ,lowSavingsWarning: '貯蓄が推奨される5%を下回っています ({amount})'
      ,excellentSavings: '素晴らしい！収入の{percent}%を貯蓄しています'
      ,autoFillBtn: '先月から自動入力'
      ,autoFillSuccess: '先月のデータで事前入力されました。必要に応じて編集してください。'
      ,noDataToFill: '前月のデータがありません'
      ,setPinTitle: 'PIN設定'
      ,enterPin: '4桁のPINを入力:'
      ,confirmPin: 'PINを確認:'
      ,pinMismatch: 'PINが一致しません'
      ,pinSet: 'PINが設定されました'
      ,unlockApp: 'アプリのロック解除'
      ,incorrectPin: 'PINが正しくありません'
      ,changePin: 'PINを変更'
      ,debtCalculator: '債務返済計算機'
      ,addDebt: '債務を追加'
      ,debtName: '債務名'
      ,debtAmount: '債務額'
      ,interestRate: '金利 (%)'
      ,minimumPayment: '最低支払額'
      ,snowballMethod: 'スノーボール法（最小額優先）'
      ,avalancheMethod: 'アバランチ法（最高金利優先）'
      ,monthsToPayoff: '返済月数'
      ,totalInterest: '支払総利息'
      ,undo: '元に戻す'
      ,redo: 'やり直し'
      ,recurring: '定期的'
      ,monthlySummary: '月次サマリー'
      ,biggestCategory: '最大カテゴリー'
      ,comparedToLastMonth: '先月と比較'
      ,exportPdf: 'PDFとしてエクスポート'
    }
  };

  let draggedElement = null;

  function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.income-row, .expense-row').forEach(row => {
      row.classList.remove('drag-over');
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== draggedElement && (this.classList.contains('income-row') || this.classList.contains('expense-row'))) {
      this.classList.add('drag-over');
    }
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    if (this !== draggedElement && (this.classList.contains('income-row') || this.classList.contains('expense-row'))) {
      // Get parent lists
      const draggedParent = draggedElement.parentNode;
      const dropParent = this.parentNode;

      // Only reorder if same parent (income or expense list)
      if (draggedParent === dropParent) {
        // Insert dragged element before drop target
        dropParent.insertBefore(draggedElement, this);
      }
      this.classList.remove('drag-over');
    }
  }

  function createInputRow(nameClass, amountClass, namePlaceholder, amountPlaceholder) {
    const wrapper = document.createElement('div');
    wrapper.className = nameClass === 'income-name' ? 'income-row' : 'expense-row';
    wrapper.draggable = true;

    const name = document.createElement('input');
    name.type = 'text';
    name.className = nameClass;
    // use current placeholders
    name.placeholder = nameClass === 'income-name' ? phIncomeName : phExpenseName;

    const amount = document.createElement('input');
    amount.type = 'number';
    amount.className = amountClass;
    amount.placeholder = amountClass === 'income-amount' ? phIncomeAmount : phExpenseAmount;

    const frequency = document.createElement('select');
    frequency.className = nameClass === 'income-name' ? 'income-frequency' : 'expense-frequency';
    const t = translations[currentLang] || translations.en;
    frequency.innerHTML = `
      <option value="monthly">${t.monthly}</option>
      <option value="weekly">${t.weekly}</option>
      <option value="bi-weekly">${t.biWeekly}</option>
      <option value="yearly">${t.yearly}</option>
    `;

    const note = document.createElement('input');
    note.type = 'text';
    note.className = nameClass === 'income-name' ? 'income-note' : 'expense-note';
    note.placeholder = nameClass === 'income-name' ? 'Notes (optional)' : 'Notes (optional)';

    wrapper.appendChild(name);
    wrapper.appendChild(amount);
    wrapper.appendChild(frequency);
    wrapper.appendChild(note);
    
    // Add recurring checkbox for expenses
    if (nameClass === 'expense-name') {
      const recurringLabel = document.createElement('label');
      recurringLabel.className = 'recurring-label';
      const recurringCheck = document.createElement('input');
      recurringCheck.type = 'checkbox';
      recurringCheck.className = 'expense-recurring';
      recurringLabel.appendChild(recurringCheck);
      recurringLabel.appendChild(document.createTextNode(' Recurring'));
      wrapper.appendChild(recurringLabel);
    }

    // Track changes for undo/redo
    let typingTimer;
    [name, amount, frequency, note].forEach(input => {
      input.addEventListener('change', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => saveHistory(), 500);
      });
    });

    // Add drag event listeners
    wrapper.addEventListener('dragstart', handleDragStart);
    wrapper.addEventListener('dragend', handleDragEnd);
    wrapper.addEventListener('dragover', handleDragOver);
    wrapper.addEventListener('drop', handleDrop);
    wrapper.addEventListener('dragleave', handleDragLeave);

    return wrapper;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    const t = translations[lang] || translations.en;
    // title
    const appTitle = document.getElementById('app-title');
    if (appTitle) appTitle.textContent = t.appTitle;
    // start menu
    const smh = startMenu.querySelector('h2'); if (smh) smh.textContent = t.startMenuTitle;
    remakeBtn.textContent = t.remakeBtn;
    reviewBtn.textContent = t.reviewBtn;
    if (trendsBtn) trendsBtn.textContent = t.trendsBtn;
    if (debtCalcBtn) debtCalcBtn.textContent = t.debtCalculator;
    if (autoFillBtn) autoFillBtn.textContent = t.autoFillBtn;
    // review
    const revh = reviewContainer.querySelector('h2'); if (revh) revh.textContent = t.reviewTitle;
    reviewSaveBtn.textContent = t.saveChanges;
    reviewBackBtn.textContent = t.back;
    // restore banner
    if (restoreText) {
      // will be replaced with month when shown
      restoreText.textContent = t.restoreFound.replace('{month}','');
    }
    loadPreviousBtn.textContent = t.loadPrev;
    startFreshBtn.textContent = t.startFresh;
    // question container labels
    const qh = document.querySelector('#question-container h3'); if (qh) qh.textContent = t.incomeHeader;
    const qLabels = document.querySelectorAll('#question-container label');
    if (qLabels && qLabels[0]) qLabels[0].childNodes.forEach(n => {});
    // set checkbox label text (label contains the input)
    const cbLabel = document.querySelector('#question-container label');
    if (cbLabel) {
      // keep checkbox input, but set text node
      const cb = cbLabel.querySelector('input');
      cbLabel.innerHTML = '';
      cbLabel.appendChild(cb);
      cbLabel.appendChild(document.createTextNode(' ' + t.multipleIncomeLabel));
    }
    // headings and button texts
    const h3s = document.querySelectorAll('#question-container h3');
    if (h3s[1]) h3s[1].textContent = t.expensesHeader;
    addIncomeBtn.textContent = t.addIncome;
    addExpenseBtn.textContent = t.addExpense;
    calculateBtn.textContent = t.calculate;
    // results labels
    const resH = document.querySelector('#results h2'); if (resH) resH.textContent = t.resultsTitle;
    const totalIncomeLabel = document.querySelector('#results p:nth-of-type(1)'); if (totalIncomeLabel) totalIncomeLabel.childNodes[0].textContent = t.totalIncome + ': ';
    const totalExpensesLabel = document.querySelector('#results p:nth-of-type(2)'); if (totalExpensesLabel) totalExpensesLabel.childNodes[0].textContent = t.totalExpenses + ': ';
    const remainingLabel = document.querySelector('#results p:nth-of-type(3)'); if (remainingLabel) remainingLabel.childNodes[0].textContent = t.remaining + ': ';
    const compareLabel = document.querySelector('label[for="monthSelect"]'); if (compareLabel) compareLabel.textContent = t.compareLabel;
    // results recommendation and remaining-after labels
    const recRangeEl = document.getElementById('recommend-range'); if (recRangeEl) recRangeEl.childNodes[1].textContent = ` ${t.recRangeLabel || 'Recommended savings (5% - 10%):'}`;
    const save5LabelEl = document.getElementById('save5'); if (save5LabelEl) save5LabelEl.childNodes[0].textContent = (t.save5Label || 'Save 5%') + ': ';
    const save10LabelEl = document.getElementById('save10'); if (save10LabelEl) save10LabelEl.childNodes[0].textContent = (t.save10Label || 'Save 10%') + ': ';
    const remain5El = document.getElementById('remaining-after-5'); if (remain5El) remain5El.childNodes[1].textContent = ' ' + ((t.save5Label || 'Save 5%').replace(/Save\s*/,'After saving ')) + ': ';
    const remain10El = document.getElementById('remaining-after-10'); if (remain10El) remain10El.childNodes[0].textContent = ((t.save10Label || 'Save 10%').replace(/Save\s*/,'After saving ')) + ': ';
    // review section headings
    const revInH = reviewContainer.querySelector('h3'); if (revInH) revInH.textContent = t.reviewIncomes;
    const revExpHs = reviewContainer.querySelectorAll('h3'); if (revExpHs[1]) revExpHs[1].textContent = t.reviewExpenses;

    // review totals labels
    const reviewTotals = document.getElementById('review-totals');
    if (reviewTotals) {
      const ps = reviewTotals.querySelectorAll('p');
      if (ps[0]) ps[0].childNodes[0].textContent = t.totalIncome + ': ';
      if (ps[1]) ps[1].childNodes[0].textContent = t.totalExpenses + ': ';
      if (ps[2]) ps[2].childNodes[0].textContent = t.remaining + ': ';
    }

    // review recommendation and remaining-after labels
    const reviewRecTitle = document.querySelector('#review-recommendation p'); if (reviewRecTitle) reviewRecTitle.childNodes[1].textContent = ' ' + (t.recRangeLabel || 'Recommended savings (5% - 10%):');
    const reviewSave5Label = document.getElementById('review-save5'); if (reviewSave5Label) reviewSave5Label.childNodes[0].textContent = (t.save5Label || 'Save 5%') + ': ';
    const reviewSave10Label = document.getElementById('review-save10'); if (reviewSave10Label) reviewSave10Label.childNodes[0].textContent = (t.save10Label || 'Save 10%') + ': ';
    const reviewRemain5 = document.getElementById('review-remaining-after-5'); if (reviewRemain5) reviewRemain5.childNodes[1].textContent = ' ' + ((t.save5Label || 'Save 5%').replace(/Save\s*/,'After saving ')) + ': ';
    const reviewRemain10 = document.getElementById('review-remaining-after-10'); if (reviewRemain10) reviewRemain10.childNodes[0].textContent = ((t.save10Label || 'Save 10%').replace(/Save\s*/,'After saving ')) + ': ';

    // placeholders update
    phIncomeName = t.incomeHeader + ' name (e.g., Salary)';
    phExpenseName = t.expensesHeader + ' name (e.g., Rent)';

    // currency handling: decide currentCurrency and show/hide currencySelect
    if (lang === 'ja') {
      currentCurrency = 'JPY';
      if (currencySelect) currencySelect.style.display = 'none';
    } else if (lang === 'sv') {
      currentCurrency = 'SEK';
      if (currencySelect) currencySelect.style.display = 'none';
    } else {
      // English: allow USD/EUR selection
      if (currencySelect) {
        currencySelect.style.display = 'inline-block';
        const saved = localStorage.getItem('currency');
        if (saved) currencySelect.value = saved;
        currentCurrency = currencySelect.value || 'USD';
      } else {
        currentCurrency = 'USD';
      }
    }

    // amount placeholder include currency code
    phIncomeAmount = `Amount (${currentCurrency})`;
    phExpenseAmount = `Amount (${currentCurrency})`;

    // update existing input placeholders
    document.querySelectorAll('.income-name').forEach(i => i.placeholder = phIncomeName);
    document.querySelectorAll('.income-amount').forEach(i => i.placeholder = phIncomeAmount);
    document.querySelectorAll('.expense-name').forEach(i => i.placeholder = phExpenseName);
    document.querySelectorAll('.expense-amount').forEach(i => i.placeholder = phExpenseAmount);

    // update frequency dropdowns
    document.querySelectorAll('.income-frequency, .expense-frequency').forEach(select => {
      const currentValue = select.value;
      select.innerHTML = `
        <option value="monthly">${t.monthly}</option>
        <option value="weekly">${t.weekly}</option>
        <option value="bi-weekly">${t.biWeekly}</option>
        <option value="yearly">${t.yearly}</option>
      `;
      select.value = currentValue; // restore selected value
    });
    
    // update recurring labels
    document.querySelectorAll('.recurring-label').forEach(label => {
      const checkbox = label.querySelector('input[type="checkbox"]');
      label.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = ' ' + (t.recurring || 'Recurring');
        }
      });
    });

    // update results amount labels to include currency symbol/code
    const totalIncomeVal = document.getElementById('total-income');
    const totalExpensesVal = document.getElementById('total-expenses');
    const remainingVal = document.getElementById('remaining');
    if (totalIncomeVal) totalIncomeVal.parentNode.childNodes[0].textContent = t.totalIncome + ': ';
    // saved numeric values will be updated when rendering results/review

    // update restore text template for when banner shows
    if (restoreBanner && restoreBanner.style.display !== 'none') {
      const latest = getLatestHistoryEntry();
      if (latest) restoreText.textContent = t.restoreFound.replace('{month}', latest.key);
    }

    // update "Based on" labels
    const basedOnIncome = document.getElementById('based-on-income-label');
    const basedOnRemaining = document.getElementById('based-on-remaining-label');
    const reviewBasedOnIncome = document.getElementById('review-based-on-income-label');
    const reviewBasedOnRemaining = document.getElementById('review-based-on-remaining-label');
    if (basedOnIncome) basedOnIncome.innerHTML = `<strong>${t.basedOnIncome || 'Based on income'}:</strong>`;
    if (basedOnRemaining) basedOnRemaining.innerHTML = `<strong>${t.basedOnRemaining || 'Based on remaining'}:</strong>`;
    if (reviewBasedOnIncome) reviewBasedOnIncome.innerHTML = `<strong>${t.basedOnIncome || 'Based on income'}:</strong>`;
    if (reviewBasedOnRemaining) reviewBasedOnRemaining.innerHTML = `<strong>${t.basedOnRemaining || 'Based on remaining'}:</strong>`;
    
    // update trends and savings goal UI
    const trendsTitle = trendsContainer?.querySelector('h2');
    if (trendsTitle) trendsTitle.textContent = t.trendsTitle;
    const trendsDesc = trendsContainer?.querySelector('p');
    if (trendsDesc) trendsDesc.textContent = t.trendsDesc;
    const selectMonthsLabel = trendsContainer?.querySelector('label');
    if (selectMonthsLabel) selectMonthsLabel.textContent = t.selectMonths;
    if (trendsBackBtn) trendsBackBtn.textContent = t.back;
    
    const savingsGoalTitle = document.querySelector('#savings-goal-section h3');
    if (savingsGoalTitle) savingsGoalTitle.textContent = t.savingsGoal;
    const setSavingsLabel = document.querySelector('#savings-goal-section label');
    if (setSavingsLabel) setSavingsLabel.textContent = t.setSavingsTarget;
    if (setGoalBtn) setGoalBtn.textContent = t.setGoal;
    
    const insightsTitle = document.querySelector('#trends-insights h4');
    if (insightsTitle) insightsTitle.textContent = t.insights;
    
    // Predictions and warnings
    const predictionsTitle = document.getElementById('predictions-title');
    if (predictionsTitle) predictionsTitle.textContent = t.predictions;
    const warningsTitle = document.getElementById('warnings-title');
    if (warningsTitle) warningsTitle.textContent = t.warnings;
    const predictionSubtitle = document.getElementById('prediction-subtitle');
    if (predictionSubtitle) predictionSubtitle.textContent = t.basedOnAverage.replace('{months}', '3');
    
    // Debt calculator
    const debtTitle = debtContainer?.querySelector('h2');
    if (debtTitle) debtTitle.textContent = t.debtCalculator;
    if (addDebtBtn) addDebtBtn.textContent = t.addDebt;
    if (debtBackBtn) debtBackBtn.textContent = t.back;
    
    // PIN screen
    const pinTitle = document.getElementById('pin-title');
    if (pinTitle) pinTitle.textContent = t.unlockApp;
    
    // Undo/Redo buttons
    if (undoBtn) undoBtn.textContent = `↶ ${t.undo}`;
    if (redoBtn) redoBtn.textContent = `↷ ${t.redo}`;
  }

  // load saved language or default
  const savedLang = localStorage.getItem('lang');
  if (savedLang) currentLang = savedLang;
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      const v = e.target.value;
      localStorage.setItem('lang', v);
      applyLanguage(v);
      // fetch rates and apply currency changes
      fetchRates().then(() => {
        // update UI placeholders and any loaded data
        applyCurrencyToLoadedData();
      });
    });
  }

  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      const v = e.target.value;
      localStorage.setItem('currency', v);
      currentCurrency = v;
      // update placeholders to show selected currency
      phIncomeAmount = `Amount (${currentCurrency})`;
      phExpenseAmount = `Amount (${currentCurrency})`;
      document.querySelectorAll('.income-amount').forEach(i => i.placeholder = phIncomeAmount);
      document.querySelectorAll('.expense-amount').forEach(i => i.placeholder = phExpenseAmount);
      // fetch rates then update displayed saved data
      fetchRates().then(() => applyCurrencyToLoadedData());
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const v = e.target.value;
      applyTheme(v);
    });
  }

  function addIncomeRow(name = '', amount = '', note = '') {
    const row = createInputRow('income-name', 'income-amount', 'Income name (e.g., Salary)', 'Amount (SEK)');
    row.querySelector('.income-name').value = name;
    row.querySelector('.income-amount').value = amount;
    row.querySelector('.income-note').value = note;
    incomeList.appendChild(row);
  }

  function addExpenseRow(name = '', amount = '', note = '', recurring = false) {
    const row = createInputRow('expense-name', 'expense-amount', 'Expense name (e.g., Rent)', 'Amount (SEK)');
    row.querySelector('.expense-name').value = name;
    row.querySelector('.expense-amount').value = amount;
    row.querySelector('.expense-note').value = note;
    const recurringCheck = row.querySelector('.expense-recurring');
    if (recurringCheck) recurringCheck.checked = recurring;
    expenseList.appendChild(row);
  }

  // Find the most recent saved month data (if any)
  function getLatestHistoryEntry() {
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const months = Object.keys(history);
    if (!months.length) return null;
    months.sort();
    const latest = months[months.length - 1];
    return { key: latest, data: history[latest] };
  }

  function showRestoreBannerIfNeeded() {
    const latest = getLatestHistoryEntry();
    if (!latest) {
      restoreBanner.style.display = 'none';
      return;
    }
    // use t from function scope (declared at top)
    restoreText.textContent = t.restoreFound.replace('{month}', latest.key);
    restoreBanner.style.display = 'block';
  }

  loadPreviousBtn.addEventListener('click', () => {
    const latest = getLatestHistoryEntry();
    if (!latest) return;
    const payload = latest.data;
    // Clear current lists
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    const incomes = payload.incomes || [];
    const expenses = payload.expenses || [];
    // convert stored SEK amounts to display currency for the form
    if (incomes.length) {
      incomes.forEach(i => {
        const disp = convertFromSEK(i.amount, currentCurrency);
        addIncomeRow(i.name, Math.round(disp * 100) / 100, i.note || '');
      });
    } else {
      addIncomeRow();
    }
    if (expenses.length) {
      expenses.forEach(e => {
        const disp = convertFromSEK(e.amount, currentCurrency);
        addExpenseRow(e.name, Math.round(disp * 100) / 100, e.note || '', e.recurring || false);
      });
    } else {
      addExpenseRow();
    }

    multipleIncomeCB.checked = (incomes.length > 1);
    updateAddIncomeVisibility();
    const symbol = currencySymbol(currentCurrency);
    document.querySelectorAll('#results-currency').forEach(el => el.textContent = symbol);
    document.querySelectorAll('#review-currency').forEach(el => el.textContent = symbol);

    // Hide banner and allow user to edit or add
    restoreBanner.style.display = 'none';
  });

  startFreshBtn.addEventListener('click', () => {
    // Reset to a single empty row each and hide banner
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    addIncomeRow();
    addExpenseRow();
    multipleIncomeCB.checked = false;
    updateAddIncomeVisibility();
    restoreBanner.style.display = 'none';
  });

  addIncomeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveHistory();
    addIncomeRow();
  });

  addExpenseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    saveHistory();
    addExpenseRow();
  });

  // Hide/show "Add income" button depending on checkbox state
  function updateAddIncomeVisibility() {
    // Show the "Add income source" button only when multiple incomes are enabled
    if (multipleIncomeCB.checked) {
      addIncomeBtn.style.display = 'inline-block';
    } else {
      addIncomeBtn.style.display = 'none';
      // If the user disables multiple incomes, keep only the first income row
      const rows = incomeList.querySelectorAll('.income-row');
      rows.forEach((r, idx) => {
        if (idx > 0) r.remove();
      });
    }
  }

  multipleIncomeCB.addEventListener('change', () => {
    updateAddIncomeVisibility();
  });

  // set initial visibility
  updateAddIncomeVisibility();

  // Helper function to convert frequency to monthly amount
  function convertFrequencyToMonthly(amount, frequency) {
    switch (frequency) {
      case 'weekly':
        return amount * 52 / 12; // ~4.33 weeks per month
      case 'bi-weekly':
        return amount * 26 / 12; // ~2.17 bi-weekly periods per month
      case 'yearly':
        return amount / 12;
      case 'monthly':
      default:
        return amount;
    }
  }

  function readFormData() {
    const incomes = [];
    const incomeRows = incomeList.querySelectorAll('.income-row');
    incomeRows.forEach(r => {
      const name = r.querySelector('.income-name').value.trim() || 'Income';
      const amountInput = Number(r.querySelector('.income-amount').value) || 0;
      const frequency = r.querySelector('.income-frequency')?.value || 'monthly';
      const monthlyAmount = convertFrequencyToMonthly(amountInput, frequency);
      const amountSEK = convertToSEK(monthlyAmount, currentCurrency);
      const note = r.querySelector('.income-note').value.trim() || '';
      if (amountSEK !== 0) incomes.push({ name, amount: amountSEK, note });
    });

    const expenses = [];
    const expenseRows = expenseList.querySelectorAll('.expense-row');
    expenseRows.forEach(r => {
      const name = r.querySelector('.expense-name').value.trim() || 'Expense';
      const amountInput = Number(r.querySelector('.expense-amount').value) || 0;
      const frequency = r.querySelector('.expense-frequency')?.value || 'monthly';
      const monthlyAmount = convertFrequencyToMonthly(amountInput, frequency);
      const amountSEK = convertToSEK(monthlyAmount, currentCurrency);
      const note = r.querySelector('.expense-note').value.trim() || '';
      const recurring = r.querySelector('.expense-recurring')?.checked || false;
      if (amountSEK !== 0) expenses.push({ name, amount: amountSEK, note, recurring });
    });

    return { incomes, expenses };
  }

  // Detect duplicate names and offer to merge them
  function checkAndMergeDuplicates(incomes, expenses) {
    const t = translations[currentLang] || translations.en;
    
    // Check incomes for duplicates
    const incomeNames = incomes.map(i => i.name.toLowerCase());
    const uniqueIncomeNames = [...new Set(incomeNames)];
    if (uniqueIncomeNames.length < incomeNames.length) {
      // Found duplicates
      for (const uniqueName of uniqueIncomeNames) {
        const duplicateIndices = incomeNames
          .map((name, idx) => name === uniqueName ? idx : -1)
          .filter(idx => idx !== -1);
        if (duplicateIndices.length > 1) {
          const origName = incomes[duplicateIndices[0]].name;
          const mergeMsg = t.mergeSuggestion.replace('{name}', origName);
          const shouldMerge = confirm(`${t.duplicateDetected}\n\n${mergeMsg}`);
          if (shouldMerge) {
            // Merge: combine amounts and notes
            let totalAmount = 0;
            let mergedNote = '';
            duplicateIndices.forEach(idx => {
              totalAmount += incomes[idx].amount;
              if (incomes[idx].note) mergedNote += (mergedNote ? '; ' : '') + incomes[idx].note;
            });
            // Keep first, remove others from back to front to maintain indices
            incomes[duplicateIndices[0]].amount = totalAmount;
            incomes[duplicateIndices[0]].note = mergedNote;
            for (let i = duplicateIndices.length - 1; i > 0; i--) {
              incomes.splice(duplicateIndices[i], 1);
            }
            // After removing duplicates, update the incomeNames array
            incomeNames.length = 0;
            incomes.forEach(inc => incomeNames.push(inc.name.toLowerCase()));
          }
        }
      }
    }
    
    // Check expenses for duplicates
    const expenseNames = expenses.map(e => e.name.toLowerCase());
    const uniqueExpenseNames = [...new Set(expenseNames)];
    if (uniqueExpenseNames.length < expenseNames.length) {
      for (const uniqueName of uniqueExpenseNames) {
        const duplicateIndices = expenseNames
          .map((name, idx) => name === uniqueName ? idx : -1)
          .filter(idx => idx !== -1);
        if (duplicateIndices.length > 1) {
          const origName = expenses[duplicateIndices[0]].name;
          const mergeMsg = t.mergeSuggestion.replace('{name}', origName);
          const shouldMerge = confirm(`${t.duplicateDetected}\n\n${mergeMsg}`);
          if (shouldMerge) {
            let totalAmount = 0;
            let mergedNote = '';
            duplicateIndices.forEach(idx => {
              totalAmount += expenses[idx].amount;
              if (expenses[idx].note) mergedNote += (mergedNote ? '; ' : '') + expenses[idx].note;
            });
            // Keep first, remove others from back to front
            expenses[duplicateIndices[0]].amount = totalAmount;
            expenses[duplicateIndices[0]].note = mergedNote;
            for (let i = duplicateIndices.length - 1; i > 0; i--) {
              expenses.splice(duplicateIndices[i], 1);
            }
            // Update expenseNames array
            expenseNames.length = 0;
            expenses.forEach(exp => expenseNames.push(exp.name.toLowerCase()));
          }
        }
      }
    }
  }

  function generateColors(n) {
    const base = ['#ff4d4d', '#ff944d', '#ffcc4d', '#66b2ff', '#33cc33', '#9966ff', '#ff66b2', '#33cccc', '#ff9933', '#cccccc'];
    const colors = [];
    for (let i = 0; i < n; i++) colors.push(base[i % base.length]);
    return colors;
  }

  // When language/currency changes or when rates are refreshed, update any loaded form values that originated from stored data
  function applyCurrencyToLoadedData() {
    // If the form is showing restored/saved data (incomeList entries correspond to stored payload), we don't try to convert arbitrary user-typed values.
    // Best-effort: if inputs match numbers that came from storage (we don't track that), leave them. We'll at least update placeholders and review/results display.
    document.querySelectorAll('.income-amount').forEach(i => i.placeholder = phIncomeAmount);
    document.querySelectorAll('.expense-amount').forEach(i => i.placeholder = phExpenseAmount);
    // If the review panel is open and has currentReview, re-render it using the new currency
    if (currentReview) renderReview(currentReview);
    // update currency display spans
    const symbol = currencySymbol(currentCurrency);
    document.querySelectorAll('#results-currency').forEach(el => el.textContent = symbol);
    document.querySelectorAll('#review-currency').forEach(el => el.textContent = symbol);
    // If results are visible, re-render the last saved month if present
    // (We can repopulate chart by selecting the most recent saved month)
    if (resultsDiv.style.display !== 'none') {
      const latest = getLatestHistoryEntry();
      if (latest) {
        // reuse month select change code to redraw chart/values
        const data = latest.data;
        const incomes = data.incomes || [];
        const expenses = data.expenses || [];
        const totalIncomeSEK = incomes.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        const totalExpensesSEK = expenses.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        totalIncomeText.textContent = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
        totalExpensesText.textContent = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
        const remainingLatest = totalIncomeSEK - totalExpensesSEK;
        remainingText.textContent = Math.round(convertFromSEK(remainingLatest, currentCurrency) * 100) / 100;
        // recommendation for latest data (based on total income)
        const recLowLatestSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.05 : 0;
        const recHighLatestSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.10 : 0;
        if (save5AmountEl) save5AmountEl.textContent = Math.round(convertFromSEK(recLowLatestSEK, currentCurrency) * 100) / 100;
        if (save10AmountEl) save10AmountEl.textContent = Math.round(convertFromSEK(recHighLatestSEK, currentCurrency) * 100) / 100;
        // remaining after saving
        if (remainingAfter5El) remainingAfter5El.textContent = Math.round(convertFromSEK(remainingLatest - recLowLatestSEK, currentCurrency) * 100) / 100;
        if (remainingAfter10El) remainingAfter10El.textContent = Math.round(convertFromSEK(remainingLatest - recHighLatestSEK, currentCurrency) * 100) / 100;
        // update chart to show expenses in display currency
        const labels = expenses.map(e => e.name);
        const values = expenses.map(e => Math.round(convertFromSEK(e.amount, currentCurrency) * 100) / 100);
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
          type: 'pie',
          data: { labels: labels, datasets: [{ data: values, backgroundColor: generateColors(values.length) }] },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
      }
    }
  }

  // ============= MONTHLY SUMMARY =============
  function generateMonthlySummary(totalIncomeSEK, totalExpensesSEK, expenses) {
    const t = translations[currentLang] || translations.en;
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const months = Object.keys(history).sort();
    
    const totalIncomeDisp = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
    const totalExpensesDisp = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
    const remainingDisp = Math.round(convertFromSEK(totalIncomeSEK - totalExpensesSEK, currentCurrency) * 100) / 100;
    const symbol = currencySymbol(currentCurrency);
    
    // Find biggest category (highest expense)
    let biggestCategory = 'N/A';
    let biggestAmount = 0;
    expenses.forEach(exp => {
      if (exp.amount > biggestAmount) {
        biggestAmount = exp.amount;
        biggestCategory = exp.name;
      }
    });
    const biggestAmountDisp = Math.round(convertFromSEK(biggestAmount, currentCurrency) * 100) / 100;
    
    // Compare to last month
    let comparison = '';
    if (months.length >= 2) {
      const lastMonth = months[months.length - 1];
      const lastData = history[lastMonth];
      const lastExpenses = lastData.expenses.reduce((s, e) => s + e.amount, 0);
      const change = totalExpensesSEK - lastExpenses;
      const changePercent = lastExpenses > 0 ? (change / lastExpenses * 100).toFixed(1) : 0;
      const changeDisp = Math.round(convertFromSEK(Math.abs(change), currentCurrency) * 100) / 100;
      
      if (change > 0) {
        comparison = `<p>📈 Compared to last month: <span style="color:var(--error-color);">+${changeDisp} ${symbol} (+${Math.abs(changePercent)}%)</span></p>`;
      } else if (change < 0) {
        comparison = `<p>📉 Compared to last month: <span style="color:var(--success-color);">-${changeDisp} ${symbol} (-${Math.abs(changePercent)}%)</span></p>`;
      } else {
        comparison = `<p>➡️ Same as last month</p>`;
      }
    }
    
    const summaryContent = document.getElementById('summary-content');
    summaryContent.innerHTML = `
      <p><strong>Total Income:</strong> ${totalIncomeDisp} ${symbol}</p>
      <p><strong>Total Expenses:</strong> ${totalExpensesDisp} ${symbol}</p>
      <p><strong>Remaining:</strong> ${remainingDisp} ${symbol}</p>
      <p><strong>Biggest Category:</strong> ${biggestCategory} (${biggestAmountDisp} ${symbol})</p>
      ${comparison}
    `;
  }

  function calculateAndShow() {
    let { incomes, expenses } = readFormData();

    // Check for duplicates and prompt to merge (modifies arrays in place)
    checkAndMergeDuplicates(incomes, expenses);

    const totalIncomeSEK = incomes.reduce((s, it) => s + it.amount, 0);
    const totalExpensesSEK = expenses.reduce((s, it) => s + it.amount, 0);

    // display in current currency
    totalIncomeText.textContent = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
    totalExpensesText.textContent = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
    const remainingSEK = totalIncomeSEK - totalExpensesSEK;
    remainingText.textContent = Math.round(convertFromSEK(remainingSEK, currentCurrency) * 100) / 100;
    // recommendation: 5% - 10% of total income (if income <= 0, recommend 0)
    const tRec = translations[currentLang] || translations.en;
    const recLowSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.05 : 0;
    const recHighSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.10 : 0;
    const recLowDisp = Math.round(convertFromSEK(recLowSEK, currentCurrency) * 100) / 100;
    const recHighDisp = Math.round(convertFromSEK(recHighSEK, currentCurrency) * 100) / 100;
    const recRangeEl = document.getElementById('recommend-range');
    if (recRangeEl) recRangeEl.textContent = tRec.recRangeLabel || 'Recommended savings (5% - 10%):';
    if (save5AmountEl) save5AmountEl.textContent = recLowDisp;
    if (save10AmountEl) save10AmountEl.textContent = recHighDisp;
    // remaining after saving
    if (remainingAfter5El) remainingAfter5El.textContent = Math.round(convertFromSEK(remainingSEK - recLowSEK, currentCurrency) * 100) / 100;
    if (remainingAfter10El) remainingAfter10El.textContent = Math.round(convertFromSEK(remainingSEK - recHighSEK, currentCurrency) * 100) / 100;
    document.querySelectorAll('#results-currency').forEach(el => el.textContent = currencySymbol(currentCurrency));

    document.getElementById('question-container').style.display = 'none';
    resultsDiv.style.display = 'block';

    const labels = expenses.map(e => e.name);
    const values = expenses.map(e => Math.round(convertFromSEK(e.amount, currentCurrency) * 100) / 100);
    
    // Add savings amounts to chart as distinct slices
    const rec5Disp = Math.round(convertFromSEK(recLowSEK, currentCurrency) * 100) / 100;
    const rec10Disp = Math.round(convertFromSEK(recHighSEK, currentCurrency) * 100) / 100;
    const t = translations[currentLang] || translations.en;
    labels.push(`${t.save5Label || 'Save 5%'} (${rec5Disp})`);
    labels.push(`${t.save10Label || 'Save 10%'} (${rec10Disp})`);
    values.push(rec5Disp);
    values.push(rec10Disp);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: generateColors(values.length) }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // save incomes/expenses amounts in SEK
    saveMonthlyData({ incomes, expenses });
    populateMonthSelect();
    
    // Generate monthly summary
    generateMonthlySummary(totalIncomeSEK, totalExpensesSEK, expenses);
    
    // Update savings goal tracker
    updateSavingsGoalTracker(totalIncomeSEK, totalExpensesSEK);
    
    // Generate predictions and warnings
    generatePredictionsAndWarnings(totalIncomeSEK, totalExpensesSEK);
  }

  // Savings goal tracker functionality
  function updateSavingsGoalTracker(totalIncomeSEK, totalExpensesSEK) {
    const savedGoal = localStorage.getItem('savingsGoal');
    if (!savedGoal) {
      document.getElementById('savings-goal-display').style.display = 'none';
      return;
    }
    
    const goalSEK = Number(savedGoal);
    const remainingSEK = totalIncomeSEK - totalExpensesSEK;
    
    // Actual savings is the remaining amount (what's left after expenses)
    const actualSavingsSEK = remainingSEK > 0 ? remainingSEK : 0;
    
    const t = translations[currentLang] || translations.en;
    const goalDisp = Math.round(convertFromSEK(goalSEK, currentCurrency) * 100) / 100;
    const actualDisp = Math.round(convertFromSEK(actualSavingsSEK, currentCurrency) * 100) / 100;
    
    document.getElementById('goal-amount').textContent = goalDisp;
    document.getElementById('actual-savings').textContent = actualDisp;
    document.querySelectorAll('#goal-currency, #actual-currency').forEach(el => {
      el.textContent = currencySymbol(currentCurrency);
    });
    
    const percentage = goalSEK > 0 ? Math.min((actualSavingsSEK / goalSEK) * 100, 100) : 0;
    const progressBar = document.getElementById('savings-progress-bar');
    const progressText = document.getElementById('savings-progress-text');
    const statusText = document.getElementById('savings-status');
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage);
    
    if (actualSavingsSEK >= goalSEK) {
      statusText.textContent = t.goalMet || '🎉 Congratulations! You met your savings goal!';
      statusText.style.color = 'var(--success-color)';
    } else {
      const shortfall = goalSEK - actualSavingsSEK;
      const shortfallDisp = Math.round(convertFromSEK(shortfall, currentCurrency) * 100) / 100;
      let msg = t.goalNotMet || 'Keep going! You need {amount} more to reach your goal.';
      msg = msg.replace('{amount}', `${shortfallDisp} ${currencySymbol(currentCurrency)}`);
      statusText.textContent = msg;
      statusText.style.color = 'var(--text-secondary)';
    }
    
    document.getElementById('savings-goal-display').style.display = 'block';
  }

  // Set savings goal button handler
  if (setGoalBtn) {
    setGoalBtn.addEventListener('click', () => {
      const goalInput = Number(savingsGoalInput.value) || 0;
      if (goalInput <= 0) {
        alert('Please enter a valid savings goal amount.');
        return;
      }
      
      // Convert to SEK for storage
      const goalSEK = convertToSEK(goalInput, currentCurrency);
      localStorage.setItem('savingsGoal', goalSEK);
      
      savingsGoalInput.value = '';
      alert('Savings goal set successfully!');
      
      // Update display if results are showing
      if (resultsDiv.style.display === 'block') {
        const totalIncomeSEK = Number(totalIncomeText.textContent.replace(/[^\d.-]/g, '')) || 0;
        const totalExpensesSEK = Number(totalExpensesText.textContent.replace(/[^\d.-]/g, '')) || 0;
        updateSavingsGoalTracker(
          convertToSEK(totalIncomeSEK, currentCurrency),
          convertToSEK(totalExpensesSEK, currentCurrency)
        );
      }
    });
  }

  // ============= AUTO-FILL FROM LAST MONTH =============
  if (autoFillBtn) {
    autoFillBtn.addEventListener('click', () => {
      const t = translations[currentLang] || translations.en;
      const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
      const months = Object.keys(history).sort();
      
      if (months.length === 0) {
        alert(t.noDataToFill || 'No previous month data available');
        return;
      }
      
      const lastMonth = months[months.length - 1];
      const lastData = history[lastMonth];
      
      // Clear existing rows
      incomeList.innerHTML = '';
      expenseList.innerHTML = '';
      
      // Fill incomes
      if (lastData.incomes && lastData.incomes.length > 0) {
        lastData.incomes.forEach(inc => {
          const amountDisp = Math.round(convertFromSEK(inc.amount, currentCurrency) * 100) / 100;
          addIncomeRow(inc.name, amountDisp, inc.note || '');
        });
      } else {
        addIncomeRow('', '', '');
      }
      
      // Fill expenses (including recurring bills automatically)
      if (lastData.expenses && lastData.expenses.length > 0) {
        lastData.expenses.forEach(exp => {
          const amountDisp = Math.round(convertFromSEK(exp.amount, currentCurrency) * 100) / 100;
          addExpenseRow(exp.name, amountDisp, exp.note || '', exp.recurring || false);
        });
      } else {
        addExpenseRow('', '', '', false);
      }
      
      alert(t.autoFillSuccess || 'Pre-filled with last month\'s data. Edit as needed.');
    });
  }

  // ============= PREDICTIONS & WARNINGS =============
  function generatePredictionsAndWarnings(totalIncomeSEK, totalExpensesSEK) {
    const t = translations[currentLang] || translations.en;
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const months = Object.keys(history).sort();
    
    // Need at least 2 months for trends
    if (months.length < 2) {
      document.getElementById('predictions-section').style.display = 'none';
      document.getElementById('warnings-section').style.display = 'none';
      return;
    }
    
    // Get last 3 months average
    const recentMonths = months.slice(-3);
    let avgIncome = 0, avgExpenses = 0;
    recentMonths.forEach(month => {
      const data = history[month];
      avgIncome += data.incomes.reduce((s, i) => s + i.amount, 0);
      avgExpenses += data.expenses.reduce((s, e) => s + e.amount, 0);
    });
    avgIncome /= recentMonths.length;
    avgExpenses /= recentMonths.length;
    
    // Predictions
    const predictedRemaining = avgIncome - avgExpenses;
    const avgIncomeDisp = Math.round(convertFromSEK(avgIncome, currentCurrency) * 100) / 100;
    const avgExpensesDisp = Math.round(convertFromSEK(avgExpenses, currentCurrency) * 100) / 100;
    const predictedRemainingDisp = Math.round(convertFromSEK(predictedRemaining, currentCurrency) * 100) / 100;
    
    document.getElementById('predictions-section').style.display = 'block';
    document.getElementById('predictions-content').innerHTML = `
      <p><strong>${t.predictedExpenses || 'Predicted Expenses'}:</strong> ${avgExpensesDisp} ${currencySymbol(currentCurrency)}</p>
      <p><strong>${t.predictedRemaining || 'Predicted Remaining'}:</strong> ${predictedRemainingDisp} ${currencySymbol(currentCurrency)}</p>
      <p style="font-size:12px; color:var(--text-muted);">${t.basedOnAverage.replace('{months}', recentMonths.length)}</p>
    `;
    
    // Warnings
    const warnings = [];
    const lastMonth = history[months[months.length - 1]];
    const lastExpenses = lastMonth.expenses.reduce((s, e) => s + e.amount, 0);
    
    // Check expense change
    if (months.length >= 2) {
      const prevMonth = history[months[months.length - 2]];
      const prevExpenses = prevMonth.expenses.reduce((s, e) => s + e.amount, 0);
      const change = ((lastExpenses - prevExpenses) / prevExpenses) * 100;
      
      if (change > 10) {
        warnings.push(`⚠️ ${t.expensesIncreased.replace('{percent}', Math.round(change))}`);
      } else if (change < -10) {
        warnings.push(`✅ ${t.expensesDecreased.replace('{percent}', Math.round(Math.abs(change)))}`);
      }
    }
    
    // Check if predicted remaining is negative
    if (predictedRemaining < 0) {
      warnings.push(`🚨 ${t.negativeRemainingWarning}`);
    }
    
    // Check savings vs recommendation
    const remainingSEK = totalIncomeSEK - totalExpensesSEK;
    const savingsPercent = totalIncomeSEK > 0 ? (remainingSEK / totalIncomeSEK) * 100 : 0;
    if (savingsPercent < 5 && totalIncomeSEK > 0) {
      const recommended5 = totalIncomeSEK * 0.05;
      const shortfall = recommended5 - remainingSEK;
      const shortfallDisp = Math.round(convertFromSEK(shortfall, currentCurrency) * 100) / 100;
      warnings.push(`⚠️ ${t.lowSavingsWarning.replace('{amount}', shortfallDisp + ' ' + currencySymbol(currentCurrency))}`);
    } else if (savingsPercent >= 10) {
      warnings.push(`🎉 ${t.excellentSavings.replace('{percent}', Math.round(savingsPercent))}`);
    }
    
    if (warnings.length > 0) {
      document.getElementById('warnings-section').style.display = 'block';
      document.getElementById('warnings-content').innerHTML = warnings.map(w => `<p style="margin:4px 0;">${w}</p>`).join('');
    } else {
      document.getElementById('warnings-section').style.display = 'none';
    }
  }

  // ============= DEBT PAYOFF CALCULATOR =============
  let debts = [];
  
  if (debtCalcBtn) {
    debtCalcBtn.addEventListener('click', () => {
      showDebtCalculator();
    });
  }
  
  if (debtBackBtn) {
    debtBackBtn.addEventListener('click', () => {
      debtContainer.style.display = 'none';
      startMenu.style.display = 'block';
    });
  }
  
  if (addDebtBtn) {
    addDebtBtn.addEventListener('click', addDebtRow);
  }
  
  function showDebtCalculator() {
    startMenu.style.display = 'none';
    debtContainer.style.display = 'block';
    loadDebts();
  }
  
  function loadDebts() {
    const stored = localStorage.getItem('debts');
    debts = stored ? JSON.parse(stored) : [];
    renderDebtList();
  }
  
  function saveDebts() {
    localStorage.setItem('debts', JSON.stringify(debts));
  }
  
  function addDebtRow() {
    const t = translations[currentLang] || translations.en;
    const name = prompt(t.debtName || 'Debt Name:');
    if (!name) return;
    
    const amount = Number(prompt(t.debtAmount || 'Amount Owed:'));
    if (!amount || amount <= 0 || isNaN(amount)) return;
    
    const rateInput = prompt(t.interestRate || 'Interest Rate (% - decimals allowed, e.g., 5.25):');
    if (rateInput === null || rateInput === '') return;
    const rate = Number(rateInput.replace(',', '.'));
    if (isNaN(rate) || rate < 0) return;
    
    const minPayment = Number(prompt(t.minimumPayment || 'Minimum Payment:'));
    if (!minPayment || minPayment <= 0 || isNaN(minPayment)) return;
    
    debts.push({ name, amount, rate, minPayment });
    saveDebts();
    renderDebtList();
  }
  
  function renderDebtList() {
    const t = translations[currentLang] || translations.en;
    const debtList = document.getElementById('debt-list');
    
    if (debts.length === 0) {
      debtList.innerHTML = `<p style="color:var(--text-muted);">No debts added. Click "Add Debt" to start.</p>`;
      document.getElementById('debt-results').style.display = 'none';
      return;
    }
    
    debtList.innerHTML = debts.map((debt, idx) => `
      <div style="padding:12px; margin:8px 0; background:var(--bg-secondary); border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${debt.name}</strong><br>
            <span style="font-size:14px;">Amount: ${debt.amount} ${currencySymbol(currentCurrency)} | Rate: ${debt.rate}% | Min Payment: ${debt.minPayment} ${currencySymbol(currentCurrency)}</span>
          </div>
          <button onclick="removeDebt(${idx})" style="background:var(--error-color); color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Delete</button>
        </div>
      </div>
    `).join('');
    
    calculateDebtPayoff();
  }
  
  window.removeDebt = function(idx) {
    debts.splice(idx, 1);
    saveDebts();
    renderDebtList();
  };
  
  function calculateDebtPayoff() {
    const t = translations[currentLang] || translations.en;
    if (debts.length === 0) return;
    
    // Snowball method (smallest balance first)
    const snowballDebts = [...debts].sort((a, b) => a.amount - b.amount);
    const snowballResult = simulatePayoff(snowballDebts);
    
    // Avalanche method (highest interest first)
    const avalancheDebts = [...debts].sort((a, b) => b.rate - a.rate);
    const avalancheResult = simulatePayoff(avalancheDebts);
    
    document.getElementById('debt-results').style.display = 'block';
    
    document.getElementById('snowball-content').innerHTML = `
      <p><strong>${t.monthsToPayoff || 'Months to payoff'}:</strong> ${snowballResult.months}</p>
      <p><strong>${t.totalInterest || 'Total interest paid'}:</strong> ${snowballResult.totalInterest} ${currencySymbol(currentCurrency)}</p>
    `;
    
    document.getElementById('avalanche-content').innerHTML = `
      <p><strong>${t.monthsToPayoff || 'Months to payoff'}:</strong> ${avalancheResult.months}</p>
      <p><strong>${t.totalInterest || 'Total interest paid'}:</strong> ${avalancheResult.totalInterest} ${currencySymbol(currentCurrency)}</p>
      <p style="color:var(--success-color); margin-top:8px;">💡 Typically saves more money in interest!</p>
    `;
  }
  
  function simulatePayoff(sortedDebts) {
    let months = 0;
    let totalInterest = 0;
    const workingDebts = sortedDebts.map(d => ({ ...d }));
    
    while (workingDebts.some(d => d.amount > 0)) {
      months++;
      if (months > 600) break; // Safety limit (50 years)
      
      // Apply interest and minimum payments
      workingDebts.forEach(debt => {
        if (debt.amount > 0) {
          const monthlyRate = debt.rate / 100 / 12;
          const interest = debt.amount * monthlyRate;
          totalInterest += interest;
          debt.amount += interest;
          debt.amount -= Math.min(debt.minPayment, debt.amount);
        }
      });
    }
    
    return { months, totalInterest: Math.round(totalInterest * 100) / 100 };
  }

  function saveMonthlyData(payload) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()+1}`;
    let history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    // Ensure amounts stored in payload are in SEK
    const copy = { incomes: [], expenses: [] };
    (payload.incomes || []).forEach(i => copy.incomes.push({ name: i.name, amount: Number(i.amount) || 0 }));
    (payload.expenses || []).forEach(e => copy.expenses.push({ name: e.name, amount: Number(e.amount) || 0 }));
    history[monthKey] = copy;
    localStorage.setItem('budgetHistory', JSON.stringify(history));
  }

  function populateMonthSelect() {
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    monthSelect.innerHTML = '<option value="">Select month</option>';
    Object.keys(history).sort().reverse().forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }

  monthSelect.addEventListener('change', (e) => {
    const month = e.target.value;
    if (!month) return;
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const data = history[month];
    if (!data) return;

    const incomes = data.incomes || [];
    const expenses = data.expenses || [];

    const totalIncomeSEK = incomes.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalExpensesSEK = expenses.reduce((s, it) => s + (Number(it.amount) || 0), 0);

    totalIncomeText.textContent = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
    totalExpensesText.textContent = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
    const remainingSel = totalIncomeSEK - totalExpensesSEK;
    remainingText.textContent = Math.round(convertFromSEK(remainingSel, currentCurrency) * 100) / 100;

    // recommendation for selected month
    const remainingSelSEK = totalIncomeSEK - totalExpensesSEK;
    const recLowSelSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.05 : 0;
    const recHighSelSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.10 : 0;
    if (save5AmountEl) save5AmountEl.textContent = Math.round(convertFromSEK(recLowSelSEK, currentCurrency) * 100) / 100;
    if (save10AmountEl) save10AmountEl.textContent = Math.round(convertFromSEK(recHighSelSEK, currentCurrency) * 100) / 100;
    // show remaining after saving for selected month
    if (remainingAfter5El) remainingAfter5El.textContent = Math.round(convertFromSEK(remainingSel - recLowSelSEK, currentCurrency) * 100) / 100;
    if (remainingAfter10El) remainingAfter10El.textContent = Math.round(convertFromSEK(remainingSel - recHighSelSEK, currentCurrency) * 100) / 100;

    const labels = expenses.map(e => e.name);
    const values = expenses.map(e => Math.round(convertFromSEK(e.amount, currentCurrency) * 100) / 100);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'pie',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: generateColors(values.length) }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  });

  calculateBtn.addEventListener('click', () => calculateAndShow());

  // ============= PDF EXPORT =============
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const t = translations[currentLang] || translations.en;
      
      // Get current data
      const totalIncome = document.getElementById('total-income').textContent;
      const totalExpenses = document.getElementById('total-expenses').textContent;
      const remaining = document.getElementById('remaining').textContent;
      const symbol = currencySymbol(currentCurrency);
      
      // Add title
      doc.setFontSize(18);
      doc.text('Monthly Budget Report', 20, 20);
      
      // Add date
      doc.setFontSize(11);
      const today = new Date().toLocaleDateString();
      doc.text(`Generated: ${today}`, 20, 30);
      
      // Add summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 45);
      doc.setFontSize(11);
      doc.text(`Total Income: ${totalIncome} ${symbol}`, 25, 55);
      doc.text(`Total Expenses: ${totalExpenses} ${symbol}`, 25, 62);
      doc.text(`Remaining: ${remaining} ${symbol}`, 25, 69);
      
      // Add expenses breakdown
      let yPos = 85;
      doc.setFontSize(14);
      doc.text('Expenses Breakdown', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const expenseRows = document.querySelectorAll('.expense-row');
      expenseRows.forEach(row => {
        const name = row.querySelector('.expense-name').value;
        const amount = row.querySelector('.expense-amount').value;
        if (name && amount) {
          doc.text(`${name}: ${amount} ${symbol}`, 25, yPos);
          yPos += 7;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        }
      });
      
      // Add savings goal if set
      const goalDisplay = document.getElementById('savings-goal-display');
      if (goalDisplay && goalDisplay.style.display !== 'none') {
        yPos += 10;
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.text('Savings Goal', 20, yPos);
        yPos += 10;
        doc.setFontSize(11);
        const goal = document.getElementById('goal-amount').textContent;
        const actual = document.getElementById('actual-savings').textContent;
        const progress = document.getElementById('savings-progress-text').textContent;
        doc.text(`Goal: ${goal} ${symbol}`, 25, yPos);
        doc.text(`Actual: ${actual} ${symbol} (${progress}%)`, 25, yPos + 7);
      }
      
      // Save the PDF
      doc.save(`budget-report-${today.replace(/\//g, '-')}.pdf`);
    });
  }

  // Apply nicer button classes to existing buttons (in case CSS added)
  addIncomeBtn.classList.add('big-btn');
  addExpenseBtn.classList.add('big-btn');
  calculateBtn.classList.add('big-btn');

  // initialize with one row each
  populateMonthSelect();
  // Start by showing the start menu
  startMenu.style.display = 'block';
  document.getElementById('question-container').style.display = 'none';
  resultsDiv.style.display = 'none';

  // Wire up start menu buttons
  remakeBtn.addEventListener('click', () => {
    // If there is existing history, ask for confirmation before resetting
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const hasExisting = Object.keys(history).length > 0;
    if (hasExisting) {
      const t = translations[currentLang] || translations.en;
      const ok = confirm(t.confirmReset || 'A calculation already exists. Reset the budget and start fresh?');
      if (!ok) return; // cancel
      // Clear saved history on confirm
      localStorage.removeItem('budgetHistory');
      monthSelect.innerHTML = '<option value="">Select month</option>';
    }

    // Clear form for a new calculation
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    addIncomeRow();
    addExpenseRow();
    multipleIncomeCB.checked = false;
    updateAddIncomeVisibility();

    startMenu.style.display = 'none';
    reviewContainer.style.display = 'none';
    document.getElementById('question-container').style.display = 'block';
    restoreBanner.style.display = 'none';
  });

  reviewBtn.addEventListener('click', () => {
    const latest = getLatestHistoryEntry();
    if (!latest) {
      const t = translations[currentLang] || translations.en;
      alert(t.noSavedBudget || 'No saved budget found. Please create a calculation first.');
      return;
    }
    // Render review view
    currentReview = { key: latest.key, incomes: (latest.data.incomes||[]).map(i=>({ ...i })), expenses: (latest.data.expenses||[]).map(e=>({ ...e })) };
    renderReview(currentReview);
    startMenu.style.display = 'none';
    reviewContainer.style.display = 'block';
  });

  reviewBackBtn.addEventListener('click', () => {
    reviewContainer.style.display = 'none';
    startMenu.style.display = 'block';
  });

  // Trends button handler
  if (trendsBtn) {
    trendsBtn.addEventListener('click', () => {
      showTrendsView();
    });
  }

  if (trendsBackBtn) {
    trendsBackBtn.addEventListener('click', () => {
      trendsContainer.style.display = 'none';
      startMenu.style.display = 'block';
    });
  }

  // Show trends view with bar chart
  let trendsChart = null;
  function showTrendsView() {
    const t = translations[currentLang] || translations.en;
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    const months = Object.keys(history).sort();
    
    if (months.length < 2) {
      alert(t.noTrendsData || 'Not enough data. Create budgets for multiple months to see trends.');
      return;
    }
    
    // Populate month selector
    trendsMonthsSelect.innerHTML = '';
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = month;
      option.selected = true; // Select all by default
      trendsMonthsSelect.appendChild(option);
    });
    
    startMenu.style.display = 'none';
    resultsDiv.style.display = 'none';
    reviewContainer.style.display = 'none';
    trendsContainer.style.display = 'block';
    
    // Initial render
    renderTrendsChart();
    
    // Update chart when selection changes
    trendsMonthsSelect.addEventListener('change', renderTrendsChart);
  }

  function renderTrendsChart() {
    const selectedOptions = Array.from(trendsMonthsSelect.selectedOptions);
    const selectedMonths = selectedOptions.map(opt => opt.value);
    
    if (selectedMonths.length === 0) return;
    
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    
    // Collect all unique expense categories across selected months
    const allCategories = new Set();
    selectedMonths.forEach(month => {
      const data = history[month];
      if (data && data.expenses) {
        data.expenses.forEach(exp => allCategories.add(exp.name));
      }
    });
    
    const categories = Array.from(allCategories);
    
    // Build dataset for each month
    const datasets = selectedMonths.map((month, idx) => {
      const data = history[month];
      const amounts = categories.map(cat => {
        const expense = data.expenses?.find(e => e.name === cat);
        if (expense) {
          return Math.round(convertFromSEK(expense.amount, currentCurrency) * 100) / 100;
        }
        return 0;
      });
      
      // Color palette for different months
      const colors = [
        'rgba(96, 165, 250, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)'
      ];
      
      return {
        label: month,
        data: amounts,
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.8', '1'),
        borderWidth: 1
      };
    });
    
    // Destroy existing chart
    if (trendsChart) {
      trendsChart.destroy();
    }
    
    const ctx = document.getElementById('trendsChart').getContext('2d');
    trendsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Expense Comparison (${currencySymbol(currentCurrency)})`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `Amount (${currencySymbol(currentCurrency)})`
            }
          }
        }
      }
    });
    
    // Generate insights
    generateTrendsInsights(selectedMonths, history, categories);
  }

  function generateTrendsInsights(selectedMonths, history, categories) {
    const t = translations[currentLang] || translations.en;
    const insightsDiv = document.getElementById('trends-insights');
    const insightsContent = document.getElementById('trends-insights-content');
    
    if (selectedMonths.length < 2) {
      insightsDiv.style.display = 'none';
      return;
    }
    
    insightsDiv.style.display = 'block';
    insightsContent.innerHTML = '';
    
    // Compare first and last selected months
    const firstMonth = selectedMonths[0];
    const lastMonth = selectedMonths[selectedMonths.length - 1];
    
    const firstData = history[firstMonth];
    const lastData = history[lastMonth];
    
    const insights = [];
    
    categories.forEach(cat => {
      const firstExp = firstData.expenses?.find(e => e.name === cat);
      const lastExp = lastData.expenses?.find(e => e.name === cat);
      
      const firstAmount = firstExp ? firstExp.amount : 0;
      const lastAmount = lastExp ? lastExp.amount : 0;
      
      if (firstAmount === 0 && lastAmount === 0) return;
      
      const change = lastAmount - firstAmount;
      const changeDisp = Math.round(convertFromSEK(Math.abs(change), currentCurrency) * 100) / 100;
      const percentChange = firstAmount > 0 ? Math.round((change / firstAmount) * 100) : 100;
      
      if (Math.abs(percentChange) > 10) { // Only show significant changes
        if (change > 0) {
          let msg = t.categoryIncreased || '{category} increased by {amount} ({percent}%)';
          msg = msg.replace('{category}', cat)
                   .replace('{amount}', `${changeDisp} ${currencySymbol(currentCurrency)}`)
                   .replace('{percent}', Math.abs(percentChange));
          insights.push(`<p style="color:var(--error-color);">▲ ${msg}</p>`);
        } else {
          let msg = t.categoryDecreased || '{category} decreased by {amount} ({percent}%)';
          msg = msg.replace('{category}', cat)
                   .replace('{amount}', `${changeDisp} ${currencySymbol(currentCurrency)}`)
                   .replace('{percent}', Math.abs(percentChange));
          insights.push(`<p style="color:var(--success-color);">▼ ${msg}</p>`);
        }
      }
    });
    
    if (insights.length === 0) {
      insightsContent.innerHTML = '<p>No significant changes detected.</p>';
    } else {
      insightsContent.innerHTML = insights.join('');
    }
  }

  reviewBackBtn.addEventListener('click', () => {
    reviewContainer.style.display = 'none';
    startMenu.style.display = 'block';
  });

  reviewSaveBtn.addEventListener('click', () => {
    if (!currentReview) return;
    // Save edits back to localStorage under the same key
    const history = JSON.parse(localStorage.getItem('budgetHistory')) || {};
    history[currentReview.key] = { incomes: currentReview.incomes, expenses: currentReview.expenses };
    localStorage.setItem('budgetHistory', JSON.stringify(history));
    populateMonthSelect();
    alert('Changes saved.');
    // After saving, go back to start menu
    reviewContainer.style.display = 'none';
    startMenu.style.display = 'block';
  });

  // Download comprehensive summary as PNG
  const downloadBtn = document.getElementById('download-review-chart');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!currentReview) {
        const t = translations[currentLang] || translations.en;
        alert(t.noSavedBudget || 'No data available');
        return;
      }
      try {
        const payload = currentReview;
        const t = translations[currentLang] || translations.en;
        const totalIncomeSEK = (payload.incomes || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const totalExpensesSEK = (payload.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const remainingSEK = totalIncomeSEK - totalExpensesSEK;
        const recLowSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.05 : 0;
        const recHighSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.10 : 0;
        
        const totalIncomeDisp = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
        const totalExpensesDisp = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
        const remainingDisp = Math.round(convertFromSEK(remainingSEK, currentCurrency) * 100) / 100;
        const rec5Disp = Math.round(convertFromSEK(recLowSEK, currentCurrency) * 100) / 100;
        const rec10Disp = Math.round(convertFromSEK(recHighSEK, currentCurrency) * 100) / 100;
        const sym = currencySymbol(currentCurrency);
        
        // Create summary canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let y = 40;
        const lineHeight = 30;
        const indent = 30;
        
        // Title
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(t.budgetSummary || 'Budget Summary', indent, y);
        y += 40;
        
        // Month
        ctx.font = '16px Arial';
        ctx.fillStyle = '#555';
        ctx.fillText(`${t.monthColon || 'Month:'} ${payload.key}`, indent, y);
        y += 30;
        
        // Incomes section
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(t.reviewIncomes + ':', indent, y);
        y += lineHeight;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        (payload.incomes || []).forEach(inc => {
          const dispInc = Math.round(convertFromSEK(inc.amount, currentCurrency) * 100) / 100;
          ctx.fillText(`  ${inc.name}: ${dispInc} ${sym}`, indent, y);
          y += lineHeight;
          if (inc.note) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText(`    Note: ${inc.note}`, indent, y);
            y += lineHeight * 0.7;
            ctx.font = '14px Arial';
            ctx.fillStyle = '#333';
          }
        });
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${t.totalIncome}: ${totalIncomeDisp} ${sym}`, indent, y);
        y += 35;
        
        // Expenses section
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(t.reviewExpenses + ':', indent, y);
        y += lineHeight;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        (payload.expenses || []).forEach(exp => {
          const dispExp = Math.round(convertFromSEK(exp.amount, currentCurrency) * 100) / 100;
          ctx.fillText(`  ${exp.name}: ${dispExp} ${sym}`, indent, y);
          y += lineHeight;
          if (exp.note) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText(`    Note: ${exp.note}`, indent, y);
            y += lineHeight * 0.7;
            ctx.font = '14px Arial';
            ctx.fillStyle = '#333';
          }
        });
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${t.totalExpenses}: ${totalExpensesDisp} ${sym}`, indent, y);
        y += 35;
        
        // Summary section
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${t.summaryColon || 'Summary:'}`, indent, y);
        y += lineHeight;
        ctx.font = '16px Arial';
        ctx.fillStyle = remainingDisp >= 0 ? '#22863a' : '#cb2431';
        ctx.fillText(`${t.remaining}: ${remainingDisp} ${sym}`, indent, y);
        y += 35;
        
        // Recommendations
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${t.recRangeLabel || 'Recommended savings (5% - 10%):'}`, indent, y);
        y += lineHeight;
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(`${t.save5Label}: ${rec5Disp} ${sym}`, indent, y);
        y += lineHeight;
        ctx.fillText(`${t.save10Label}: ${rec10Disp} ${sym}`, indent, y);
        y += 35;
        
        // Remaining after saving
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#555';
        const remainAfter5 = Math.round(convertFromSEK(remainingSEK - recLowSEK, currentCurrency) * 100) / 100;
        const remainAfter10 = Math.round(convertFromSEK(remainingSEK - recHighSEK, currentCurrency) * 100) / 100;
        ctx.fillText(`${t.afterSaving5 || 'After saving 5%:'} ${remainAfter5} ${sym}`, indent, y);
        y += lineHeight;
        ctx.fillText(`${t.afterSaving10 || 'After saving 10%:'} ${remainAfter10} ${sym}`, indent, y);
        
        // Download
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        const filename = `budget-${payload.key}.png`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        console.error('Download failed', e);
        alert('Unable to download summary.');
      }
    });
  }

  // Render review data into the review container
  function renderReview(payload) {
    const t = translations[currentLang] || translations.en;
    reviewMonth.textContent = t.monthLabel.replace('{month}', payload.key);
    reviewIncomes.innerHTML = '';
    reviewExpenses.innerHTML = '';

    // compute totals
    const totalIncomeSEK = (payload.incomes || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExpensesSEK = (payload.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const remainingSEK = totalIncomeSEK - totalExpensesSEK;
    const totalIncomeDisp = Math.round(convertFromSEK(totalIncomeSEK, currentCurrency) * 100) / 100;
    const totalExpensesDisp = Math.round(convertFromSEK(totalExpensesSEK, currentCurrency) * 100) / 100;
    const remainingDisp = Math.round(convertFromSEK(remainingSEK, currentCurrency) * 100) / 100;
    reviewTotalIncomeEl.textContent = totalIncomeDisp;
    reviewTotalExpensesEl.textContent = totalExpensesDisp;
    reviewRemainingEl.textContent = remainingDisp;
    // colorize remaining
    reviewRemainingEl.parentElement.classList.remove('positive','negative');
    if (remainingDisp >= 0) reviewRemainingEl.parentElement.classList.add('positive');
    else reviewRemainingEl.parentElement.classList.add('negative');

    // review recommendations (based on total income)
    const recLowSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.05 : 0;
    const recHighSEK = totalIncomeSEK > 0 ? totalIncomeSEK * 0.10 : 0;
    const recLowDisp = Math.round(convertFromSEK(recLowSEK, currentCurrency) * 100) / 100;
    const recHighDisp = Math.round(convertFromSEK(recHighSEK, currentCurrency) * 100) / 100;
    const reviewSave5El = document.getElementById('review-save5');
    const reviewSave10El = document.getElementById('review-save10');
    if (reviewSave5El) reviewSave5El.innerHTML = `${t.save5Label || 'Save 5%'}: <strong><span id="review-save5-amount">${recLowDisp}</span> ${currencySymbol(currentCurrency)}</strong>`;
    if (reviewSave10El) reviewSave10El.innerHTML = `${t.save10Label || 'Save 10%'}: <strong><span id="review-save10-amount">${recHighDisp}</span> ${currencySymbol(currentCurrency)}</strong>`;
    // show remaining after saving in review
    if (reviewRemainingAfter5El) reviewRemainingAfter5El.textContent = Math.round(convertFromSEK(remainingSEK - recLowSEK, currentCurrency) * 100) / 100;
    if (reviewRemainingAfter10El) reviewRemainingAfter10El.textContent = Math.round(convertFromSEK(remainingSEK - recHighSEK, currentCurrency) * 100) / 100;

    payload.incomes.forEach((inc, idx) => {
      const row = document.createElement('div');
      row.className = 'review-row';
      const left = document.createElement('div'); left.className = 'left';
      const name = document.createElement('div'); name.className = 'name'; name.textContent = inc.name;
      const amt = document.createElement('div'); amt.className = 'amount';
      const displayInc = Math.round(convertFromSEK(inc.amount, currentCurrency) * 100) / 100;
      amt.textContent = `${displayInc} ${currencySymbol(currentCurrency)}`;
      left.appendChild(name); left.appendChild(amt);
      // Add note if present
      if (inc.note) {
        const noteEl = document.createElement('div'); noteEl.style.fontSize = '12px'; noteEl.style.color = '#666'; noteEl.textContent = `Note: ${inc.note}`;
        left.appendChild(noteEl);
      }
      const btn = document.createElement('button'); btn.className = 'three-dots'; btn.textContent = '⋮';
      btn.addEventListener('click', () => {
        const t = translations[currentLang] || translations.en;
        const disp = Math.round(convertFromSEK(inc.amount, currentCurrency) * 100) / 100;
        const newName = prompt(t.editIncomeNamePrompt, inc.name);
        if (newName !== null) inc.name = newName.trim() || inc.name;
        const newAmt = prompt(`${t.editAmountPrompt} (${currencySymbol(currentCurrency)})`, disp);
        if (newAmt !== null) inc.amount = convertToSEK(Number(newAmt) || 0, currentCurrency);
        const newNote = prompt('Edit note:', inc.note || '');
        if (newNote !== null) inc.note = newNote.trim();
        renderReview(currentReview);
      });
      const del = document.createElement('button'); del.className = 'delete-btn'; del.textContent = (translations[currentLang]||translations.en).deleteBtn || 'Delete';
      del.addEventListener('click', () => {
        const t = translations[currentLang] || translations.en;
        const confirmMsg = t.deleteConfirm.replace('{name}', inc.name);
        if (confirm(confirmMsg)) {
          payload.incomes.splice(idx, 1);
          renderReview(currentReview);
        }
      });
      row.appendChild(left);
      const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.gap = '6px'; controls.appendChild(btn); controls.appendChild(del);
      row.appendChild(controls);
      reviewIncomes.appendChild(row);
    });

    payload.expenses.forEach((exp, idx) => {
      const row = document.createElement('div');
      row.className = 'review-row';
      const left = document.createElement('div'); left.className = 'left';
      const name = document.createElement('div'); name.className = 'name'; name.textContent = exp.name;
      const amt = document.createElement('div'); amt.className = 'amount';
      const displayExp = Math.round(convertFromSEK(exp.amount, currentCurrency) * 100) / 100;
      amt.textContent = `${displayExp} ${currencySymbol(currentCurrency)}`;
      left.appendChild(name); left.appendChild(amt);
      // Add note if present
      if (exp.note) {
        const noteEl = document.createElement('div'); noteEl.style.fontSize = '12px'; noteEl.style.color = '#666'; noteEl.textContent = `Note: ${exp.note}`;
        left.appendChild(noteEl);
      }
      const btn = document.createElement('button'); btn.className = 'three-dots'; btn.textContent = '⋮';
      btn.addEventListener('click', () => {
        const t = translations[currentLang] || translations.en;
        const disp = Math.round(convertFromSEK(exp.amount, currentCurrency) * 100) / 100;
        const newName = prompt(t.editIncomeNamePrompt, exp.name);
        if (newName !== null) exp.name = newName.trim() || exp.name;
        const newAmt = prompt(`${t.editAmountPrompt} (${currencySymbol(currentCurrency)})`, disp);
        if (newAmt !== null) exp.amount = convertToSEK(Number(newAmt) || 0, currentCurrency);
        const newNote = prompt('Edit note:', exp.note || '');
        if (newNote !== null) exp.note = newNote.trim();
        renderReview(currentReview);
      });
      const del = document.createElement('button'); del.className = 'delete-btn'; del.textContent = (translations[currentLang]||translations.en).deleteBtn || 'Delete';
      del.addEventListener('click', () => {
        const t = translations[currentLang] || translations.en;
        const confirmMsg = t.deleteConfirm.replace('{name}', exp.name);
        if (confirm(confirmMsg)) {
          payload.expenses.splice(idx, 1);
          renderReview(currentReview);
        }
      });
      row.appendChild(left);
      const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.gap = '6px'; controls.appendChild(btn); controls.appendChild(del);
      row.appendChild(controls);
      reviewExpenses.appendChild(row);
    });

    // Render expenses pie chart inside review panel
    try {
      const ctx = document.getElementById('reviewChart').getContext('2d');
      const labels = (payload.expenses || []).map(e => e.name);
      const values = (payload.expenses || []).map(e => Math.round(convertFromSEK(e.amount, currentCurrency) * 100) / 100);
      if (reviewChart) reviewChart.destroy();
      reviewChart = new Chart(ctx, {
        type: 'pie',
        data: { labels: labels, datasets: [{ data: values, backgroundColor: generateColors(values.length) }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    } catch (e) {
      // canvas may not exist if review hidden — ignore
    }
  }

  // Show restore banner prompt in question view if needed when user opens form
  // (banner is shown/hidden inside question view)
  // Load saved theme or detect system preference
  const savedTheme = localStorage.getItem('theme');
  currentTheme = savedTheme || detectSystemTheme();
  applyTheme(currentTheme);
  if (themeSelect) themeSelect.value = currentTheme;
  
  // fetch latest rates, then apply language and update any displayed amounts
  fetchRates().then(() => {
    applyLanguage(currentLang);
    applyCurrencyToLoadedData();
    showRestoreBannerIfNeeded();
  }).catch(() => {
    applyLanguage(currentLang);
    showRestoreBannerIfNeeded();
  });
  
  } // end initializeApp
  
  } catch (err) {
    console.error('Initialization error', err);
    alert('Application initialization error: ' + (err && err.message ? err.message : String(err)));
  }
});
