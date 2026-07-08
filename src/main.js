import { audioManager } from './audio.js';
import { canvasBackground } from './canvas.js';

// Zen Quotes Presets
const zenQuotes = [
  { text: '"การมีสติอยู่กับลมหายใจ คือกุญแจสำคัญสู่ความสงบที่แท้จริง"', author: 'ท่าน ติช นัท ฮันห์' },
  { text: '"จิตที่ฝึกดีแล้ว นำความสุขมาให้"', author: 'พุทธสุภาษิต' },
  { text: '"ความสุขไม่ได้ขึ้นอยู่กับว่าคุณมีอะไร แต่ขึ้นอยู่กับว่าคุณเป็นอย่างไร"', author: 'ตงก๊วก คี' },
  { text: '"ความเงียบไม่ใช่การปราศจากเสียง แต่เป็นการปราศจากความวุ่นวายในใจ"', author: 'อจลญานนท์' },
  { text: '"ในความนิ่งเฉย ลมหายใจที่แผ่วเบาจะบอกทุกความลับของชีวิต"', author: 'ปรัชญาเซน' },
  { text: '"ปล่อยวางอดีต ละทิ้งอนาคต และอยู่กับปัจจุบันขณะอย่างงดงาม"', author: 'เซนมาสเตอร์' },
  { text: '"เมื่อเจ้ามองออกไปข้างนอก เจ้าฝัน เมื่อเจ้ามองเข้าไปข้างใน เจ้าตื่น"', author: 'คาร์ล ยุง' }
];

// App State
let activeTheme = 'midnight';
let appStarted = false;
let completionTimeout = null;

// Breathing State
let currentPattern = 'box';
let breathingInterval = null;
let currentPhaseIdx = -1;
let secondsInPhaseLeft = 0;

// Timer State
let timerInterval = null;
let totalSeconds = 600; // default 10 minutes
let remainingSeconds = 600;
let timerRunning = false;
const CIRCUMFERENCE = 2 * Math.PI * 95; // 596.90px

// DOM Elements Cache
let overlay, appContainer, btnStartJourney;
let themeButtons, patternSelect, patternDesc;
let breathingStatus, breathingTimer, breathingBubble;
let timerDisplay, timerLabel, timerProgress;
let presetButtons, btnTimerToggle, btnTimerReset;
let customTimeContainer, customTimeInput, customTimeSetBtn;
let sliders, muteBtn, bowlTestBtn;
let quoteText, quoteAuthor, quoteContainer;
let guideSelect, ytPlayerWrapper, sliderGuide, soundCardGuide, valGuide;

// Stats & Journal Elements Cache
let btnOpenStats, btnCloseStats, statsModal;
let statTotalMinutes, statSessions, statStreak;
let journalModal, btnSaveJournal, journalNoteInput;
let moodButtons, journalHistoryList;

// Stats & Journal State
let selectedMood = null;
let dbStats = {
  totalMinutes: 0,
  sessions: 0,
  streak: 0,
  lastDate: null,
  unlockedBadges: [],
  journal: []
};

// Initialize Web App
window.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  initCanvas();
  setupEventListeners();
  startQuoteRotator();
});

function cacheDOMElements() {
  overlay = document.getElementById('start-overlay');
  appContainer = document.getElementById('app-container');
  btnStartJourney = document.getElementById('btn-start-journey');
  
  themeButtons = document.querySelectorAll('.theme-btn');
  patternSelect = document.getElementById('breathing-pattern-select');
  patternDesc = document.getElementById('pattern-desc');
  
  breathingStatus = document.getElementById('breathing-status');
  breathingTimer = document.getElementById('breathing-timer');
  breathingBubble = document.getElementById('breathing-bubble');
  
  timerDisplay = document.getElementById('timer-display');
  timerLabel = document.getElementById('timer-label');
  timerProgress = document.getElementById('timer-progress-bar');
  
  presetButtons = document.querySelectorAll('.preset-btn');
  btnTimerToggle = document.getElementById('btn-timer-toggle');
  btnTimerReset = document.getElementById('btn-timer-reset');
  
  customTimeContainer = document.getElementById('custom-time-container');
  customTimeInput = document.getElementById('custom-time-input');
  customTimeSetBtn = document.getElementById('custom-time-set-btn');
  
  sliders = {
    binaural: document.getElementById('slider-binaural'),
    rain: document.getElementById('slider-rain'),
    ocean: document.getElementById('slider-ocean'),
    wind: document.getElementById('slider-wind')
  };
  
  muteBtn = document.getElementById('btn-mute-all');
  bowlTestBtn = document.getElementById('btn-bowl-test');
  
  quoteText = document.getElementById('quote-text');
  quoteAuthor = document.getElementById('quote-author');
  quoteContainer = document.getElementById('quote-container');

  guideSelect = document.getElementById('guide-audio-select');
  ytPlayerWrapper = document.getElementById('yt-player-wrapper');
  sliderGuide = document.getElementById('slider-guide');
  soundCardGuide = document.getElementById('sound-card-guide');
  valGuide = document.getElementById('val-guide');

  // Set initial stroke dasharray
  timerProgress.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  updateTimerDisplay();

  // Cache stats & journal elements
  btnOpenStats = document.getElementById('btn-open-stats');
  btnCloseStats = document.getElementById('btn-close-stats');
  statsModal = document.getElementById('stats-modal');

  statTotalMinutes = document.getElementById('stat-total-minutes');
  statSessions = document.getElementById('stat-sessions');
  statStreak = document.getElementById('stat-streak');

  journalModal = document.getElementById('journal-modal');
  btnSaveJournal = document.getElementById('btn-save-journal');
  journalNoteInput = document.getElementById('journal-note-input');
  moodButtons = document.querySelectorAll('.mood-btn');
  journalHistoryList = document.getElementById('journal-history-list');

  // Load stats from LocalStorage
  loadStatsFromLocalStorage();
}

function initCanvas() {
  canvasBackground.init('bg-canvas');
}

function setupEventListeners() {
  // Start Journey Overlay
  btnStartJourney.addEventListener('click', () => {
    // Hide overlay
    overlay.classList.add('fade-out');
    appContainer.classList.remove('app-hidden');
    appStarted = true;

    // Initialize & setup audio manager
    audioManager.init();
    
    // Set initial volumes from UI values
    Object.keys(sliders).forEach(name => {
      audioManager.setVolume(name, sliders[name].value / 100);
    });
    audioManager.setYTVolume(sliderGuide.value);

    // Initial guide slider card visibility state
    if (guideSelect.value !== 'none') {
      soundCardGuide.classList.remove('hidden');
    }

    // Start Breathing guide
    startBreathing();
  });

  // Theme Switching
  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTheme = btn.getAttribute('data-theme');
      
      // Update UI active state
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update Body Class
      document.body.className = `theme-${targetTheme}`;
      activeTheme = targetTheme;

      // Update Canvas
      canvasBackground.setTheme(targetTheme);
    });
  });

  // Breathing Pattern Selection
  patternSelect.addEventListener('change', (e) => {
    currentPattern = e.target.value;
    updatePatternDescription();
    if (appStarted) {
      startBreathing();
    }
  });

  // Timer Preset Buttons
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const timeVal = btn.getAttribute('data-time');
      
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (timeVal === 'custom') {
        customTimeContainer.classList.remove('hidden');
      } else {
        customTimeContainer.classList.add('hidden');
        const secs = parseInt(timeVal);
        setTimerDuration(secs);
      }
    });
  });

  // Custom Time Set
  customTimeSetBtn.addEventListener('click', () => {
    let minutes = parseInt(customTimeInput.value);
    if (isNaN(minutes) || minutes < 1) {
      minutes = 1;
    } else if (minutes > 180) {
      minutes = 180;
    }
    customTimeInput.value = minutes;
    setTimerDuration(minutes * 60);
  });

  // Timer Toggle Start/Pause
  btnTimerToggle.addEventListener('click', () => {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  // Timer Reset
  btnTimerReset.addEventListener('click', () => {
    resetTimer();
  });

  // Sound Sliders
  Object.keys(sliders).forEach(name => {
    const slider = sliders[name];
    const valText = document.getElementById(`val-${name}`);
    
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      valText.textContent = `${val}%`;
      
      if (appStarted) {
        audioManager.setVolume(name, val / 100);
      }
    });
  });

  // Mute All Button
  muteBtn.addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    muteBtn.querySelector('span').textContent = isMuted ? 'เปิดเสียงทั้งหมด' : 'ปิดเสียงทั้งหมด';
    
    // Add/remove class to show muted state
    if (isMuted) {
      muteBtn.classList.add('btn-primary');
    } else {
      muteBtn.classList.remove('btn-primary');
    }
  });

  // Bowl tester
  bowlTestBtn.addEventListener('click', () => {
    audioManager.playSingingBowl();
  });

  // Guide Audio Selection change
  guideSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'none') {
      soundCardGuide.classList.add('hidden');
      if (appStarted) {
        audioManager.stopYT();
        // Hide YT player wrapper
        ytPlayerWrapper.style.opacity = 0;
        ytPlayerWrapper.style.pointerEvents = 'none';
      }
    } else {
      soundCardGuide.classList.remove('hidden');
      if (appStarted && timerRunning) {
        // Show YT player wrapper and play immediately if timer is already running
        ytPlayerWrapper.style.opacity = 1;
        ytPlayerWrapper.style.pointerEvents = 'auto';
        audioManager.playYT(val);
      }
    }
  });

  // Guide Volume Slider
  sliderGuide.addEventListener('input', (e) => {
    const val = e.target.value;
    valGuide.textContent = `${val}%`;
    audioManager.setYTVolume(val);
  });

  // Stats Modal Show/Hide
  btnOpenStats.addEventListener('click', () => {
    renderStatsModal();
    statsModal.classList.remove('hidden');
  });

  btnCloseStats.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  // Close Stats modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === statsModal) {
      statsModal.classList.add('hidden');
    }
  });

  // Mood selection in Journal Modal
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.getAttribute('data-mood');
    });
  });

  // Save Mood Journal Entry
  btnSaveJournal.addEventListener('click', () => {
    saveSessionJournal();
  });
}

// Quote Rotator Logic (Fade transition)
function startQuoteRotator() {
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % zenQuotes.length;
    
    // Fade out
    quoteContainer.style.opacity = 0;
    
    setTimeout(() => {
      quoteText.textContent = zenQuotes[idx].text;
      quoteAuthor.textContent = zenQuotes[idx].author;
      // Fade in
      quoteContainer.style.opacity = 1;
    }, 500);
  }, 16000);
}

// Breathing Guide Control Loop
function startBreathing() {
  if (breathingInterval) {
    clearInterval(breathingInterval);
  }

  const patterns = {
    box: [
      { name: 'หายใจเข้า', duration: 4, scale: 1.6 },
      { name: 'กลั้นหายใจ', duration: 4, scale: 1.6 },
      { name: 'หายใจออก', duration: 4, scale: 1.0 },
      { name: 'กลั้นหายใจ', duration: 4, scale: 1.0 }
    ],
    relax: [
      { name: 'หายใจเข้า', duration: 4, scale: 1.6 },
      { name: 'กลั้นหายใจ', duration: 7, scale: 1.6 },
      { name: 'หายใจออก', duration: 8, scale: 1.0 }
    ],
    coherent: [
      { name: 'หายใจเข้า', duration: 5, scale: 1.6 },
      { name: 'หายใจออก', duration: 5, scale: 1.0 }
    ]
  };

  const phases = patterns[currentPattern];
  currentPhaseIdx = -1;
  secondsInPhaseLeft = 0;

  const tickBreathing = () => {
    if (secondsInPhaseLeft <= 0) {
      // Advance phase index
      const prevPhase = phases[currentPhaseIdx];
      currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
      const phase = phases[currentPhaseIdx];
      secondsInPhaseLeft = phase.duration;
      
      // Update DOM Text
      breathingStatus.textContent = phase.name;

      // Animate Bubble Size using smooth CSS transition matching duration
      breathingBubble.style.transition = `transform ${phase.duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
      breathingBubble.style.transform = `scale(${phase.scale})`;

      // Adjust shadow color depending on breathing status
      if (phase.name === 'หายใจเข้า') {
        breathingBubble.style.boxShadow = '0 0 70px var(--accent-glow)';
      } else if (phase.name === 'หายใจออก') {
        breathingBubble.style.boxShadow = '0 0 35px var(--accent-glow)';
      }
    }

    breathingTimer.textContent = secondsInPhaseLeft;
    secondsInPhaseLeft--;
  };

  tickBreathing();
  breathingInterval = setInterval(tickBreathing, 1000);
}

function updatePatternDescription() {
  if (currentPattern === 'box') {
    patternDesc.textContent = 'Box Breathing (4-4-4-4): เทคนิคปรับคลื่นสมองของหน่วยซีล ช่วยเคลียร์สมอง ลดความล้า และดึงสมาธิกลับมาได้อย่างรวดเร็ว';
  } else if (currentPattern === 'relax') {
    patternDesc.textContent = 'Relaxing Breath (4-7-8): พัฒนาโดย ดร. แอนดรูว์ ไวล์ ช่วยกระตุ้นระบบประสาทพาราซิมพาเทติกเพื่อความสงบล้ำลึกและการนอนหลับที่ดี';
  } else if (currentPattern === 'coherent') {
    patternDesc.textContent = 'Coherent Breathing (5-5): หายใจเข้าและออกแบบเท่ากัน ช่วยปรับสมดุลการเต้นของหัวใจ (Heart Rate Variability) และบรรเทาความวิตกกังวล';
  }
}

// Timer Logic
function setTimerDuration(seconds) {
  if (completionTimeout) {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    breathingBubble.classList.remove('btn-primary');
  }
  if (timerRunning) {
    pauseTimer();
  }
  totalSeconds = seconds;
  remainingSeconds = seconds;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update Ring Progress
  const progressRatio = remainingSeconds / totalSeconds;
  const offset = CIRCUMFERENCE - (progressRatio * CIRCUMFERENCE);
  timerProgress.style.strokeDashoffset = offset;
}

function startTimer() {
  if (completionTimeout) {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    breathingBubble.classList.remove('btn-primary');
  }
  if (timerRunning) return;
  
  timerRunning = true;
  timerLabel.textContent = 'จิตวิญญาณเริ่มนิ่งสงบ';
  
  // Icon update to Pause
  document.getElementById('play-icon').classList.add('hidden');
  document.getElementById('pause-icon').classList.remove('hidden');
  document.getElementById('btn-timer-text').textContent = 'หยุดชั่วคราว';

  audioManager.resume();

  // Play guided audio if selected
  const guideVal = guideSelect.value;
  if (guideVal !== 'none') {
    ytPlayerWrapper.style.opacity = 1;
    ytPlayerWrapper.style.pointerEvents = 'auto';
    audioManager.playYT(guideVal);
  }

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      timerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;

  timerRunning = false;
  clearInterval(timerInterval);
  timerLabel.textContent = 'หยุดเวลา';

  // Icon update to Play
  document.getElementById('play-icon').classList.remove('hidden');
  document.getElementById('pause-icon').classList.add('hidden');
  document.getElementById('btn-timer-text').textContent = 'เริ่มต่อ';

  // Pause guided audio
  audioManager.pauseYT();
}

function resetTimer() {
  if (completionTimeout) {
    clearTimeout(completionTimeout);
    completionTimeout = null;
    breathingBubble.classList.remove('btn-primary');
  }
  pauseTimer();
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
  timerLabel.textContent = 'พร้อมเริ่ม';
  document.getElementById('btn-timer-text').textContent = 'เริ่มทำสมาธิ';

  // Stop guided audio and hide player
  audioManager.stopYT();
  ytPlayerWrapper.style.opacity = 0;
  ytPlayerWrapper.style.pointerEvents = 'none';
}

function timerComplete() {
  pauseTimer();
  
  // Play singing bowl bell chime
  audioManager.playSingingBowl();

  // Stop guided audio and hide player
  audioManager.stopYT();
  ytPlayerWrapper.style.opacity = 0;
  ytPlayerWrapper.style.pointerEvents = 'none';
  
  timerLabel.textContent = 'เสร็จสิ้นการทำสมาธิ';
  timerDisplay.textContent = 'เสร็จสิ้น';
  document.getElementById('btn-timer-text').textContent = 'เริ่มทำสมาธิ';

  // Trigger brief highlight on completion
  breathingBubble.classList.add('btn-primary');
  
  // Open Mood Journal Modal
  openMoodJournal();
}

// ==========================================================================
// NEW UPGRADE LOGIC: STATS, BADGES, AND JOURNALING HELPERS
// ==========================================================================

function openMoodJournal() {
  selectedMood = null;
  moodButtons.forEach(b => b.classList.remove('active'));
  journalNoteInput.value = '';
  journalModal.classList.remove('hidden');
}

function saveSessionJournal() {
  if (!selectedMood) {
    alert('กรุณาเลือกความรู้สึกปัจจุบันของคุณก่อนบันทึกความเพียรนะครับ 😊');
    return;
  }
  
  const sessionMinutes = Math.round(totalSeconds / 60);
  const now = new Date();
  
  // Calculate Streak
  calculateStreak(now);
  
  // Update Stats
  dbStats.totalMinutes += sessionMinutes;
  dbStats.sessions += 1;
  
  // Save Journal Entry
  const newEntry = {
    date: now.toISOString(),
    minutes: sessionMinutes,
    mood: selectedMood,
    note: journalNoteInput.value.trim()
  };
  dbStats.journal.unshift(newEntry); // newest first
  
  // Check Badges
  checkBadges(sessionMinutes, now);
  
  // Persist
  saveStatsToLocalStorage();
  
  // Close modal & reset
  journalModal.classList.add('hidden');
  if (completionTimeout) {
    clearTimeout(completionTimeout);
    completionTimeout = null;
  }
  breathingBubble.classList.remove('btn-primary');
  resetTimer();
  
  // Open Stats modal to show progress and awards
  renderStatsModal();
  statsModal.classList.remove('hidden');
}

function calculateStreak(nowDate) {
  if (!dbStats.lastDate) {
    dbStats.streak = 1;
    dbStats.lastDate = nowDate.toISOString();
    return;
  }
  
  const last = new Date(dbStats.lastDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const currentDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  
  const diffTime = currentDay - lastDay;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    dbStats.streak += 1;
  } else if (diffDays > 1) {
    dbStats.streak = 1;
  }
  // If diffDays === 0, same-day meditation, streak remains unchanged
  
  dbStats.lastDate = nowDate.toISOString();
}

function checkBadges(sessionMinutes, nowDate) {
  const unlocked = dbStats.unlockedBadges;
  
  // 1. Beginner: First session
  if (!unlocked.includes('beginner') && dbStats.sessions >= 1) {
    unlocked.push('beginner');
  }
  
  // 2. Streak 3: 3 consecutive days
  if (!unlocked.includes('streak3') && dbStats.streak >= 3) {
    unlocked.push('streak3');
  }
  
  // 3. Morning Mind: Morning meditation (4:00 - 8:00 AM)
  const hour = nowDate.getHours();
  if (!unlocked.includes('morning') && (hour >= 4 && hour < 8)) {
    unlocked.push('morning');
  }
  
  // 4. Master 30: Single session >= 30 mins
  if (!unlocked.includes('master30') && sessionMinutes >= 30) {
    unlocked.push('master30');
  }
  
  // 5. Peace Master: Cumulative time >= 100 mins
  if (!unlocked.includes('peacemaster') && dbStats.totalMinutes >= 100) {
    unlocked.push('peacemaster');
  }
}

function renderStatsModal() {
  statTotalMinutes.textContent = dbStats.totalMinutes;
  statSessions.textContent = dbStats.sessions;
  statStreak.textContent = `🔥 ${dbStats.streak}`;
  
  // Render Badges
  const badgeIds = ['beginner', 'streak3', 'morning', 'master30', 'peacemaster'];
  badgeIds.forEach(id => {
    const el = document.getElementById(`badge-${id}`);
    if (el) {
      if (dbStats.unlockedBadges.includes(id)) {
        el.classList.remove('locked');
        el.title = `ปลดล็อกแล้ว: ${el.getAttribute('data-title')} - ${el.getAttribute('data-desc')}`;
      } else {
        el.classList.add('locked');
        el.title = `ล็อกอยู่: ${el.getAttribute('data-title')} - ${el.getAttribute('data-desc')}`;
      }
    }
  });
  
  // Render Journal History
  journalHistoryList.innerHTML = '';
  if (dbStats.journal.length === 0) {
    journalHistoryList.innerHTML = '<p class="empty-journal-message">ยังไม่มีประวัติการบันทึก ทำสมาธิเสร็จสิ้นเพื่อเริ่มบันทึกบันทึกสติ</p>';
  } else {
    dbStats.journal.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'journal-item';
      
      const dateObj = new Date(entry.date);
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear() + 543} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
      
      let moodEmoji = '😌';
      let moodLabel = 'สงบ';
      if (entry.mood === 'peaceful') { moodEmoji = '😇'; moodLabel = 'ผ่องใส'; }
      else if (entry.mood === 'refreshed') { moodEmoji = '🍃'; moodLabel = 'สดชื่น'; }
      else if (entry.mood === 'sleepy') { moodEmoji = '🥱'; moodLabel = 'ง่วงนอน'; }
      else if (entry.mood === 'restless') { moodEmoji = '😟'; moodLabel = 'ฟุ้งซ่าน'; }
      
      item.innerHTML = `
        <div class="journal-item-header">
          <span class="journal-item-mood">${moodEmoji} ${moodLabel} (${entry.minutes} นาที)</span>
          <span>${formattedDate} น.</span>
        </div>
        ${entry.note ? `<p class="journal-item-note">"${entry.note}"</p>` : ''}
      `;
      journalHistoryList.appendChild(item);
    });
  }
}

function loadStatsFromLocalStorage() {
  const data = localStorage.getItem('khoun_monk_stats');
  if (data) {
    try {
      dbStats = JSON.parse(data);
      if (!dbStats.unlockedBadges) dbStats.unlockedBadges = [];
      if (!dbStats.journal) dbStats.journal = [];
    } catch (e) {
      console.error('Failed to parse local storage stats, resetting', e);
    }
  }
}

function saveStatsToLocalStorage() {
  localStorage.setItem('khoun_monk_stats', JSON.stringify(dbStats));
}
