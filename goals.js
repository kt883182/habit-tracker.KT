// HabitFlow Pro - Goals Management & Progress Tracking
import { store } from './store.js';

export class GoalsManager {
  constructor() {
    this.container = document.getElementById('goals-list-container');
    this.filterTimeframe = 'all';

    this.initEventListeners();
  }

  initEventListeners() {
    // Timeframe selector
    const timeframeBtns = document.querySelectorAll('[data-goals-timeframe]');
    timeframeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timeframeBtns.forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('text-slate-400');
        this.filterTimeframe = btn.dataset.goalsTimeframe;
        this.render();
      });
    });

    // Goal Form Submit
    const goalForm = document.getElementById('goal-modal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    store.subscribe((event) => {
      if (['GOAL_ADDED', 'GOAL_UPDATED', 'GOAL_DELETED', 'RESET'].includes(event)) {
        this.render();
      }
    });
  }

  render() {
    if (!this.container) return;

    let goals = store.state.goals || [];
    if (this.filterTimeframe !== 'all') {
      goals = goals.filter(g => g.timeframe === this.filterTimeframe);
    }

    if (goals.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-12 text-center glass-panel rounded-2xl border border-white/5">
          <div class="text-3xl mb-2">🎯</div>
          <h4 class="text-base font-semibold text-slate-200">No active goals in this view</h4>
          <p class="text-xs text-slate-400 max-w-xs mx-auto mb-4">Set meaningful milestones for this month, quarter, or year.</p>
          <button onclick="window.app.openAddGoalModal()" class="px-4 py-2 rounded-xl glow-btn text-white text-xs font-medium">
            + Add New Goal
          </button>
        </div>
      `;
      return;
    }

    const timeframeBadges = {
      monthly: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      quarterly: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      yearly: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    };

    this.container.innerHTML = goals.map(g => {
      const percent = Math.min(100, Math.round((g.current / g.target) * 100));
      const isComplete = g.completed || percent >= 100;

      return `
        <div class="glass-card-interactive p-4 sm:p-5 rounded-2xl flex flex-col justify-between ${
          isComplete ? 'border-emerald-500/30 bg-emerald-950/10' : ''
        }">
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <span class="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
                timeframeBadges[g.timeframe] || timeframeBadges.monthly
              }">
                ${g.timeframe}
              </span>
              <div class="flex items-center gap-1">
                <button class="p-1 text-slate-500 hover:text-rose-400 transition-colors" data-goal-action="delete" data-id="${g.id}" title="Delete goal">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h4 class="font-semibold text-slate-100 text-sm leading-snug mb-1 ${isComplete ? 'line-through text-slate-400' : ''}">
              ${g.title}
            </h4>
            <div class="text-[11px] text-slate-400 font-medium">${g.category}</div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-700/40">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-slate-400 font-mono text-[11px]">${g.current} / ${g.target} ${g.unit}</span>
              <span class="font-bold font-mono text-xs ${isComplete ? 'text-emerald-400' : 'text-indigo-400'}">${percent}%</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div class="h-full rounded-full transition-all duration-500 ${
                isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }" style="width: ${percent}%;"></div>
            </div>

            <!-- Increment / Action Buttons -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <button class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs" data-goal-action="decrement" data-id="${g.id}">
                  -1
                </button>
                <button class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs" data-goal-action="increment" data-id="${g.id}">
                  +1
                </button>
              </div>

              ${isComplete ? `
                <span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span>✓</span> Completed
                </span>
              ` : `
                <button class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-medium border border-indigo-500/30"
                        data-goal-action="complete" data-id="${g.id}">
                  Mark Done
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.attachCardEventListeners();
  }

  attachCardEventListeners() {
    this.container.querySelectorAll('[data-goal-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.goalAction;
        const id = btn.dataset.id;
        const goal = store.state.goals.find(g => g.id === id);
        if (!goal) return;

        if (action === 'increment') {
          store.updateGoal(id, { current: goal.current + 1 });
        } else if (action === 'decrement') {
          store.updateGoal(id, { current: Math.max(0, goal.current - 1) });
        } else if (action === 'complete') {
          store.updateGoal(id, { current: goal.target, completed: true });
        } else if (action === 'delete') {
          if (confirm(`Delete goal "${goal.title}"?`)) {
            store.deleteGoal(id);
          }
        }
      });
    });
  }

  handleFormSubmit() {
    const title = document.getElementById('goal-title-input').value;
    const timeframe = document.getElementById('goal-timeframe-select').value;
    const category = document.getElementById('goal-category-select').value;
    const target = Number(document.getElementById('goal-target-input').value) || 10;
    const unit = document.getElementById('goal-unit-input').value || 'units';

    if (!title.trim()) return;

    store.addGoal({ title, timeframe, category, target, unit, current: 0 });
    window.app.showToast('Goal created!', 'success');
    this.closeModal();
  }

  closeModal() {
    const modal = document.getElementById('goal-modal');
    if (modal) modal.classList.add('hidden');
  }
}
