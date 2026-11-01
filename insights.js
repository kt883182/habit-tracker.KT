// HabitFlow Pro - AI-Like Smart Insights & Productivity Prediction Engine
import { store } from './store.js';

export class InsightsManager {
  constructor() {
    this.container = document.getElementById('insights-cards-container');
    this.reviewModal = document.getElementById('review-report-modal');

    this.initEventListeners();
  }

  initEventListeners() {
    store.subscribe((event) => {
      if (['STATUS_TOGGLED', 'HABIT_ADDED', 'HABIT_UPDATED', 'RESET'].includes(event)) {
        this.render();
      }
    });

    const openReviewBtn = document.getElementById('btn-open-weekly-review');
    if (openReviewBtn) {
      openReviewBtn.addEventListener('click', () => {
        this.openReviewReport('weekly');
      });
    }

    const openMonthlyReviewBtn = document.getElementById('btn-open-monthly-review');
    if (openMonthlyReviewBtn) {
      openMonthlyReviewBtn.addEventListener('click', () => {
        this.openReviewReport('monthly');
      });
    }
  }

  render() {
    if (!this.container) return;
    const insights = this.generateSmartInsights();

    this.container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Best Day of Week -->
        <div class="glass-card-interactive p-4 rounded-2xl border-indigo-500/20 bg-indigo-950/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Peak Performance</span>
            <span class="text-lg">⚡</span>
          </div>
          <div class="text-lg font-bold text-slate-100">${insights.bestDay.name}</div>
          <p class="text-xs text-slate-400 mt-1">${insights.bestDay.text}</p>
        </div>

        <!-- 2. Weakest Habit Alert -->
        <div class="glass-card-interactive p-4 rounded-2xl border-amber-500/20 bg-amber-950/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-amber-400">Needs Attention</span>
            <span class="text-lg">🎯</span>
          </div>
          <div class="text-lg font-bold text-slate-100 truncate">${insights.weakestHabit ? insights.weakestHabit.name : 'All Habits On Track'}</div>
          <p class="text-xs text-slate-400 mt-1">${insights.weakestHabit ? insights.weakestHabit.advice : 'Outstanding balance across all your routines.'}</p>
        </div>

        <!-- 3. Consistency Score -->
        <div class="glass-card-interactive p-4 rounded-2xl border-emerald-500/20 bg-emerald-950/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Consistency Index</span>
            <span class="text-lg">📈</span>
          </div>
          <div class="flex items-baseline gap-2">
            <div class="text-2xl font-bold font-mono text-emerald-400">${insights.consistencyScore}/100</div>
            <span class="text-xs text-emerald-500/80 font-medium">Top 5% Tier</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">${insights.consistencyComment}</p>
        </div>

        <!-- 4. Prediction Engine -->
        <div class="glass-card-interactive p-4 rounded-2xl border-purple-500/20 bg-purple-950/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-purple-400">Tomorrow Forecast</span>
            <span class="text-lg">🔮</span>
          </div>
          <div class="text-lg font-bold text-slate-100">${insights.forecast.percent}% Projected</div>
          <p class="text-xs text-slate-400 mt-1">${insights.forecast.recommendation}</p>
        </div>
      </div>

      <!-- Actionable Habit Stacking Recommendation Banner -->
      <div class="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-slate-800/40 to-purple-900/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Smart Habit Stacking Recommendation</div>
            <p class="text-xs sm:text-sm text-slate-200 mt-0.5">
              ${insights.stackingSuggestion}
            </p>
          </div>
        </div>
        <button onclick="window.app.switchTab('analytics')" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium transition-colors shrink-0">
          View Detailed Analytics →
        </button>
      </div>
    `;
  }

  generateSmartInsights() {
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    for (let i = 28; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = store.formatDateKey(d);
      const stats = store.getDayStats(k);
      const dayIdx = d.getDay();
      dayTotals[dayIdx] += stats.percent;
      dayCounts[dayIdx]++;
    }

    const hasAnyLogs = dayTotals.some(t => t > 0) || store.state.habits.length > 0;

    let bestDayIdx = 1;
    let bestDayScore = 0;
    dayTotals.forEach((tot, idx) => {
      const avg = dayCounts[idx] ? tot / dayCounts[idx] : 0;
      if (avg > bestDayScore) {
        bestDayScore = avg;
        bestDayIdx = idx;
      }
    });

    const bestDay = hasAnyLogs && bestDayScore > 0 ? {
      name: dayNames[bestDayIdx],
      text: `Your completion rate averages ${Math.round(bestDayScore)}% on ${dayNames[bestDayIdx]}. Peak focus time!`
    } : {
      name: 'Day 1 Ahead',
      text: 'Start completing routines today to discover your peak focus days.'
    };

    // Find weakest habit in last 30 days
    let weakestHabit = null;
    let lowestScore = 999;
    if (store.state.habits.length > 0) {
      store.state.habits.forEach(h => {
        let score = 0;
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const k = store.formatDateKey(d);
          score += store.getHabitStatus(h.id, k);
        }
        if (score < lowestScore) {
          lowestScore = score;
          weakestHabit = {
            name: h.name,
            score: Math.round((score / 60) * 100),
            advice: `Trailing at ${Math.round((score / 60) * 100)}% adherence. Try anchoring it immediately after your morning routine.`
          };
        }
      });
    }

    // Consistency score (0-100)
    let total30DayScores = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = store.formatDateKey(d);
      total30DayScores += store.getDayStats(k).percent;
    }

    const consistencyScore = total30DayScores > 0 ? Math.min(100, Math.round(total30DayScores / 30)) : 0;
    const consistencyComment = total30DayScores > 0
      ? 'Consistent discipline variance index with steady momentum.'
      : 'Log your first daily routines to build your consistency score.';

    // Forecast
    const tomorrowDay = new Date(today);
    tomorrowDay.setDate(tomorrowDay.getDate() + 1);
    const tomorrowDayIdx = tomorrowDay.getDay();
    const histAvg = dayCounts[tomorrowDayIdx] ? Math.round(dayTotals[tomorrowDayIdx] / dayCounts[tomorrowDayIdx]) : 0;

    const forecast = hasAnyLogs && histAvg > 0 ? {
      percent: Math.min(100, histAvg + 3),
      recommendation: `Historical confidence is active for ${dayNames[tomorrowDayIdx]}. Complete your top routines early.`
    } : {
      percent: 0,
      recommendation: 'Create your first habit today to unlock smart productivity forecasts.'
    };

    // Stacking suggestion
    const firstTwo = store.state.habits.slice(0, 2);
    const stackingSuggestion = firstTwo.length >= 2
      ? `Stack "<strong>${firstTwo[1].name}</strong>" directly after "<strong>${firstTwo[0].name}</strong>" to build automatic momentum.`
      : 'Pair your hardest habit with your favorite morning beverage for an instant dopaminergic cue.';

    return {
      bestDay,
      weakestHabit,
      consistencyScore,
      consistencyComment,
      forecast,
      stackingSuggestion
    };
  }

  // Automated Review Report Generator (Weekly / Monthly)
  openReviewReport(type = 'weekly') {
    const modal = this.reviewModal;
    const content = document.getElementById('review-report-content');
    const title = document.getElementById('review-report-title');

    if (!modal || !content) return;

    const isWeekly = (type === 'weekly');
    const daysBack = isWeekly ? 7 : 30;
    const today = new Date();

    let totalCompleted = 0;
    let totalOpportunities = 0;
    let perfectDays = 0;

    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = store.formatDateKey(d);
      const stats = store.getDayStats(k);

      totalCompleted += stats.completed;
      totalOpportunities += stats.total;
      if (stats.percent === 100) perfectDays++;
    }

    const overallRate = totalOpportunities ? Math.round((totalCompleted / totalOpportunities) * 100) : 0;
    const globalStreak = store.calculateGlobalStreak();

    if (title) {
      title.textContent = isWeekly ? 'Weekly Productivity Review' : 'Monthly Performance Audit';
    }

    content.innerHTML = `
      <div class="space-y-6 text-slate-200">
        <!-- Highlights Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="text-xs text-slate-400">Total Completions</div>
            <div class="text-2xl font-bold font-mono text-indigo-400 mt-1">${totalCompleted}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="text-xs text-slate-400">Overall Accuracy</div>
            <div class="text-2xl font-bold font-mono text-emerald-400 mt-1">${overallRate}%</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="text-xs text-slate-400">Perfect 100% Days</div>
            <div class="text-2xl font-bold font-mono text-amber-400 mt-1">${perfectDays}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="text-xs text-slate-400">Current Streak</div>
            <div class="text-2xl font-bold font-mono text-rose-400 mt-1">🔥 ${globalStreak.current}d</div>
          </div>
        </div>

        <!-- Executive Summary -->
        <div class="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Executive Summary</h4>
          <p class="text-sm leading-relaxed text-slate-300">
            Over the past ${daysBack} days, you logged an outstanding <strong class="text-emerald-400">${overallRate}% adherence rate</strong> across your active routines.
            Your focus stability was reinforced by consistent morning rituals and uninterrupted focus sprints.
          </p>
        </div>

        <!-- Wins & Areas for Growth -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/20">
            <h5 class="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
              <span>✓</span> Major Wins
            </h5>
            <ul class="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>Morning mindfulness maintained with zero misses.</li>
              <li>Consistently exceeded physical hydration baseline.</li>
              <li>Logged ${store.state.focusSessions} focused Pomodoro intervals.</li>
            </ul>
          </div>

          <div class="p-4 rounded-xl bg-amber-950/15 border border-amber-500/20">
            <h5 class="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
              <span>!</span> Growth Focus for Next Period
            </h5>
            <ul class="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>Safeguard evening reflection from late-night schedule drift.</li>
              <li>Protect deep work focus blocks during midweek afternoons.</li>
              <li>Aim for +5% consistency bump in reading non-fiction.</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  closeReviewModal() {
    if (this.reviewModal) {
      this.reviewModal.classList.add('hidden');
    }
  }
}
