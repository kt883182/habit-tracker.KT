// HabitFlow Pro - Pomodoro Focus Timer
import { store } from './store.js';
import { sound } from './audio.js';

export class TimerManager {
  constructor() {
    this.mode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    this.durations = {
      pomodoro: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };
    this.remainingSeconds = this.durations.pomodoro;
    this.totalSeconds = this.durations.pomodoro;
    this.isRunning = false;
    this.timerId = null;
    this.selectedHabitId = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // Mode Buttons
    const modeBtns = document.querySelectorAll('[data-timer-mode]');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('text-slate-400');

        this.setMode(btn.dataset.timerMode);
      });
    });

    // Start / Pause Button
    const toggleBtn = document.getElementById('timer-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Reset Button
    const resetBtn = document.getElementById('timer-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }

    // Skip Button
    const skipBtn = document.getElementById('timer-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.completeSession();
      });
    }

    // Habit Link Dropdown
    const habitSelect = document.getElementById('timer-habit-select');
    if (habitSelect) {
      habitSelect.addEventListener('change', (e) => {
        this.selectedHabitId = e.target.value;
      });
    }

    store.subscribe((event) => {
      if (['HABIT_ADDED', 'HABIT_DELETED', 'RESET'].includes(event)) {
        this.updateHabitSelectDropdown();
      }
    });
  }

  setMode(mode) {
    this.pause();
    this.mode = mode;
    this.remainingSeconds = this.durations[mode] || 25 * 60;
    this.totalSeconds = this.remainingSeconds;
    this.updateDisplay();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    sound.playPop();

    const toggleBtn = document.getElementById('timer-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pause
      `;
    }

    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    const toggleBtn = document.getElementById('timer-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Focus
      `;
    }
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.durations[this.mode];
    this.updateDisplay();
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();
    } else {
      this.completeSession();
    }
  }

  completeSession() {
    this.pause();
    sound.playTimerDone();

    const minutesLogged = Math.round(this.totalSeconds / 60);
    if (this.mode === 'pomodoro') {
      store.logFocusSession(this.selectedHabitId, minutesLogged);
      if (window.app && window.app.showToast) {
        window.app.showToast(`🎯 Focus session finished! Logged ${minutesLogged} mins (+${Math.round(minutesLogged * 0.8)} XP)`, 'success');
      }
    } else {
      if (window.app && window.app.showToast) {
        window.app.showToast('☕ Break time over! Ready for the next sprint?', 'info');
      }
    }

    this.remainingSeconds = this.durations[this.mode];
    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const textEl = document.getElementById('timer-time-display');
    if (textEl) {
      textEl.textContent = timeFormatted;
    }

    // Update document title if running
    if (this.isRunning) {
      document.title = `(${timeFormatted}) HabitFlow Pro`;
    } else {
      document.title = 'HabitFlow Pro - Modern Habit Tracker';
    }

    // Update SVG Circular Ring Progress
    const progressEl = document.getElementById('timer-progress-ring');
    if (progressEl) {
      const radius = 120;
      const circumference = 2 * Math.PI * radius;
      const progressRatio = this.remainingSeconds / this.totalSeconds;
      const offset = circumference * (1 - progressRatio);
      progressEl.style.strokeDasharray = `${circumference} ${circumference}`;
      progressEl.style.strokeDashoffset = offset;
    }
  }

  updateHabitSelectDropdown() {
    const select = document.getElementById('timer-habit-select');
    if (!select) return;

    const habits = store.state.habits;
    select.innerHTML = `
      <option value="">General Focus (No habit linked)</option>
      ${habits.map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('')}
    `;

    if (this.selectedHabitId) {
      select.value = this.selectedHabitId;
    }
  }

  selectHabit(habitId) {
    this.selectedHabitId = habitId;
    this.updateHabitSelectDropdown();
  }
}
