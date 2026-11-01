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
      focusSessions: 0,
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

  // --- Status & Logs Management ---
  getHabitStatus(habitId, dateKey = this.getTodayKey()) {
    if (!this.state.logs[dateKey]) return 0;
    return this.state.logs[dateKey][habitId] || 0;
  }

  toggleHabitStatus(habitId, dateKey = this.getTodayKey()) {
    if (!this.state.logs[dateKey]) {
      this.state.logs[dateKey] = {};
    }
    const current = this.state.logs[dateKey][habitId] || 0;
    // Cycle: 0 (none) -> 2 (complete) -> 1 (partial) -> 0 (none)
    let next = 2;
    if (current === 2) next = 1;
    else if (current === 1) next = 0;
    else next = 2;

    this.state.logs[dateKey][habitId] = next;

    if (next === 2) {
      sound.playSuccess();
      this.addXP(15, 'Completed habit');
      this.checkMilestones();
    } else if (next === 1) {
      sound.playPop();
      this.addXP(5, 'Partial progress');
    } else {
      sound.playPop();
    }

    this.notify('STATUS_TOGGLED', { habitId, dateKey, status: next });
    return next;
  }

  setHabitStatusDirect(habitId, dateKey, status) {
    if (!this.state.logs[dateKey]) {
      this.state.logs[dateKey] = {};
    }
    this.state.logs[dateKey][habitId] = status;
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
    let current = 0;
    let longest = 0;
    let temp = 0;

    const today = new Date();
    // Check backwards from today or yesterday
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = this.formatDateKey(d);
      const st = this.state.logs[k] ? this.state.logs[k][habitId] || 0 : 0;

      if (st > 0) {
        temp++;
        if (temp > longest) longest = temp;
        if (i === 0 || (i === 1 && current === 0)) {
          current = temp;
        }
      } else {
        if (i > 1 && current === 0) {
          current = temp;
        }
        temp = 0;
      }
    }
    return { current, longest: Math.max(longest, current) };
  }

  calculateGlobalStreak() {
    let current = 0;
    let longest = 0;
    let temp = 0;
    const today = new Date();

    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = this.formatDateKey(d);
      const stats = this.getDayStats(k);

      // A day counts towards global streak if at least 50% productivity is achieved
      if (stats.percent >= 50) {
        temp++;
        if (temp > longest) longest = temp;
        if (i === 0 || (i === 1 && current === 0)) {
          current = temp;
        }
      } else {
        if (i <= 1 && current === 0) {
          // If today isn't 50% yet, streak from yesterday still counts as current
          if (i === 0) continue;
        }
        temp = 0;
      }
    }
    return { current, longest };
  }

  // --- Gamification Engine (XP, Levels, Ranks) ---
  addXP(amount, reason = '') {
    this.state.user.xp += amount;
    const oldLevel = this.state.user.level;
    const newLevel = Math.floor(Math.sqrt(this.state.user.xp / 18)) + 1;
    this.state.user.level = newLevel;

    // Rank Progression
    if (newLevel >= 35) this.state.user.rank = 'Legend';
    else if (newLevel >= 20) this.state.user.rank = 'Master';
    else if (newLevel >= 10) this.state.user.rank = 'Focused';
    else if (newLevel >= 5) this.state.user.rank = 'Consistent';
    else this.state.user.rank = 'Beginner';

    if (newLevel > oldLevel) {
      sound.playLevelUp();
      this.notify('LEVEL_UP', { level: newLevel, rank: this.state.user.rank });
    }
  }

  getXPForNextLevel() {
    const currentLvl = this.state.user.level;
    const nextLvlXp = (currentLvl * currentLvl) * 18;
    const prevLvlXp = ((currentLvl - 1) * (currentLvl - 1)) * 18;
    const progressInLevel = Math.max(0, this.state.user.xp - prevLvlXp);
    const neededForLevel = Math.max(1, nextLvlXp - prevLvlXp);
    const percent = Math.min(100, Math.round((progressInLevel / neededForLevel) * 100));
    return { current: this.state.user.xp, target: nextLvlXp, percent };
  }

  checkMilestones() {
    const todayStats = this.getDayStats(this.getTodayKey());
    const globalStreak = this.calculateGlobalStreak();

    let totalCompletions = 0;
    Object.keys(this.state.logs).forEach(k => {
      totalCompletions += this.getDayStats(k).completed;
    });

    let newlyUnlocked = null;
    this.state.achievements.forEach(ach => {
      if (ach.unlocked) return;

      if (ach.id === 'first_step' && totalCompletions >= 1) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'perfect_day' && todayStats.total > 0 && todayStats.percent === 100) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'streak_3' && globalStreak.current >= 3) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'streak_7' && globalStreak.current >= 7) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'streak_14' && globalStreak.current >= 14) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'streak_30' && globalStreak.current >= 30) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'centurion' && totalCompletions >= 100) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      } else if (ach.id === 'xp_5000' && this.state.user.xp >= 5000) {
        ach.unlocked = true;
        ach.unlockedAt = this.getTodayKey();
        newlyUnlocked = ach;
      }
    });

    if (newlyUnlocked) {
      sound.playMilestone();
      this.notify('ACHIEVEMENT_UNLOCKED', newlyUnlocked);
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
    this.state.journal[dateKey] = {
      mood: mood || 'good',
      notes: notes || '',
      tags: tags || []
    };
    this.addXP(10, 'Logged reflection journal');
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
    this.notify('GOAL_ADDED', newGoal);
  }

  updateGoal(id, updates) {
    const g = this.state.goals.find(item => item.id === id);
    if (g) {
      Object.assign(g, updates);
      if (g.current >= g.target && !g.completed) {
        g.completed = true;
        sound.playMilestone();
        this.addXP(100, 'Completed goal');
      }
      this.notify('GOAL_UPDATED', g);
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(item => item.id !== id);
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
