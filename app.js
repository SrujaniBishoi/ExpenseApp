/**
 * Expense App — Client-Side Application Logic
 * Supports daily journaling & monthly expense tracking starting from January 2026.
 * Features INR base currency with live exchange rate conversions, configurable payment methods,
 * interactive SVG charts, and complete offline persistence.
 */

// Month definitions
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Fallback exchange rates against base INR (1 INR = X Foreign Currency)
const FALLBACK_RATES_FROM_INR = {
  INR: 1.0,
  USD: 0.010376, // 1 USD ≈ ₹96.38
  EUR: 0.009213, // 1 EUR ≈ ₹108.54
  GBP: 0.007859, // 1 GBP ≈ ₹127.24
  AED: 0.038118, // 1 AED ≈ ₹26.23
  CAD: 0.014788, // 1 CAD ≈ ₹67.62
  AUD: 0.014964, // 1 AUD ≈ ₹66.83
  JPY: 1.640217  // 1 JPY ≈ ₹0.61
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥'
};

// -----------------------------------------------------------------------------
// Firebase Cloud Backend Configuration & Initialization
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCoA5DenYrdhqpPsdp_t0LOskEV7uSMV8s",
  authDomain: "expenseapp-dae7e.firebaseapp.com",
  projectId: "expenseapp-dae7e",
  storageBucket: "expenseapp-dae7e.firebasestorage.app",
  messagingSenderId: "432329380893",
  appId: "1:432329380893:web:a16f70d3c7a0f1a096a2f4"
};

let fbApp = null;
let fbAuth = null;
let fbDb = null;

try {
  if (typeof firebase !== 'undefined') {
    fbApp = firebase.initializeApp(firebaseConfig);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
  }
} catch (e) {
  console.warn('Firebase init notice:', e);
}

// Initial default payment methods (focused on INR / Indian & global contexts)
const DEFAULT_PAYMENT_METHODS = [
  { id: 'pm_upi', name: 'UPI / GPay / PhonePe', type: 'UPI / Instant', color: '#8b5cf6' },
  { id: 'pm_credit', name: 'ICICI VISA Credit Card', type: 'Credit Card', color: '#3b82f6', dueDay: 15 },
  { id: 'pm_hdfc_diners', name: 'HDFC Diners Credit Card', type: 'Credit Card', color: '#1d4ed8', dueDay: 20 },
  { id: 'pm_debit', name: 'Debit Card', type: 'Debit Card', color: '#06b6d4' },
  { id: 'pm_cash', name: 'Cash', type: 'Cash', color: '#10b981' },
  { id: 'pm_netbanking', name: 'Net Banking / NEFT', type: 'Net Banking', color: '#ec4899' },
  { id: 'pm_amex', name: 'Amex Card', type: 'Credit Card', color: '#f59e0b', dueDay: 25 }
];

// Category default colors
const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Groceries': '#84cc16',
  'Housing & Rent': '#06b6d4',
  'Utilities': '#eab308',
  'Transportation': '#6366f1',
  'Shopping': '#ec4899',
  'Entertainment': '#a855f7',
  'Health & Medical': '#ef4444',
  'Subscriptions': '#14b8a6',
  'Travel': '#3b82f6',
  'Education': '#10b981',
  'Investment': '#22c55e',
  'Other': '#64748b'
};

// Sample seed data in INR starting from January 2026
function getSampleSeedData() {
  return {
    years: [2026, 2027, 2028],
    currency: 'INR',
    theme: 'dark',
    exchangeRates: { ...FALLBACK_RATES_FROM_INR },
    paymentMethods: [...DEFAULT_PAYMENT_METHODS],
    expenses: [
      {
        id: 'exp_202601_1',
        year: 2026,
        month: 0, // Jan (0-indexed)
        date: '2026-01-02',
        description: 'Monthly Apartment Rent',
        category: 'Housing & Rent',
        amount: 25000.00, // INR base
        paymentMethodId: 'pm_netbanking',
        notes: 'Monthly fixed lease via NEFT transfer'
      },
      {
        id: 'exp_202601_2',
        year: 2026,
        month: 0,
        date: '2026-01-05',
        description: 'Supermarket Groceries & Pantry',
        category: 'Groceries',
        amount: 3450.00,
        paymentMethodId: 'pm_upi',
        notes: 'Reliance Fresh monthly pantry restocking'
      },
      {
        id: 'exp_202601_3',
        year: 2026,
        month: 0,
        date: '2026-01-08',
        description: 'Electricity & Internet Bill',
        category: 'Utilities',
        amount: 1850.00,
        paymentMethodId: 'pm_upi',
        notes: 'Power grid + fiber broadband'
      },
      {
        id: 'exp_202601_4',
        year: 2026,
        month: 0,
        date: '2026-01-12',
        description: 'Family Dinner at Restaurant',
        category: 'Food & Dining',
        amount: 1200.00,
        paymentMethodId: 'pm_credit',
        notes: 'Weekend dinner'
      },
      {
        id: 'exp_202601_5',
        year: 2026,
        month: 0,
        date: '2026-01-18',
        description: 'Metro Card Reload & Uber Rides',
        category: 'Transportation',
        amount: 950.00,
        paymentMethodId: 'pm_upi',
        notes: 'Commuting recharge'
      },
      {
        id: 'exp_202601_6',
        year: 2026,
        month: 0,
        date: '2026-01-22',
        description: 'OTT & Cloud Subscriptions',
        category: 'Subscriptions',
        amount: 699.00,
        paymentMethodId: 'pm_credit',
        notes: 'Music & cloud storage'
      },
      {
        id: 'exp_202601_7',
        year: 2026,
        month: 0,
        date: '2026-01-27',
        description: 'Local Sabzi Mandi (Fruits & Vegetables)',
        category: 'Groceries',
        amount: 450.00,
        paymentMethodId: 'pm_cash',
        notes: 'Fresh weekly produce'
      },
      {
        id: 'exp_202601_8',
        year: 2026,
        month: 0,
        date: '2026-01-20',
        description: 'Flight Tickets for Business Summit',
        category: 'Travel',
        amount: 6500.00,
        paymentMethodId: 'pm_hdfc_diners',
        notes: 'HDFC Diners air miles & lounge access'
      },
      {
        id: 'exp_202609_hdfc',
        year: 2026,
        month: 8, // September (0-indexed: 8)
        date: '2026-09-22',
        description: 'Electronics & Gadgets Purchase',
        category: 'Shopping',
        amount: 4500.00,
        paymentMethodId: 'pm_hdfc_diners',
        notes: 'HDFC Diners post-due spend (incurred 22 Sep after 20 Sep due date, billed in Oct bill due 20 Oct)'
      }
    ],
    // Stored per day: YYYY-MM-DD
    journals: {
      '2026-01-02': `[Daily Reflection] First working Friday of 2026. Paid rent on time via NetBanking.
[Today's Spend] Transferred ₹25,000 for rent. Budget is well calibrated for this month.`,
      '2026-01-05': `[Today's Spend] Restocked monthly staples at Reliance Fresh for ₹3,450 using UPI.
[Daily Win] Stuck strictly to the grocery list and avoided impulse purchases.`
    },
    // Payments made towards credit card bills (with date paid, amount, and notes)
    creditCardPayments: [
      {
        id: 'ccpay_202601_1',
        year: 2026,
        month: 0,
        paymentMethodId: 'pm_credit',
        date: '2026-01-15',
        amount: 1200.00,
        notes: 'Paid restaurant dinner balance via UPI / GPay'
      }
    ]
  };
}

// Authentication & Multi-User State Keys
const USERS_STORAGE_KEY = 'expense_app_users_v1';
const SESSION_STORAGE_KEY = 'expense_app_session_v1';
const LEGACY_STORAGE_KEY = 'expense_app_data_v1';

// Initial pre-configured admin user: srujani / sera123
const INITIAL_USERS = [
  {
    username: 'srujani',
    name: 'Srujani',
    role: 'admin',
    passwordHash: 'cc13d3ace8aeeae58b21c3313d19999ff905538924b12e02680987ef46a702cb', // sha256("sera123")
    createdAt: '2026-01-01'
  }
];

// Active Session & Global State
let currentSession = null;
let appState = null;
let selectedYear = 2026;
let selectedMonth = 0; // January
let selectedJournalDate = '2026-01-02'; // default day in Jan 2026
let activeView = 'monthly-view';
let journalDebounceTimer = null;
let liveFxStatus = 'Base: INR (₹)';
let currentCcCycleMode = 'due-month'; // 'due-month' or 'post-due'

// Password hashing using Web Crypto SHA-256
async function hashPassword(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsersList() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading users list:', e);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  return [...INITIAL_USERS];
}

function saveUsersList(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const users = getUsersList();
      const match = users.find(u => u.username.toLowerCase() === (parsed.username || '').toLowerCase());
      if (match) {
        return { ...match, loginTime: parsed.loginTime };
      }
    }
  } catch (e) {
    console.warn('Error reading active session:', e);
  }
  return null;
}

function setActiveSession(user) {
  const sess = {
    username: user.username,
    name: user.name,
    role: user.role,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess));
  currentSession = sess;
}

function clearActiveSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  currentSession = null;
}

function getUserStorageKey(username) {
  const uname = (username || (currentSession && currentSession.username) || 'srujani').toLowerCase();
  return `expense_app_data_v1_${uname}`;
}

// Initialize state per user
function loadState(targetUsername) {
  const uname = (targetUsername || (currentSession && currentSession.username) || 'srujani').toLowerCase();
  const key = getUserStorageKey(uname);
  try {
    let raw = localStorage.getItem(key);
    // If target user is srujani and no specific key exists yet, check legacy storage key
    if (!raw && uname === 'srujani') {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }

    if (raw) {
      const parsed = JSON.parse(raw);

      // Ensure valid currency (fallback to INR if undefined or legacy '$')
      if (!parsed.currency || parsed.currency === '$') {
        parsed.currency = 'INR';
      }

      // Ensure minimum year is 2026
      if (!parsed.years || !parsed.years.includes(2026)) {
        parsed.years = Array.from(new Set([2026, ...(parsed.years || [])])).sort((a,b) => a-b);
      }

      // Ensure exchange rates object
      parsed.exchangeRates = Object.assign({}, FALLBACK_RATES_FROM_INR, parsed.exchangeRates || {});

      // Migrate any legacy month journal keys ('2026-0') to daily key ('2026-01-02')
      if (parsed.journals) {
        Object.keys(parsed.journals).forEach(key => {
          if (/^\d{4}-\d{1,2}$/.test(key)) {
            const parts = key.split('-');
            const y = parts[0];
            const m = String(parseInt(parts[1], 10) + 1).padStart(2, '0');
            const dayKey = `${y}-${m}-01`;
            if (!parsed.journals[dayKey]) {
              parsed.journals[dayKey] = parsed.journals[key];
            }
            delete parsed.journals[key];
          }
        });
      }

      // Ensure payment methods have user-requested renames, additions, and due dates
      if (parsed.paymentMethods) {
        parsed.paymentMethods.forEach(pm => {
          if (pm.id === 'pm_credit' || pm.name.toLowerCase().includes('visa') || pm.name === 'Credit Card (Visa/Mastercard)') {
            pm.name = 'ICICI VISA Credit Card';
          }
          // Assign default dueDay for credit cards if not already set
          if (pm.type === 'Credit Card' && !pm.dueDay) {
            if (pm.id === 'pm_credit') pm.dueDay = 15;
            else if (pm.id === 'pm_hdfc_diners' || pm.name.toLowerCase().includes('diners')) pm.dueDay = 20;
            else if (pm.id === 'pm_amex' || pm.name.toLowerCase().includes('amex')) pm.dueDay = 25;
            else pm.dueDay = 15;
          }
        });
        const hasHdfcDiners = parsed.paymentMethods.some(pm => pm.name.toLowerCase().includes('diners'));
        if (!hasHdfcDiners) {
          parsed.paymentMethods.splice(2, 0, {
            id: 'pm_hdfc_diners',
            name: 'HDFC Diners Credit Card',
            type: 'Credit Card',
            color: '#1d4ed8',
            dueDay: 20
          });
        }
      } else {
        parsed.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
      }

      // Ensure credit card payments array exists
      if (!Array.isArray(parsed.creditCardPayments)) {
        parsed.creditCardPayments = [];
      }

      // Save into the per-user key
      localStorage.setItem(key, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load saved state, falling back to seed data:', err);
  }

  const seed = getSampleSeedData();
  if (uname !== 'srujani') {
    // For non-admin new accounts, start with empty expenses & journals
    seed.expenses = [];
    seed.journals = {};
    seed.creditCardPayments = [];
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

let cloudSyncDebounceTimer = null;

function setCloudSyncStatus(status, text) {
  if (!el.cloudSyncStatus) return;
  el.cloudSyncStatus.className = `cloud-sync-status ${status}`;
  if (el.cloudSyncText) {
    el.cloudSyncText.textContent = text || (status === 'syncing' ? 'Syncing...' : status === 'offline' ? 'Offline' : 'Cloud');
  }
}

async function syncStateToCloud(userId, state = appState) {
  if (!fbDb || !userId || !state) return;
  setCloudSyncStatus('syncing', 'Syncing...');
  try {
    const payload = {
      expenses: state.expenses || [],
      paymentMethods: state.paymentMethods || [],
      creditCardPayments: state.creditCardPayments || [],
      dailyJournals: state.dailyJournals || {},
      currency: state.currency || 'INR',
      theme: state.theme || 'dark',
      exchangeRates: state.exchangeRates || FALLBACK_RATES_FROM_INR,
      lastUpdated: new Date().toISOString()
    };
    await fbDb.collection('users').doc(userId).set(payload, { merge: true });
    setCloudSyncStatus('ready', 'Cloud');
  } catch (err) {
    console.warn('Firestore sync notice:', err);
    if (err && err.code === 'permission-denied') {
      setCloudSyncStatus('offline', 'Rule Error');
    } else {
      setCloudSyncStatus('offline', 'Offline');
    }
  }
}

function saveStateToStorage(state = appState) {
  try {
    const key = getUserStorageKey();
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state:', err);
  }

  // Sync to Cloud Firestore with debounce
  if (currentSession && currentSession.uid && fbDb) {
    clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(() => {
      syncStateToCloud(currentSession.uid, state);
    }, 600);
  }
}

// DOM Elements
const el = {
  themeToggle: document.getElementById('theme-toggle'),
  currencySelect: document.getElementById('currency-select'),
  liveFxChip: document.getElementById('live-fx-chip'),
  fxRateText: document.getElementById('fx-rate-text'),
  yearSelect: document.getElementById('year-select'),
  btnPrevYear: document.getElementById('btn-prev-year'),
  btnNextYear: document.getElementById('btn-next-year'),
  btnAddFutureYear: document.getElementById('btn-add-future-year'),
  monthPills: document.getElementById('month-pills'),

  // Metrics (Clean 2-Card Layout)
  statTotalSpend: document.getElementById('stat-total-spend'),
  statPeriodTag: document.getElementById('stat-period-tag'),
  cardCreditCardDues: document.getElementById('card-credit-card-dues'),
  statCcNetSpend: document.getElementById('stat-cc-net-spend'),
  statCcPayable: document.getElementById('stat-cc-payable'),

  // Side Menu & Analytics Tabs
  btnToggleSideMenu: document.getElementById('btn-toggle-side-menu'),
  btnFloatingSideMenu: document.getElementById('btn-floating-side-menu'),
  btnCloseSideMenu: document.getElementById('btn-close-side-menu'),
  btnDockSideMenu: document.getElementById('btn-dock-side-menu'),
  sideMenuOverlay: document.getElementById('side-menu-overlay'),
  sideMenuDrawer: document.getElementById('side-menu-drawer'),
  sideMenuTabs: document.querySelectorAll('.side-menu-tab-btn'),
  sideTabPanels: document.querySelectorAll('.side-tab-panel'),

  // Credit Card Dues Modal
  creditCardDuesModal: document.getElementById('credit-card-dues-modal'),
  btnCloseCcModal: document.getElementById('btn-close-cc-modal'),
  btnDoneCcModal: document.getElementById('btn-done-cc-modal'),
  btnManagePmFromCc: document.getElementById('btn-manage-pm-from-cc'),
  ccModalMonthBadge: document.getElementById('cc-modal-month-badge'),
  ccModalTotalSpend: document.getElementById('cc-modal-total-spend'),
  ccModalTotalPaid: document.getElementById('cc-modal-total-paid'),
  ccModalTotalPayable: document.getElementById('cc-modal-total-payable'),
  ccModalTxCount: document.getElementById('cc-modal-tx-count'),
  ccModalPaymentsCount: document.getElementById('cc-modal-payments-count'),
  ccModalActiveCardsCount: document.getElementById('cc-modal-active-cards-count'),
  ccCardsList: document.getElementById('cc-cards-list'),
  btnCycleDueMonth: document.getElementById('btn-cycle-due-month'),
  btnCyclePostDue: document.getElementById('btn-cycle-post-due'),
  ccCycleTabMonthName: document.getElementById('cc-cycle-tab-month-name'),

  // View Navigation
  viewTabs: document.querySelectorAll('.view-tab'),
  monthlyView: document.getElementById('monthly-view'),
  annualView: document.getElementById('annual-view'),
  annualTabYear: document.getElementById('annual-tab-year'),
  annualHeaderYear: document.getElementById('annual-header-year'),

  // Expenses Panel
  expensesPanelTitle: document.getElementById('expenses-panel-title'),
  badgeEntryCount: document.getElementById('badge-entry-count'),
  btnAddExpense: document.getElementById('btn-add-expense'),
  btnAddExpenseEmpty: document.getElementById('btn-add-expense-empty'),
  expenseSearch: document.getElementById('expense-search'),
  filterCategory: document.getElementById('filter-category'),
  filterPayment: document.getElementById('filter-payment'),
  sortOrder: document.getElementById('sort-order'),
  expenseTbody: document.getElementById('expense-tbody'),
  expenseEmptyState: document.getElementById('expense-empty-state'),

  // Charts
  categoryChartContainer: document.getElementById('category-chart-container'),
  paymentChartContainer: document.getElementById('payment-chart-container'),
  annualChartContainer: document.getElementById('annual-chart-container'),
  annualTbody: document.getElementById('annual-tbody'),
  annualTfoot: document.getElementById('annual-tfoot'),

  // Daily Journal & Monthly Calendar Elements
  btnCalPrevMonth: document.getElementById('btn-cal-prev-month'),
  btnCalNextMonth: document.getElementById('btn-cal-next-month'),
  calMonthYearTitle: document.getElementById('cal-month-year-title'),
  calDaysGrid: document.getElementById('cal-days-grid'),
  btnPrevDay: document.getElementById('btn-prev-day'),
  btnNextDay: document.getElementById('btn-next-day'),
  btnTodayDay: document.getElementById('btn-today-day'),
  journalDateInput: document.getElementById('journal-date-input'),
  journalDayWeekday: document.getElementById('journal-day-weekday'),
  journalDayExpensesSummary: document.getElementById('journal-day-expenses-summary'),
  dailyJournalText: document.getElementById('daily-journal-text'),
  journalStatus: document.getElementById('journal-status'),
  journalCharCount: document.getElementById('journal-char-count'),
  btnSaveJournal: document.getElementById('btn-save-journal'),
  journalQuickTags: document.getElementById('journal-quick-tags'),
  quickFactsList: document.getElementById('quick-facts-list'),

  // Expense Modal
  expenseModal: document.getElementById('expense-modal'),
  formExpense: document.getElementById('form-expense'),
  modalExpenseTitle: document.getElementById('modal-expense-title'),
  btnCloseExpenseModal: document.getElementById('btn-close-expense-modal'),
  btnCancelExpense: document.getElementById('btn-cancel-expense'),
  expenseEditId: document.getElementById('expense-edit-id'),
  expenseDate: document.getElementById('expense-date'),
  expenseAmount: document.getElementById('expense-amount'),
  expenseEntryCurrency: document.getElementById('expense-entry-currency'),
  expenseFxCalc: document.getElementById('expense-fx-calc'),
  expenseDescription: document.getElementById('expense-description'),
  expenseCategory: document.getElementById('expense-category'),
  expensePaymentMethod: document.getElementById('expense-payment-method'),
  expenseNotes: document.getElementById('expense-notes'),
  btnQuickManagePm: document.getElementById('btn-quick-manage-pm'),

  // Payment Methods Modal
  paymentMethodsModal: document.getElementById('payment-methods-modal'),
  btnOpenPaymentMethods: document.getElementById('btn-open-payment-methods'),
  btnClosePmModal: document.getElementById('btn-close-pm-modal'),
  btnDonePm: document.getElementById('btn-done-pm'),
  formNewPaymentMethod: document.getElementById('form-new-payment-method'),
  editPmId: document.getElementById('edit-pm-id'),
  pmFormTitle: document.getElementById('pm-form-title'),
  btnCancelEditPm: document.getElementById('btn-cancel-edit-pm'),
  btnSubmitPm: document.getElementById('btn-submit-pm'),
  newPmName: document.getElementById('new-pm-name'),
  newPmType: document.getElementById('new-pm-type'),
  newPmColor: document.getElementById('new-pm-color'),
  newPmColorPreview: document.getElementById('new-pm-color-preview'),
  pmDueDayGroup: document.getElementById('pm-due-day-group'),
  newPmDueDay: document.getElementById('new-pm-due-day'),
  paymentMethodsList: document.getElementById('payment-methods-list'),

  // Backup / Data options
  btnBackupMenu: document.getElementById('btn-backup-menu'),
  backupMenuContent: document.getElementById('backup-menu-content'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportAnnualCsv: document.getElementById('btn-export-annual-csv'),
  btnExportJson: document.getElementById('btn-export-json'),
  inputImportJson: document.getElementById('input-import-json'),
  btnClearMonthMenu: document.getElementById('btn-clear-month-menu'),
  labelClearMonth: document.getElementById('label-clear-month'),
  btnClearMonthExpenses: document.getElementById('btn-clear-month-expenses'),
  btnClearExpenses: document.getElementById('btn-clear-expenses'),
  btnResetDemo: document.getElementById('btn-reset-demo'),

  // User Profile & Authentication Elements
  authOverlay: document.getElementById('auth-overlay'),
  tabAuthLogin: document.getElementById('tab-auth-login'),
  tabAuthSignup: document.getElementById('tab-auth-signup'),
  authForm: document.getElementById('auth-form'),
  authUsername: document.getElementById('auth-username'),
  authPassword: document.getElementById('auth-password'),
  btnToggleAuthPwd: document.getElementById('btn-toggle-auth-pwd'),
  pwdIconEye: document.getElementById('pwd-icon-eye'),
  btnForgotPwd: document.getElementById('btn-forgot-pwd'),
  authError: document.getElementById('auth-error'),
  authErrorText: document.getElementById('auth-error-text'),
  btnAuthSubmit: document.getElementById('btn-auth-submit'),

  signupForm: document.getElementById('signup-form'),
  signupName: document.getElementById('signup-name'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  btnToggleSignupPwd: document.getElementById('btn-toggle-signup-pwd'),
  pwdIconEyeSignup: document.getElementById('pwd-icon-eye-signup'),
  signupConfirmPassword: document.getElementById('signup-confirm-password'),
  btnSignupSubmit: document.getElementById('btn-signup-submit'),

  cloudSyncStatus: document.getElementById('cloud-sync-status'),
  cloudSyncText: document.getElementById('cloud-sync-text'),

  userProfileDropdown: document.getElementById('user-profile-dropdown'),
  btnUserProfile: document.getElementById('btn-user-profile'),
  userProfileMenuContent: document.getElementById('user-profile-menu-content'),
  userNavAvatar: document.getElementById('user-nav-avatar'),
  userNavName: document.getElementById('user-nav-name'),
  userMenuAvatar: document.getElementById('user-menu-avatar'),
  userMenuFullname: document.getElementById('user-menu-fullname'),
  userMenuSub: document.getElementById('user-menu-sub'),
  userMenuRole: document.getElementById('user-menu-role'),
  btnOpenUserMgmt: document.getElementById('btn-open-user-mgmt'),
  btnSwitchUser: document.getElementById('btn-switch-user'),
  btnLogout: document.getElementById('btn-logout'),

  // Admin User Management Modal
  userManagementModal: document.getElementById('user-management-modal'),
  btnCloseUserMgmt: document.getElementById('btn-close-user-mgmt'),
  btnDoneUserMgmt: document.getElementById('btn-done-user-mgmt'),
  addUserForm: document.getElementById('add-user-form'),
  newUsername: document.getElementById('new-user-username'),
  newName: document.getElementById('new-user-name'),
  newPassword: document.getElementById('new-user-password'),
  newRole: document.getElementById('new-user-role'),
  usersListContainer: document.getElementById('users-list-container'),

  // Toast
  toast: document.getElementById('toast')
};

// -----------------------------------------------------------------------------
// Live Currency & Exchange Rate Logic
// -----------------------------------------------------------------------------
async function fetchLiveExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        appState.exchangeRates = Object.assign({}, FALLBACK_RATES_FROM_INR, data.rates);
        saveStateToStorage();
        updateFxChip();
        renderAll();
      }
    }
  } catch (err) {
    console.warn('Could not fetch real-time exchange rates (offline or blocked). Using fallback rates.', err);
    updateFxChip();
  }
}

function updateFxChip() {
  if (!el.fxRateText || !el.liveFxChip) return;
  const cur = (appState && appState.currency) ? appState.currency : 'INR';
  if (cur === 'INR') {
    el.fxRateText.textContent = 'Base: INR (₹)';
    el.liveFxChip.title = 'Displaying in base currency: Indian Rupee (INR)';
  } else {
    const rates = (appState && appState.exchangeRates) ? appState.exchangeRates : FALLBACK_RATES_FROM_INR;
    const rateFromInr = rates[cur] || FALLBACK_RATES_FROM_INR[cur] || 1;
    const inrPerUnit = (1 / rateFromInr).toFixed(2);
    el.fxRateText.textContent = `1 ${cur} = ₹${inrPerUnit}`;
    el.liveFxChip.title = `Live Forex Conversion: 1 ${cur} = ₹${inrPerUnit} INR`;
  }
}

// Convert amount in base INR to the selected display currency
function convertFromInr(amountInInr, targetCurrency = (appState ? appState.currency : 'INR')) {
  const cur = targetCurrency || (appState ? appState.currency : 'INR') || 'INR';
  if (cur === 'INR') return Number(amountInInr || 0);
  const rates = (appState && appState.exchangeRates) ? appState.exchangeRates : FALLBACK_RATES_FROM_INR;
  const rate = rates[cur] || FALLBACK_RATES_FROM_INR[cur] || 1;
  return Number(amountInInr || 0) * rate;
}

// Convert amount in foreign currency back to base INR
function convertToInr(foreignAmount, sourceCurrency) {
  if (!sourceCurrency || sourceCurrency === 'INR') return Number(foreignAmount || 0);
  const rates = (appState && appState.exchangeRates) ? appState.exchangeRates : FALLBACK_RATES_FROM_INR;
  const rate = rates[sourceCurrency] || FALLBACK_RATES_FROM_INR[sourceCurrency] || 1;
  return Number(foreignAmount || 0) / rate;
}

// Format currency for display
function formatCurrency(amountInInr, targetCurrency = (appState ? appState.currency : 'INR')) {
  const cur = targetCurrency || (appState ? appState.currency : 'INR') || 'INR';
  const sym = CURRENCY_SYMBOLS[cur] || `${cur} `;
  const converted = convertFromInr(amountInInr, cur);

  // Use Indian locale formatting if INR
  if (cur === 'INR') {
    return `${sym}${Number(converted || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${sym}${Number(converted || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Show Toast message
function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(el.toast._timer);
  el.toast._timer = setTimeout(() => {
    el.toast.classList.remove('show');
  }, 2800);
}

// -----------------------------------------------------------------------------
// Timeline & Year/Month Management (Starting from Jan 2026)
// -----------------------------------------------------------------------------
function initTimeline() {
  renderYearOptions();
  renderMonthPills();
}

function renderYearOptions() {
  if (!el.yearSelect) return;
  if (!appState) appState = getSampleSeedData();
  if (!appState.years || !Array.isArray(appState.years)) appState.years = [2026];
  el.yearSelect.innerHTML = '';
  if (!appState.years.includes(2026)) {
    appState.years.push(2026);
  }
  appState.years.sort((a,b) => a-b);

  appState.years.forEach(yr => {
    const opt = document.createElement('option');
    opt.value = yr;
    opt.textContent = yr;
    if (yr === selectedYear) opt.selected = true;
    el.yearSelect.appendChild(opt);
  });

  el.annualTabYear.textContent = selectedYear;
  el.annualHeaderYear.textContent = selectedYear;
}

function renderMonthPills() {
  el.monthPills.innerHTML = '';

  MONTH_NAMES.forEach((name, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `month-pill ${idx === selectedMonth ? 'active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', idx === selectedMonth ? 'true' : 'false');
    btn.dataset.month = idx;

    // Calculate month total in INR
    const monthExpenses = getExpensesForMonth(selectedYear, idx);
    const monthTotalInInr = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = MONTH_SHORT[idx];

    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'pill-badge';
    badgeSpan.textContent = monthTotalInInr > 0 ? formatCurrency(monthTotalInInr) : '—';

    btn.appendChild(labelSpan);
    btn.appendChild(badgeSpan);

    btn.addEventListener('click', () => {
      selectedMonth = idx;
      // Sync journal date to 1st of selected month if currently outside it
      const [jYear, jMonth] = selectedJournalDate.split('-').map(Number);
      if (jYear !== selectedYear || (jMonth - 1) !== selectedMonth) {
        const mStr = String(selectedMonth + 1).padStart(2, '0');
        selectedJournalDate = `${selectedYear}-${mStr}-01`;
      }
      renderAll();
    });

    el.monthPills.appendChild(btn);
  });
}

function addFutureYear() {
  const maxYear = Math.max(...appState.years);
  const nextYear = maxYear + 1;
  appState.years.push(nextYear);
  saveStateToStorage();
  selectedYear = nextYear;
  renderYearOptions();
  renderAll();
  showToast(`Added year ${nextYear} to timeline!`);
}

// -----------------------------------------------------------------------------
// Expense Query Helpers
// -----------------------------------------------------------------------------
function getExpensesForMonth(year, month) {
  return appState.expenses.filter(e => Number(e.year) === Number(year) && Number(e.month) === Number(month));
}

function getExpensesForDay(dateStr) {
  return appState.expenses.filter(e => e.date === dateStr);
}

// Format Date object to YYYY-MM-DD
function formatYMD(year, monthIndex, day) {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Compute the billing cycle for the bill due in targetYear-targetMonth
// Example: HDFC due 20th in Oct 2026 -> Start: 2026-09-21, End/Due: 2026-10-20
function getCardBillingCycleForDueMonth(pm, targetYear, targetMonth) {
  const configuredDue = pm.dueDay ? Math.min(Math.max(1, parseInt(pm.dueDay, 10)), 31) : 15;

  // Current due date in targetYear-targetMonth
  const daysInCur = new Date(targetYear, targetMonth + 1, 0).getDate();
  const effCurDay = Math.min(configuredDue, daysInCur);
  const curDueDate = new Date(targetYear, targetMonth, effCurDay);

  // Previous due date in (targetMonth - 1)
  const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
  const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
  const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
  const effPrevDay = Math.min(configuredDue, daysInPrev);

  // Cycle starts the day after previous due date
  const startDate = new Date(prevYear, prevMonth, effPrevDay + 1);

  return {
    cycleType: 'due-month',
    targetYear,
    targetMonth,
    dueDay: effCurDay,
    configuredDueDay: configuredDue,
    startDate,
    endDate: curDueDate,
    dueDate: curDueDate,
    startDateStr: formatYMD(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
    endDateStr: formatYMD(curDueDate.getFullYear(), curDueDate.getMonth(), curDueDate.getDate()),
    dueDateStr: formatYMD(curDueDate.getFullYear(), curDueDate.getMonth(), curDueDate.getDate())
  };
}

// Compute the billing cycle starting post-due in targetYear-targetMonth, due in next month
// Example: HDFC due 20th in Sep 2026 -> Start: 2026-09-21, End/Due: 2026-10-20 (due 20 Oct)
function getCardCycleStartingPostDue(pm, targetYear, targetMonth) {
  const configuredDue = pm.dueDay ? Math.min(Math.max(1, parseInt(pm.dueDay, 10)), 31) : 15;

  // Current due date in targetYear-targetMonth
  const daysInCur = new Date(targetYear, targetMonth + 1, 0).getDate();
  const effCurDay = Math.min(configuredDue, daysInCur);

  // Start date is the day after current due date
  const startDate = new Date(targetYear, targetMonth, effCurDay + 1);

  // Next due date in (targetMonth + 1)
  const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
  const nextMonth = targetMonth === 11 ? 0 : targetMonth + 1;
  const daysInNext = new Date(nextYear, nextMonth + 1, 0).getDate();
  const effNextDay = Math.min(configuredDue, daysInNext);
  const nextDueDate = new Date(nextYear, nextMonth, effNextDay);

  return {
    cycleType: 'post-due',
    targetYear: nextYear,
    targetMonth: nextMonth,
    dueDay: effNextDay,
    configuredDueDay: configuredDue,
    startDate,
    endDate: nextDueDate,
    dueDate: nextDueDate,
    startDateStr: formatYMD(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
    endDateStr: formatYMD(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate()),
    dueDateStr: formatYMD(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate())
  };
}

// Query expenses for a specific credit card within a cycle's start and end date strings (inclusive)
function getExpensesForCardCycle(pmId, startDateStr, endDateStr) {
  return appState.expenses.filter(e =>
    e.paymentMethodId === pmId &&
    e.date >= startDateStr &&
    e.date <= endDateStr
  );
}

// Query payments made towards a specific credit card billing cycle
function getPaymentsForCardCycle(pmId, cycle) {
  if (!Array.isArray(appState.creditCardPayments)) return [];

  return appState.creditCardPayments.filter(p => {
    if (p.paymentMethodId !== pmId) return false;

    // Direct match with this cycle's due date
    if (p.billingCycleEnd && p.billingCycleEnd === cycle.dueDateStr) {
      return true;
    }

    // Match by target billing year and month
    if (p.targetYear !== undefined && p.targetMonth !== undefined) {
      if (Number(p.targetYear) === Number(cycle.targetYear) && Number(p.targetMonth) === Number(cycle.targetMonth)) {
        return true;
      }
    }

    // Match by recorded year/month
    if (Number(p.year) === Number(cycle.targetYear) && Number(p.month) === Number(cycle.targetMonth)) {
      return true;
    }

    // Match by payment date window within cycle start and due date + 7 days grace
    const graceEndDate = new Date(cycle.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const graceEndStr = formatYMD(graceEndDate.getFullYear(), graceEndDate.getMonth(), graceEndDate.getDate());
    if (p.date >= cycle.startDateStr && p.date <= graceEndStr) {
      return true;
    }

    return false;
  });
}

function getFilteredExpenses() {
  let list = getExpensesForMonth(selectedYear, selectedMonth);

  const query = el.expenseSearch.value.trim().toLowerCase();
  const catFilter = el.filterCategory.value;
  const pmFilter = el.filterPayment.value;
  const sort = el.sortOrder.value;

  if (query) {
    list = list.filter(item => {
      const pm = getPaymentMethod(item.paymentMethodId);
      const pmName = pm ? pm.name.toLowerCase() : '';
      return item.description.toLowerCase().includes(query) ||
             (item.notes && item.notes.toLowerCase().includes(query)) ||
             item.category.toLowerCase().includes(query) ||
             pmName.includes(query);
    });
  }

  if (catFilter) {
    list = list.filter(item => item.category === catFilter);
  }

  if (pmFilter) {
    list = list.filter(item => item.paymentMethodId === pmFilter);
  }

  // Sorting
  list.sort((a, b) => {
    if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  return list;
}

function getPaymentMethod(id) {
  return appState.paymentMethods.find(pm => pm.id === id) || {
    id,
    name: 'Unknown',
    type: 'Other',
    color: '#94a3b8'
  };
}

// -----------------------------------------------------------------------------
// Metric Cards & Quick Facts
// -----------------------------------------------------------------------------
function updateMetrics() {
  const monthItems = getExpensesForMonth(selectedYear, selectedMonth);
  const totalInInr = monthItems.reduce((acc, cur) => acc + Number(cur.amount), 0);
  const count = monthItems.length;

  if (el.statTotalSpend) el.statTotalSpend.textContent = formatCurrency(totalInInr);
  if (el.statPeriodTag) el.statPeriodTag.textContent = `For ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // Daily average in current month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyAvgInInr = count > 0 ? (totalInInr / daysInMonth) : 0;

  // Top Category
  const catSums = {};
  monthItems.forEach(item => {
    catSums[item.category] = (catSums[item.category] || 0) + Number(item.amount);
  });
  let topCat = '—';
  let topCatAmount = 0;
  for (const [cat, amt] of Object.entries(catSums)) {
    if (amt > topCatAmount) {
      topCat = cat;
      topCatAmount = amt;
    }
  }

  // Top Payment Method
  const pmSums = {};
  monthItems.forEach(item => {
    pmSums[item.paymentMethodId] = (pmSums[item.paymentMethodId] || 0) + Number(item.amount);
  });
  let topPmId = null;
  let topPmAmt = 0;
  for (const [pmId, amt] of Object.entries(pmSums)) {
    if (amt > topPmAmt) {
      topPmId = pmId;
      topPmAmt = amt;
    }
  }

  // Credit Cards Net Spend, Payments Made & Total Payable at Month End
  const ccMethods = appState.paymentMethods.filter(pm => pm.type === 'Credit Card');
  let ccTotalSpendInInr = 0;
  let ccTotalPaidInInr = 0;
  let ccUnbilledPostDueInInr = 0;

  ccMethods.forEach(pm => {
    // Current billing cycle ending on this month's due date
    const cycle = getCardBillingCycleForDueMonth(pm, selectedYear, selectedMonth);
    const cardCycleItems = getExpensesForCardCycle(pm.id, cycle.startDateStr, cycle.endDateStr);
    const cardCycleSpend = cardCycleItems.reduce((acc, cur) => acc + Number(cur.amount), 0);
    ccTotalSpendInInr += cardCycleSpend;

    // Payments matching this card billing cycle
    const cardCyclePayments = getPaymentsForCardCycle(pm.id, cycle);
    const cardPaid = cardCyclePayments.reduce((acc, cur) => acc + Number(cur.amount), 0);
    ccTotalPaidInInr += cardPaid;

    // Check for post-due expenses incurred in selectedMonth after this card's due date
    const postCycle = getCardCycleStartingPostDue(pm, selectedYear, selectedMonth);
    const daysInCurMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endOfCurMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInCurMonth).padStart(2, '0')}`;
    const unbilledItems = appState.expenses.filter(e =>
      e.paymentMethodId === pm.id &&
      e.date >= postCycle.startDateStr &&
      e.date <= endOfCurMonthStr
    );
    ccUnbilledPostDueInInr += unbilledItems.reduce((acc, cur) => acc + Number(cur.amount), 0);
  });

  const ccRemainingPayableInInr = Math.max(0, ccTotalSpendInInr - ccTotalPaidInInr);

  if (el.statCcNetSpend) {
    el.statCcNetSpend.textContent = formatCurrency(ccTotalSpendInInr);
  }
  if (el.statCcPayable) {
    el.statCcPayable.textContent = formatCurrency(ccRemainingPayableInInr);
  }

  const subtextWrap = document.getElementById('stat-cc-subtext-wrap');
  if (subtextWrap) {
    let subHtml = '';
    if (ccTotalPaidInInr > 0 && ccRemainingPayableInInr > 0) {
      subHtml = `Due: <strong id="stat-cc-payable">${formatCurrency(ccRemainingPayableInInr)}</strong> <span style="color: var(--success); font-weight: 600; font-size: 0.73rem;">(Paid: ${formatCurrency(ccTotalPaidInInr)})</span>`;
    } else if (ccTotalPaidInInr > 0 && ccRemainingPayableInInr === 0 && ccTotalSpendInInr > 0) {
      subHtml = `<span style="color: var(--success); font-weight: 700; font-size: 0.75rem;">✅ Paid in Full (${formatCurrency(ccTotalPaidInInr)})</span>`;
    } else {
      subHtml = `Payable: <strong id="stat-cc-payable">${formatCurrency(ccRemainingPayableInInr)}</strong>`;
    }

    if (ccUnbilledPostDueInInr > 0) {
      subHtml += ` <span style="color: var(--warning); font-size: 0.71rem; font-weight: 600; margin-left: 4px;" title="Charges incurred in this month after due date that will be billed in next month's statement">• +${formatCurrency(ccUnbilledPostDueInInr)} unbilled</span>`;
    }

    subtextWrap.innerHTML = subHtml;
  }

  // Quick Facts in Side Menu
  updateQuickFacts(monthItems, totalInInr, daysInMonth, count, dailyAvgInInr, topCat, topCatAmount, topPmId, topPmAmt);
}

function updateQuickFacts(items, totalInInr, daysInMonth, count, dailyAvgInInr, topCat, topCatAmount, topPmId, topPmAmt) {
  if (!el.quickFactsList) return;
  el.quickFactsList.innerHTML = '';

  const facts = [];
  facts.push({
    title: 'Total Transactions',
    val: `${count} ${count === 1 ? 'entry' : 'entries'}`
  });

  facts.push({
    title: 'Daily Average Spend',
    val: `${formatCurrency(dailyAvgInInr)} / day`
  });

  if (topCat && topCat !== '—') {
    facts.push({
      title: 'Top Expense Category',
      val: `${topCat} (${formatCurrency(topCatAmount)})`
    });
  }

  if (topPmId && totalInInr > 0) {
    const pm = getPaymentMethod(topPmId);
    const pct = Math.round((topPmAmt / totalInInr) * 100);
    facts.push({
      title: 'Top Payment Method',
      val: `${pm.name} (${pct}%)`
    });
  }

  facts.push({
    title: 'Days in Month',
    val: `${daysInMonth} days`
  });

  if (items.length > 0) {
    const highestItem = [...items].sort((a,b) => b.amount - a.amount)[0];
    facts.push({
      title: 'Highest Single Spend',
      val: `${formatCurrency(highestItem.amount)} (${highestItem.description})`
    });

    const averagePerTx = totalInInr / items.length;
    facts.push({
      title: 'Avg per Transaction',
      val: formatCurrency(averagePerTx)
    });
  } else {
    facts.push({
      title: 'Highest Single Spend',
      val: '—'
    });
  }

  // Count how many daily entries exist for this month
  const mPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  let daysWithNotesCount = 0;
  if (appState.journals) {
    Object.keys(appState.journals).forEach(dKey => {
      if (dKey.startsWith(mPrefix) && appState.journals[dKey].trim()) {
        daysWithNotesCount++;
      }
    });
  }

  facts.push({
    title: 'Daily Journal Entries',
    val: `${daysWithNotesCount} ${daysWithNotesCount === 1 ? 'day recorded' : 'days recorded'}`
  });

  facts.push({
    title: 'Current FX Rate',
    val: (appState && appState.currency === 'INR') ? 'Base INR (₹)' : `1 ${appState ? appState.currency : 'INR'} = ₹${(1 / (appState && appState.exchangeRates && appState.exchangeRates[appState.currency] ? appState.exchangeRates[appState.currency] : 1)).toFixed(2)}`
  });

  facts.forEach(f => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="fact-title">${escapeHtml(f.title)}</span>
      <span class="fact-val">${escapeHtml(f.val)}</span>
    `;
    el.quickFactsList.appendChild(li);
  });
}

// -----------------------------------------------------------------------------
// Expense Table Rendering
// -----------------------------------------------------------------------------
function renderExpenseTable() {
  const items = getFilteredExpenses();
  el.expensesPanelTitle.textContent = `Expenses for ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  el.badgeEntryCount.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  el.expenseTbody.innerHTML = '';

  if (items.length === 0) {
    el.expenseEmptyState.style.display = 'block';
    return;
  }
  el.expenseEmptyState.style.display = 'none';

  items.forEach(item => {
    const tr = document.createElement('tr');
    const pm = getPaymentMethod(item.paymentMethodId);

    tr.innerHTML = `
      <td class="cell-date">
        <a href="javascript:void(0)" class="date-link" title="Open daily journal for this day" data-date="${item.date}" style="color: inherit; text-decoration: underline;">
          ${escapeHtml(item.date)}
        </a>
      </td>
      <td>
        <div class="cell-desc">${escapeHtml(item.description)}</div>
        ${item.notes ? `<div class="cell-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
      </td>
      <td>
        <span class="badge badge-category">
          <span style="color: ${CATEGORY_COLORS[item.category] || 'var(--text-muted)'}">●</span>
          ${escapeHtml(item.category)}
        </span>
      </td>
      <td>
        <span class="badge badge-payment" style="background-color: ${pm.color}20; color: ${pm.color}; border-color: ${pm.color}40;">
          <span class="pm-dot" style="background-color: ${pm.color};"></span>
          ${escapeHtml(pm.name)}
        </span>
      </td>
      <td class="text-right cell-amount">${formatCurrency(item.amount)}</td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-table-action btn-edit-expense" data-id="${item.id}" title="Edit Expense" aria-label="Edit Expense">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-table-action delete btn-delete-expense" data-id="${item.id}" title="Delete Expense" aria-label="Delete Expense">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;

    // Click date to jump directly to that day's journal
    tr.querySelector('.date-link').addEventListener('click', (e) => {
      e.preventDefault();
      setJournalDate(item.date);
    });

    tr.querySelector('.btn-edit-expense').addEventListener('click', () => openExpenseModal(item.id));
    tr.querySelector('.btn-delete-expense').addEventListener('click', () => deleteExpense(item.id));

    el.expenseTbody.appendChild(tr);
  });
}

function updateFilterOptions() {
  const currentCat = el.filterCategory.value;
  el.filterCategory.innerHTML = '<option value="">All Categories</option>';
  Object.keys(CATEGORY_COLORS).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentCat) opt.selected = true;
    el.filterCategory.appendChild(opt);
  });

  const currentPm = el.filterPayment.value;
  el.filterPayment.innerHTML = '<option value="">All Payment Methods</option>';
  appState.paymentMethods.forEach(pm => {
    const opt = document.createElement('option');
    opt.value = pm.id;
    opt.textContent = pm.name;
    if (pm.id === currentPm) opt.selected = true;
    el.filterPayment.appendChild(opt);
  });
}

// -----------------------------------------------------------------------------
// Expense CRUD Operations & Modal with Foreign Currency Support
// -----------------------------------------------------------------------------
function updateExpenseModalFxPreview() {
  const entryCur = el.expenseEntryCurrency.value;
  const rawAmt = parseFloat(el.expenseAmount.value);

  if (entryCur === 'INR' || isNaN(rawAmt) || rawAmt <= 0) {
    el.expenseFxCalc.style.display = 'none';
    el.expenseFxCalc.textContent = '';
    return;
  }

  const amtInInr = convertToInr(rawAmt, entryCur);
  const rateUnit = (1 / (appState.exchangeRates[entryCur] || 1)).toFixed(2);
  el.expenseFxCalc.style.display = 'block';
  el.expenseFxCalc.textContent = `≈ ₹${amtInInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR (Rate: 1 ${entryCur} = ₹${rateUnit})`;
}

function openExpenseModal(editId = null) {
  el.expenseEditId.value = editId || '';
  populatePaymentMethodSelect();

  if (editId) {
    const item = appState.expenses.find(e => e.id === editId);
    if (!item) return;
    el.modalExpenseTitle.textContent = 'Edit Expense Entry';
    el.expenseDate.value = item.date;
    el.expenseEntryCurrency.value = 'INR';
    el.expenseAmount.value = item.amount;
    el.expenseDescription.value = item.description;
    el.expenseCategory.value = item.category;
    el.expensePaymentMethod.value = item.paymentMethodId;
    el.expenseNotes.value = item.notes || '';
  } else {
    el.modalExpenseTitle.textContent = 'Add Expense Entry';
    el.formExpense.reset();
    el.expenseEditId.value = '';
    el.expenseEntryCurrency.value = 'INR';

    // Default to currently selected journal date or today
    el.expenseDate.value = selectedJournalDate;
  }

  updateExpenseModalFxPreview();
  el.expenseModal.showModal();
}

function closeExpenseModal() {
  el.expenseModal.close();
  el.formExpense.reset();
  el.expenseFxCalc.style.display = 'none';
}

function handleExpenseSubmit(e) {
  e.preventDefault();

  const editId = el.expenseEditId.value;
  const dateStr = el.expenseDate.value;
  const rawAmount = parseFloat(el.expenseAmount.value);
  const entryCurrency = el.expenseEntryCurrency.value;
  const description = el.expenseDescription.value.trim();
  const category = el.expenseCategory.value;
  const paymentMethodId = el.expensePaymentMethod.value;
  let notes = el.expenseNotes.value.trim();

  if (!dateStr || isNaN(rawAmount) || rawAmount <= 0 || !description || !paymentMethodId) {
    alert('Please fill out all required fields with valid data.');
    return;
  }

  // Derive year and month from the date
  const parts = dateStr.split('-');
  const itemYear = parseInt(parts[0], 10);
  const itemMonth = parseInt(parts[1], 10) - 1;

  if (itemYear < 2026) {
    alert('Expenses must be recorded starting from January 2026.');
    return;
  }

  // Always store amount normalized in base INR
  let amountInInr = rawAmount;
  if (entryCurrency !== 'INR') {
    amountInInr = convertToInr(rawAmount, entryCurrency);
    const fxNote = `[Paid in ${entryCurrency} ${rawAmount.toFixed(2)}]`;
    if (!notes.includes(fxNote)) {
      notes = notes ? `${notes} ${fxNote}` : fxNote;
    }
  }

  // Ensure year exists in state
  if (!appState.years.includes(itemYear)) {
    appState.years.push(itemYear);
    appState.years.sort((a,b) => a-b);
  }

  if (editId) {
    const index = appState.expenses.findIndex(x => x.id === editId);
    if (index !== -1) {
      appState.expenses[index] = {
        id: editId,
        year: itemYear,
        month: itemMonth,
        date: dateStr,
        amount: Math.round(amountInInr * 100) / 100,
        description,
        category,
        paymentMethodId,
        notes
      };
      showToast('Expense updated successfully');
    }
  } else {
    const newEntry = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      year: itemYear,
      month: itemMonth,
      date: dateStr,
      amount: Math.round(amountInInr * 100) / 100,
      description,
      category,
      paymentMethodId,
      notes
    };
    appState.expenses.push(newEntry);
    showToast('Expense added successfully');
  }

  // Switch timeline to this expense's date
  selectedYear = itemYear;
  selectedMonth = itemMonth;
  selectedJournalDate = dateStr;

  saveStateToStorage();
  closeExpenseModal();
  renderAll();
}

function deleteExpense(id) {
  const item = appState.expenses.find(x => x.id === id);
  if (!item) return;

  if (confirm(`Are you sure you want to delete "${item.description}" (${formatCurrency(item.amount)})?`)) {
    appState.expenses = appState.expenses.filter(x => x.id !== id);
    saveStateToStorage();
    renderAll();
    showToast('Expense deleted');
  }
}

// -----------------------------------------------------------------------------
// Configurable Payment Methods
// -----------------------------------------------------------------------------
function populatePaymentMethodSelect() {
  if (!el.expensePaymentMethod) return;
  if (!appState) appState = getSampleSeedData();
  if (!appState.paymentMethods || !Array.isArray(appState.paymentMethods)) appState.paymentMethods = DEFAULT_PAYMENT_METHODS;
  el.expensePaymentMethod.innerHTML = '';
  appState.paymentMethods.forEach(pm => {
    const opt = document.createElement('option');
    opt.value = pm.id;
    opt.textContent = `${pm.name} (${pm.type})`;
    el.expensePaymentMethod.appendChild(opt);
  });
}

function openPaymentMethodsModal() {
  cancelEditPaymentMethod();
  renderPaymentMethodsList();
  el.paymentMethodsModal.showModal();
}

function closePaymentMethodsModal() {
  cancelEditPaymentMethod();
  el.paymentMethodsModal.close();
  populatePaymentMethodSelect();
  updateFilterOptions();
  renderExpenseTable();
  renderCharts();
  renderMonthlyCalendar();
  updateMetrics();
}

function renderPaymentMethodsList() {
  el.paymentMethodsList.innerHTML = '';
  const currentEditId = el.editPmId ? el.editPmId.value : '';

  appState.paymentMethods.forEach(pm => {
    const card = document.createElement('div');
    card.className = 'pm-item-card' + (pm.id === currentEditId ? ' is-editing' : '');

    const usageCount = appState.expenses.filter(e => e.paymentMethodId === pm.id).length;
    const dueDayText = pm.type === 'Credit Card' ? ` • Due: ${pm.dueDay || 15}th` : '';

    card.innerHTML = `
      <div class="pm-item-left">
        <span class="pm-item-badge" style="background-color: ${pm.color};"></span>
        <div class="pm-item-info">
          <span class="pm-item-name">${escapeHtml(pm.name)}</span>
          <span class="pm-item-type">${escapeHtml(pm.type)}${dueDayText} • ${usageCount} ${usageCount === 1 ? 'entry' : 'entries'}</span>
        </div>
      </div>
      <div class="pm-item-actions">
        <button class="btn-table-action btn-edit-pm" data-id="${pm.id}" title="Edit Payment Method" aria-label="Edit Payment Method">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
        <button class="btn-table-action delete btn-delete-pm" data-id="${pm.id}" title="Remove Payment Method" aria-label="Remove Payment Method">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.btn-edit-pm').addEventListener('click', () => startEditPaymentMethod(pm.id));
    card.querySelector('.btn-delete-pm').addEventListener('click', () => deletePaymentMethod(pm.id, usageCount));
    el.paymentMethodsList.appendChild(card);
  });
}

function startEditPaymentMethod(pmId) {
  const pm = appState.paymentMethods.find(x => x.id === pmId);
  if (!pm) return;

  if (el.editPmId) el.editPmId.value = pm.id;
  el.newPmName.value = pm.name;
  el.newPmType.value = pm.type;
  el.newPmColor.value = pm.color;
  el.newPmColorPreview.textContent = pm.color;

  if (el.pmDueDayGroup) {
    if (pm.type === 'Credit Card') {
      el.pmDueDayGroup.style.display = 'flex';
      if (el.newPmDueDay) el.newPmDueDay.value = pm.dueDay || 15;
    } else {
      el.pmDueDayGroup.style.display = 'none';
    }
  }

  if (el.pmFormTitle) el.pmFormTitle.textContent = `Edit Payment Method`;
  if (el.btnSubmitPm) el.btnSubmitPm.textContent = 'Save Changes';
  if (el.btnCancelEditPm) el.btnCancelEditPm.style.display = 'inline-block';

  renderPaymentMethodsList();
  el.newPmName.focus();
}

function cancelEditPaymentMethod() {
  if (el.editPmId) el.editPmId.value = '';
  if (el.formNewPaymentMethod) el.formNewPaymentMethod.reset();
  el.newPmColor.value = '#6366f1';
  el.newPmColorPreview.textContent = '#6366f1';
  if (el.newPmDueDay) el.newPmDueDay.value = 15;
  if (el.pmDueDayGroup) {
    el.pmDueDayGroup.style.display = (el.newPmType && el.newPmType.value === 'Credit Card') ? 'flex' : 'none';
  }
  if (el.pmFormTitle) el.pmFormTitle.textContent = 'Add New Payment Method';
  if (el.btnSubmitPm) el.btnSubmitPm.textContent = '+ Add Method';
  if (el.btnCancelEditPm) el.btnCancelEditPm.style.display = 'none';
  renderPaymentMethodsList();
}

function handleAddPaymentMethod(e) {
  e.preventDefault();
  const name = el.newPmName.value.trim();
  const type = el.newPmType.value;
  const color = el.newPmColor.value;
  const editId = el.editPmId ? el.editPmId.value : '';
  const dueDay = (type === 'Credit Card') ? (parseInt(el.newPmDueDay ? el.newPmDueDay.value : '15', 10) || 15) : undefined;

  if (!name) return;

  if (editId) {
    // Edit existing payment method
    const pmIndex = appState.paymentMethods.findIndex(x => x.id === editId);
    if (pmIndex === -1) return;

    const duplicate = appState.paymentMethods.some(pm => pm.id !== editId && pm.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      alert('Another payment method with this name already exists.');
      return;
    }

    appState.paymentMethods[pmIndex].name = name;
    appState.paymentMethods[pmIndex].type = type;
    appState.paymentMethods[pmIndex].color = color;
    if (type === 'Credit Card') {
      appState.paymentMethods[pmIndex].dueDay = dueDay;
    } else {
      delete appState.paymentMethods[pmIndex].dueDay;
    }

    saveStateToStorage();
    cancelEditPaymentMethod();
    populatePaymentMethodSelect();
    updateFilterOptions();
    renderExpenseTable();
    renderCharts();
    renderMonthlyCalendar();
    updateMetrics();
    showToast(`Updated "${name}" payment method`);
  } else {
    // Add new payment method
    const exists = appState.paymentMethods.some(pm => pm.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('A payment method with this name already exists.');
      return;
    }

    const newPm = {
      id: 'pm_' + Date.now(),
      name,
      type,
      color
    };
    if (type === 'Credit Card') {
      newPm.dueDay = dueDay;
    }

    appState.paymentMethods.push(newPm);
    saveStateToStorage();
    cancelEditPaymentMethod();
    populatePaymentMethodSelect();
    updateFilterOptions();
    renderExpenseTable();
    renderCharts();
    renderMonthlyCalendar();
    updateMetrics();
    showToast(`Added "${name}" payment method`);
  }
}

// -----------------------------------------------------------------------------
// Credit Card Dues & Billing Modal Logic
// -----------------------------------------------------------------------------
function openCreditCardDuesModal() {
  if (!el.creditCardDuesModal) return;
  renderCreditCardDuesModal();
  el.creditCardDuesModal.showModal();
}

function closeCreditCardDuesModal() {
  if (!el.creditCardDuesModal) return;
  el.creditCardDuesModal.close();
}

function renderCreditCardDuesModal() {
  if (!el.ccCardsList) return;

  if (el.ccModalMonthBadge) {
    el.ccModalMonthBadge.textContent = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }

  // Update Cycle Mode Tabs
  if (el.btnCycleDueMonth && el.btnCyclePostDue) {
    el.btnCycleDueMonth.classList.toggle('active', currentCcCycleMode === 'due-month');
    el.btnCyclePostDue.classList.toggle('active', currentCcCycleMode === 'post-due');
  }
  if (el.ccCycleTabMonthName) {
    el.ccCycleTabMonthName.textContent = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }

  const creditCards = appState.paymentMethods.filter(pm => pm.type === 'Credit Card');

  el.ccCardsList.innerHTML = '';

  if (creditCards.length === 0) {
    if (el.ccModalTotalSpend) el.ccModalTotalSpend.textContent = formatCurrency(0);
    if (el.ccModalTotalPaid) el.ccModalTotalPaid.textContent = formatCurrency(0);
    if (el.ccModalTotalPayable) el.ccModalTotalPayable.textContent = formatCurrency(0);
    if (el.ccModalTxCount) el.ccModalTxCount.textContent = 'Across 0 transactions';
    if (el.ccModalPaymentsCount) el.ccModalPaymentsCount.textContent = '0 payments recorded';
    if (el.ccModalActiveCardsCount) el.ccModalActiveCardsCount.textContent = '0 credit cards active';

    el.ccCardsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <p style="font-size: 1rem; margin-bottom: 0.5rem; font-weight: 600;">No payment methods of type "Credit Card" found.</p>
        <p style="font-size: 0.82rem; color: var(--text-dim); margin-bottom: 1rem;">Add or change a payment method type to "Credit Card" to track monthly dues and billing cycles.</p>
        <button type="button" class="btn btn-primary" id="btn-add-cc-now">+ Configure Payment Methods</button>
      </div>
    `;
    const addBtn = el.ccCardsList.querySelector('#btn-add-cc-now');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        closeCreditCardDuesModal();
        openPaymentMethodsModal();
      });
    }
    return;
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let totalCcSpendInInr = 0;
  let totalCcPaidInInr = 0;
  let totalCcPayableInInr = 0;
  let totalCcTxCount = 0;
  let totalCcPaymentsCount = 0;

  creditCards.forEach(pm => {
    // Determine card billing cycle based on active tab view
    const cycle = currentCcCycleMode === 'due-month'
      ? getCardBillingCycleForDueMonth(pm, selectedYear, selectedMonth)
      : getCardCycleStartingPostDue(pm, selectedYear, selectedMonth);

    // Filter transactions falling in this cycle: [cycle.startDateStr, cycle.endDateStr]
    const cardItems = getExpensesForCardCycle(pm.id, cycle.startDateStr, cycle.endDateStr);
    const cardSpent = cardItems.reduce((s, x) => s + Number(x.amount), 0);
    const cardTxCount = cardItems.length;

    // Filter payments matching this card billing cycle
    const cardPayments = getPaymentsForCardCycle(pm.id, cycle);
    const cardPaid = cardPayments.reduce((s, x) => s + Number(x.amount), 0);
    const cardRemainingDue = Math.max(0, cardSpent - cardPaid);

    totalCcSpendInInr += cardSpent;
    totalCcPaidInInr += cardPaid;
    totalCcPayableInInr += cardRemainingDue;
    totalCcTxCount += cardTxCount;
    totalCcPaymentsCount += cardPayments.length;

    // Check for post-due expenses in the selected month (spends after due day that belong to next cycle)
    let postDueAlertHtml = '';
    if (currentCcCycleMode === 'due-month') {
      const postCycle = getCardCycleStartingPostDue(pm, selectedYear, selectedMonth);
      const daysInCurMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endOfCurMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInCurMonth).padStart(2, '0')}`;
      const postDueExpenses = appState.expenses.filter(e =>
        e.paymentMethodId === pm.id &&
        e.date >= postCycle.startDateStr &&
        e.date <= endOfCurMonthStr
      );
      const postDueAmt = postDueExpenses.reduce((s, x) => s + Number(x.amount), 0);
      if (postDueAmt > 0) {
        postDueAlertHtml = `
          <div class="cc-post-due-alert">
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><strong>${postDueExpenses.length} post-due ${postDueExpenses.length === 1 ? 'expense' : 'expenses'} (${formatCurrency(postDueAmt)})</strong> incurred in ${MONTH_SHORT[selectedMonth]} after due date (${cycle.dueDay}th). Billed in ${MONTH_SHORT[postCycle.targetMonth]} (due ${postCycle.dueDay} ${MONTH_SHORT[postCycle.targetMonth]}).</span>
            <button type="button" class="cc-btn-switch-cycle" data-switch-to="post-due">View in Next Cycle →</button>
          </div>
        `;
      }
    } else {
      // In post-due mode, show an explanatory chip
      postDueAlertHtml = `
        <div class="cc-post-due-alert" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25); color: var(--primary);">
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg><strong>Active Rolling Cycle:</strong> Showing charges incurred from ${escapeHtml(cycle.startDateStr)} to ${escapeHtml(cycle.endDateStr)} (due on ${cycle.dueDay} ${MONTH_SHORT[cycle.targetMonth]} ${cycle.targetYear}).</span>
          <button type="button" class="cc-btn-switch-cycle" style="background: var(--primary); color: #fff;" data-switch-to="due-month">← Back to Billed Due</button>
        </div>
      `;
    }

    // Due countdown & status badge calculation
    const dueMidnight = cycle.dueDate;
    const diffDays = Math.ceil((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
    let statusText = '';
    let statusClass = '';

    if (cardSpent === 0) {
      if (cardPaid > 0) {
        statusText = `Credit Bal: ${formatCurrency(cardPaid)}`;
        statusClass = 'status-fully-paid';
      } else {
        statusText = 'No charges in cycle';
        statusClass = 'status-no-dues';
      }
    } else if (cardRemainingDue === 0) {
      statusText = `Fully Paid (${formatCurrency(cardPaid)})`;
      statusClass = 'status-fully-paid';
    } else if (diffDays < 0) {
      statusText = (cardPaid > 0) ? `Partially Paid (Past due ${Math.abs(diffDays)}d ago)` : `Past due (${Math.abs(diffDays)}d ago)`;
      statusClass = (cardPaid > 0) ? 'status-partially-paid' : 'status-past-due';
    } else if (diffDays === 0) {
      statusText = (cardPaid > 0) ? 'Partially Paid (Due Today!)' : 'Due Today!';
      statusClass = (cardPaid > 0) ? 'status-partially-paid' : 'status-due-today';
    } else {
      const dayStr = diffDays === 1 ? 'day' : 'days';
      statusText = (cardPaid > 0) ? `Partially Paid (Due in ${diffDays}d)` : `Due in ${diffDays} ${dayStr}`;
      statusClass = (cardPaid > 0) ? 'status-partially-paid' : 'status-upcoming';
    }

    const cardEl = document.createElement('div');
    cardEl.className = 'cc-card-item';
    cardEl.innerHTML = `
      <div class="cc-card-item-top">
        <div class="cc-card-brand">
          <span class="cc-card-badge" style="background-color: ${pm.color};"></span>
          <div>
            <div class="cc-card-title">${escapeHtml(pm.name)}</div>
            <div class="cc-card-type"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>${escapeHtml(pm.type)} • Monthly due day: <strong>${cycle.configuredDueDay}th</strong></div>
          </div>
        </div>
        <div class="cc-financial-grid">
          <div class="cc-fin-stat">
            <span class="cc-fin-label">Billed Spends</span>
            <span class="cc-fin-val">${formatCurrency(cardSpent)}</span>
          </div>
          <div class="cc-fin-stat">
            <span class="cc-fin-label">Payments Made</span>
            <span class="cc-fin-val ${cardPaid > 0 ? 'val-paid' : ''}">${formatCurrency(cardPaid)}</span>
          </div>
          <div class="cc-fin-stat">
            <span class="cc-fin-label">Remaining Due</span>
            <span class="cc-fin-val ${cardRemainingDue > 0 ? 'val-due' : 'val-clear'}">${formatCurrency(cardRemainingDue)}</span>
          </div>
        </div>
      </div>

      <div class="cc-card-item-bottom">
        <div class="cc-due-config-wrap">
          <label class="cc-due-label" for="due-day-input-${pm.id}">Due Day:</label>
          <input type="number" id="due-day-input-${pm.id}" class="cc-due-day-input" min="1" max="31" value="${cycle.configuredDueDay}" title="Enter day of month (1-31) when this card's bill is due">
          <div class="cc-cycle-range-tag" title="Billing cycle: spendings from day after prev due date till this due date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Cycle: ${escapeHtml(cycle.startDateStr)} to ${escapeHtml(cycle.endDateStr)} • Due: ${escapeHtml(cycle.dueDateStr)}
          </div>
          <span class="cc-due-status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="cc-card-actions">
          <button type="button" class="btn-record-payment btn-toggle-pay-form" data-pm-id="${pm.id}">
            + Record Payment
          </button>
          <button type="button" class="btn btn-ghost-sm btn-toggle-tx-preview" data-pm-id="${pm.id}" title="Toggle list of transactions in this cycle">
            Charges (${cardTxCount}) ▾
          </button>
          <button type="button" class="btn btn-ghost-sm btn-filter-card" title="View all expenses for this card in main table">
            Filter Table
          </button>
        </div>
      </div>

      ${postDueAlertHtml}

      <!-- Collapsible Charges Breakdown for this Cycle -->
      <div class="cc-cycle-tx-preview" id="tx-preview-${pm.id}" style="display: none;">
        <div class="cc-cycle-tx-preview-header">
          <span>Charges in Cycle (${cardItems.length})</span>
          <span>Amount</span>
        </div>
        ${cardItems.length === 0 ? `
          <div style="font-size: 0.78rem; color: var(--text-dim); padding: 4px;">
            No expenses recorded between ${escapeHtml(cycle.startDateStr)} and ${escapeHtml(cycle.endDateStr)}.
          </div>
        ` : cardItems.map(item => `
          <div class="cc-cycle-tx-item">
            <div>
              <div class="cc-cycle-tx-desc">${escapeHtml(item.description)}</div>
              <div class="cc-cycle-tx-date"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(item.date)} • ${escapeHtml(item.category)}${item.notes ? ` • ${escapeHtml(item.notes)}` : ''}</div>
            </div>
            <div class="cc-cycle-tx-amt">${formatCurrency(item.amount)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Inline Record Bill Payment Form (Toggled by Button) -->
      <div class="cc-inline-pay-form" id="pay-form-${pm.id}" style="display: none;">
        <div class="cc-pay-form-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Record Bill Payment for ${escapeHtml(pm.name)} (Due ${escapeHtml(cycle.dueDateStr)})</div>
        <div class="cc-pay-form-row">
          <div class="cc-pay-form-group">
            <label for="pay-date-${pm.id}">Payment Date</label>
            <input type="date" id="pay-date-${pm.id}" class="form-input pay-input-date" value="${cycle.dueDateStr}">
          </div>
          <div class="cc-pay-form-group">
            <label for="pay-amount-${pm.id}">Amount Paid (${appState.currency || 'INR'})</label>
            <input type="number" step="0.01" min="0.01" id="pay-amount-${pm.id}" class="form-input pay-input-amt" placeholder="0.00" value="${cardRemainingDue > 0 ? convertFromInr(cardRemainingDue).toFixed(2) : (cardSpent > 0 ? convertFromInr(cardSpent).toFixed(2) : '')}">
          </div>
          <div class="cc-pay-form-group" style="flex: 2;">
            <label for="pay-notes-${pm.id}">Payment Reference / Mode (Optional)</label>
            <input type="text" id="pay-notes-${pm.id}" class="form-input pay-input-notes" placeholder="e.g., Paid via HDFC NetBanking / Cred / UPI Ref #1234">
          </div>
        </div>
        <div class="cc-pay-form-actions">
          <button type="button" class="btn btn-secondary btn-cancel-pay" style="padding: 4px 12px; font-size: 0.8rem;">Cancel</button>
          <button type="button" class="btn btn-primary btn-save-pay" style="padding: 4px 12px; font-size: 0.8rem;">Save Payment</button>
        </div>
      </div>

      <!-- Payment History Log for this Card Cycle -->
      <div class="cc-payments-section">
        <div class="cc-payments-header">
          <span class="cc-payments-title">Bill Payments Recorded for Cycle (${cardPayments.length})</span>
          ${cardPaid > 0 ? `<span style="font-size: 0.76rem; font-weight: 700; color: var(--success); font-family: var(--font-mono);">Total Paid: ${formatCurrency(cardPaid)}</span>` : ''}
        </div>
        <div class="cc-payments-list">
          ${cardPayments.length === 0 ? `
            <div style="font-size: 0.78rem; color: var(--text-dim); padding: 4px 2px;">
              No payments recorded yet for this billing cycle (due ${escapeHtml(cycle.dueDateStr)}). Click <strong>+ Record Payment</strong> above after paying your bill.
            </div>
          ` : cardPayments.map(p => `
            <div class="cc-payment-item">
              <div class="cc-payment-details">
                <span class="cc-payment-date"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${escapeHtml(p.date)}</span>
                <span class="cc-payment-amount">+ ${formatCurrency(p.amount)}</span>
                ${p.notes ? `<span class="cc-payment-notes">— ${escapeHtml(p.notes)}</span>` : ''}
              </div>
              <button type="button" class="btn-delete-cc-payment" data-pay-id="${p.id}" title="Delete this payment record">&times;</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Due Day input listener
    const dueInput = cardEl.querySelector('.cc-due-day-input');
    const handleDueChange = () => {
      let val = parseInt(dueInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 31) val = 31;
      dueInput.value = val;
      updateCardDueDay(pm.id, val);
    };
    dueInput.addEventListener('change', handleDueChange);

    // Switch cycle button inside post-due alert if present
    const switchCycleBtn = cardEl.querySelector('.cc-btn-switch-cycle');
    if (switchCycleBtn) {
      switchCycleBtn.addEventListener('click', () => {
        currentCcCycleMode = switchCycleBtn.dataset.switchTo || (currentCcCycleMode === 'due-month' ? 'post-due' : 'due-month');
        renderCreditCardDuesModal();
      });
    }

    // Toggle charges list preview
    const txToggleBtn = cardEl.querySelector('.btn-toggle-tx-preview');
    const txPreview = cardEl.querySelector(`#tx-preview-${pm.id}`);
    if (txToggleBtn && txPreview) {
      txToggleBtn.addEventListener('click', () => {
        const isShown = txPreview.style.display !== 'none';
        txPreview.style.display = isShown ? 'none' : 'flex';
        txToggleBtn.textContent = isShown ? `Charges (${cardTxCount}) ▾` : `Charges (${cardTxCount}) ▴`;
      });
    }

    // Filter by this card in main table
    const filterBtn = cardEl.querySelector('.btn-filter-card');
    filterBtn.addEventListener('click', () => {
      closeCreditCardDuesModal();
      switchView('monthly-view');
      el.filterPayment.value = pm.id;
      renderExpenseTable();
      showToast(`Showing expenses for ${pm.name}`);
    });

    // Toggle Record Payment Form
    const payForm = cardEl.querySelector(`#pay-form-${pm.id}`);
    const togglePayBtn = cardEl.querySelector('.btn-toggle-pay-form');
    const cancelPayBtn = cardEl.querySelector('.btn-cancel-pay');
    const savePayBtn = cardEl.querySelector('.btn-save-pay');

    togglePayBtn.addEventListener('click', () => {
      const isVisible = payForm.style.display !== 'none';
      payForm.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        payForm.querySelector('.pay-input-amt').focus();
      }
    });

    cancelPayBtn.addEventListener('click', () => {
      payForm.style.display = 'none';
    });

    savePayBtn.addEventListener('click', () => {
      const dateVal = cardEl.querySelector(`#pay-date-${pm.id}`).value;
      const amtVal = cardEl.querySelector(`#pay-amount-${pm.id}`).value;
      const notesVal = cardEl.querySelector(`#pay-notes-${pm.id}`).value;
      recordCreditCardPayment(pm.id, dateVal, amtVal, notesVal, cycle);
    });

    // Delete individual payment buttons
    cardEl.querySelectorAll('.btn-delete-cc-payment').forEach(delBtn => {
      delBtn.addEventListener('click', () => {
        deleteCreditCardPayment(delBtn.dataset.payId);
      });
    });

    el.ccCardsList.appendChild(cardEl);
  });

  // Update top summary boxes
  if (el.ccModalTotalSpend) el.ccModalTotalSpend.textContent = formatCurrency(totalCcSpendInInr);
  if (el.ccModalTotalPaid) el.ccModalTotalPaid.textContent = formatCurrency(totalCcPaidInInr);
  if (el.ccModalTotalPayable) el.ccModalTotalPayable.textContent = formatCurrency(totalCcPayableInInr);
  if (el.ccModalTxCount) el.ccModalTxCount.textContent = `Across ${totalCcTxCount} ${totalCcTxCount === 1 ? 'transaction' : 'transactions'} in cycle`;
  if (el.ccModalPaymentsCount) el.ccModalPaymentsCount.textContent = `${totalCcPaymentsCount} ${totalCcPaymentsCount === 1 ? 'payment recorded' : 'payments recorded'}`;
  if (el.ccModalActiveCardsCount) el.ccModalActiveCardsCount.textContent = `${creditCards.length} credit ${creditCards.length === 1 ? 'card' : 'cards'} active`;
}

function updateCardDueDay(pmId, newDueDay) {
  const pm = appState.paymentMethods.find(x => x.id === pmId);
  if (!pm) return;
  if (pm.dueDay === newDueDay) return;

  pm.dueDay = newDueDay;
  saveStateToStorage();
  renderCreditCardDuesModal();
  updateMetrics();
  renderPaymentMethodsList();
  showToast(`Due date for "${pm.name}" updated to day ${newDueDay} of every month`);
}

function recordCreditCardPayment(pmId, dateStr, displayAmount, notes, cycle) {
  const numAmt = parseFloat(displayAmount);
  if (isNaN(numAmt) || numAmt <= 0) {
    alert('Please enter a valid positive payment amount.');
    return;
  }
  if (!dateStr) {
    alert('Please enter a valid payment date.');
    return;
  }

  // Convert entered display amount to base INR
  const amountInInr = convertToInr(numAmt, appState.currency);

  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;

  if (!Array.isArray(appState.creditCardPayments)) {
    appState.creditCardPayments = [];
  }

  const newPayment = {
    id: 'ccpay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    year: y,
    month: m,
    paymentMethodId: pmId,
    date: dateStr,
    amount: amountInInr,
    notes: (notes || '').trim(),
    billingCycleEnd: cycle ? cycle.dueDateStr : undefined,
    targetYear: cycle ? cycle.targetYear : y,
    targetMonth: cycle ? cycle.targetMonth : m
  };

  appState.creditCardPayments.push(newPayment);
  saveStateToStorage();
  updateMetrics();
  renderCreditCardDuesModal();
  initDailyJournal();
  renderMonthlyCalendar();

  const pm = getPaymentMethod(pmId);
  showToast(`Recorded payment of ${formatCurrency(amountInInr)} for ${pm.name}`);
}

function deleteCreditCardPayment(paymentId) {
  const payment = (appState.creditCardPayments || []).find(p => p.id === paymentId);
  if (!payment) return;

  const pm = getPaymentMethod(payment.paymentMethodId);
  const confirmDel = confirm(`Delete payment record of ${formatCurrency(payment.amount)} made to "${pm.name}" on ${payment.date}? The remaining bill due will be recalculated.`);
  if (!confirmDel) return;

  appState.creditCardPayments = appState.creditCardPayments.filter(p => p.id !== paymentId);
  saveStateToStorage();
  updateMetrics();
  renderCreditCardDuesModal();
  initDailyJournal();
  renderMonthlyCalendar();
  showToast('Payment record deleted. Remaining due recalculated.');
}

function deletePaymentMethod(pmId, usageCount) {
  if (appState.paymentMethods.length <= 1) {
    alert('You must keep at least one active payment method.');
    return;
  }

  if (usageCount > 0) {
    const confirmDelete = confirm(`This payment method is linked to ${usageCount} expense transactions. Deleting it will keep the transactions but mark the payment method as archived. Proceed?`);
    if (!confirmDelete) return;
  }

  // If currently editing this item, cancel editing
  if (el.editPmId && el.editPmId.value === pmId) {
    cancelEditPaymentMethod();
  }

  appState.paymentMethods = appState.paymentMethods.filter(pm => pm.id !== pmId);
  saveStateToStorage();
  populatePaymentMethodSelect();
  updateFilterOptions();
  renderPaymentMethodsList();
  renderExpenseTable();
  renderCharts();
  renderMonthlyCalendar();
  showToast('Payment method removed');
}

// -----------------------------------------------------------------------------
// DAILY JOURNAL MANAGEMENT (Every Day, YYYY-MM-DD)
// -----------------------------------------------------------------------------
function setJournalDate(newDateStr) {
  if (!newDateStr) return;
  selectedJournalDate = newDateStr;

  // Also sync timeline if year or month changed
  const parts = newDateStr.split('-');
  const yr = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10) - 1;

  if (yr !== selectedYear || mo !== selectedMonth) {
    selectedYear = Math.max(2026, yr);
    selectedMonth = mo;
    renderYearOptions();
    renderMonthPills();
    updateMetrics();
    renderExpenseTable();
    renderCharts();
  }

  initDailyJournal();
}

function stepJournalDay(direction) {
  const [y, m, d] = selectedJournalDate.split('-').map(Number);
  const curDate = new Date(y, m - 1, d);
  curDate.setDate(curDate.getDate() + direction);

  // Constraint: Cannot go before 2026-01-01
  if (curDate < new Date(2026, 0, 1)) {
    showToast('Timeline begins from 1 January 2026.');
    return;
  }

  const newY = curDate.getFullYear();
  const newM = String(curDate.getMonth() + 1).padStart(2, '0');
  const newD = String(curDate.getDate()).padStart(2, '0');
  setJournalDate(`${newY}-${newM}-${newD}`);
}

function initDailyJournal() {
  if (!selectedJournalDate) {
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    selectedJournalDate = `${selectedYear}-${mStr}-01`;
  }

  if (el.journalDateInput) {
    el.journalDateInput.value = selectedJournalDate;
  }

  // Format date heading: e.g. "Friday, 2 January 2026"
  const [y, m, d] = selectedJournalDate.split('-').map(Number);
  const dObj = new Date(y, m - 1, d);
  const weekdayName = dObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  el.journalDayWeekday.textContent = weekdayName;

  // Day's expenses & credit card payments summary
  const dayItems = getExpensesForDay(selectedJournalDate);
  const dayTotalInInr = dayItems.reduce((acc, cur) => acc + Number(cur.amount), 0);
  const dayPayments = (appState.creditCardPayments || []).filter(p => p.date === selectedJournalDate);
  const dayPaymentsTotal = dayPayments.reduce((acc, cur) => acc + Number(cur.amount), 0);

  const summaryParts = [];
  if (dayItems.length > 0) {
    summaryParts.push(`<span class="inline-summary-item"><strong>${formatCurrency(dayTotalInInr)}</strong> spent today across ${dayItems.length} ${dayItems.length === 1 ? 'entry' : 'entries'}</span>`);
  }
  if (dayPayments.length > 0) {
    const cardNames = dayPayments.map(p => getPaymentMethod(p.paymentMethodId).name).join(', ');
    summaryParts.push(`<span class="inline-summary-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:3px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><strong>${formatCurrency(dayPaymentsTotal)}</strong> bill payment made (${escapeHtml(cardNames)})</span>`);
  }

  if (summaryParts.length > 0) {
    el.journalDayExpensesSummary.innerHTML = summaryParts.join(' • ');
  } else {
    el.journalDayExpensesSummary.innerHTML = '<span style="color: var(--text-dim);">No expenses or bill payments recorded on this day</span>';
  }

  // Load daily journal text
  const text = (appState.journals && appState.journals[selectedJournalDate]) || '';
  el.dailyJournalText.value = text;
  updateJournalStats();
  el.journalStatus.textContent = text.trim() ? 'Auto-saved' : 'No entry';

  // Render the full calendar navigation grid
  renderMonthlyCalendar();
}

function renderMonthlyCalendar() {
  if (!el.calDaysGrid || !el.calMonthYearTitle) return;

  el.calMonthYearTitle.textContent = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  el.calDaysGrid.innerHTML = '';

  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun
  const daysInCurMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Leading days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${prevDayNum}</span>`;
    el.calDaysGrid.appendChild(cell);
  }

  // 2. Days of the active selected month
  for (let day = 1; day <= daysInCurMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-day-cell';

    const isSelected = (dateStr === selectedJournalDate);
    const isToday = (dateStr === todayStr);

    if (isSelected) cell.classList.add('selected');
    if (isToday) cell.classList.add('today-cell');

    const hasJournal = !!(appState.journals && appState.journals[dateStr] && appState.journals[dateStr].trim());
    const dayExpenses = getExpensesForDay(dateStr);
    const hasExpenses = dayExpenses.length > 0;
    const dayTotalInInr = dayExpenses.reduce((s, x) => s + Number(x.amount), 0);
    const dayPayments = (appState.creditCardPayments || []).filter(p => p.date === dateStr);
    const hasPayments = dayPayments.length > 0;
    const dayPaymentsTotal = dayPayments.reduce((s, x) => s + Number(x.amount), 0);

    const hasFinancials = hasExpenses || hasPayments;

    let dotsHtml = '';
    if (hasJournal && hasFinancials) {
      dotsHtml = `<div class="cal-cell-dots"><span class="cell-dot dot-both" title="Has journal note & transactions/payments"></span></div>`;
    } else if (hasJournal) {
      dotsHtml = `<div class="cal-cell-dots"><span class="cell-dot dot-journal" title="Has journal note"></span></div>`;
    } else if (hasFinancials) {
      dotsHtml = `<div class="cal-cell-dots"><span class="cell-dot dot-expense" title="Has expenses or card payments"></span></div>`;
    } else {
      dotsHtml = `<div class="cal-cell-dots"></div>`;
    }

    cell.innerHTML = `
      <span class="cal-day-num">${day}</span>
      ${dotsHtml}
    `;

    // Rich Tooltip
    let tooltip = `${day} ${MONTH_SHORT[selectedMonth]} ${selectedYear}`;
    if (hasJournal) tooltip += ' • 📝 Note saved';
    if (hasExpenses) tooltip += ` • 💸 Spent: ${formatCurrency(dayTotalInInr)}`;
    if (hasPayments) tooltip += ` • 💳 Bill Paid: ${formatCurrency(dayPaymentsTotal)}`;
    cell.title = tooltip;

    cell.addEventListener('click', () => {
      setJournalDate(dateStr);
    });

    el.calDaysGrid.appendChild(cell);
  }

  // 3. Trailing days to finish the 7-column grid
  const totalCellsSoFar = firstDayOfWeek + daysInCurMonth;
  const trailingDays = (7 - (totalCellsSoFar % 7)) % 7;
  for (let j = 1; j <= trailingDays; j++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${j}</span>`;
    el.calDaysGrid.appendChild(cell);
  }
}

function saveJournal(showNotification = false) {
  if (!appState.journals) appState.journals = {};

  const text = el.dailyJournalText.value;
  appState.journals[selectedJournalDate] = text;
  saveStateToStorage();

  el.journalStatus.textContent = 'Auto-saved';
  el.journalStatus.style.color = 'var(--success)';
  el.journalStatus.style.background = 'var(--success-soft)';

  // Update dots on calendar
  renderMonthlyCalendar();

  if (showNotification) {
    showToast(`Journal saved for ${selectedJournalDate}`);
  }
}

function updateJournalStats() {
  const text = el.dailyJournalText.value;
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  el.journalCharCount.textContent = `${wordCount} words • ${charCount} chars`;
}

function handleJournalInput() {
  updateJournalStats();
  el.journalStatus.textContent = 'Unsaved changes...';
  el.journalStatus.style.color = 'var(--warning)';
  el.journalStatus.style.background = 'var(--warning-soft)';

  clearTimeout(journalDebounceTimer);
  journalDebounceTimer = setTimeout(() => {
    saveJournal(false);
  }, 900);
}

function handleInsertJournalTag(tagText) {
  const textarea = el.dailyJournalText;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const prefix = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
  const insertion = prefix + tagText;

  textarea.value = text.substring(0, start) + insertion + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + insertion.length;

  handleJournalInput();
}

// -----------------------------------------------------------------------------
// SVG Charts Rendering (Category & Payment Method Breakdown)
// -----------------------------------------------------------------------------
function renderCharts() {
  renderCategoryChart();
  renderPaymentChart();
  if (activeView === 'annual-view') {
    renderAnnualView();
  }
}

function renderCategoryChart() {
  const container = el.categoryChartContainer;
  const items = getExpensesForMonth(selectedYear, selectedMonth);

  if (items.length === 0) {
    container.innerHTML = `<div style="color: var(--text-dim); font-size: 0.85rem; padding: 2rem;">No expenses recorded for this month.</div>`;
    return;
  }

  const totals = {};
  let totalSpend = 0;
  items.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    totalSpend += Number(e.amount);
  });

  const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]).slice(0, 6);
  const rowHeight = 34;
  const svgHeight = sorted.length * rowHeight + 10;
  const svgWidth = 380;
  const barMaxWidth = 180;
  const maxVal = sorted[0][1] || 1;

  let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  sorted.forEach(([cat, valInInr], idx) => {
    const y = idx * rowHeight + 10;
    const barWidth = Math.max(8, (valInInr / maxVal) * barMaxWidth);
    const color = CATEGORY_COLORS[cat] || 'var(--primary)';
    const pct = Math.round((valInInr / totalSpend) * 100);

    svg += `
      <text x="5" y="${y + 16}" class="chart-bar-label">${escapeHtml(cat.length > 14 ? cat.substring(0, 13) + '…' : cat)}</text>
      <rect x="110" y="${y + 4}" width="${barMaxWidth}" height="14" class="chart-bar-bg" />
      <rect x="110" y="${y + 4}" width="${barWidth}" height="14" fill="${color}" class="chart-bar-fill" />
      <text x="${110 + barMaxWidth + 10}" y="${y + 16}" class="chart-bar-val">${formatCurrency(valInInr)} (${pct}%)</text>
    `;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

function renderPaymentChart() {
  const container = el.paymentChartContainer;
  const items = getExpensesForMonth(selectedYear, selectedMonth);

  if (items.length === 0) {
    container.innerHTML = `<div style="color: var(--text-dim); font-size: 0.85rem; padding: 2rem;">No payment breakdown available.</div>`;
    return;
  }

  const totals = {};
  let totalSpend = 0;
  items.forEach(e => {
    totals[e.paymentMethodId] = (totals[e.paymentMethodId] || 0) + Number(e.amount);
    totalSpend += Number(e.amount);
  });

  const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]);
  const rowHeight = 34;
  const svgHeight = sorted.length * rowHeight + 10;
  const svgWidth = 380;
  const barMaxWidth = 180;
  const maxVal = sorted[0][1] || 1;

  let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  sorted.forEach(([pmId, valInInr], idx) => {
    const pm = getPaymentMethod(pmId);
    const y = idx * rowHeight + 10;
    const barWidth = Math.max(8, (valInInr / maxVal) * barMaxWidth);
    const pct = Math.round((valInInr / totalSpend) * 100);

    svg += `
      <text x="5" y="${y + 16}" class="chart-bar-label">${escapeHtml(pm.name.length > 14 ? pm.name.substring(0, 13) + '…' : pm.name)}</text>
      <rect x="110" y="${y + 4}" width="${barMaxWidth}" height="14" class="chart-bar-bg" />
      <rect x="110" y="${y + 4}" width="${barWidth}" height="14" fill="${pm.color}" class="chart-bar-fill" />
      <text x="${110 + barMaxWidth + 10}" y="${y + 16}" class="chart-bar-val">${formatCurrency(valInInr)} (${pct}%)</text>
    `;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// -----------------------------------------------------------------------------
// Annual Summary View & Chart
// -----------------------------------------------------------------------------
function renderAnnualView() {
  el.annualTabYear.textContent = selectedYear;
  el.annualHeaderYear.textContent = selectedYear;

  el.annualTbody.innerHTML = '';
  let annualGrandTotalInInr = 0;
  let annualGrandCount = 0;

  const monthData = [];

  for (let m = 0; m < 12; m++) {
    const items = getExpensesForMonth(selectedYear, m);
    const totalInInr = items.reduce((s, x) => s + Number(x.amount), 0);
    const count = items.length;
    const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
    const dailyAvgInInr = count > 0 ? (totalInInr / daysInMonth) : 0;

    // Top Category
    const catMap = {};
    items.forEach(x => catMap[x.category] = (catMap[x.category] || 0) + Number(x.amount));
    let topCat = '—';
    let topCatVal = 0;
    for (const [c, amt] of Object.entries(catMap)) {
      if (amt > topCatVal) { topCat = c; topCatVal = amt; }
    }

    // Count daily notes for this month
    const mPrefix = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
    let dailyNotesCount = 0;
    if (appState.journals) {
      Object.keys(appState.journals).forEach(dKey => {
        if (dKey.startsWith(mPrefix) && appState.journals[dKey].trim()) dailyNotesCount++;
      });
    }

    annualGrandTotalInInr += totalInInr;
    annualGrandCount += count;

    monthData.push({ month: m, total: totalInInr });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${MONTH_NAMES[m]}</strong></td>
      <td class="text-right cell-amount">${totalInInr > 0 ? formatCurrency(totalInInr) : '—'}</td>
      <td class="text-right">${count}</td>
      <td class="text-right">${dailyAvgInInr > 0 ? formatCurrency(dailyAvgInInr) : '—'}</td>
      <td>${topCat !== '—' ? `<span class="badge badge-category">${topCat}</span>` : '—'}</td>
      <td class="text-center">${dailyNotesCount > 0 ? `<span class="journal-status">${dailyNotesCount} days</span>` : '<span style="color:var(--text-dim);">None</span>'}</td>
      <td class="text-center">
        <button class="btn btn-secondary btn-sm btn-jump-month" data-month="${m}">
          Open Month
        </button>
      </td>
    `;

    tr.querySelector('.btn-jump-month').addEventListener('click', () => {
      selectedMonth = m;
      const mStr = String(m + 1).padStart(2, '0');
      selectedJournalDate = `${selectedYear}-${mStr}-01`;
      switchView('monthly-view');
      renderAll();
    });

    el.annualTbody.appendChild(tr);
  }

  const avgMonthlyInInr = annualGrandTotalInInr / 12;
  el.annualTfoot.innerHTML = `
    <tr style="background: var(--bg-surface-elevated); font-weight: 700;">
      <td>Total for ${selectedYear}</td>
      <td class="text-right cell-amount" style="color: var(--primary); font-size: 1.05rem;">${formatCurrency(annualGrandTotalInInr)}</td>
      <td class="text-right">${annualGrandCount}</td>
      <td class="text-right">Avg: ${formatCurrency(avgMonthlyInInr)} / mo</td>
      <td colspan="3" class="text-center">Annual Summary</td>
    </tr>
  `;

  renderAnnualChart(monthData);
}

function renderAnnualChart(monthData) {
  if (!monthData) {
    monthData = [];
    for (let m = 0; m < 12; m++) {
      const items = getExpensesForMonth(selectedYear, m);
      monthData.push({
        month: m,
        total: items.reduce((s, x) => s + Number(x.amount), 0)
      });
    }
  }

  const container = el.annualChartContainer;
  const maxSpend = Math.max(...monthData.map(d => d.total), 100);
  const chartHeight = 180;
  const chartWidth = 760;
  const barWidth = 36;
  const gap = (chartWidth - 60 - (12 * barWidth)) / 11;

  let svg = `<svg viewBox="0 0 ${chartWidth} ${chartHeight + 40}" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">`;

  // Baseline
  svg += `<line x1="30" y1="${chartHeight}" x2="${chartWidth - 20}" y2="${chartHeight}" stroke="var(--border-color)" stroke-width="1"/>`;

  monthData.forEach((d, i) => {
    const x = 40 + i * (barWidth + gap);
    const barH = d.total > 0 ? Math.max(6, (d.total / maxSpend) * (chartHeight - 30)) : 0;
    const y = chartHeight - barH;
    const isCurrent = (d.month === selectedMonth);
    const fillColor = isCurrent ? 'var(--primary)' : 'rgba(99, 102, 241, 0.45)';

    svg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${fillColor}" />
      <text x="${x + barWidth / 2}" y="${chartHeight + 18}" text-anchor="middle" class="chart-bar-label" fill="${isCurrent ? 'var(--primary)' : 'var(--text-muted)'}">${MONTH_SHORT[d.month]}</text>
      ${d.total > 0 ? `<text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-family="var(--font-mono)" font-weight="700" fill="var(--text-main)">${formatCurrency(d.total)}</text>` : ''}
    `;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
}

// -----------------------------------------------------------------------------
// View & Side Menu Switching
// -----------------------------------------------------------------------------
function switchView(targetView) {
  activeView = targetView;
  if (el.viewTabs) {
    el.viewTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.view === targetView);
    });
  }

  if (targetView === 'monthly-view') {
    if (el.monthlyView) el.monthlyView.classList.add('active');
  } else if (targetView === 'annual-view') {
    openSideMenu('side-annual-summary');
  }
}

function openSideMenu(targetTabId = null) {
  if (!el.sideMenuDrawer) return;
  el.sideMenuDrawer.classList.add('open');
  if (el.sideMenuOverlay) el.sideMenuOverlay.classList.add('open');

  if (targetTabId) {
    switchSideTab(targetTabId);
  } else {
    const currentActive = document.querySelector('.side-menu-tab-btn.active');
    if (currentActive) {
      switchSideTab(currentActive.dataset.sideTab);
    } else {
      switchSideTab('side-annual-summary');
    }
  }
}

function closeSideMenu() {
  if (!el.sideMenuDrawer) return;
  el.sideMenuDrawer.classList.remove('open');
  if (el.sideMenuOverlay) el.sideMenuOverlay.classList.remove('open');
}

function toggleSideMenu() {
  if (!el.sideMenuDrawer) return;
  if (el.sideMenuDrawer.classList.contains('open')) {
    closeSideMenu();
  } else {
    openSideMenu();
  }
}

function switchSideTab(tabId) {
  if (!tabId) return;
  const tabBtns = document.querySelectorAll('.side-menu-tab-btn');
  const tabPanels = document.querySelectorAll('.side-tab-panel');

  tabBtns.forEach(btn => {
    const isTarget = btn.dataset.sideTab === tabId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  if (tabId === 'side-annual-summary') {
    renderAnnualView();
  } else if (tabId === 'side-spending-category') {
    renderCategoryChart();
  } else if (tabId === 'side-spending-payment') {
    renderPaymentChart();
  }
}

function toggleDockSideMenu() {
  const isDocked = document.body.classList.toggle('side-menu-docked');
  if (isDocked) {
    openSideMenu();
    showToast('Side Menu pinned to sidebar');
  } else {
    showToast('Side Menu in drawer mode');
  }
}

// -----------------------------------------------------------------------------
// Export & Backup
// -----------------------------------------------------------------------------
function exportMonthCsv() {
  const items = getExpensesForMonth(selectedYear, selectedMonth);
  if (items.length === 0) {
    alert('No expenses found for this month to export.');
    return;
  }

  const cur = appState.currency || 'INR';
  const headers = ['Date', 'Description', 'Category', 'Payment Method', `Amount (${cur})`, 'Amount (INR Base)', 'Notes'];
  const rows = items.map(item => {
    const pm = getPaymentMethod(item.paymentMethodId);
    const displayAmt = convertFromInr(item.amount, cur).toFixed(2);
    return [
      `"${item.date}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${pm.name.replace(/"/g, '""')}"`,
      displayAmt,
      item.amount.toFixed(2),
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `Expenses_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`, 'text/csv');
}

function exportAnnualCsv() {
  const items = appState.expenses.filter(e => Number(e.year) === Number(selectedYear));
  if (items.length === 0) {
    alert(`No expenses found for ${selectedYear} to export.`);
    return;
  }

  const cur = appState.currency || 'INR';
  const headers = ['Year', 'Month', 'Date', 'Description', 'Category', 'Payment Method', `Amount (${cur})`, 'Amount (INR Base)', 'Notes'];
  const rows = items.map(item => {
    const pm = getPaymentMethod(item.paymentMethodId);
    const displayAmt = convertFromInr(item.amount, cur).toFixed(2);
    return [
      item.year,
      `"${MONTH_NAMES[item.month]}"`,
      `"${item.date}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${pm.name.replace(/"/g, '""')}"`,
      displayAmt,
      item.amount.toFixed(2),
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `Expenses_Annual_${selectedYear}.csv`, 'text/csv');
}

function exportJsonBackup() {
  const jsonStr = JSON.stringify(appState, null, 2);
  downloadFile(jsonStr, `ExpenseApp_Backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}

function importJsonBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!parsed.expenses || !parsed.paymentMethods) {
        throw new Error('Invalid expense app backup format.');
      }
      appState = parsed;
      saveStateToStorage();
      renderYearOptions();
      renderAll();
      showToast('Data backup restored successfully!');
    } catch (err) {
      alert('Failed to import backup: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearCurrentMonthExpenses() {
  const monthName = MONTH_NAMES[selectedMonth];
  const count = (appState.expenses || []).filter(e => Number(e.year) === selectedYear && Number(e.month) === selectedMonth).length;
  if (count === 0) {
    showToast(`No expenses found in ${monthName} ${selectedYear} to clear.`);
    return;
  }
  if (confirm(`Are you sure you want to clear all ${count} expense(s) for ${monthName} ${selectedYear}? Other months and payment methods will remain untouched.`)) {
    appState.expenses = (appState.expenses || []).filter(e => !(Number(e.year) === selectedYear && Number(e.month) === selectedMonth));
    saveStateToStorage();
    renderAll();
    showToast(`Cleared ${count} expense(s) for ${monthName} ${selectedYear}.`);
  }
}

function clearAllExpenses() {
  if (confirm('Are you sure you want to clear all expenses? Your payment methods, journals, and accounts will be preserved.')) {
    appState.expenses = [];
    appState.creditCardPayments = [];
    saveStateToStorage();
    renderAll();
    showToast('All expenses cleared.');
  }
}

function resetToDemo() {
  if (confirm('Are you sure you want to reset to sample data starting January 2026? Any custom data will be replaced.')) {
    appState = getSampleSeedData();
    selectedYear = 2026;
    selectedMonth = 0;
    selectedJournalDate = '2026-01-02';
    saveStateToStorage();
    renderYearOptions();
    renderAll();
    showToast('Reset to clean initial state (INR)');
  }
}

// -----------------------------------------------------------------------------
// Utilities & Helper
// -----------------------------------------------------------------------------
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  appState.theme = theme;
  saveStateToStorage();
}

// -----------------------------------------------------------------------------
// Master Render Function
// -----------------------------------------------------------------------------
function renderAll() {
  updateFxChip();
  renderMonthPills();
  updateMetrics();
  updateFilterOptions();
  renderExpenseTable();
  initDailyJournal();
  renderCharts();
  if (el.labelClearMonth) {
    el.labelClearMonth.textContent = `Clear ${MONTH_NAMES[selectedMonth]} ${selectedYear} Expenses`;
  }
  if (activeView === 'annual-view') {
    renderAnnualView();
  }
}

// -----------------------------------------------------------------------------
// Event Listeners Setup
// -----------------------------------------------------------------------------
function initEventListeners() {
  // Theme Toggle
  el.themeToggle.addEventListener('click', () => {
    const curTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = curTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // Currency select with Live FX
  el.currencySelect.value = appState.currency || 'INR';
  el.currencySelect.addEventListener('change', () => {
    appState.currency = el.currencySelect.value;
    saveStateToStorage();
    renderAll();
    if (appState.currency !== 'INR') {
      const rate = (1 / (appState.exchangeRates[appState.currency] || 1)).toFixed(2);
      showToast(`Switched to ${appState.currency} (1 ${appState.currency} = ₹${rate})`);
    } else {
      showToast('Switched to base currency INR (₹)');
    }
  });

  // Year Navigation Buttons with clear < and > symbols
  el.yearSelect.addEventListener('change', () => {
    selectedYear = parseInt(el.yearSelect.value, 10);
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    selectedJournalDate = `${selectedYear}-${mStr}-01`;
    renderAll();
  });

  el.btnPrevYear.addEventListener('click', () => {
    const idx = appState.years.indexOf(selectedYear);
    if (idx > 0) {
      selectedYear = appState.years[idx - 1];
      el.yearSelect.value = selectedYear;
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      selectedJournalDate = `${selectedYear}-${mStr}-01`;
      renderAll();
      showToast(`Year: ${selectedYear}`);
    } else {
      showToast('Year 2026 is the starting timeline.');
    }
  });

  el.btnNextYear.addEventListener('click', () => {
    const idx = appState.years.indexOf(selectedYear);
    if (idx < appState.years.length - 1) {
      selectedYear = appState.years[idx + 1];
      el.yearSelect.value = selectedYear;
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      selectedJournalDate = `${selectedYear}-${mStr}-01`;
      renderAll();
      showToast(`Year: ${selectedYear}`);
    } else {
      addFutureYear();
    }
  });

  el.btnAddFutureYear.addEventListener('click', addFutureYear);

  // Full Monthly Calendar Navigation
  if (el.btnCalPrevMonth) {
    el.btnCalPrevMonth.addEventListener('click', () => {
      if (selectedMonth > 0) {
        selectedMonth--;
      } else {
        if (selectedYear > 2026) {
          selectedYear--;
          selectedMonth = 11;
        } else {
          showToast('January 2026 is the starting timeline.');
          return;
        }
      }
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      selectedJournalDate = `${selectedYear}-${mStr}-01`;
      renderAll();
    });
  }

  if (el.btnCalNextMonth) {
    el.btnCalNextMonth.addEventListener('click', () => {
      if (selectedMonth < 11) {
        selectedMonth++;
      } else {
        const maxYear = Math.max(...appState.years);
        if (selectedYear >= maxYear) {
          appState.years.push(selectedYear + 1);
          saveStateToStorage();
        }
        selectedYear++;
        selectedMonth = 0;
      }
      const mStr = String(selectedMonth + 1).padStart(2, '0');
      selectedJournalDate = `${selectedYear}-${mStr}-01`;
      renderAll();
    });
  }

  // Daily Journal Day Navigation Steppers
  el.btnPrevDay.addEventListener('click', () => stepJournalDay(-1));
  el.btnNextDay.addEventListener('click', () => stepJournalDay(1));
  if (el.journalDateInput) {
    el.journalDateInput.addEventListener('change', (e) => {
      if (e.target.value) setJournalDate(e.target.value);
    });
  }
  el.btnTodayDay.addEventListener('click', () => {
    const now = new Date();
    if (now.getFullYear() >= 2026) {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setJournalDate(`${y}-${m}-${d}`);
    } else {
      setJournalDate('2026-01-01');
    }
    showToast('Jumped to current date');
  });

  // Daily Journal Input & Save
  el.dailyJournalText.addEventListener('input', handleJournalInput);
  el.btnSaveJournal.addEventListener('click', () => saveJournal(true));
  el.journalQuickTags.addEventListener('click', (e) => {
    const chip = e.target.closest('.tag-chip');
    if (chip && chip.dataset.insert) {
      handleInsertJournalTag(chip.dataset.insert);
    }
  });

  // Side Menu Toggles & Controls
  if (el.btnToggleSideMenu) {
    el.btnToggleSideMenu.addEventListener('click', toggleSideMenu);
  }
  if (el.btnFloatingSideMenu) {
    el.btnFloatingSideMenu.addEventListener('click', toggleSideMenu);
  }
  if (el.btnCloseSideMenu) {
    el.btnCloseSideMenu.addEventListener('click', closeSideMenu);
  }
  if (el.sideMenuOverlay) {
    el.sideMenuOverlay.addEventListener('click', closeSideMenu);
  }
  if (el.btnDockSideMenu) {
    el.btnDockSideMenu.addEventListener('click', toggleDockSideMenu);
  }

  // Side Menu Tabs Switching
  document.querySelectorAll('.side-menu-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSideTab(btn.dataset.sideTab);
    });
  });

  // Keyboard shortcut: Escape closes side menu (if not docked)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.sideMenuDrawer && el.sideMenuDrawer.classList.contains('open') && !document.body.classList.contains('side-menu-docked')) {
      closeSideMenu();
    }
  });

  // View Tabs (if any)
  if (el.viewTabs) {
    el.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchView(tab.dataset.view);
      });
    });
  }

  // Expense Filtering & Search
  el.expenseSearch.addEventListener('input', () => renderExpenseTable());
  el.filterCategory.addEventListener('change', () => renderExpenseTable());
  el.filterPayment.addEventListener('change', () => renderExpenseTable());
  el.sortOrder.addEventListener('change', () => renderExpenseTable());

  // Add Expense Dialog
  el.btnAddExpense.addEventListener('click', () => openExpenseModal(null));
  el.btnAddExpenseEmpty.addEventListener('click', () => openExpenseModal(null));
  el.btnCloseExpenseModal.addEventListener('click', closeExpenseModal);
  el.btnCancelExpense.addEventListener('click', closeExpenseModal);
  el.formExpense.addEventListener('submit', handleExpenseSubmit);

  // Dynamic FX hint inside Add Expense Modal
  el.expenseEntryCurrency.addEventListener('change', updateExpenseModalFxPreview);
  el.expenseAmount.addEventListener('input', updateExpenseModalFxPreview);

  // Quick link to Payment Methods from expense dialog
  el.btnQuickManagePm.addEventListener('click', () => {
    openPaymentMethodsModal();
  });

  // Payment Methods Modal
  el.btnOpenPaymentMethods.addEventListener('click', openPaymentMethodsModal);
  el.btnClosePmModal.addEventListener('click', closePaymentMethodsModal);
  el.btnDonePm.addEventListener('click', closePaymentMethodsModal);
  el.formNewPaymentMethod.addEventListener('submit', handleAddPaymentMethod);
  if (el.btnCancelEditPm) {
    el.btnCancelEditPm.addEventListener('click', cancelEditPaymentMethod);
  }
  el.newPmColor.addEventListener('input', (e) => {
    el.newPmColorPreview.textContent = e.target.value;
  });

  // Toggle Due Day field visibility based on Payment Method type
  if (el.newPmType && el.pmDueDayGroup) {
    el.newPmType.addEventListener('change', () => {
      el.pmDueDayGroup.style.display = (el.newPmType.value === 'Credit Card') ? 'flex' : 'none';
    });
  }

  // Credit Card Dues Card & Modal Listeners
  if (el.cardCreditCardDues) {
    el.cardCreditCardDues.addEventListener('click', openCreditCardDuesModal);
    el.cardCreditCardDues.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCreditCardDuesModal();
      }
    });
  }

  if (el.btnCloseCcModal) el.btnCloseCcModal.addEventListener('click', closeCreditCardDuesModal);
  if (el.btnDoneCcModal) el.btnDoneCcModal.addEventListener('click', closeCreditCardDuesModal);
  if (el.btnManagePmFromCc) {
    el.btnManagePmFromCc.addEventListener('click', () => {
      closeCreditCardDuesModal();
      openPaymentMethodsModal();
    });
  }

  // Credit Card Cycle Tabs
  if (el.btnCycleDueMonth) {
    el.btnCycleDueMonth.addEventListener('click', () => {
      currentCcCycleMode = 'due-month';
      renderCreditCardDuesModal();
    });
  }
  if (el.btnCyclePostDue) {
    el.btnCyclePostDue.addEventListener('click', () => {
      currentCcCycleMode = 'post-due';
      renderCreditCardDuesModal();
    });
  }

  // Backup Menu Dropdown
  el.btnBackupMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    el.backupMenuContent.classList.toggle('show');
    if (el.userProfileMenuContent) el.userProfileMenuContent.classList.remove('show');
  });

  // User Profile Dropdown Toggle
  if (el.btnUserProfile && el.userProfileMenuContent) {
    el.btnUserProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userProfileMenuContent.classList.toggle('show');
      el.backupMenuContent.classList.remove('show');
    });
  }

  // Close dropdowns on backdrop / window click
  document.addEventListener('click', () => {
    el.backupMenuContent.classList.remove('show');
    if (el.userProfileMenuContent) el.userProfileMenuContent.classList.remove('show');
  });

  // Centralized robust sign-out
  async function performSignOut() {
    if (el.userProfileMenuContent) el.userProfileMenuContent.classList.remove('show');
    clearActiveSession();
    updateUserNavUi();
    showAuthOverlay();
    if (fbAuth) {
      try {
        await fbAuth.signOut();
      } catch (e) {
        console.warn('Firebase signOut notice:', e);
      }
    }
    showToast('You have signed out.');
  }

  // Switch User
  if (el.btnSwitchUser) {
    el.btnSwitchUser.addEventListener('click', (e) => {
      e.stopPropagation();
      performSignOut();
    });
  }

  // Logout
  if (el.btnLogout) {
    el.btnLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      performSignOut();
    });
  }

  // Toggle Auth Password Visibility
  if (el.btnToggleAuthPwd) {
    el.btnToggleAuthPwd.addEventListener('click', toggleAuthPasswordVisibility);
  }
  if (el.btnToggleSignupPwd) {
    el.btnToggleSignupPwd.addEventListener('click', toggleSignupPasswordVisibility);
  }

  // Auth Tabs (Sign In vs Create Account)
  if (el.tabAuthLogin) {
    el.tabAuthLogin.addEventListener('click', () => switchAuthTab('login'));
  }
  if (el.tabAuthSignup) {
    el.tabAuthSignup.addEventListener('click', () => switchAuthTab('signup'));
  }

  // Forgot Password
  if (el.btnForgotPwd) {
    el.btnForgotPwd.addEventListener('click', async () => {
      let email = (el.authUsername ? el.authUsername.value : '').trim();
      if (!email || !email.includes('@')) {
        email = prompt('Enter your registered email address for password reset:');
      }
      if (!email) return;
      if (fbAuth) {
        try {
          await fbAuth.sendPasswordResetEmail(email.trim());
          showToast(`Password reset link sent to ${email}`);
        } catch (err) {
          showAuthError(err.message || 'Failed to send reset email.');
        }
      } else {
        alert('Cloud authentication service is currently offline.');
      }
    });
  }

  // Authentication Form Submit (Sign In)
  if (el.authForm) {
    el.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawInput = (el.authUsername.value || '').trim();
      const pwd = el.authPassword.value || '';
      if (!rawInput || !pwd) return;

      if (el.btnAuthSubmit) {
        el.btnAuthSubmit.disabled = true;
        el.btnAuthSubmit.textContent = 'Signing In...';
      }

      // Convert username or email
      let emailToUse = rawInput.toLowerCase();
      if (emailToUse === 'srujani') {
        emailToUse = 'srujanibishoi@gmail.com';
      } else if (!emailToUse.includes('@')) {
        emailToUse = `${emailToUse}@expenseapp.local`;
      }

      if (fbAuth) {
        try {
          await fbAuth.signInWithEmailAndPassword(emailToUse, pwd);
          // onAuthStateChanged handles session, cloud load, and modal closing
        } catch (fbErr) {
          console.warn('Firebase signIn notice:', fbErr.code, fbErr.message);
          // Check local fallback account
          const users = getUsersList();
          const localUser = users.find(u => u.username.toLowerCase() === rawInput.toLowerCase());
          if (localUser) {
            const hash = await hashPassword(pwd);
            if (hash === localUser.passwordHash) {
              setActiveSession(localUser);
              appState = loadState(localUser.username);
              updateUserNavUi();
              hideAuthOverlay();
              populatePaymentMethodSelect();
              renderAll();
              showToast(`Welcome back, ${localUser.name}! (Local)`);
              if (el.btnAuthSubmit) {
                el.btnAuthSubmit.disabled = false;
                el.btnAuthSubmit.textContent = 'Sign In';
              }
              return;
            }
          }

          let msg = 'Authentication error. Please check your credentials.';
          if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
            msg = 'Invalid email or password. Please verify or click "Create Account".';
          } else if (fbErr.code === 'auth/too-many-requests') {
            msg = 'Too many attempts. Please try again later or reset password.';
          } else if (fbErr.message) {
            msg = fbErr.message;
          }
          showAuthError(msg);
        }
      } else {
        // Fallback local authentication
        const users = getUsersList();
        const user = users.find(u => u.username.toLowerCase() === rawInput.toLowerCase());
        if (!user) {
          showAuthError('User does not exist. Please contact Administrator (Srujani).');
        } else {
          const hash = await hashPassword(pwd);
          if (hash !== user.passwordHash) {
            showAuthError('Incorrect password. Please try again.');
          } else {
            setActiveSession(user);
            appState = loadState(user.username);
            updateUserNavUi();
            hideAuthOverlay();
            populatePaymentMethodSelect();
            renderAll();
            showToast(`Welcome back, ${user.name}!`);
          }
        }
      }

      if (el.btnAuthSubmit) {
        el.btnAuthSubmit.disabled = false;
        el.btnAuthSubmit.textContent = 'Sign In';
      }
    });
  }

  // Sign Up Form Submit (Create Account)
  if (el.signupForm) {
    el.signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (el.signupName.value || '').trim();
      const email = (el.signupEmail.value || '').trim().toLowerCase();
      const pwd = el.signupPassword.value || '';
      const confirmPwd = el.signupConfirmPassword.value || '';

      if (!name || !email || !pwd) return;

      if (pwd !== confirmPwd) {
        showAuthError('Passwords do not match. Please verify.');
        return;
      }

      if (pwd.length < 6) {
        showAuthError('Password must be at least 6 characters long.');
        return;
      }

      if (el.btnSignupSubmit) {
        el.btnSignupSubmit.disabled = true;
        el.btnSignupSubmit.textContent = 'Creating Account & Cloud Store...';
      }

      if (fbAuth) {
        try {
          const cred = await fbAuth.createUserWithEmailAndPassword(email, pwd);
          if (cred && cred.user) {
            try {
              await cred.user.updateProfile({ displayName: name });
            } catch (pErr) {}
          }
          showToast(`Account created for ${name}! Initializing cloud data...`);
          // onAuthStateChanged will handle cloud document setup and session initialization
        } catch (err) {
          console.error('Firebase signup error:', err);
          let msg = 'Failed to create account. Please try again.';
          if (err.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered. Please click "Sign In" instead.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          } else if (err.code === 'auth/weak-password') {
            msg = 'Password should be at least 6 characters.';
          } else if (err.message) {
            msg = err.message;
          }
          showAuthError(msg);
        } finally {
          if (el.btnSignupSubmit) {
            el.btnSignupSubmit.disabled = false;
            el.btnSignupSubmit.textContent = 'Create Account & Sync Cloud';
          }
        }
      } else {
        showAuthError('Cloud authentication service is currently not reachable.');
        if (el.btnSignupSubmit) {
          el.btnSignupSubmit.disabled = false;
          el.btnSignupSubmit.textContent = 'Create Account & Sync Cloud';
        }
      }
    });
  }

  // Open User Management Modal (Admin only)
  if (el.btnOpenUserMgmt) {
    el.btnOpenUserMgmt.addEventListener('click', () => {
      if (el.userProfileMenuContent) el.userProfileMenuContent.classList.remove('show');
      if (!currentSession || currentSession.role !== 'admin') {
        showToast('Admin privilege required.');
        return;
      }
      renderUsersList();
      if (typeof el.userManagementModal.showModal === 'function') {
        el.userManagementModal.showModal();
      } else {
        el.userManagementModal.setAttribute('open', '');
      }
    });
  }

  if (el.btnCloseUserMgmt) {
    el.btnCloseUserMgmt.addEventListener('click', () => {
      if (typeof el.userManagementModal.close === 'function') {
        el.userManagementModal.close();
      } else {
        el.userManagementModal.removeAttribute('open');
      }
    });
  }

  if (el.btnDoneUserMgmt) {
    el.btnDoneUserMgmt.addEventListener('click', () => {
      if (typeof el.userManagementModal.close === 'function') {
        el.userManagementModal.close();
      } else {
        el.userManagementModal.removeAttribute('open');
      }
    });
  }

  // Add User Form Submission (Admin)
  if (el.addUserForm) {
    el.addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uname = (el.newUsername.value || '').trim().toLowerCase();
      const name = (el.newName.value || '').trim();
      const pwd = el.newPassword.value || '';
      const role = el.newRole.value || 'member';

      if (!uname || !name || !pwd) return;

      const users = getUsersList();
      if (users.some(u => u.username.toLowerCase() === uname)) {
        alert(`Username "${uname}" already exists! Please choose another.`);
        return;
      }

      const hash = await hashPassword(pwd);
      const newUser = {
        username: uname,
        name: name,
        role: role,
        passwordHash: hash,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      saveUsersList(users);

      // Initialize clean data store for this user
      loadState(uname);

      el.addUserForm.reset();
      showToast(`User @${uname} created!`);
      renderUsersList();
    });
  }

  el.btnExportCsv.addEventListener('click', exportMonthCsv);
  el.btnExportAnnualCsv.addEventListener('click', exportAnnualCsv);
  el.btnExportJson.addEventListener('click', exportJsonBackup);
  el.inputImportJson.addEventListener('change', importJsonBackup);
  if (el.btnClearMonthMenu) {
    el.btnClearMonthMenu.addEventListener('click', clearCurrentMonthExpenses);
  }
  if (el.btnClearMonthExpenses) {
    el.btnClearMonthExpenses.addEventListener('click', clearCurrentMonthExpenses);
  }
  if (el.btnClearExpenses) {
    el.btnClearExpenses.addEventListener('click', clearAllExpenses);
  }
  el.btnResetDemo.addEventListener('click', resetToDemo);

  // Close modals on backdrop click
  [el.expenseModal, el.paymentMethodsModal, el.creditCardDuesModal, el.userManagementModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
      });
    }
  });
}

// -----------------------------------------------------------------------------
// Authentication & User Profile UI Functions
// -----------------------------------------------------------------------------
function switchAuthTab(mode) {
  if (el.authError) el.authError.style.display = 'none';
  const descEl = document.getElementById('auth-sub-desc');
  if (mode === 'signup') {
    if (el.tabAuthLogin) el.tabAuthLogin.classList.remove('active');
    if (el.tabAuthSignup) el.tabAuthSignup.classList.add('active');
    if (el.authForm) el.authForm.style.display = 'none';
    if (el.signupForm) {
      el.signupForm.style.display = 'flex';
      setTimeout(() => el.signupName && el.signupName.focus(), 50);
    }
    if (descEl) descEl.textContent = 'Create your personal account to sync your expenses in real-time across all your devices.';
  } else {
    if (el.tabAuthSignup) el.tabAuthSignup.classList.remove('active');
    if (el.tabAuthLogin) el.tabAuthLogin.classList.add('active');
    if (el.signupForm) el.signupForm.style.display = 'none';
    if (el.authForm) {
      el.authForm.style.display = 'flex';
      setTimeout(() => el.authUsername && el.authUsername.focus(), 50);
    }
    if (descEl) descEl.textContent = 'Sign in or create an account to access your personal expenses from any phone or computer.';
  }
}

let isSignupPasswordVisible = false;
function toggleSignupPasswordVisibility() {
  isSignupPasswordVisible = !isSignupPasswordVisible;
  if (el.signupPassword) {
    el.signupPassword.type = isSignupPasswordVisible ? 'text' : 'password';
  }
  if (el.pwdIconEyeSignup) {
    el.pwdIconEyeSignup.innerHTML = isSignupPasswordVisible
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

async function handleFirebaseUserSignedIn(user) {
  const uid = user.uid;
  const email = (user.email || '').toLowerCase();
  const displayName = user.displayName || (email.split('@')[0]) || 'User';
  const role = (email === 'srujanibishoi@gmail.com' || email.startsWith('srujani')) ? 'admin' : 'member';

  currentSession = {
    uid: uid,
    username: email.split('@')[0],
    email: email,
    name: displayName,
    role: role,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));

  let loaded = false;
  setCloudSyncStatus('syncing', 'Loading...');

  if (fbDb) {
    try {
      const snap = await fbDb.collection('users').doc(uid).get();
      if (snap.exists) {
        const cloudData = snap.data();
        appState = {
          currency: cloudData.currency || 'INR',
          theme: cloudData.theme || 'dark',
          exchangeRates: Object.assign({}, FALLBACK_RATES_FROM_INR, cloudData.exchangeRates || {}),
          paymentMethods: cloudData.paymentMethods || DEFAULT_PAYMENT_METHODS,
          expenses: cloudData.expenses || [],
          creditCardPayments: cloudData.creditCardPayments || [],
          dailyJournals: cloudData.dailyJournals || {},
          years: Array.from(new Set([2026, ...(cloudData.years || [])])).sort((a,b) => a-b)
        };
        loaded = true;
        setCloudSyncStatus('ready', 'Cloud');
      } else {
        // Initializing new cloud account document
        let initialData = null;
        try {
          const rawLocal = localStorage.getItem(`expense_app_data_v1_${currentSession.username}`) || localStorage.getItem('expense_app_data_v1_srujani');
          if (rawLocal) initialData = JSON.parse(rawLocal);
        } catch (e) {}

        appState = initialData || getSampleSeedData();
        await fbDb.collection('users').doc(uid).set({
          profile: {
            uid: uid,
            email: email,
            displayName: displayName,
            role: role,
            createdAt: new Date().toISOString()
          },
          expenses: appState.expenses || [],
          paymentMethods: appState.paymentMethods || [],
          creditCardPayments: appState.creditCardPayments || [],
          dailyJournals: appState.dailyJournals || {},
          currency: appState.currency || 'INR',
          theme: appState.theme || 'dark',
          exchangeRates: appState.exchangeRates || FALLBACK_RATES_FROM_INR,
          years: appState.years || [2026],
          lastUpdated: new Date().toISOString()
        });
        loaded = true;
        setCloudSyncStatus('ready', 'Cloud');
      }
    } catch (err) {
      console.warn('Firestore load notice:', err);
      setCloudSyncStatus('offline', 'Offline');
    }
  }

  if (!loaded) {
    appState = loadState(currentSession.username);
  }

  const key = getUserStorageKey(currentSession.username);
  localStorage.setItem(key, JSON.stringify(appState));

  if (appState.theme) {
    applyTheme(appState.theme);
  }

  hideAuthOverlay();
  updateUserNavUi();
  populatePaymentMethodSelect();
  renderAll();
  showToast(`Welcome, ${currentSession.name}! Connected to Cloud ☁️`);
}

function updateUserNavUi() {
  if (!currentSession) {
    if (el.btnUserProfile) el.btnUserProfile.style.display = 'none';
    return;
  }
  if (el.btnUserProfile) el.btnUserProfile.style.display = 'inline-flex';
  const initial = (currentSession.name || currentSession.username || 'U').charAt(0).toUpperCase();
  if (el.userNavAvatar) el.userNavAvatar.textContent = initial;
  if (el.userNavName) el.userNavName.textContent = currentSession.name || currentSession.username;
  if (el.userMenuAvatar) el.userMenuAvatar.textContent = initial;
  if (el.userMenuFullname) el.userMenuFullname.textContent = currentSession.name || currentSession.username;
  if (el.userMenuRole) {
    el.userMenuRole.textContent = currentSession.role === 'admin' ? 'Admin' : 'Member';
    el.userMenuRole.className = `role-badge ${currentSession.role === 'admin' ? 'role-admin' : 'role-member'}`;
  }
  if (el.userMenuSub) {
    const handle = currentSession.email ? currentSession.email : `@${escapeHtml(currentSession.username)}`;
    el.userMenuSub.innerHTML = `${escapeHtml(handle)} • <span class="role-badge ${currentSession.role === 'admin' ? 'role-admin' : 'role-member'}">${currentSession.role === 'admin' ? 'Admin' : 'Member'}</span>`;
  }
  if (el.btnOpenUserMgmt) {
    el.btnOpenUserMgmt.style.display = currentSession.role === 'admin' ? 'flex' : 'none';
  }
}

function showAuthOverlay() {
  if (el.authOverlay) {
    el.authOverlay.classList.remove('auth-hidden');
    if (el.authError) el.authError.style.display = 'none';
    switchAuthTab('login');
    if (el.authUsername) {
      el.authUsername.value = '';
      setTimeout(() => el.authUsername.focus(), 50);
    }
    if (el.authPassword) el.authPassword.value = '';
  }
}

function hideAuthOverlay() {
  if (el.authOverlay) {
    el.authOverlay.classList.add('auth-hidden');
  }
}

function showAuthError(msg) {
  if (el.authError && el.authErrorText) {
    el.authErrorText.textContent = msg;
    el.authError.style.display = 'flex';
  }
}

let isAuthPasswordVisible = false;
function toggleAuthPasswordVisibility() {
  isAuthPasswordVisible = !isAuthPasswordVisible;
  if (el.authPassword) {
    el.authPassword.type = isAuthPasswordVisible ? 'text' : 'password';
  }
  if (el.pwdIconEye) {
    el.pwdIconEye.innerHTML = isAuthPasswordVisible
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function renderUsersList() {
  if (!el.usersListContainer) return;
  const users = getUsersList();
  el.usersListContainer.innerHTML = '';

  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-card';

    let txCount = 0;
    try {
      const rawUser = localStorage.getItem(getUserStorageKey(u.username));
      if (rawUser) {
        const uData = JSON.parse(rawUser);
        txCount = (uData.expenses || []).length;
      }
    } catch(e) {}

    const isCurrentActive = currentSession && currentSession.username.toLowerCase() === u.username.toLowerCase();
    const isSrujani = u.username.toLowerCase() === 'srujani';

    card.innerHTML = `
      <div class="user-card-info">
        <div class="user-avatar-circle" style="width: 36px; height: 36px; font-size: 0.95rem;">${(u.name || u.username).charAt(0).toUpperCase()}</div>
        <div class="user-card-meta">
          <div class="user-card-name-row">
            <span class="user-card-title">${escapeHtml(u.name)}</span>
            <span class="role-badge ${u.role === 'admin' ? 'role-admin' : 'role-member'}">${u.role === 'admin' ? 'Admin' : 'Member'}</span>
            ${isCurrentActive ? '<span class="badge" style="font-size: 0.65rem; background: var(--primary-soft); color: var(--primary);">Active</span>' : ''}
          </div>
          <span class="user-card-sub">@${escapeHtml(u.username)} • ${txCount} ${txCount === 1 ? 'expense' : 'expenses'}</span>
        </div>
      </div>
      <div class="user-card-actions">
        <button type="button" class="btn btn-secondary btn-sm btn-reset-user-pwd" data-username="${escapeHtml(u.username)}" title="Reset user password">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Reset Pwd
        </button>
        ${!isSrujani && !isCurrentActive ? `
        <button type="button" class="btn btn-secondary btn-sm text-danger btn-delete-user" data-username="${escapeHtml(u.username)}" title="Delete user profile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>` : ''}
      </div>
    `;
    el.usersListContainer.appendChild(card);
  });

  // Attach Reset Password listeners
  el.usersListContainer.querySelectorAll('.btn-reset-user-pwd').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetUname = btn.getAttribute('data-username');
      const newPwd = prompt(`Enter new password for @${targetUname}:`);
      if (newPwd === null) return;
      if (newPwd.trim().length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
      }
      const users = getUsersList();
      const match = users.find(u => u.username.toLowerCase() === targetUname.toLowerCase());
      if (match) {
        match.passwordHash = await hashPassword(newPwd.trim());
        saveUsersList(users);
        showToast(`Password updated for @${targetUname}`);
      }
    });
  });

  // Attach Delete User listeners
  el.usersListContainer.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetUname = btn.getAttribute('data-username');
      if (confirm(`Are you sure you want to delete profile @${targetUname}? Their expenses and settings will be permanently removed.`)) {
        let users = getUsersList();
        users = users.filter(u => u.username.toLowerCase() !== targetUname.toLowerCase());
        saveUsersList(users);
        localStorage.removeItem(getUserStorageKey(targetUname));
        showToast(`Profile @${targetUname} deleted.`);
        renderUsersList();
      }
    });
  });
}

// -----------------------------------------------------------------------------
// App Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Immediately ensure active session and state are loaded so appState is never null
  currentSession = getActiveSession();
  appState = loadState(currentSession ? currentSession.username : 'srujani');

  // 2. Setup initial timeline & selected date
  selectedYear = 2026;
  selectedMonth = 0; // January 2026 default
  selectedJournalDate = '2026-01-02';

  // 3. Initialize all DOM components and listeners safely
  initTimeline();
  initEventListeners();
  populatePaymentMethodSelect();
  updateUserNavUi();

  // 4. Apply saved theme
  if (appState && appState.theme) {
    applyTheme(appState.theme);
  }

  // 5. Gate visibility based on session
  if (!currentSession) {
    showAuthOverlay();
    setCloudSyncStatus('offline', 'Sign In');
  } else {
    hideAuthOverlay();
    renderAll();
  }

  // 6. Listen to Firebase Auth state
  if (fbAuth) {
    fbAuth.onAuthStateChanged((user) => {
      if (user) {
        handleFirebaseUserSignedIn(user);
      } else {
        // Firebase is not signed in
        const sess = getActiveSession();
        if (sess && !sess.uid) {
          // Explicit local session (e.g. srujani local demo)
          currentSession = sess;
          hideAuthOverlay();
          appState = loadState(currentSession.username);
          setCloudSyncStatus('offline', 'Local');
          updateUserNavUi();
          if (appState.theme) applyTheme(appState.theme);
          renderAll();
        } else {
          // Logged out
          clearActiveSession();
          showAuthOverlay();
          updateUserNavUi();
          setCloudSyncStatus('offline', 'Sign In');
        }
      }
    });
  }

  // 7. Fetch live exchange rates in background
  fetchLiveExchangeRates();
});
