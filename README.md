# HabitFlow Pro ⚡
> Premium, Modern, Responsive Habit Tracker & Discipline Operating System

Inspired by **Apple**, **Linear**, and **Notion** design aesthetics, HabitFlow Pro is an ultra-fast, zero-dependency, glassmorphic Single Page Web Application designed for tracking daily habits, long-term consistency, and deep work focus.

---

## ✨ Features

- **⚡ Apple + Linear + Notion Inspired UI**: Clean frosted glassmorphism, dynamic dark/light themes, customizable primary accents (Indigo, Violet, Emerald, Rose, Amber, Cyan), and responsive layout for mobile and desktop.
- **📊 GitHub-Style Monthly Habit Matrix**: Interactive calendar grid for days 1 to 31 with triple-state completion (Unchecked, Partial 50%, Completed 100%), per-habit adherence percentage, and daily aggregate scores.
- **🟩 52-Week Activity Heatmap**: GitHub-style yearly contribution map reflecting daily discipline intensity with interactive hover tooltip stats.
- **📈 Comprehensive Analytics (Chart.js)**:
  - Daily productivity score line graph with smooth gradients
  - Day-of-the-week performance bar chart
  - Category balance radar chart (Health, Fitness, Study, Work, Growth)
  - 30-day habit success rates
  - Habit correlation & synergy matrix
- **🏆 Gamification & Progression**:
  - Real-time XP engine & Level progression (Levels 1 to 50+)
  - Tiered Productivity Ranks: *Beginner*, *Consistent*, *Focused*, *Master*, *Legend*
  - 16+ Unlockable Achievement Badges with confetti celebrations
- **🧠 AI-Like Smart Insights**:
  - Peak performance day detection (e.g., "Tuesdays are your highest performing day at 91%")
  - Weakest habit alerts and habit stacking recommendations
  - Automated **Weekly Review** and **Monthly Performance Audit** reports
- **⏱️ Deep Work Pomodoro Focus Timer**:
  - 25/5 and 15m intervals with circular animated SVG timer ring
  - Option to credit sprint duration directly to any active habit
  - Synthesized meditation bell sound upon completion
- **✍️ Daily Reflection & Mood Journal**:
  - 5-state emoji mood logger (🤩 Amazing, 😊 Good, 😐 Neutral, 😔 Down, 😫 Stressed)
  - Keyword theme tags and auto-saving reflections with historical timeline
- **🎯 Milestone Goals**:
  - Monthly, Quarterly, and Yearly milestone tracking with progress bars
- **💾 Data Export & Privacy First**:
  - 100% offline & client-side LocalStorage persistence
  - Export to multi-sheet **Excel (.xlsx)** via SheetJS (Habits, Logs, Goals, Journal)
  - Export to **JSON Backup** and instant restore with file validation
  - Printable / PDF export styling
- **🔊 Synthesized Web Audio UI**:
  - Tactile pop, success chime, victory fanfare, and bell audio generated on-the-fly using the Web Audio API without external audio files
- **⌨️ Keyboard Shortcuts**:
  - `N`: Add New Habit
  - `P`: Start Pomodoro Focus Timer
  - `D`: Toggle Dark / Light Mode
  - `J`: Open Journal
  - `?`: Show Shortcuts Cheatsheet
  - `Esc`: Close any open modal

---

## 🚀 How to Run

### Method 1: Local HTTP Server (Recommended)
You can serve the application instantly using Python:
```bash
cd "C:\Users\Kartik Tiwari\.gemini\antigravity\scratch\habit-tracker"
python -m http.server 8080
```
Then open your browser and navigate to:
[http://localhost:8080/login.html](http://localhost:8080/login.html)

The app uses JavaScript modules and Firebase Authentication, so it must be served over HTTP. Opening `index.html` or `login.html` directly with `file://` will not work reliably.

### Firebase Authentication setup
In the Firebase console for the configured project:

1. Enable **Email/Password** and **Google** under Authentication → Sign-in method.
2. Under Authentication → Settings → Authorized domains, add `habit-tracker-liard-kappa.vercel.app` for the deployed Vercel site. Add `localhost` separately for local testing.
3. If the Vercel project uses a different production/custom domain, add that hostname too (without `https://` or a path).

The login, dashboard, and logout redirects are relative to the current site origin, so they work on Vercel and other hosts without redirecting users to localhost. Redeploy this project after code changes. Firebase's authorized-domain allowlist is configured in the Firebase Console and cannot be changed by this static app's code.

### Deploying the current files to Vercel
This project is a static site and has no build step. Deploy this folder as the Vercel project root, keeping `index.html`, `login.html`, `css/`, `js/`, and `vercel.json` together. The Vercel rewrite sends `/` to the login page. The login page loads `css/login.css` and `js/auth.js`; do not deploy an older flat `auth.js` that expects the old `signupBtn`/`loginBtn` markup. After deployment, verify `/js/auth.js` and `/js/firebase.js` return HTTP 200 and `/` opens the sign-in page. If login fails with `auth/unauthorized-domain`, add the hostname shown by the error to the Firebase Authorized domains list.

The login form also has a JavaScript-load fallback that prevents the browser's default GET submission, so passwords are not added to the URL if the auth module fails. If credentials have appeared in a URL, change/reset that password and avoid sharing the URL.

---

## 📁 File Structure

```
habit-tracker/
├── index.html            # Main HTML5 application shell & view templates
├── login.html            # Firebase sign-in, account creation & password reset
├── css/
│   ├── style.css         # Glassmorphism tokens, dark/light themes, heatmap styling
│   └── login.css         # Responsive sign-in page layout
├── js/
│   ├── auth.js           # Firebase email/password and Google authentication
│   ├── firebase.js       # Firebase app and Authentication initialization
│   ├── app.js            # Master application coordinator & event router
│   ├── store.js          # Central reactive state, LocalStorage persistence & defaults
│   ├── audio.js          # Web Audio API sound synthesizer
│   ├── habits.js         # Habit CRUD, filters, search & drag-and-drop
│   ├── calendar.js       # Monthly checkbox matrix & GitHub yearly heatmap
│   ├── analytics.js      # Chart.js visualization engine & correlation matrix
│   ├── gamification.js   # XP, levels, ranks, badges & confetti
│   ├── insights.js       # Smart productivity suggestions & review generator
│   ├── timer.js          # Pomodoro timer engine & focus logger
│   ├── journal.js        # Daily mood logger & reflection notes
│   ├── goals.js          # Milestone goals tracker
│   └── export.js         # Excel, JSON backup & PDF export utilities
└── README.md
```
