// HabitFlow Pro - Central State Store & Persistence
import { sound } from './audio.js';

const STORAGE_KEY = 'habitflow_pro_beginner_v1';

export class Store {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  // Reactive Subscription
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify(event, payload) {
    this.saveState();
    this.listeners.forEach(fn => fn(event, payload, this.state));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to LocalStorage:', e);
    }
  }

  loadState() {
    try {
      localStorage.removeItem('habitflow_pro_v1');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.habits && parsed.logs) {
          // Ensure new fields exist for older saves
          if (!Array.isArray(parsed.focusSessions)) parsed.focusSessions = [];
          if (typeof parsed.focusHours !== 'number') parsed.focusHours = 0;
          if (!parsed.journal) parsed.journal = {};
          if (!parsed.goals) parsed.goals = [];
          if (!parsed.settings) parsed.settings = { theme: 'dark', accent: 'indigo', soundEnabled: true, notificationsEnabled: true };
          if (!parsed.user) parsed.user = this.generateDefaultData().user;
          // Ensure level and rank are mathematically synchronized with XP
          parsed.user.level = Store.levelFromXP(parsed.user.xp || 0);
          parsed.user.rank = Store.rankFromLevel(parsed.user.level);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage corrupted, seeding clean beginner dataset:', e);
    }
    return this.generateDefaultData();
  }

  resetToDefault() {
    this.state = this.generateDefaultData();
    this.saveState();
    this.notify('RESET', null);
  }

  // Format Helper: YYYY-MM-DD in local time
  formatDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayKey() {
    return this.formatDateKey(new Date());
  }

  // Clean Beginner Dataset (Zero Pre-Filled Data)
  generateDefaultData() {
    const habits = [];
    const logs = {};
    const journal = {};
    const goals = [];

    const achievements = [
      { id: 'first_step', title: 'First Step', desc: 'Complete your first habit', icon: '🌱', unlocked: false, unlockedAt: null },
      { id: 'streak_3', title: 'Spark of Habit', desc: 'Reach a 3-day streak', icon: '🔥', unlocked: false, unlockedAt: null },
      { id: 'streak_7', title: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: '⚡', unlocked: false, unlockedAt: null },
      { id: 'streak_14', title: 'Unstoppable Momentum', desc: 'Maintain a 14-day streak', icon: '🚀', unlocked: false, unlockedAt: null },
      { id: 'streak_30', title: 'Iron Discipline', desc: 'Reach a 30-day streak', icon: '🛡️', unlocked: false, unlockedAt: null },
      { id: 'perfect_day', title: 'Perfectionist', desc: 'Complete 100% of habits in a single day', icon: '⭐', unlocked: false, unlockedAt: null },
      { id: 'centurion', title: 'Centurion', desc: 'Log 100 total habit completions', icon: '👑', unlocked: false, unlockedAt: null },
      { id: 'focus_master', title: 'Deep Worker', desc: 'Complete 10 Pomodoro focus sessions', icon: '⏱️', unlocked: false, unlockedAt: null },
      { id: 'zen_master', title: 'Zen Master', desc: 'Log 30 meditation sessions', icon: '🧘', unlocked: false, unlockedAt: null },
      { id: 'early_bird', title: 'Dawn Patrol', desc: 'Complete a morning habit before 8 AM', icon: '🌅', unlocked: false, unlockedAt: null },
      { id: 'night_owl', title: 'Night Owl', desc: 'Log an evening reflection habit', icon: '🦉', unlocked: false, unlockedAt: null },
      { id: 'scholar', title: 'Scholar Mind', desc: 'Read 20+ days in a month', icon: '📖', unlocked: false, unlockedAt: null },
      { id: 'goal_crusher', title: 'Goal Crusher', desc: 'Accomplish an official goal', icon: '🎯', unlocked: false, unlockedAt: null },
      { id: 'streak_60', title: 'Diamond Will', desc: 'Reach an exceptional 60-day streak', icon: '💎', unlocked: false, unlockedAt: null },
      { id: 'xp_5000', title: 'Legendary Rank', desc: 'Earn 5,000 XP in total', icon: '🏆', unlocked: false, unlockedAt: null },
      { id: 'polymath', title: 'Balanced Life', desc: 'Complete habits in all 5 categories in one day', icon: '⚖️', unlocked: false, unlockedAt: null }
    ];

    const quotes = [
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
      { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
      { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { text: "Focus is a muscle. The more you practice saying no, the stronger your yes becomes.", author: "Linear Philosophy" }
    ];

    return {
      user: {
        name: 'Kartik Tiwari',
        tagline: 'Starting day one: Building my discipline routine',
        avatar: '🌱',
        quote: quotes[0],
        xp: 0,
        level: 1,
        rank: 'Beginner'
      },
      habits,
      logs,
      journal,
      goals,
      achievements,
      focusHours: 0,
      focusSessions: [],
      settings: {
        theme: 'dark',
        accent: 'indigo',
        soundEnabled: true,
        notificationsEnabled: true
      }
    };
  }

  // --- Habit CRUD ---
  addHabit(habitData) {
    const newHabit = {
      id: 'h-' + Date.now(),
      name: habitData.name.trim(),
      description: habitData.description || '',
      category: habitData.category || 'Health',
      priority: habitData.priority || 'medium',
      icon: habitData.icon || '🎯',
      color: habitData.color || '#6366F1',
      targetDays: habitData.targetDays || [0, 1, 2, 3, 4, 5, 6],
      reminder: habitData.reminder || '09:00',
      order: this.state.habits.length + 1,
      createdAt: this.getTodayKey()
    };
    this.state.habits.push(newHabit);
    this.addXP(20, 'Created a new habit');
    this.notify('HABIT_ADDED', newHabit);
    return newHabit;
  }

  updateHabit(id, updateData) {
    const index = this.state.habits.findIndex(h => h.id === id);
    if (index !== -1) {
      this.state.habits[index] = { ...this.state.habits[index], ...updateData };
      this.notify('HABIT_UPDATED', this.state.habits[index]);
    }
  }

  deleteHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    // Clean up logs for this habit
    Object.keys(this.state.logs).forEach(dateKey => {
      delete this.state.logs[dateKey][id];
    });
    this.recalculateXPFromLogs();
    this.notify('HABIT_DELETED', id);
  }

  reorderHabits(orderedIds) {
    orderedIds.forEach((id, idx) => {
      const h = this.state.habits.find(item => item.id === id);
      if (h) h.order = idx + 1;
    });
    this.state.habits.sort((a, b) => a.order - b.order);
    this.notify('HABITS_REORDERED', this.state.habits);
  }

  // ─── XP Award Table (single source of truth) ───────────────────────────
  // These values are referenced by toggle AND recalculation so they never drift.
  static get XP_TABLE() {
    return {
      HABIT_COMPLETE: 20,  // completing a habit (status 2)
      HABIT_PARTIAL:  8,   // partial progress   (status 1)
      HABIT_NONE:     0    // unchecked           (status 0)
    };
  }

  // ─── Status & Logs Management ───────────────────────────────────────────
  getHabitStatus(habitId, dateKey = this.getTodayKey()) {
    if (!this.state.logs[dateKey]) return 0;
    return this.state.logs[dateKey][habitId] || 0;
  }

  toggleHabitStatus(habitId, dateKey = this.getTodayKey()) {
    if (!this.state.logs[dateKey]) {
      this.state.logs[dateKey] = {};
    }
    const prev = this.state.logs[dateKey][habitId] || 0;

    // Cycle: 0 → 2 (Complete) → 1 (Partial) → 0 (None)
    let next;
    if (prev === 0) next = 2;
    else if (prev === 2) next = 1;
    else next = 0;

    this.state.logs[dateKey][habitId] = next;

    // ── XP delta: award new state's XP, deduct old state's XP ──────────
    const xpTable = Store.XP_TABLE;
    const prevXP = prev === 2 ? xpTable.HABIT_COMPLETE : prev === 1 ? xpTable.HABIT_PARTIAL : 0;
    const nextXP = next === 2 ? xpTable.HABIT_COMPLETE : next === 1 ? xpTable.HABIT_PARTIAL : 0;
    const delta  = nextXP - prevXP;

    if (delta > 0) {
      this.addXP(delta, next === 2 ? 'Habit approved ✓' : 'Partial progress');
    } else if (delta < 0) {
      this.deductXP(Math.abs(delta), next === 0 ? 'Habit disapproved ✗' : 'Partial progress');
    }

    if (next === 2) {
      sound.playSuccess();
      this.checkMilestones();
    } else if (next === 1) {
      sound.playPop();
    } else {
      sound.playPop();
    }

    this.notify('STATUS_TOGGLED', { habitId, dateKey, status: next, xpDelta: delta });
    return next;
  }

  setHabitStatusDirect(habitId, dateKey, status) {
    if (!this.state.logs[dateKey]) {
      this.state.logs[dateKey] = {};
    }
    const prev = this.state.logs[dateKey][habitId] || 0;
    this.state.logs[dateKey][habitId] = status;

    const xpTable  = Store.XP_TABLE;
    const prevXP   = prev === 2 ? xpTable.HABIT_COMPLETE : prev === 1 ? xpTable.HABIT_PARTIAL : 0;
    const nextXP   = status === 2 ? xpTable.HABIT_COMPLETE : status === 1 ? xpTable.HABIT_PARTIAL : 0;
    const delta    = nextXP - prevXP;
    if (delta > 0) this.addXP(delta, 'Direct status set');
    else if (delta < 0) this.deductXP(Math.abs(delta), 'Direct status removed');

    if (status === 2) sound.playSuccess();
    else sound.playPop();
    this.notify('STATUS_TOGGLED', { habitId, dateKey, status });
  }

  // --- Productivity & Streaks Calculation ---
  getDayStats(dateKey = this.getTodayKey()) {
    const dayLogs = this.state.logs[dateKey] || {};
    const total = this.state.habits.length;
    if (total === 0) return { total: 0, completed: 0, partial: 0, percent: 0 };

    let completed = 0;
    let partial = 0;
    this.state.habits.forEach(h => {
      const st = dayLogs[h.id] || 0;
      if (st === 2) completed++;
      else if (st === 1) partial++;
    });

    const weightedScore = completed + (partial * 0.5);
    const percent = Math.round((weightedScore / total) * 100);
    return { total, completed, partial, percent };
  }

  calculateHabitStreak(habitId) {
    const today = new Date();
    const todayKey = this.formatDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = this.formatDateKey(yesterday);

    const todayStatus = (this.state.logs[todayKey] && (this.state.logs[todayKey][habitId] || 0)) || 0;
    const yesterdayStatus = (this.state.logs[yesterdayKey] && (this.state.logs[yesterdayKey][habitId] || 0)) || 0;

    let current = 0;
    let checkDate = null;

    if (todayStatus > 0) {
      checkDate = new Date(today);
    } else if (yesterdayStatus > 0) {
      checkDate = new Date(yesterday);
    }

    if (checkDate) {
      while (true) {
        const k = this.formatDateKey(checkDate);
        const st = this.state.logs[k] ? (this.state.logs[k][habitId] || 0) : 0;
        if (st > 0) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longest = current;
    let running = 0;
    const scanDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const k = this.formatDateKey(scanDate);
      const st = this.state.logs[k] ? (this.state.logs[k][habitId] || 0) : 0;
      if (st > 0) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
      scanDate.setDate(scanDate.getDate() - 1);
    }

    return { current, longest };
  }

  calculateGlobalStreak() {
    const today = new Date();
    const todayKey = this.formatDateKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = this.formatDateKey(yesterday);

    const todayStats = this.getDayStats(todayKey);
    const yesterdayStats = this.getDayStats(yesterdayKey);

    let current = 0;
    let checkDate = null;

    // Day counts if >= 50% productivity
    if (todayStats.percent >= 50) {
      checkDate = new Date(today);
    } else if (yesterdayStats.percent >= 50) {
      checkDate = new Date(yesterday);
    }

    if (checkDate) {
      while (true) {
        const k = this.formatDateKey(checkDate);
        const stats = this.getDayStats(k);
        if (stats.percent >= 50) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    let longest = current;
    let running = 0;
    const scanDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const k = this.formatDateKey(scanDate);
      const stats = this.getDayStats(k);
      if (stats.percent >= 50) {
        running++;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
      scanDate.setDate(scanDate.getDate() - 1);
    }

    return { current, longest };
  }

  // ─── Gamification Engine (XP · Levels · Ranks) ──────────────────────────

  // XP thresholds per level (level N needs cumulative XP of N² × 25)
  // Level 1=25, 2=100, 3=225, 4=400, 5=625, 10=2500, 20=10000 …
  static xpForLevel(level) {
    return level <= 1 ? 0 : (level - 1) * (level - 1) * 25;
  }

  static levelFromXP(xp) {
    // Solve (L-1)² × 25 ≤ xp  →  L-1 ≤ sqrt(xp/25)  →  L = floor(sqrt(xp/25)) + 1
    return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1);
  }

  static rankFromLevel(level) {
    if (level >= 35) return 'Legend';
    if (level >= 20) return 'Master';
    if (level >= 10) return 'Focused';
    if (level >= 5)  return 'Consistent';
    return 'Beginner';
  }

  _applyXPChange(newXP) {
    const clampedXP = Math.max(0, newXP);
    const oldLevel  = this.state.user.level;
    const oldRank   = this.state.user.rank;
    const newLevel  = Store.levelFromXP(clampedXP);
    const newRank   = Store.rankFromLevel(newLevel);

    this.state.user.xp    = clampedXP;
    this.state.user.level = newLevel;
    this.state.user.rank  = newRank;

    if (newLevel > oldLevel) {
      sound.playLevelUp();
      this.notify('LEVEL_UP',   { level: newLevel, rank: newRank, prev: oldLevel });
    } else if (newLevel < oldLevel) {
      this.notify('LEVEL_DOWN', { level: newLevel, rank: newRank, prev: oldLevel });
    } else if (newRank !== oldRank) {
      this.notify('RANK_CHANGE', { rank: newRank, level: newLevel });
    }
  }

  addXP(amount, reason = '') {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this._applyXPChange(this.state.user.xp + amount);
  }

  deductXP(amount, reason = '') {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this._applyXPChange(this.state.user.xp - amount);
  }

  /**
   * Recompute the user's total XP from scratch based on actual log data.
   * Call this after bulk imports, resets, or if XP ever drifts.
   */
  recalculateXPFromLogs() {
    const xpTable = Store.XP_TABLE;
    let total = 0;

    // Habit completions
    Object.keys(this.state.logs).forEach(dateKey => {
      const dayLog = this.state.logs[dateKey] || {};
      this.state.habits.forEach(h => {
        const st = dayLog[h.id] || 0;
        if (st === 2) total += xpTable.HABIT_COMPLETE;
        else if (st === 1) total += xpTable.HABIT_PARTIAL;
      });
    });

    // Focus sessions
    (this.state.focusSessions || []).forEach(s => {
      total += Math.round((s.durationMinutes || 0) * 0.8);
    });

    // Journal entries (15 XP per unique day with notes or tags)
    Object.keys(this.state.journal || {}).forEach(dateKey => {
      const j = this.state.journal[dateKey];
      if (j && (j.notes || (j.tags && j.tags.length > 0))) {
        total += 15;
      }
    });

    // Habit creation bonus (20 XP each)
    total += this.state.habits.length * 20;

    // Goal creation bonus (25 XP each)
    total += (this.state.goals || []).length * 25;

    // Completed goal bonus (100 XP each)
    (this.state.goals || []).forEach(g => {
      if (g.completed) total += 100;
    });

    // Achievement unlock bonus (50 XP each)
    (this.state.achievements || []).forEach(a => {
      if (a.unlocked) total += 50;
    });

    this._applyXPChange(total);
    this.saveState();
    return total;
  }

  getXPForNextLevel() {
    const level     = this.state.user.level;
    const thisFloor = Store.xpForLevel(level);
    const nextCeil  = Store.xpForLevel(level + 1);
    const range     = Math.max(1, nextCeil - thisFloor);
    const progress  = Math.max(0, this.state.user.xp - thisFloor);
    const percent   = Math.min(100, Math.round((progress / range) * 100));
    return {
      current:    this.state.user.xp,
      levelFloor: thisFloor,
      target:     nextCeil,
      range,
      progress,
      percent
    };
  }

  checkMilestones() {
    const todayStats = this.getDayStats(this.getTodayKey());
    const globalStreak = this.calculateGlobalStreak();

    let totalCompletions = 0;
    Object.keys(this.state.logs).forEach(k => {
      totalCompletions += this.getDayStats(k).completed;
    });

    // Focus sessions count
    const focusCount = Array.isArray(this.state.focusSessions) ? this.state.focusSessions.length : 0;

    // Polymath check: habits completed in ALL 5 base categories today
    const todayLogs = this.state.logs[this.getTodayKey()] || {};
    const completedCategories = new Set();
    this.state.habits.forEach(h => {
      if ((todayLogs[h.id] || 0) === 2) {
        completedCategories.add(h.category);
      }
    });
    const baseCategories = ['Health', 'Fitness', 'Study', 'Work', 'Personal Growth'];
    const allCategoriesCovered = baseCategories.every(c => completedCategories.has(c));

    // Check for completed goals
    const hasCompletedGoal = (this.state.goals || []).some(g => g.completed);

    const newlyUnlockedList = [];
    this.state.achievements.forEach(ach => {
      if (ach.unlocked) return;

      let shouldUnlock = false;
      if (ach.id === 'first_step' && totalCompletions >= 1) shouldUnlock = true;
      else if (ach.id === 'perfect_day' && todayStats.total > 0 && todayStats.percent === 100) shouldUnlock = true;
      else if (ach.id === 'streak_3' && globalStreak.current >= 3) shouldUnlock = true;
      else if (ach.id === 'streak_7' && globalStreak.current >= 7) shouldUnlock = true;
      else if (ach.id === 'streak_14' && globalStreak.current >= 14) shouldUnlock = true;
      else if (ach.id === 'streak_30' && globalStreak.current >= 30) shouldUnlock = true;
      else if (ach.id === 'streak_60' && globalStreak.current >= 60) shouldUnlock = true;
      else if (ach.id === 'centurion' && totalCompletions >= 100) shouldUnlock = true;
      else if (ach.id === 'xp_5000' && this.state.user.xp >= 5000) shouldUnlock = true;
      else if (ach.id === 'focus_master' && focusCount >= 10) shouldUnlock = true;
      else if (ach.id === 'goal_crusher' && hasCompletedGoal) shouldUnlock = true;
      else if (ach.id === 'polymath' && allCategoriesCovered) shouldUnlock = true;

      if (shouldUnlock) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlockedList.push(ach);
      }
    });

    if (newlyUnlockedList.length > 0) {
      sound.playMilestone();
      // Notify for each unlocked achievement
      newlyUnlockedList.forEach(ach => {
        this.notify('ACHIEVEMENT_UNLOCKED', ach);
      });
    }
  }

  // --- Pomodoro & Focus Log ---
  logFocusSession(habitId, minutes) {
    const session = {
      id: 'f-' + Date.now(),
      habitId,
      durationMinutes: minutes,
      timestamp: new Date().toISOString()
    };
    if (!this.state.focusSessions) this.state.focusSessions = [];
    this.state.focusSessions.push(session);
    this.state.focusHours = +(this.state.focusHours + (minutes / 60)).toFixed(1);
    this.addXP(Math.round(minutes * 0.8), 'Completed Pomodoro session');
    this.notify('FOCUS_LOGGED', session);
  }

  // --- Journal ---
  setJournal(dateKey, { mood, notes, tags }) {
    if (!this.state.journal) this.state.journal = {};
    const existing = this.state.journal[dateKey];
    const isFirstLog = !existing || (!existing.notes && (!existing.tags || existing.tags.length === 0));

    this.state.journal[dateKey] = {
      mood: mood || 'good',
      notes: notes || '',
      tags: tags || []
    };

    // Only award XP once per day for journaling
    if (isFirstLog && (notes.trim() || (tags && tags.length > 0))) {
      this.addXP(15, 'Logged daily reflection');
    }

    this.saveState();
    this.notify('JOURNAL_SAVED', { dateKey, entry: this.state.journal[dateKey] });
  }

  getJournal(dateKey = this.getTodayKey()) {
    return (this.state.journal && this.state.journal[dateKey]) || {
      mood: 'good',
      notes: '',
      tags: []
    };
  }

  // --- Goals ---
  addGoal(goalData) {
    const newGoal = {
      id: 'g-' + Date.now(),
      title: goalData.title,
      timeframe: goalData.timeframe || 'monthly',
      category: goalData.category || 'Personal Growth',
      current: Number(goalData.current) || 0,
      target: Number(goalData.target) || 10,
      unit: goalData.unit || 'units',
      completed: false
    };
    this.state.goals.push(newGoal);
    this.addXP(25, 'Created new goal');
    this.notify('GOAL_ADDED', newGoal);
  }

  updateGoal(id, updates) {
    const g = this.state.goals.find(item => item.id === id);
    if (g) {
      const wasCompleted = !!g.completed;
      Object.assign(g, updates);
      if (g.current >= g.target && !wasCompleted) {
        g.completed = true;
        sound.playMilestone();
        this.addXP(100, 'Completed goal milestone');
      } else if (g.current < g.target && wasCompleted) {
        g.completed = false;
        this.deductXP(100, 'Goal milestone reverted');
      }
      this.notify('GOAL_UPDATED', g);
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(item => item.id !== id);
    this.recalculateXPFromLogs();
    this.notify('GOAL_DELETED', id);
  }

  // --- Settings & Profile ---
  updateSettings(settingsUpdates) {
    this.state.settings = { ...this.state.settings, ...settingsUpdates };
    if (settingsUpdates.soundEnabled !== undefined) {
      sound.enabled = settingsUpdates.soundEnabled;
    }
    this.notify('SETTINGS_UPDATED', this.state.settings);
  }

  updateUser(userUpdates) {
    this.state.user = { ...this.state.user, ...userUpdates };
    this.notify('USER_UPDATED', this.state.user);
  }
}

export const store = new Store();
