// HabitFlow Pro - Notes, Daily Journal & Mood Tracker
import { store } from './store.js';

export class JournalManager {
  constructor() {
    this.selectedDate = store.getTodayKey();
    this.currentMood = 'good';
    this.currentTags = [];

    this.initEventListeners();
  }

  initEventListeners() {
    // Mood emoji buttons
    const moodBtns = document.querySelectorAll('[data-mood]');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => {
          b.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-110');
        });
        btn.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-110');
        this.currentMood = btn.dataset.mood;
        this.save();
      });
    });

    // Tag pills
    const tagPills = document.querySelectorAll('[data-tag]');
    tagPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const tag = pill.dataset.tag;
        if (this.currentTags.includes(tag)) {
          this.currentTags = this.currentTags.filter(t => t !== tag);
          pill.classList.remove('bg-indigo-600', 'text-white');
          pill.classList.add('bg-slate-800', 'text-slate-400');
        } else {
          this.currentTags.push(tag);
          pill.classList.add('bg-indigo-600', 'text-white');
          pill.classList.remove('bg-slate-800', 'text-slate-400');
        }
        this.save();
      });
    });

    // Notes Textarea with autosave debounce
    const notesInput = document.getElementById('journal-notes-input');
    if (notesInput) {
      let debounceTimeout = null;
      notesInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.save();
        }, 600);
      });
    }

    // Journal Date Selector
    const dateInput = document.getElementById('journal-date-picker');
    if (dateInput) {
      dateInput.value = this.selectedDate;
      dateInput.addEventListener('change', (e) => {
        this.selectedDate = e.target.value;
        this.loadEntryForDate(this.selectedDate);
      });
    }

    store.subscribe((event) => {
      if (['JOURNAL_SAVED', 'RESET'].includes(event)) {
        this.renderHistory();
      }
    });
  }

  loadEntryForDate(dateKey) {
    const entry = store.getJournal(dateKey);
    this.currentMood = entry.mood || 'good';
    this.currentTags = entry.tags || [];

    // Update UI elements
    const moodBtns = document.querySelectorAll('[data-mood]');
    moodBtns.forEach(b => {
      b.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-110');
      if (b.dataset.mood === this.currentMood) {
        b.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-110');
      }
    });

    const tagPills = document.querySelectorAll('[data-tag]');
    tagPills.forEach(pill => {
      const tag = pill.dataset.tag;
      if (this.currentTags.includes(tag)) {
        pill.classList.add('bg-indigo-600', 'text-white');
        pill.classList.remove('bg-slate-800', 'text-slate-400');
      } else {
        pill.classList.remove('bg-indigo-600', 'text-white');
        pill.classList.add('bg-slate-800', 'text-slate-400');
      }
    });

    const notesInput = document.getElementById('journal-notes-input');
    if (notesInput) {
      notesInput.value = entry.notes || '';
    }
  }

  save() {
    const notesInput = document.getElementById('journal-notes-input');
    const notes = notesInput ? notesInput.value.trim() : '';

    store.setJournal(this.selectedDate, {
      mood: this.currentMood,
      notes,
      tags: this.currentTags
    });

    const statusEl = document.getElementById('journal-saved-status');
    if (statusEl) {
      statusEl.textContent = 'Saved • just now';
      statusEl.classList.remove('opacity-0');
      setTimeout(() => {
        statusEl.classList.add('opacity-0');
      }, 2000);
    }
  }

  render() {
    this.loadEntryForDate(this.selectedDate);
    this.renderHistory();
  }

  renderHistory() {
    const container = document.getElementById('journal-history-container');
    if (!container) return;

    const entries = store.state.journal || {};
    const dates = Object.keys(entries).sort().reverse();

    if (dates.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400">No reflections logged yet. Capture your thoughts above!</p>';
      return;
    }

    const moodIcons = {
      amazing: '🤩',
      good: '😊',
      neutral: '😐',
      down: '😔',
      stressed: '😫'
    };

    container.innerHTML = dates.slice(0, 10).map(dateKey => {
      const item = entries[dateKey];
      return `
        <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-mono text-slate-400">${dateKey}</span>
            <span class="text-base" title="Mood: ${item.mood}">${moodIcons[item.mood] || '😊'}</span>
          </div>
          ${item.notes ? `<p class="text-xs text-slate-200 line-clamp-2">${item.notes}</p>` : ''}
          ${item.tags && item.tags.length ? `
            <div class="flex flex-wrap gap-1 mt-2">
              ${item.tags.map(t => `<span class="px-1.5 py-0.5 text-[10px] bg-slate-700/60 text-slate-300 rounded">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}
