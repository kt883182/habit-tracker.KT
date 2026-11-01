// HabitFlow Pro - Gamification, XP, Levels, Badges, and Confetti Milestones
import { store } from './store.js';

export class GamificationManager {
  constructor() {
    this.badgeContainer = document.getElementById('achievements-grid');
    this.initEventListeners();
  }

  initEventListeners() {
    store.subscribe((event, payload) => {
      if (['LEVEL_UP', 'ACHIEVEMENT_UNLOCKED', 'STATUS_TOGGLED', 'RESET'].includes(event)) {
        this.render();
      }

      if (event === 'LEVEL_UP') {
        this.triggerMilestoneCelebration(`🎉 Level Up! You reached Level ${payload.level} (${payload.rank})`);
      } else if (event === 'ACHIEVEMENT_UNLOCKED') {
        this.triggerMilestoneCelebration(`🏆 Badge Unlocked: ${payload.title}!`);
      }
    });
  }

  render() {
    this.updateUserStats();
    this.renderBadges();
  }

  updateUserStats() {
    const user = store.state.user;
    const nextLvlInfo = store.getXPForNextLevel();

    // Elements in header and dashboard
    const userXpText = document.getElementById('user-xp-display');
    const userLevelBadge = document.getElementById('user-level-badge');
    const userRankBadge = document.getElementById('user-rank-badge');
    const xpProgressBar = document.getElementById('user-xp-progress');
    const xpProgressText = document.getElementById('user-xp-ratio');

    if (userXpText) userXpText.textContent = `${user.xp.toLocaleString()} XP`;
    if (userLevelBadge) userLevelBadge.textContent = `Lvl ${user.level}`;
    if (userRankBadge) {
      userRankBadge.textContent = user.rank;
      const rankStyles = {
        Beginner: 'text-slate-400 bg-slate-800 border-slate-700',
        Consistent: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        Focused: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        Master: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10 shadow',
        Legend: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/20 shadow'
      };
      userRankBadge.className = `px-2.5 py-0.5 text-xs font-semibold rounded-full border ${rankStyles[user.rank] || rankStyles.Master}`;
    }

    if (xpProgressBar) {
      xpProgressBar.style.width = `${nextLvlInfo.percent}%`;
    }
    if (xpProgressText) {
      xpProgressText.textContent = `${user.xp} / ${nextLvlInfo.target} XP (${nextLvlInfo.percent}%)`;
    }
  }

  renderBadges() {
    if (!this.badgeContainer) return;
    const achievements = store.state.achievements;

    this.badgeContainer.innerHTML = achievements.map(ach => {
      const isUnlocked = ach.unlocked;

      return `
        <div class="relative p-3.5 rounded-2xl border transition-all ${
          isUnlocked
            ? 'glass-card-interactive border-indigo-500/30 bg-indigo-950/20'
            : 'border-slate-800/80 bg-slate-900/30 opacity-40 grayscale'
        } flex items-center gap-3 group">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            isUnlocked ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-md' : 'bg-slate-800/50'
          }">
            ${ach.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <h5 class="text-xs font-semibold text-slate-100 truncate">${ach.title}</h5>
              ${isUnlocked ? '<span class="text-[10px] text-emerald-400 font-mono">✓</span>' : '<span class="text-[10px] text-slate-500">🔒</span>'}
            </div>
            <p class="text-[11px] text-slate-400 truncate mt-0.5">${ach.desc}</p>
            ${isUnlocked && ach.unlockedAt ? `<div class="text-[10px] font-mono text-indigo-400/80 mt-1">Unlocked: ${ach.unlockedAt}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  triggerMilestoneCelebration(message = 'Milestone Reached!') {
    if (window.confetti) {
      // Fire double confetti cannons
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        window.confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }

    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'success');
    }
  }
}
