// HabitFlow Pro - Habit Management & Dashboard View
import { store } from './store.js';

export class HabitManager {
  constructor() {
    this.container = document.getElementById('habits-list-container');
    this.filterCategory = 'All';
    this.filterPriority = 'All';
    this.filterStatus = 'All';
    this.searchTerm = '';
    this.sortBy = 'order'; // 'order' | 'priority' | 'streak' | 'name'
    this.draggedElement = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // Search input
    const searchInput = document.getElementById('habit-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Category filter pills
    const categoryContainer = document.getElementById('habit-category-filters');
    if (categoryContainer) {
      categoryContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-category]');
        if (btn) {
          categoryContainer.querySelectorAll('[data-category]').forEach(b => {
            b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            b.classList.add('text-slate-400', 'hover:text-slate-200');
          });
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
          btn.classList.remove('text-slate-400', 'hover:text-slate-200');
          this.filterCategory = btn.dataset.category;
          this.render();
        }
      });
    }

    // Priority filter dropdown
    const prioritySelect = document.getElementById('habit-priority-filter');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.filterPriority = e.target.value;
        this.render();
      });
    }

    // Status filter dropdown
    const statusSelect = document.getElementById('habit-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.render();
      });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('habit-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // Form: Add / Edit Habit Modal
    const habitForm = document.getElementById('habit-modal-form');
    if (habitForm) {
      habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Listen for store changes
    store.subscribe((event) => {
      if (['HABIT_ADDED', 'HABIT_UPDATED', 'HABIT_DELETED', 'HABITS_REORDERED', 'STATUS_TOGGLED', 'RESET'].includes(event)) {
        this.render();
      }
    });
  }

  getFilteredHabits() {
    let habits = [...store.state.habits];
    const todayKey = store.getTodayKey();

    // Category filter
    if (this.filterCategory !== 'All') {
      habits = habits.filter(h => h.category === this.filterCategory);
    }

    // Priority filter
    if (this.filterPriority !== 'All') {
      habits = habits.filter(h => h.priority === this.filterPriority.toLowerCase());
    }

    // Status filter
    if (this.filterStatus !== 'All') {
      habits = habits.filter(h => {
        const st = store.getHabitStatus(h.id, todayKey);
        if (this.filterStatus === 'Completed') return st === 2;
        if (this.filterStatus === 'Partial') return st === 1;
        if (this.filterStatus === 'Pending') return st === 0;
        return true;
      });
    }

    // Search filter
    if (this.searchTerm) {
      habits = habits.filter(h =>
        h.name.toLowerCase().includes(this.searchTerm) ||
        (h.description && h.description.toLowerCase().includes(this.searchTerm))
      );
    }

    // Sorting
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (this.sortBy === 'name') {
      habits.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy === 'priority') {
      habits.sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
    } else if (this.sortBy === 'streak') {
      habits.sort((a, b) => {
        const sA = store.calculateHabitStreak(a.id).current;
        const sB = store.calculateHabitStreak(b.id).current;
        return sB - sA;
      });
    } else {
      habits.sort((a, b) => a.order - b.order);
    }

    return habits;
  }

  render() {
    if (!this.container) return;
    const habits = this.getFilteredHabits();
    const todayKey = store.getTodayKey();

    if (habits.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center glass-panel rounded-2xl border border-white/5">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/80 flex items-center justify-center text-3xl">🎯</div>
          <h3 class="text-lg font-semibold text-slate-200 mb-1">No habits found</h3>
          <p class="text-sm text-slate-400 max-w-sm mx-auto mb-6">Create a new habit or adjust your search and filters to view your routine.</p>
          <button onclick="window.app.openAddHabitModal()" class="px-5 py-2.5 rounded-xl glow-btn text-white text-sm font-medium inline-flex items-center gap-2">
            <span>+</span> Create Habit
          </button>
        </div>
      `;
      return;
    }

    const priorityBadge = (priority) => {
      const styles = {
        urgent: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        low: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
      };
      return `<span class="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded-md border ${styles[priority] || styles.medium}">${priority}</span>`;
    };

    this.container.innerHTML = habits.map(h => {
      const status = store.getHabitStatus(h.id, todayKey);
      const streak = store.calculateHabitStreak(h.id);

      // Checkbox state UI
      let checkboxHtml = '';
      if (status === 2) {
        checkboxHtml = `
          <div class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 transition-transform active:scale-90">
            <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        `;
      } else if (status === 1) {
        checkboxHtml = `
          <div class="w-8 h-8 rounded-xl bg-emerald-500/30 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center transition-transform active:scale-90">
            <span class="text-xs font-bold font-mono">½</span>
          </div>
        `;
      } else {
        checkboxHtml = `
          <div class="w-8 h-8 rounded-xl border-2 border-slate-600 hover:border-slate-400 flex items-center justify-center transition-transform active:scale-90">
            <div class="w-2 h-2 rounded-full bg-transparent"></div>
          </div>
        `;
      }

      return `
        <div class="habit-card glass-card-interactive p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative group ${status === 2 ? 'border-emerald-500/30 bg-emerald-950/10' : ''}"
             data-id="${h.id}" draggable="true">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3">
                <span class="text-2xl p-2 rounded-xl bg-slate-800/80 border border-white/5 shadow-inner" style="border-left: 3px solid ${h.color};">
                  ${h.icon}
                </span>
                <div>
                  <h4 class="font-semibold text-slate-100 text-base leading-snug group-hover:text-indigo-300 transition-colors ${status === 2 ? 'line-through text-slate-400' : ''}">
                    ${h.name}
                  </h4>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${h.color};"></span>
                      ${h.category}
                    </span>
                    <span class="text-slate-600">•</span>
                    ${priorityBadge(h.priority)}
                  </div>
                </div>
              </div>

              <!-- Quick Status Toggle Button -->
              <button class="habit-toggle-btn focus:outline-none" data-action="toggle" data-id="${h.id}" title="Click: Complete / Partial / Reset">
                ${checkboxHtml}
              </button>
            </div>

            ${h.description ? `<p class="text-xs text-slate-400 mb-4 line-clamp-2">${h.description}</p>` : '<div class="h-2"></div>'}
          </div>

          <!-- Bottom Card Footer -->
          <div class="pt-3 border-t border-slate-700/50 flex items-center justify-between mt-auto">
            <div class="flex items-center gap-2 text-xs">
              <span class="flex items-center gap-1 font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20" title="Current streak">
                🔥 ${streak.current}d
              </span>
              <span class="text-slate-500 text-[11px]" title="Best streak">Best: ${streak.longest}d</span>
            </div>

            <div class="flex items-center gap-1">
              <!-- Pomodoro Quick Trigger -->
              <button class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-colors"
                      data-action="focus" data-id="${h.id}" data-name="${h.name}" title="Start Focus Timer for this habit">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <!-- Edit Habit -->
              <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                      data-action="edit" data-id="${h.id}" title="Edit habit">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <!-- Delete Habit -->
              <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      data-action="delete" data-id="${h.id}" title="Delete habit">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <!-- Drag Handle -->
              <span class="p-1.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.attachCardEventListeners();
  }

  attachCardEventListeners() {
    // Card button actions
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'toggle') {
          store.toggleHabitStatus(id);
        } else if (action === 'focus') {
          const habitName = btn.dataset.name;
          window.app.startFocusWithHabit(id, habitName);
        } else if (action === 'edit') {
          this.openEditModal(id);
        } else if (action === 'delete') {
          this.confirmDelete(id);
        }
      });
    });

    // Drag and Drop reordering
    const cards = this.container.querySelectorAll('.habit-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedElement = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.container.querySelectorAll('.habit-card').forEach(c => c.classList.remove('drag-over'));
        this.draggedElement = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.draggedElement !== card) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (this.draggedElement && this.draggedElement !== card) {
          const currentCards = [...this.container.querySelectorAll('.habit-card')];
          const draggedIdx = currentCards.indexOf(this.draggedElement);
          const targetIdx = currentCards.indexOf(card);

          const orderedIds = store.state.habits.map(h => h.id);
          const [movedId] = orderedIds.splice(draggedIdx, 1);
          orderedIds.splice(targetIdx, 0, movedId);

          store.reorderHabits(orderedIds);
        }
      });
    });
  }

  openEditModal(id) {
    const habit = store.state.habits.find(h => h.id === id);
    if (!habit) return;

    const modal = document.getElementById('habit-modal');
    const title = document.getElementById('habit-modal-title');
    const idInput = document.getElementById('habit-id-input');
    const nameInput = document.getElementById('habit-name-input');
    const descInput = document.getElementById('habit-desc-input');
    const catSelect = document.getElementById('habit-category-select');
    const prioritySelect = document.getElementById('habit-priority-select');
    const iconInput = document.getElementById('habit-icon-input');
    const colorInput = document.getElementById('habit-color-input');
    const reminderInput = document.getElementById('habit-reminder-input');

    if (title) title.textContent = 'Edit Habit';
    if (idInput) idInput.value = habit.id;
    if (nameInput) nameInput.value = habit.name;
    if (descInput) descInput.value = habit.description || '';
    if (catSelect) catSelect.value = habit.category;
    if (prioritySelect) prioritySelect.value = habit.priority;
    if (iconInput) iconInput.value = habit.icon;
    if (colorInput) colorInput.value = habit.color;
    if (reminderInput) reminderInput.value = habit.reminder || '09:00';

    if (modal) modal.classList.remove('hidden');
  }

  handleFormSubmit() {
    const id = document.getElementById('habit-id-input').value;
    const name = document.getElementById('habit-name-input').value;
    const description = document.getElementById('habit-desc-input').value;
    const category = document.getElementById('habit-category-select').value;
    const priority = document.getElementById('habit-priority-select').value;
    const icon = document.getElementById('habit-icon-input').value || '🎯';
    const color = document.getElementById('habit-color-input').value || '#6366F1';
    const reminder = document.getElementById('habit-reminder-input').value;

    if (!name.trim()) return;

    if (id) {
      store.updateHabit(id, { name, description, category, priority, icon, color, reminder });
      window.app.showToast('Habit updated successfully', 'success');
    } else {
      store.addHabit({ name, description, category, priority, icon, color, reminder });
      window.app.showToast('New habit added!', 'success');
    }

    this.closeModal();
  }

  confirmDelete(id) {
    const habit = store.state.habits.find(h => h.id === id);
    if (!habit) return;
    if (confirm(`Are you sure you want to delete "${habit.name}"? This will also remove historical logs for this habit.`)) {
      store.deleteHabit(id);
      window.app.showToast('Habit deleted', 'info');
    }
  }

  closeModal() {
    const modal = document.getElementById('habit-modal');
    if (modal) modal.classList.add('hidden');
  }
}
