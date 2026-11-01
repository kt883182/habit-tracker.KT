// HabitFlow Pro - Monthly Grid Matrix & GitHub-Style Heatmap
import { store } from './store.js';

export class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.viewYear = this.currentDate.getFullYear();
    this.viewMonth = this.currentDate.getMonth(); // 0-indexed

    this.matrixContainer = document.getElementById('monthly-matrix-container');
    this.heatmapContainer = document.getElementById('yearly-heatmap-container');
    this.monthTitle = document.getElementById('matrix-month-title');
    this.tooltip = document.getElementById('heatmap-tooltip');

    this.initEventListeners();
  }

  initEventListeners() {
    const prevBtn = document.getElementById('matrix-prev-month');
    const nextBtn = document.getElementById('matrix-next-month');
    const todayBtn = document.getElementById('matrix-today-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.viewMonth--;
        if (this.viewMonth < 0) {
          this.viewMonth = 11;
          this.viewYear--;
        }
        this.renderMatrix();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.viewMonth++;
        if (this.viewMonth > 11) {
          this.viewMonth = 0;
          this.viewYear++;
        }
        this.renderMatrix();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        const now = new Date();
        this.viewYear = now.getFullYear();
        this.viewMonth = now.getMonth();
        this.renderMatrix();
      });
    }

    store.subscribe((event) => {
      if (['STATUS_TOGGLED', 'HABIT_ADDED', 'HABIT_UPDATED', 'HABIT_DELETED', 'RESET'].includes(event)) {
        this.renderMatrix();
        this.renderHeatmap();
      }
    });
  }

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  render() {
    this.renderMatrix();
    this.renderHeatmap();
  }

  // --- Monthly Habit Grid Matrix ---
  renderMatrix() {
    if (!this.matrixContainer) return;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    if (this.monthTitle) {
      this.monthTitle.textContent = `${monthNames[this.viewMonth]} ${this.viewYear}`;
    }

    const daysCount = this.getDaysInMonth(this.viewYear, this.viewMonth);
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === this.viewYear && today.getMonth() === this.viewMonth);
    const todayDate = today.getDate();

    const habits = store.state.habits;
    if (habits.length === 0) {
      this.matrixContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          No habits available to display in monthly matrix. Add your first habit!
        </div>
      `;
      return;
    }

    // Build Table
    let html = `
      <table class="matrix-table w-full text-left">
        <thead>
          <tr class="border-b border-slate-700/60 text-xs text-slate-400 font-mono">
            <th class="p-3 sticky-col min-w-[200px] sm:min-w-[240px] text-slate-300 font-medium">Habit</th>
    `;

    // Days Columns Headers
    for (let d = 1; d <= daysCount; d++) {
      const dayDate = new Date(this.viewYear, this.viewMonth, d);
      const dayLetter = weekdayLetters[dayDate.getDay()];
      const isToday = isCurrentMonth && d === todayDate;
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

      html += `
        <th class="p-1 text-center font-normal ${isToday ? 'bg-indigo-500/20 text-indigo-400 font-bold rounded-t-lg' : isWeekend ? 'text-slate-500' : ''}">
          <div class="text-[10px] leading-tight text-slate-400">${dayLetter}</div>
          <div class="text-xs ${isToday ? 'text-indigo-400 font-bold' : ''}">${d}</div>
        </th>
      `;
    }

    html += `
            <th class="p-3 text-center min-w-[70px] text-slate-300 font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Habit Rows
    habits.forEach(h => {
      let completedInMonth = 0;
      let partialInMonth = 0;

      let rowCells = '';
      for (let d = 1; d <= daysCount; d++) {
        const monthPad = String(this.viewMonth + 1).padStart(2, '0');
        const dayPad = String(d).padStart(2, '0');
        const dateKey = `${this.viewYear}-${monthPad}-${dayPad}`;
        const status = store.getHabitStatus(h.id, dateKey);
        const isToday = isCurrentMonth && d === todayDate;

        if (status === 2) completedInMonth++;
        else if (status === 1) partialInMonth++;

        let cellClass = 'matrix-cell-none';
        let cellContent = '';

        if (status === 2) {
          cellClass = 'matrix-cell-completed';
          cellContent = `
            <svg class="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          `;
        } else if (status === 1) {
          cellClass = 'matrix-cell-partial';
          cellContent = `<span class="font-bold text-[10px] font-mono">½</span>`;
        }

        rowCells += `
          <td class="p-1 text-center ${isToday ? 'bg-indigo-500/5' : ''}">
            <div class="matrix-cell ${cellClass} mx-auto"
                 data-matrix-toggle="true"
                 data-habit-id="${h.id}"
                 data-date="${dateKey}"
                 title="${h.name} (${dateKey}) - Click to toggle">
              ${cellContent}
            </div>
          </td>
        `;
      }

      const totalWeighted = completedInMonth + (partialInMonth * 0.5);
      const monthRate = Math.round((totalWeighted / daysCount) * 100);

      html += `
        <tr class="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
          <td class="p-2 sm:p-3 sticky-col">
            <div class="flex items-center gap-2">
              <span class="text-base">${h.icon}</span>
              <span class="font-medium text-xs sm:text-sm text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">${h.name}</span>
            </div>
          </td>
          ${rowCells}
          <td class="p-2 text-center font-mono text-xs font-semibold ${monthRate >= 80 ? 'text-emerald-400' : monthRate >= 50 ? 'text-amber-400' : 'text-slate-400'}">
            ${monthRate}%
          </td>
        </tr>
      `;
    });

    // Daily Score Summary Row (Column Footers)
    html += `
        <tr class="bg-slate-900/60 font-mono text-[11px] font-medium border-t border-slate-700">
          <td class="p-3 sticky-col text-slate-400">Daily Score</td>
    `;

    for (let d = 1; d <= daysCount; d++) {
      const monthPad = String(this.viewMonth + 1).padStart(2, '0');
      const dayPad = String(d).padStart(2, '0');
      const dateKey = `${this.viewYear}-${monthPad}-${dayPad}`;
      const dayStats = store.getDayStats(dateKey);
      const isToday = isCurrentMonth && d === todayDate;

      html += `
        <td class="p-1 text-center ${isToday ? 'bg-indigo-500/10 text-indigo-300 font-bold' : 'text-slate-400'}">
          ${dayStats.percent > 0 ? `${dayStats.percent}%` : '-'}
        </td>
      `;
    }

    html += `
          <td class="p-3 text-center text-indigo-400 font-bold">AVG</td>
        </tr>
      </tbody>
    </table>
    `;

    this.matrixContainer.innerHTML = html;

    // Attach click listeners for matrix cells
    this.matrixContainer.querySelectorAll('[data-matrix-toggle="true"]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = cell.dataset.habitId;
        const dateKey = cell.dataset.date;
        store.toggleHabitStatus(habitId, dateKey);
      });
    });
  }

  // --- GitHub-Style Yearly Heatmap ---
  renderHeatmap() {
    if (!this.heatmapContainer) return;

    // Generate last 52 weeks (364 days) up to today
    const days = [];
    const today = new Date();

    // Start 52 weeks ago on the closest Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    const cursor = new Date(start);
    while (cursor <= today) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const cellsHtml = days.map(d => {
      const dateKey = store.formatDateKey(d);
      const stats = store.getDayStats(dateKey);

      let level = 0;
      if (stats.percent > 75) level = 4;
      else if (stats.percent > 50) level = 3;
      else if (stats.percent > 25) level = 2;
      else if (stats.percent > 0) level = 1;

      return `
        <div class="heatmap-cell heat-level-${level}"
             data-date="${dateKey}"
             data-percent="${stats.percent}"
             data-completed="${stats.completed}"
             data-total="${stats.total}">
        </div>
      `;
    }).join('');

    this.heatmapContainer.innerHTML = cellsHtml;

    // Heatmap Tooltip handlers
    if (this.tooltip) {
      this.heatmapContainer.querySelectorAll('.heatmap-cell').forEach(cell => {
        cell.addEventListener('mouseenter', (e) => {
          const rect = cell.getBoundingClientRect();
          const date = cell.dataset.date;
          const percent = cell.dataset.percent;
          const completed = cell.dataset.completed;
          const total = cell.dataset.total;

          const dateObj = new Date(date + 'T00:00:00');
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          this.tooltip.innerHTML = `
            <div class="font-semibold text-slate-100">${formattedDate}</div>
            <div class="text-emerald-400 font-mono text-[11px] mt-0.5">
              ${completed} of ${total} habits (${percent}%)
            </div>
          `;
          this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
          this.tooltip.style.top = `${rect.top - 8}px`;
          this.tooltip.style.display = 'block';
        });

        cell.addEventListener('mouseleave', () => {
          this.tooltip.style.display = 'none';
        });
      });
    }
  }
}
