// HabitFlow Pro - Gamification, XP, Levels, Badges, and Confetti Milestones
import { store } from './store.js';

export class GamificationManager {
  constructor() {
    this.badgeContainer = document.getElementById('achievements-grid');
    this.initEventListeners();
  }

  initEventListeners() {
    store.subscribe((event, payload) => {
      // Re-render stats panel on any relevant event
      if (['LEVEL_UP', 'LEVEL_DOWN', 'RANK_CHANGE', 'ACHIEVEMENT_UNLOCKED',
           'STATUS_TOGGLED', 'FOCUS_LOGGED', 'JOURNAL_SAVED', 'RESET'].includes(event)) {
        this.render();
      }

      if (event === 'LEVEL_UP') {
        this.triggerMilestoneCelebration(
          `🎉 Level Up! You reached Level ${payload.level} — ${payload.rank}!`
        );
      } else if (event === 'LEVEL_DOWN') {
        if (window.app && window.app.showToast) {
          window.app.showToast(
            `📉 Level dropped to ${payload.level} — keep going, you've got this!`, 'warning'
          );
        }
      } else if (event === 'RANK_CHANGE') {
        if (window.app && window.app.showToast) {
          window.app.showToast(`🏅 Rank changed to ${payload.rank}`, 'info');
        }
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
    const user       = store.state.user;
    const xpInfo     = store.getXPForNextLevel();

    // Sidebar XP elements
    const userXpText      = document.getElementById('user-xp-display');
    const userLevelBadge  = document.getElementById('user-level-badge');
    const userRankBadge   = document.getElementById('user-rank-badge');
    const xpProgressBar   = document.getElementById('user-xp-progress');
    const xpProgressText  = document.getElementById('user-xp-ratio');

    if (userXpText)     userXpText.textContent    = `${user.xp.toLocaleString()} XP`;
    if (userLevelBadge) userLevelBadge.textContent = `Lvl ${user.level}`;

    if (userRankBadge) {
      userRankBadge.textContent = user.rank;
      const rankStyles = {
        Beginner:   'text-slate-400 bg-slate-800 border-slate-700',
        Consistent: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        Focused:    'text-purple-400 bg-purple-500/10 border-purple-500/30',
        Master:     'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10 shadow',
        Legend:     'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/20 shadow'
      };
      userRankBadge.className = `px-2.5 py-0.5 text-xs font-semibold rounded-full border ${rankStyles[user.rank] || rankStyles.Master}`;
    }

    if (xpProgressBar) {
      xpProgressBar.style.width = `${xpInfo.percent}%`;
    }
    if (xpProgressText) {
      // Show  "current / nextLevel XP  (X%)"
      const inLevel   = xpInfo.progress;
      const toLevel   = xpInfo.range;
      xpProgressText.textContent =
        `${inLevel.toLocaleString()} / ${toLevel.toLocaleString()} XP (${xpInfo.percent}%)`;
    }

    // Also update gamification view if visible
    this.updateGamificationView(user, xpInfo);
  }

  updateGamificationView(user, xpInfo) {
    // Large XP display on the Gamification tab
    const bigXpEl     = document.getElementById('gam-xp-total');
    const bigLvlEl    = document.getElementById('gam-level-display');
    const bigLvlText  = document.getElementById('gam-level-text');
    const bigRankEl   = document.getElementById('gam-rank-display');
    const bigBarEl    = document.getElementById('gam-xp-bar');
    const bigBarText  = document.getElementById('gam-xp-bar-text');
    const nextLvlXpEl = document.getElementById('gam-next-level-xp');

    if (bigXpEl)     bigXpEl.textContent    = user.xp.toLocaleString();
    if (bigLvlEl)    bigLvlEl.textContent   = user.level;
    if (bigLvlText)  bigLvlText.textContent = user.level;
    if (bigRankEl) {
      bigRankEl.textContent = user.rank;
      const rankStyles = {
        Beginner:   'text-slate-300 bg-slate-800 border-slate-700',
        Consistent: 'text-blue-300 bg-blue-900/30 border-blue-500/40',
        Focused:    'text-purple-300 bg-purple-900/30 border-purple-500/40',
        Master:     'text-amber-300 bg-amber-900/30 border-amber-500/40',
        Legend:     'text-rose-300 bg-rose-900/30 border-rose-500/40'
      };
      bigRankEl.className = `px-2.5 py-0.5 text-xs font-semibold rounded-full border ${rankStyles[user.rank] || rankStyles.Beginner}`;
    }
    if (bigBarEl)    bigBarEl.style.width   = `${xpInfo.percent}%`;
    if (bigBarText)  bigBarText.textContent = `${xpInfo.progress.toLocaleString()} / ${xpInfo.range.toLocaleString()} XP to Level ${user.level + 1}`;
    if (nextLvlXpEl) nextLvlXpEl.textContent = `${xpInfo.target.toLocaleString()} XP`;

    // Highlight active rank card dynamically
    document.querySelectorAll('[data-rank-card]').forEach(card => {
      const isCurrent = (card.dataset.rankCard === user.rank);
      const label = card.querySelector('.rank-label');
      if (isCurrent) {
        card.className = 'p-3.5 rounded-2xl bg-indigo-900/40 border-2 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105 transition-all';
        if (label) {
          label.className = 'text-xs font-bold text-indigo-300 rank-label';
          label.textContent = '★ Active Rank';
        }
      } else {
        card.className = 'p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 opacity-60 hover:opacity-90 transition-all';
        if (label) {
          const rankNum = { Beginner: 'Rank 1', Consistent: 'Rank 2', Focused: 'Rank 3', Master: 'Rank 4', Legend: 'Peak Rank' }[card.dataset.rankCard] || '';
          label.className = 'text-xs font-semibold text-slate-400 rank-label';
          label.textContent = rankNum;
        }
      }
    });
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
