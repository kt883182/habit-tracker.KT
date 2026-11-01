// HabitFlow Pro - Data Backup, Excel & PDF Export Engine
import { store } from './store.js';

export class ExportManager {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    // Export JSON Backup
    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => this.exportJSON());
    }

    // Import JSON Backup
    const importJsonInput = document.getElementById('input-import-json');
    if (importJsonInput) {
      importJsonInput.addEventListener('change', (e) => this.importJSON(e));
    }

    // Export Excel
    const exportExcelBtn = document.getElementById('btn-export-excel');
    if (exportExcelBtn) {
      exportExcelBtn.addEventListener('click', () => this.exportExcel());
    }

    // Export PDF / Print
    const exportPdfBtn = document.getElementById('btn-export-pdf');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => this.exportPDF());
    }

    // Reset Data
    const resetDataBtn = document.getElementById('btn-reset-data');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => this.resetData());
    }
  }

  // 1. Export JSON Backup
  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store.state, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = store.getTodayKey();
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `habitflow-backup-${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (window.app && window.app.showToast) {
      window.app.showToast('Backup JSON downloaded!', 'success');
    }
  }

  // 2. Import JSON Backup
  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.habits && parsed.logs) {
          store.state = parsed;
          store.saveState();
          store.notify('RESET', null);
          if (window.app && window.app.showToast) {
            window.app.showToast('Data restored successfully!', 'success');
          }
        } else {
          alert('Invalid backup file: Missing required habits or logs schema.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // 3. Export Excel (.xlsx) using SheetJS
  exportExcel() {
    if (!window.XLSX) {
      alert('SheetJS library is loading. Please try again in a moment.');
      return;
    }

    const wb = window.XLSX.utils.book_new();

    // Sheet 1: Habits List
    const habitsData = store.state.habits.map(h => ({
      ID: h.id,
      Name: h.name,
      Category: h.category,
      Priority: h.priority,
      Reminder: h.reminder,
      StreakCurrent: store.calculateHabitStreak(h.id).current,
      StreakLongest: store.calculateHabitStreak(h.id).longest,
      CreatedDate: h.createdAt
    }));
    const habitsSheet = window.XLSX.utils.json_to_sheet(habitsData);
    window.XLSX.utils.book_append_sheet(wb, habitsSheet, 'Habits');

    // Sheet 2: Daily Logs
    const logsData = [];
    Object.keys(store.state.logs).sort().reverse().forEach(dateKey => {
      const stats = store.getDayStats(dateKey);
      const row = {
        Date: dateKey,
        ProductivityPercent: `${stats.percent}%`,
        CompletedHabits: stats.completed,
        TotalHabits: stats.total
      };
      store.state.habits.forEach(h => {
        const st = store.getHabitStatus(h.id, dateKey);
        row[h.name] = (st === 2 ? 'Done' : st === 1 ? 'Partial' : 'Missed');
      });
      logsData.push(row);
    });
    const logsSheet = window.XLSX.utils.json_to_sheet(logsData);
    window.XLSX.utils.book_append_sheet(wb, logsSheet, 'Daily Logs');

    // Sheet 3: Goals
    const goalsData = (store.state.goals || []).map(g => ({
      Title: g.title,
      Timeframe: g.timeframe,
      Category: g.category,
      Current: g.current,
      Target: g.target,
      Unit: g.unit,
      Progress: `${Math.round((g.current / g.target) * 100)}%`,
      Completed: g.completed ? 'Yes' : 'No'
    }));
    const goalsSheet = window.XLSX.utils.json_to_sheet(goalsData);
    window.XLSX.utils.book_append_sheet(wb, goalsSheet, 'Goals');

    // Sheet 4: Journal
    const journalData = Object.keys(store.state.journal || {}).sort().reverse().map(dateKey => {
      const j = store.state.journal[dateKey];
      return {
        Date: dateKey,
        Mood: j.mood,
        Tags: (j.tags || []).join(', '),
        Notes: j.notes
      };
    });
    const journalSheet = window.XLSX.utils.json_to_sheet(journalData);
    window.XLSX.utils.book_append_sheet(wb, journalSheet, 'Journal');

    const today = store.getTodayKey();
    window.XLSX.writeFile(wb, `habitflow-export-${today}.xlsx`);

    if (window.app && window.app.showToast) {
      window.app.showToast('Excel workbook exported!', 'success');
    }
  }

  // 4. Export PDF via Browser Print
  exportPDF() {
    window.print();
  }

  // 5. Reset to Sample / Default Data
  resetData() {
    if (confirm('Are you sure you want to reset all data to the default starter routine? This cannot be undone unless you have a JSON backup.')) {
      store.resetToDefault();
      if (window.app && window.app.showToast) {
        window.app.showToast('Reset to default habits & logs', 'info');
      }
    }
  }
}
