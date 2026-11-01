// HabitFlow Pro - Master Application Controller
import { store } from './store.js';
import { sound } from './audio.js';
import { HabitManager } from './habits.js';
import { CalendarManager } from './calendar.js';
import { AnalyticsManager } from './analytics.js';
import { GamificationManager } from './gamification.js';
import { InsightsManager } from './insights.js';
import { TimerManager } from './timer.js';
import { JournalManager } from './journal.js';
import { GoalsManager } from './goals.js';
import { ExportManager } from './export.js';

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.habits = null;
    this.calendar = null;
    this.analytics = null;
    this.gamification = null;
    this.insights = null;
    this.timer = null;
    this.journal = null;
    this.goals = null;
    this.export = null;

    this.init();
  }

  init() {
    // Apply saved theme and accent
    this.applyTheme(store.state.settings.theme || 'dark');
    this.applyAccent(store.state.settings.accent || 'indigo');
    sound.enabled = store.state.settings.soundEnabled !== false;

    // Instantiate sub-managers
    this.habits = new HabitManager();
    this.calendar = new CalendarManager();
    this.analytics = new AnalyticsManager();
    this.gamification = new GamificationManager();
    this.insights = new InsightsManager();
    this.timer = new TimerManager();
    this.journal = new JournalManager();
    this.goals = new GoalsManager();
    this.export = new ExportManager();

    this.initNavigation();
    this.initKeyboardShortcuts();
    this.initSettingsModal();
    this.initProfileModal();
    this.initQuickActionButtons();

    // Initial renders
    this.renderHeroStats();
    this.habits.render();
    this.calendar.render();
    this.gamification.render();
    this.insights.render();
    this.journal.render();
    this.goals.render();
    this.renderPersonalRecords();

    // Subscribe to state updates for hero metrics
    store.subscribe((event) => {
      this.renderHeroStats();
      this.renderPersonalRecords();
    });

    // Check notification simulation
    this.initNotificationCheck();
  }

  // --- View / Tab Switching ---
  initNavigation() {
    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.navTarget;
        this.switchTab(target);
      });
    });

    // Mobile bottom navigation bar
    const mobileNavBtns = document.querySelectorAll('[data-mobile-nav]');
    mobileNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.mobileNav;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Hide all view sections
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.add('hidden'));

    // Show active view section
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    // Update desktop sidebar button states
    document.querySelectorAll('[data-nav-target]').forEach(btn => {
      const isMatch = (btn.dataset.navTarget === tabId);
      if (isMatch) {
        btn.classList.add('bg-indigo-600/15', 'text-indigo-400', 'border-indigo-500/30', 'font-semibold');
        btn.classList.remove('text-slate-400', 'hover:bg-slate-800/60');
      } else {
        btn.classList.remove('bg-indigo-600/15', 'text-indigo-400', 'border-indigo-500/30', 'font-semibold');
        btn.classList.add('text-slate-400', 'hover:bg-slate-800/60');
      }
    });

    // Update mobile bottom nav button states
    document.querySelectorAll('[data-mobile-nav]').forEach(btn => {
      const isMatch = (btn.dataset.mobileNav === tabId);
      if (isMatch) {
        btn.classList.add('text-indigo-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('text-indigo-400');
        btn.classList.add('text-slate-400');
      }
    });

    // Lazy load specific view renders
    if (tabId === 'matrix') {
      this.calendar.render();
    } else if (tabId === 'analytics') {
      setTimeout(() => this.analytics.renderAllCharts(), 50);
    } else if (tabId === 'timer') {
      this.timer.updateHabitSelectDropdown();
      this.timer.updateDisplay();
    } else if (tabId === 'journal') {
      this.journal.render();
    } else if (tabId === 'goals') {
      this.goals.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Hero Dashboard Metrics & Score Circle ---
  renderHeroStats() {
    const today = new Date();
    const todayKey = store.getTodayKey();
    const stats = store.getDayStats(todayKey);
    const globalStreak = store.calculateGlobalStreak();
    const user = store.state.user;

    // Time-of-day greeting
    const hour = today.getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const greetingEl = document.getElementById('hero-greeting-text');
    if (greetingEl) {
      greetingEl.innerHTML = `${greeting}, <span class="text-slate-100 font-bold">${user.name.split(' ')[0]}</span> 👋`;
    }

    const topDateEl = document.getElementById('top-bar-date');
    if (topDateEl) {
      topDateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }

    const quoteEl = document.getElementById('hero-quote-text');
    const quoteAuthorEl = document.getElementById('hero-quote-author');
    if (quoteEl && quoteAuthorEl && user.quote) {
      quoteEl.textContent = `"${user.quote.text}"`;
      quoteAuthorEl.textContent = `— ${user.quote.author}`;
    }

    // Hero Overview Cards
    const totalEl = document.getElementById('hero-stat-total');
    const completedEl = document.getElementById('hero-stat-completed');
    const streakEl = document.getElementById('hero-stat-streak');
    const bestStreakEl = document.getElementById('hero-stat-best-streak');
    const monthlyPctEl = document.getElementById('hero-stat-monthly-pct');

    if (totalEl) totalEl.textContent = stats.total;
    if (completedEl) completedEl.textContent = `${stats.completed}/${stats.total}`;
    if (streakEl) streakEl.textContent = `🔥 ${globalStreak.current}d`;
    if (bestStreakEl) bestStreakEl.textContent = `🏆 ${globalStreak.longest}d`;

    // Calculate Monthly Rate
    const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let monthWeighted = 0;
    let monthPossible = 0;
    for (let d = 1; d <= today.getDate(); d++) {
      const monthPad = String(today.getMonth() + 1).padStart(2, '0');
      const dayPad = String(d).padStart(2, '0');
      const k = `${today.getFullYear()}-${monthPad}-${dayPad}`;
      const s = store.getDayStats(k);
      monthWeighted += (s.completed + (s.partial * 0.5));
      monthPossible += s.total;
    }
    const monthRate = monthPossible ? Math.round((monthWeighted / monthPossible) * 100) : 0;
    if (monthlyPctEl) monthlyPctEl.textContent = `${monthRate}%`;

    // Large Circular SVG Productivity Score
    const circleScoreEl = document.getElementById('hero-circle-score');
    const circleRingEl = document.getElementById('hero-circle-ring');
    const circleTierEl = document.getElementById('hero-circle-tier');

    if (circleScoreEl) circleScoreEl.textContent = `${stats.percent}%`;
    if (circleRingEl) {
      // 100% corresponds to circumference (stroke-dasharray="100, 100")
      circleRingEl.setAttribute('stroke-dasharray', `${stats.percent}, 100`);

      if (stats.percent >= 80) {
        circleRingEl.setAttribute('stroke', '#10B981'); // Emerald
      } else if (stats.percent >= 50) {
        circleRingEl.setAttribute('stroke', '#6366F1'); // Indigo
      } else {
        circleRingEl.setAttribute('stroke', '#F59E0B'); // Amber
      }
    }

    if (circleTierEl) {
      if (stats.total > 0 && stats.percent === 100) circleTierEl.textContent = '🌟 Flawless Routine';
      else if (stats.percent >= 75) circleTierEl.textContent = '🔥 High Momentum';
      else if (stats.percent >= 40) circleTierEl.textContent = '⚡ In Progress';
      else circleTierEl.textContent = '🌱 Getting Started';
    }
  }

  // Personal Records & Milestone Showcase
  renderPersonalRecords() {
    const elRecordBestDay = document.getElementById('record-best-day');
    const elRecordStreak = document.getElementById('record-longest-streak');
    const elRecordCompletions = document.getElementById('record-lifetime-completions');
    const elRecordFocusHours = document.getElementById('record-focus-hours');

    let lifetimeCompletions = 0;
    let highestDayScore = 0;
    let highestDayDate = '';

    Object.keys(store.state.logs).forEach(k => {
      const s = store.getDayStats(k);
      lifetimeCompletions += s.completed;
      if (s.percent > highestDayScore) {
        highestDayScore = s.percent;
        highestDayDate = k;
      }
    });

    const globalStreak = store.calculateGlobalStreak();

    if (elRecordBestDay) {
      elRecordBestDay.textContent = highestDayScore > 0 ? `${highestDayScore}% (${highestDayDate})` : '0%';
    }
    if (elRecordStreak) elRecordStreak.textContent = `${globalStreak.longest} days`;
    if (elRecordCompletions) elRecordCompletions.textContent = lifetimeCompletions.toLocaleString();
    if (elRecordFocusHours) elRecordFocusHours.textContent = `${store.state.focusHours} hrs`;
  }

  // --- Keyboard Shortcuts ---
  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing inside inputs or textareas
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        this.openShortcutsModal();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openAddHabitModal();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.switchTab('timer');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.toggleTheme();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        this.switchTab('journal');
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // --- Quick Actions ---
  initQuickActionButtons() {
    const refreshQuoteBtn = document.getElementById('btn-refresh-quote');
    if (refreshQuoteBtn) {
      refreshQuoteBtn.addEventListener('click', () => {
        const quotes = [
          { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
          { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
          { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
          { text: "Focus is a muscle. The more you practice saying no, the stronger your yes becomes.", author: "Linear Philosophy" },
          { text: "Discipline equals freedom.", author: "Jocko Willink" },
          { text: "Atomic habits compound into monumental breakthroughs.", author: "James Clear" }
        ];
        const nextQuote = quotes[Math.floor(Math.random() * quotes.length)];
        store.state.user.quote = nextQuote;
        store.saveState();
        this.renderHeroStats();
        sound.playPop();
      });
    }
  }

  // --- Themes & Accents ---
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    store.updateSettings({ theme });
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.textContent = (theme === 'dark') ? '🌙' : '☀️';
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = (current === 'dark') ? 'light' : 'dark';
    this.applyTheme(next);
    sound.playPop();
    this.showToast(`Switched to ${next} mode`, 'info');
  }

  applyAccent(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    store.updateSettings({ accent });
  }

  // --- Modals Management ---
  openAddHabitModal() {
    const modal = document.getElementById('habit-modal');
    const title = document.getElementById('habit-modal-title');
    const form = document.getElementById('habit-modal-form');
    if (form) form.reset();

    const idInput = document.getElementById('habit-id-input');
    if (idInput) idInput.value = '';
    if (title) title.textContent = 'Add New Habit';

    if (modal) modal.classList.remove('hidden');
  }

  openAddGoalModal() {
    const modal = document.getElementById('goal-modal');
    const form = document.getElementById('goal-modal-form');
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  }

  openShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.remove('hidden');
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Fill settings form with current state
    const soundToggle = document.getElementById('setting-sound-toggle');
    const notifToggle = document.getElementById('setting-notif-toggle');
    const accentSelect = document.getElementById('setting-accent-select');

    if (soundToggle) soundToggle.checked = store.state.settings.soundEnabled !== false;
    if (notifToggle) notifToggle.checked = store.state.settings.notificationsEnabled !== false;
    if (accentSelect) accentSelect.value = store.state.settings.accent || 'indigo';

    modal.classList.remove('hidden');
  }

  openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    const nameInput = document.getElementById('profile-name-input');
    const taglineInput = document.getElementById('profile-tagline-input');
    const avatarInput = document.getElementById('profile-avatar-input');

    if (nameInput) nameInput.value = store.state.user.name;
    if (taglineInput) taglineInput.value = store.state.user.tagline || '';
    if (avatarInput) avatarInput.value = store.state.user.avatar || '⚡';

    modal.classList.remove('hidden');
  }

  closeAllModals() {
    document.querySelectorAll('.app-modal').forEach(m => m.classList.add('hidden'));
  }

  initSettingsModal() {
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        store.updateSettings({ soundEnabled: e.target.checked });
      });
    }

    const notifToggle = document.getElementById('setting-notif-toggle');
    if (notifToggle) {
      notifToggle.addEventListener('change', (e) => {
        store.updateSettings({ notificationsEnabled: e.target.checked });
        if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
        }
      });
    }

    const accentSelect = document.getElementById('setting-accent-select');
    if (accentSelect) {
      accentSelect.addEventListener('change', (e) => {
        this.applyAccent(e.target.value);
      });
    }
  }

  initProfileModal() {
    const form = document.getElementById('profile-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name-input').value.trim();
        const tagline = document.getElementById('profile-tagline-input').value.trim();
        const avatar = document.getElementById('profile-avatar-input').value.trim() || '⚡';

        if (name) {
          store.updateUser({ name, tagline, avatar });
          this.renderHeroStats();
          this.showToast('Profile updated!', 'success');
        }
        this.closeAllModals();
      });
    }
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const typeIcons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      danger: '✕'
    };
    const typeStyles = {
      success: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/80',
      info: 'border-indigo-500/30 text-indigo-300 bg-slate-900/90',
      warning: 'border-amber-500/30 text-amber-300 bg-amber-950/80',
      danger: 'border-rose-500/30 text-rose-300 bg-rose-950/80'
    };

    toast.className = `glass-panel px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-medium toast-enter ${typeStyles[type] || typeStyles.info}`;
    toast.innerHTML = `
      <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold bg-white/10">${typeIcons[type] || 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-enter-active'));

    setTimeout(() => {
      toast.classList.remove('toast-enter-active');
      toast.classList.add('toast-exit-active');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // Start Focus Timer for a specific habit
  startFocusWithHabit(habitId, habitName) {
    this.switchTab('timer');
    this.timer.selectHabit(habitId);
    this.showToast(`Timer focused on: ${habitName}`, 'info');
  }

  // In-app / Notification check simulator
  initNotificationCheck() {
    setInterval(() => {
      if (store.state.settings.notificationsEnabled) {
        const todayStats = store.getDayStats();
        if (todayStats.percent < 100 && todayStats.completed < todayStats.total) {
          // Subtle reminder every hour if pending
        }
      }
    }, 60000);
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
