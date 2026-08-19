import { audioManager } from './audio.js';
import { canvasBackground } from './canvas.js';
import { supabase, isConfigured, syncLocalStatsToCloud } from './supabase.js';
import { ambientEngine } from './ambient.js';

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

// Quick Modal elements
let journalModal, btnSaveJournal, journalNoteInput, moodButtons;
let selectedMood = null;

// Dashboard tab-view elements
let navBtnMeditate, navBtnStats;
let viewMeditate, viewStats;
let dbStatTotalMinutes, dbStatSessions, dbStatStreak;
let dbJournalHistoryList, dbJournalNote, btnSaveDbJournal, dbMoodBtns;
let praiseMessage;
let dbSelectedMood = null;

// Profile Registry State (Supabase Cloud Auth Mode)
let currentUserSession = null;
let cloudProfile = { name: 'ผู้ปฏิบัติธรรม', emoji: '🧘' };

// Cloud Auth DOM elements
let profileModal, btnCloseProfile, btnHeaderProfile, profileActiveEmoji, profileActiveName, profileModalTitle;
let authViewSignin, authSigninEmail, authSigninPassword, btnDoSignin, btnSwitchToSignup;
let authViewSignup, authSignupEmail, authSignupName, authSignupPassword, btnDoSignup, btnSwitchToSignin;
let authViewProfile, authProfileAvatar, authProfileNickname, authProfileEmail, btnDoSignout;
let avatarEmojiOptions;
let selectedCreateAvatar = '🧘';

// Share DOM elements
let btnShareStats, btnRefreshStats, shareModal, btnCloseShare, sharePreviewText, btnDoNativeShare, btnCopyShareText, btnShareSite;

// Stats & Journal State
let dbStats = {
  totalMinutes: 0,
  sessions: 0,
  streak: 0,
  lastDate: null,
  lastPraise: null,
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
  if (timerProgress) {
    timerProgress.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  }
  updateTimerDisplay();

  // Quick Modal caching
  journalModal = document.getElementById('journal-modal');
  btnSaveJournal = document.getElementById('btn-save-journal');
  journalNoteInput = document.getElementById('journal-note-input');
  moodButtons = document.querySelectorAll('.mood-btn');

  // Navigation caching
  navBtnMeditate = document.getElementById('nav-btn-meditate');
  navBtnStats = document.getElementById('nav-btn-stats');
  viewMeditate = document.getElementById('view-meditate');
  viewStats = document.getElementById('view-stats');

  // Dashboard caching
  dbStatTotalMinutes = document.getElementById('db-stat-total-minutes');
  dbStatSessions = document.getElementById('db-stat-sessions');
  dbStatStreak = document.getElementById('db-stat-streak');
  dbJournalHistoryList = document.getElementById('db-journal-history-list');
  dbJournalNote = document.getElementById('db-journal-note');
  btnSaveDbJournal = document.getElementById('btn-save-db-journal');
  dbMoodBtns = document.querySelectorAll('.mood-btn-db');
  praiseMessage = document.getElementById('praise-message');

  // Cache Profile elements
  btnHeaderProfile = document.getElementById('header-profile-btn');
  profileActiveEmoji = document.getElementById('profile-active-emoji');
  profileActiveName = document.getElementById('profile-active-name');
  profileModal = document.getElementById('profile-modal');
  profileModalTitle = document.getElementById('profile-modal-title');
  btnCloseProfile = document.getElementById('btn-close-profile');
  
  authViewSignin = document.getElementById('auth-view-signin');
  authSigninEmail = document.getElementById('auth-signin-email');
  authSigninPassword = document.getElementById('auth-signin-password');
  btnDoSignin = document.getElementById('btn-do-signin');
  btnSwitchToSignup = document.getElementById('btn-switch-to-signup');
  
  authViewSignup = document.getElementById('auth-view-signup');
  authSignupEmail = document.getElementById('auth-signup-email');
  authSignupName = document.getElementById('auth-signup-name');
  authSignupPassword = document.getElementById('auth-signup-password');
  btnDoSignup = document.getElementById('btn-do-signup');
  btnSwitchToSignin = document.getElementById('btn-switch-to-signin');
  
  authViewProfile = document.getElementById('auth-view-profile');
  authProfileAvatar = document.getElementById('auth-profile-avatar');
  authProfileNickname = document.getElementById('auth-profile-nickname');
  authProfileEmail = document.getElementById('auth-profile-email');
  btnDoSignout = document.getElementById('btn-do-signout');
  
  avatarEmojiOptions = document.querySelectorAll('.avatar-emoji-option');

  // Cache Share elements
  btnShareStats = document.getElementById('btn-share-stats');
  btnRefreshStats = document.getElementById('btn-refresh-stats');
  shareModal = document.getElementById('share-modal');
  btnCloseShare = document.getElementById('btn-close-share');
  sharePreviewText = document.getElementById('share-preview-text');
  btnDoNativeShare = document.getElementById('btn-do-native-share');
  btnCopyShareText = document.getElementById('btn-copy-share-text');
  btnShareSite = document.getElementById('btn-share-site');

  // Load profiles and stats
  if (isConfigured) {
    initSupabaseAuth();
  } else {
    loadStatsFromLocalStorage().then(() => {
      updateProfileHeaderUI();
      renderStatsDashboard();
      displayRandomPraise();
    });
  }
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

  // Navigation Menu SPA Tab Switching
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update nav button active states
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Switch view containers
      tabViews.forEach(view => {
         if (view.id === `view-${targetTab}`) {
           view.classList.remove('hidden');
         } else {
           view.classList.add('hidden');
         }
      });
      
      // Render stats dashboard when tab is shown
      if (targetTab === 'stats') {
        renderStatsDashboard();
        displayRandomPraise();
      }
    });
  });

  // Mood selection in Quick Journal Modal
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.getAttribute('data-mood');
    });
  });

  // Save Mood Journal Entry from Quick Modal
  btnSaveJournal.addEventListener('click', () => {
    saveSessionJournal();
  });

  // Mood selection in Dashboard stats page
  dbMoodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dbMoodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dbSelectedMood = btn.getAttribute('data-mood');
    });
  });

  // Save Dhamma Journal Entry from Dashboard page
  btnSaveDbJournal.addEventListener('click', () => {
    saveDbFreeFormJournal();
  });

  // --- Profile / Auth Listeners ---
  if (btnHeaderProfile) {
    btnHeaderProfile.addEventListener('click', showProfileModal);
  }
  if (btnCloseProfile) {
    btnCloseProfile.addEventListener('click', closeProfileModal);
  }
  if (btnSwitchToSignup) {
    btnSwitchToSignup.addEventListener('click', () => {
      showAuthView('signup');
    });
  }
  if (btnSwitchToSignin) {
    btnSwitchToSignin.addEventListener('click', () => {
      showAuthView('signin');
    });
  }
  if (btnDoSignin) {
    btnDoSignin.addEventListener('click', handleCloudSignIn);
  }
  if (btnDoSignup) {
    btnDoSignup.addEventListener('click', handleCloudSignUp);
  }
  if (btnDoSignout) {
    btnDoSignout.addEventListener('click', handleCloudSignOut);
  }
  
  const btnGuestMode = document.getElementById('btn-guest-mode');
  if (btnGuestMode) {
    btnGuestMode.addEventListener('click', () => {
      closeProfileModal();
      showToast('🧘 เข้าใช้งานในฐานะผู้ใช้ทั่วไป สถิติจะบันทึกในเครื่องของคุณครับ');
    });
  }

  const linkForgotPwd = document.getElementById('link-forgot-pwd');
  if (linkForgotPwd) {
    linkForgotPwd.addEventListener('click', handleForgotPassword);
  }

  const btnMagicLink = document.getElementById('btn-magic-link');
  if (btnMagicLink) {
    btnMagicLink.addEventListener('click', handleMagicLinkSignIn);
  }
  
  // Custom Avatar Selector
  avatarEmojiOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarEmojiOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedCreateAvatar = opt.getAttribute('data-emoji');
    });
  });

  // Edit Profile Avatar Options
  const editAvatarOptions = document.querySelectorAll('#edit-avatar-emoji-selector .avatar-emoji-option');
  editAvatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      editAvatarOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  const btnSaveProfileEdit = document.getElementById('btn-save-profile-edit');
  if (btnSaveProfileEdit) {
    btnSaveProfileEdit.addEventListener('click', handleSaveProfileEdit);
  }

  // --- 3D Glass Card Motion & Eye Toggle Listeners ---
  const card3d = document.getElementById('sign-in-card-3d');
  if (card3d) {
    card3d.addEventListener('mousemove', (e) => {
      const rect = card3d.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (y / (rect.height / 2)) * -8;
      const rotateY = (x / (rect.width / 2)) * 8;
      card3d.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card3d.addEventListener('mouseleave', () => {
      card3d.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }

  const toggleSigninPwd = document.getElementById('btn-toggle-signin-pwd');
  const signinPwdInput = document.getElementById('auth-signin-password');
  if (toggleSigninPwd && signinPwdInput) {
    toggleSigninPwd.addEventListener('click', () => {
      const isPwd = signinPwdInput.type === 'password';
      signinPwdInput.type = isPwd ? 'text' : 'password';
      toggleSigninPwd.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  const toggleSignupPwd = document.getElementById('btn-toggle-signup-pwd');
  const signupPwdInput = document.getElementById('auth-signup-password');
  if (toggleSignupPwd && signupPwdInput) {
    toggleSignupPwd.addEventListener('click', () => {
      const isPwd = signupPwdInput.type === 'password';
      signupPwdInput.type = isPwd ? 'text' : 'password';
      toggleSignupPwd.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  const btnGoogle = document.getElementById('btn-do-google-signin');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', handleGoogleSignIn);
  }

  // --- Ambient Sound Mixer Listeners ---
  ['rain', 'ocean', 'wind'].forEach(sound => {
    const slider = document.getElementById(`slider-${sound}`);
    const valText = document.getElementById(`val-${sound}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (valText) valText.textContent = `${val}%`;
        ambientEngine.setVolume(sound, val / 100);
      });
    }
  });

  // --- Sharing & Refresh Listeners ---
  if (btnRefreshStats) {
    btnRefreshStats.addEventListener('click', handleRefreshStats);
  }
  if (btnShareStats) {
    btnShareStats.addEventListener('click', openShareModal);
  }
  if (btnCloseShare) {
    btnCloseShare.addEventListener('click', closeShareModal);
  }
  if (btnDoNativeShare) {
    btnDoNativeShare.addEventListener('click', doNativeShare);
  }
  if (btnCopyShareText) {
    btnCopyShareText.addEventListener('click', copyShareText);
  }
  if (btnShareSite) {
    btnShareSite.addEventListener('click', handleShareSite);
  }
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

const dhammaPraises = [
  "ขออนุโมทนาในความตั้งใจจริง วันนี้จิตใจเริ่มก้าวเข้าสู่ความสงบอย่างงดงามแล้วนะครับ",
  "ความดีเป็นของจริง ความนิ่งคือที่สุดแห่งสุข ขออนุโมทนาในความเพียรจดจ่อลมหายใจ",
  "ยอดเยี่ยมมาก! การสะสมชั่วโมงหยุดนิ่งทีละเล็กทีละน้อย จะนำไปสู่ความสว่างไสวที่ยิ่งใหญ่",
  "จิตที่หยุดนิ่งได้ดีแล้ว คือหนทางลัดในการยกระดับคุณภาพใจให้เบาสบายผ่องใสเสมอ",
  "ขออนุโมทนาบุญกับสมาธิในครั้งนี้ ความเพียรต่อเนื่องของคุณช่างงดงามและน่าชื่นชมยิ่งนัก",
  "ใจหยุดคือที่สุดแห่งความสุข ขอให้ทำใจนิ่งใสๆ ในกลางตัวอย่างสม่ำเสมอนะครับ",
  "ความพยายามนั่งสมาธิในวันนี้เป็นการฝึกฝนที่ยอดเยี่ยมมาก จิตใจผ่องใสประกายบุญสว่างไสว",
  "สลัดเรื่องฟุ้งซ่านแล้วกลับมาอยู่กับใจตนเองได้ ยอดเยี่ยมมาก! ขออนุโมทนาด้วยใจจริงครับ"
];

function getRandomPraise() {
  return dhammaPraises[Math.floor(Math.random() * dhammaPraises.length)];
}

function displayRandomPraise(forcePraise = null) {
  if (praiseMessage) {
    if (forcePraise) {
      praiseMessage.textContent = `"${forcePraise}"`;
    } else if (dbStats.lastPraise) {
      praiseMessage.textContent = `"${dbStats.lastPraise}"`;
    } else {
      const rand = getRandomPraise();
      dbStats.lastPraise = rand;
      praiseMessage.textContent = `"${rand}"`;
    }
  }
}

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
  
  // Save to Supabase if logged in
  if (isConfigured && currentUserSession) {
    supabase.from('journals').insert({
      user_id: currentUserSession.user.id,
      date: newEntry.date,
      minutes: newEntry.minutes,
      mood: newEntry.mood,
      note: newEntry.note
    }).then(({ error }) => {
      if (error) console.error('Failed to save journal to Supabase:', error);
    });
  }
  
  // Generate random praise
  const praise = getRandomPraise();
  dbStats.lastPraise = praise;
  
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
  
  // Redirect to Stats Tab SPA smoothly
  navBtnMeditate.classList.remove('active');
  navBtnStats.classList.add('active');
  viewMeditate.classList.add('hidden');
  viewStats.classList.remove('hidden');
  
  // Render new dashboard
  renderStatsDashboard();
  displayRandomPraise(praise);
}

function saveDbFreeFormJournal() {
  const noteText = dbJournalNote.value.trim();
  if (!noteText) {
    alert('กรุณาพิมพ์บันทึกผลการปฏิบัติธรรมก่อนกดบันทึกนะครับ 😊');
    return;
  }
  
  const now = new Date();
  
  const newEntry = {
    date: now.toISOString(),
    minutes: 0, // 0 mins represents freeform entry
    mood: dbSelectedMood || 'calm',
    note: noteText
  };
  
  dbStats.journal.unshift(newEntry);
  
  // Save to Supabase if logged in
  if (isConfigured && currentUserSession) {
    supabase.from('journals').insert({
      user_id: currentUserSession.user.id,
      date: newEntry.date,
      minutes: newEntry.minutes,
      mood: newEntry.mood,
      note: newEntry.note
    }).then(({ error }) => {
      if (error) console.error('Failed to save journal to Supabase:', error);
    });
  }
  
  // Custom praise for writing Dhamma logs
  const praise = "ขออนุโมทนาในการจดบันทึกธรรมทาน สติจดจ่อกุศลย่อมสร้างความสว่างไสวให้หนทางเดินจิตใจครับ";
  dbStats.lastPraise = praise;
  
  saveStatsToLocalStorage();
  
  // Reset dashboard inputs
  dbJournalNote.value = '';
  dbMoodBtns.forEach(b => b.classList.remove('active'));
  dbSelectedMood = null;
  
  // Re-render
  renderStatsDashboard();
  displayRandomPraise(praise);
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
  // If diffDays === 0, same day, streak unchanged
  
  dbStats.lastDate = nowDate.toISOString();
}

function checkBadges(sessionMinutes, nowDate) {
  if (!dbStats.unlockedBadges || !Array.isArray(dbStats.unlockedBadges)) {
    dbStats.unlockedBadges = [];
  }
  const unlocked = dbStats.unlockedBadges;
  
  // 1. Beginner: First session
  if (!unlocked.includes('beginner') && (dbStats.sessions || 0) >= 1) {
    unlocked.push('beginner');
  }
  
  // 2. Streak 3: 3 consecutive days
  if (!unlocked.includes('streak3') && (dbStats.streak || 0) >= 3) {
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
  if (!unlocked.includes('peacemaster') && (dbStats.totalMinutes || 0) >= 100) {
    unlocked.push('peacemaster');
  }
}

function renderStatsDashboard() {
  if (!dbStats || typeof dbStats !== 'object') {
    dbStats = {
      totalMinutes: 0,
      sessions: 0,
      streak: 0,
      lastDate: null,
      lastPraise: null,
      unlockedBadges: [],
      journal: []
    };
  }
  if (typeof dbStats.totalMinutes !== 'number' || isNaN(dbStats.totalMinutes)) dbStats.totalMinutes = 0;
  if (typeof dbStats.sessions !== 'number' || isNaN(dbStats.sessions)) dbStats.sessions = 0;
  if (typeof dbStats.streak !== 'number' || isNaN(dbStats.streak)) dbStats.streak = 0;
  if (!dbStats.unlockedBadges || !Array.isArray(dbStats.unlockedBadges)) dbStats.unlockedBadges = [];
  if (!dbStats.journal || !Array.isArray(dbStats.journal)) dbStats.journal = [];

  // Update dashboard stats fields
  if (dbStatTotalMinutes) dbStatTotalMinutes.textContent = dbStats.totalMinutes;
  if (dbStatSessions) dbStatSessions.textContent = dbStats.sessions;
  if (dbStatStreak) dbStatStreak.textContent = `🔥 ${dbStats.streak}`;
  
  // Render badges on Dashboard
  const badgeIds = ['beginner', 'streak3', 'morning', 'master30', 'peacemaster'];
  badgeIds.forEach(id => {
    const el = document.getElementById(`db-badge-${id}`);
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
  
  // Render Journal History on Dashboard
  if (dbJournalHistoryList) {
    dbJournalHistoryList.innerHTML = '';
    if (dbStats.journal.length === 0) {
      dbJournalHistoryList.innerHTML = '<p class="empty-journal-message">ยังไม่มีประวัติบันทึกความดี เขียนบันทึกเพื่อจดสภาวะธรรมก้าวแรกของคุณได้ทางซ้ายมือ</p>';
    } else {
      dbStats.journal.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        const item = document.createElement('div');
        item.className = 'journal-item';
        
        let formattedDate = '';
        if (entry.date) {
          try {
            const dateObj = new Date(entry.date);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear() + 543} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')} น.`;
            } else {
              formattedDate = String(entry.date);
            }
          } catch (e) {
            formattedDate = String(entry.date);
          }
        }
        
        let moodEmoji = '😌';
        let moodLabel = 'สงบ';
        if (entry.mood === 'peaceful') { moodEmoji = '😇'; moodLabel = 'ผ่องใส'; }
        else if (entry.mood === 'refreshed') { moodEmoji = '🍃'; moodLabel = 'สดชื่น'; }
        else if (entry.mood === 'sleepy') { moodEmoji = '🥱'; moodLabel = 'ง่วงนอน'; }
        else if (entry.mood === 'restless') { moodEmoji = '😟'; moodLabel = 'ฟุ้งซ่าน'; }
        
        const mins = typeof entry.minutes === 'number' ? entry.minutes : 0;
        const typeLabel = mins > 0 ? `ทำสมาธิ ${mins} นาที` : 'บันทึกปฏิบัติธรรม';
        
        item.innerHTML = `
          <div class="journal-item-header">
            <span class="journal-item-mood">${moodEmoji} ${moodLabel} (${typeLabel})</span>
            <span>${formattedDate}</span>
          </div>
          ${entry.note ? `<p class="journal-item-note">"${entry.note}"</p>` : ''}
        `;
        dbJournalHistoryList.appendChild(item);
      });
    }
  }

  // Render Weekly Chart & Leaderboard
  renderWeeklyChart();
  fetchAndRenderLeaderboard();
}

function renderWeeklyChart() {
  const chartEl = document.getElementById('weekly-bar-chart');
  if (!chartEl) return;

  const days = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const dailyMins = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon=0, Sun=6

  // Aggregate minutes from dbStats.journal
  dbStats.journal.forEach(entry => {
    if (entry && entry.date && typeof entry.minutes === 'number') {
      const d = new Date(entry.date);
      if (!isNaN(d.getTime())) {
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const dayIdx = (d.getDay() + 6) % 7;
          dailyMins[dayIdx] += entry.minutes;
        }
      }
    }
  });

  const maxVal = Math.max(...dailyMins, 30);
  chartEl.innerHTML = '';
  days.forEach((day, idx) => {
    const mins = dailyMins[idx];
    const heightPercent = Math.min(100, Math.round((mins / maxVal) * 100));
    const isToday = idx === currentDayOfWeek;

    const col = document.createElement('div');
    col.className = `chart-column ${isToday ? 'active' : ''}`;
    col.innerHTML = `
      <span class="bar-val-label">${mins > 0 ? mins : ''}</span>
      <div class="bar-wrapper" title="${day}: ${mins} นาที">
        <div class="bar-fill" style="height: ${Math.max(8, heightPercent)}%;"></div>
      </div>
      <span class="day-label">${day}</span>
    `;
    chartEl.appendChild(col);
  });
}

async function fetchAndRenderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  if (isConfigured) {
    try {
      const { data: topProfiles, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar, total_minutes, streak')
        .order('total_minutes', { ascending: false })
        .limit(10);

      if (!error) {
        if (topProfiles && topProfiles.length > 0) {
          container.innerHTML = '';
          const currentUserId = currentUserSession ? currentUserSession.user.id : null;

          topProfiles.forEach((p, idx) => {
            const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
            const isMe = currentUserId && p.id === currentUserId;
            const rowClass = idx < 3 ? `rank-${idx + 1}` : isMe ? 'rank-me' : '';
            
            const row = document.createElement('div');
            row.className = `leaderboard-row ${rowClass}`;
            if (isMe) {
              row.style.border = '1px solid var(--accent-color)';
              row.style.background = 'rgba(245, 158, 11, 0.1)';
            }
            row.innerHTML = `
              <div class="leaderboard-left">
                <span class="rank-badge">${rankBadge}</span>
                <div class="user-name-box">
                  <span style="font-size: 1.2rem;">${p.avatar || '🧘'}</span>
                  <span class="user-name-text">${p.nickname || 'ผู้ปฏิบัติธรรม'}${isMe ? ' <span style="font-size: 0.75rem; color: var(--accent-color);">(คุณ)</span>' : ''}</span>
                </div>
              </div>
              <div class="leaderboard-right">
                <span class="minutes-text">${p.total_minutes || 0} นาที</span>
                <span class="streak-text">🔥 ${p.streak || 0} วันต่อเนื่อง</span>
              </div>
            `;
            container.appendChild(row);
          });
          return;
        } else {
          container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 24px 14px; font-size: 0.85rem;">
              🌱 ยังไม่มีบัญชีผู้ปฏิบัติธรรมในระบบ<br>
              กดปุ่ม <strong style="color: var(--accent-color);">🔑 Log in</strong> ด้านบนเพื่อสมัครสมาชิกและเป็นคนแรกในตารางอันดับ!
            </div>
          `;
          return;
        }
      }
    } catch (e) {
      console.error('Leaderboard fetch error', e);
    }
  }

  // Fallback when Supabase is not connected
  if (currentUserSession) {
    const myName = cloudProfile.name || 'ผู้ปฏิบัติธรรม';
    const myEmoji = cloudProfile.emoji || '🧘';
    container.innerHTML = `
      <div class="leaderboard-row rank-1" style="border: 1px solid var(--accent-color); background: rgba(245, 158, 11, 0.1);">
        <div class="leaderboard-left">
          <span class="rank-badge">🥇</span>
          <div class="user-name-box">
            <span style="font-size: 1.2rem;">${myEmoji}</span>
            <span class="user-name-text">${myName} <span style="font-size: 0.75rem; color: var(--accent-color);">(คุณ)</span></span>
          </div>
        </div>
        <div class="leaderboard-right">
          <span class="minutes-text">${dbStats.totalMinutes} นาที</span>
          <span class="streak-text">🔥 ${dbStats.streak} วันต่อเนื่อง</span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 24px 14px; font-size: 0.85rem;">
        🔒 กรุณากดปุ่ม <strong style="color: var(--accent-color);">🔑 Log in</strong> ด้านบนเพื่อลงชื่อเข้าใช้และบันทึกอันดับของคุณขึ้นตารางครับ!
      </div>
    `;
  }
}
window.handleRefreshLeaderboard = fetchAndRenderLeaderboard;

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function handleResetStats() {
  const confirmed = confirm('คุณต้องการล้างสถิติการปฏิบัติธรรมทั้งหมดและเริ่มต้นนับ 0 ใหม่ใช่หรือไม่?\n\n(นาทีสะสม จำนวนครั้ง วันต่อเนื่อง เหรียญ และประวัติบันทึกจะถูกล้างทั้งหมด)');
  if (!confirmed) return;

  const btn = document.getElementById('btn-reset-stats');
  if (btn) btn.disabled = true;

  // Reset in-memory stats object
  dbStats = {
    totalMinutes: 0,
    sessions: 0,
    streak: 0,
    lastDate: null,
    lastPraise: null,
    unlockedBadges: [],
    journal: []
  };

  // Clear local storage keys
  localStorage.removeItem('khoun_monk_stats_local');
  localStorage.removeItem('khoun_monk_stats_profile_default');
  localStorage.removeItem('khoun_monk_stats');
  saveStatsToLocalStorage();

  // Reset Supabase Cloud if logged in
  if (isConfigured && currentUserSession) {
    try {
      const userId = currentUserSession.user.id;
      await supabase.from('profiles').update({
        total_minutes: 0,
        sessions: 0,
        streak: 0,
        last_date: null,
        unlocked_badges: []
      }).eq('id', userId);

      await supabase.from('journals').delete().eq('user_id', userId);
    } catch (err) {
      console.error('Failed to reset cloud stats:', err);
    }
  }

  // Update UI components
  updateProfileHeaderUI();
  renderStatsDashboard();
  displayRandomPraise('เริ่มต้นเส้นทางปฏิบัติธรรมบทใหม่ ขอให้อนุโมทนาและเจริญในธรรมครับ');
  showToast('🗑️ ล้างสถิติเรียบร้อยแล้ว เริ่มต้นนับ 0 ใหม่');

  if (btn) btn.disabled = false;
}
window.handleResetStats = handleResetStats;

async function handleRefreshStats() {
  const btn = document.getElementById('btn-refresh-stats') || btnRefreshStats;
  const icon = document.getElementById('refresh-icon');
  const refreshText = btn ? (btn.querySelector('.btn-refresh-text') || btn.querySelector('span:not(#refresh-icon)')) : null;
  
  if (btn) btn.disabled = true;
  if (icon) icon.classList.add('spin-icon');
  if (refreshText) refreshText.textContent = 'กำลังโหลด...';
  
  try {
    await loadStatsFromLocalStorage();
    updateProfileHeaderUI();
    
    // Pick a fresh praise message to give immediate visual feedback
    const freshPraise = getRandomPraise();
    dbStats.lastPraise = freshPraise;
    
    renderStatsDashboard();
    displayRandomPraise(freshPraise);

    if (refreshText) refreshText.textContent = '✅ อัปเดตแล้ว';
    showToast('🔄 อัปเดตสถิติและข้อมูลล่าสุดเรียบร้อยแล้ว');
  } catch (err) {
    console.error('Failed to refresh stats:', err);
    if (refreshText) refreshText.textContent = '❌ ล้มเหลว';
    showToast('❌ ไม่สามารถโหลดข้อมูลสถิติได้');
  } finally {
    setTimeout(() => {
      if (icon) icon.classList.remove('spin-icon');
      if (refreshText) refreshText.textContent = 'รีเฟรช';
      if (btn) btn.disabled = false;
    }, 1500);
  }
}
window.handleRefreshStats = handleRefreshStats;

async function loadStatsFromLocalStorage() {
  if (isConfigured && currentUserSession) {
    // Cloud Mode: Load stats from Supabase
    try {
      const userId = currentUserSession.user.id;
      
      // Load profile stats
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileErr) {
        if (profileErr.code !== 'PGRST116') {
          console.error('Error loading profile from Supabase:', profileErr);
        }
        // Fallback to user_metadata if profile row doesn't exist yet
        const meta = currentUserSession.user.user_metadata;
        cloudProfile = {
          name: meta?.nickname || meta?.name || 'ผู้ปฏิบัติธรรม',
          emoji: meta?.avatar || '🧘'
        };
      } else if (profile) {
        cloudProfile = {
          name: profile.nickname || 'ผู้ปฏิบัติธรรม',
          emoji: profile.avatar || '🧘'
        };
        dbStats.totalMinutes = profile.total_minutes || 0;
        dbStats.sessions = profile.sessions || 0;
        dbStats.streak = profile.streak || 0;
        dbStats.lastDate = profile.last_date || null;
        dbStats.unlockedBadges = profile.unlocked_badges || [];
      }

      // Load journals
      const { data: journals, error: journalErr } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (journalErr) {
        console.error('Error loading journals from Supabase:', journalErr);
      } else {
        dbStats.journal = (journals || []).map(j => ({
          date: j.date,
          minutes: j.minutes,
          mood: j.mood,
          note: j.note
        }));
      }
    } catch (err) {
      console.error('Failed to load stats from Supabase:', err);
    }
  } else {
    // Local Fallback Mode: Load stats from LocalStorage
    let data = localStorage.getItem('khoun_monk_stats_local');
    if (!data) {
      // Migrate from the previous default profile key used in v4.0
      const prevProfileData = localStorage.getItem('khoun_monk_stats_profile_default');
      if (prevProfileData) {
        data = prevProfileData;
        localStorage.setItem('khoun_monk_stats_local', prevProfileData);
        // Clean up to prevent duplicate migrations
        localStorage.removeItem('khoun_monk_stats_profile_default');
      } else {
        // Migrate from legacy key 'khoun_monk_stats' if it exists
        const legacyData = localStorage.getItem('khoun_monk_stats');
        if (legacyData) {
          data = legacyData;
          localStorage.setItem('khoun_monk_stats_local', legacyData);
          localStorage.removeItem('khoun_monk_stats');
        }
      }
    }
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          dbStats = parsed;
        }
      } catch (e) {
        console.error('Failed to parse local storage stats, resetting', e);
      }
    } else {
      dbStats = null;
    }
  }

  // Ensure dbStats is always fully initialized safely
  if (!dbStats || typeof dbStats !== 'object') {
    dbStats = {
      totalMinutes: 0,
      sessions: 0,
      streak: 0,
      lastDate: null,
      lastPraise: null,
      unlockedBadges: [],
      journal: []
    };
  }
  if (typeof dbStats.totalMinutes !== 'number' || isNaN(dbStats.totalMinutes)) dbStats.totalMinutes = 0;
  if (typeof dbStats.sessions !== 'number' || isNaN(dbStats.sessions)) dbStats.sessions = 0;
  if (typeof dbStats.streak !== 'number' || isNaN(dbStats.streak)) dbStats.streak = 0;
  if (!dbStats.unlockedBadges || !Array.isArray(dbStats.unlockedBadges)) dbStats.unlockedBadges = [];
  if (!dbStats.journal || !Array.isArray(dbStats.journal)) dbStats.journal = [];
}

async function saveStatsToLocalStorage() {
  if (isConfigured && currentUserSession) {
    // Cloud Mode: Save / Update stats to Supabase
    try {
      const userId = currentUserSession.user.id;
      
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          nickname: cloudProfile.name,
          avatar: cloudProfile.emoji,
          total_minutes: dbStats.totalMinutes,
          sessions: dbStats.sessions,
          streak: dbStats.streak,
          last_date: dbStats.lastDate,
          unlocked_badges: dbStats.unlockedBadges
        });

      if (profileErr) {
        console.error('Error saving profile to Supabase:', profileErr);
      }
    } catch (err) {
      console.error('Failed to save profile to Supabase:', err);
    }
  } else {
    // Local Fallback Mode: Save stats to LocalStorage
    localStorage.setItem('khoun_monk_stats_local', JSON.stringify(dbStats));
  }
}

/* ==========================================================================
   SUPABASE CLOUD AUTHENTICATION MANAGER
   ========================================================================== */

function initSupabaseAuth() {
  if (!isConfigured) return;

  // Read current session immediately
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentUserSession = session;
    if (session) {
      loadStatsFromLocalStorage().then(() => {
        updateProfileHeaderUI();
        renderStatsDashboard();
      });
    }
  });

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    currentUserSession = session;
    
    if (session) {
      // User is logged in! Load stats from Supabase
      loadStatsFromLocalStorage().then(() => {
        updateProfileHeaderUI();
        renderStatsDashboard();
        
        // Try migrating any existing local fallback stats on first login
        const localStats = localStorage.getItem('khoun_monk_stats_local');
        if (localStats) {
          try {
            const parsed = JSON.parse(localStats);
            if (parsed && parsed.totalMinutes > 0) {
              syncLocalStatsToCloud(session.user.id, parsed).then(() => {
                // Clear local stats to complete migration
                localStorage.removeItem('khoun_monk_stats_local');
                loadStatsFromLocalStorage().then(() => {
                  renderStatsDashboard();
                });
              });
            }
          } catch (e) {}
        }
      });
    } else {
      // User is logged out
      cloudProfile = { name: 'ผู้ปฏิบัติธรรม', emoji: '🧘' };
      loadStatsFromLocalStorage().then(() => {
        updateProfileHeaderUI();
        renderStatsDashboard();
      });
    }
  });
}

function updateProfileHeaderUI() {
  if (isConfigured && currentUserSession) {
    if (profileActiveEmoji) profileActiveEmoji.textContent = cloudProfile.emoji || '🧘';
    if (profileActiveName) profileActiveName.textContent = cloudProfile.name || 'ผู้ปฏิบัติธรรม';
  } else {
    // When NOT logged in -> Show Log in button
    if (profileActiveEmoji) profileActiveEmoji.textContent = '🔑';
    if (profileActiveName) profileActiveName.textContent = 'Log in';
  }
}

function showAuthView(viewName) {
  const views = {
    signin: authViewSignin,
    signup: authViewSignup,
    profile: authViewProfile
  };

  Object.keys(views).forEach(name => {
    if (views[name]) {
      if (name === viewName) {
        views[name].classList.remove('hidden');
      } else {
        views[name].classList.add('hidden');
      }
    }
  });

  // Update modal title
  if (profileModalTitle) {
    if (viewName === 'signin') profileModalTitle.textContent = '🔑 ลงชื่อเข้าใช้งาน';
    else if (viewName === 'signup') profileModalTitle.textContent = '✨ สมัครบัญชีผู้ใช้';
    else if (viewName === 'profile') profileModalTitle.textContent = '👤 โปรไฟล์ของคุณ';
  }
}

function showProfileModal() {
  if (!isConfigured) {
    alert('ระบบล็อกอินออนไลน์ยังไม่ได้ตั้งค่าคีย์เชื่อมต่อของ Supabase ครับ ⚙️\nโปรดตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env นะครับ');
    return;
  }

  if (profileModal) {
    profileModal.classList.remove('hidden');
    if (currentUserSession) {
      // Render profile summary details
      if (authProfileAvatar) authProfileAvatar.textContent = cloudProfile.emoji;
      if (authProfileNickname) authProfileNickname.textContent = cloudProfile.name;
      if (authProfileEmail) authProfileEmail.textContent = currentUserSession.user.email;
      
      const editNameInput = document.getElementById('edit-profile-name');
      if (editNameInput) editNameInput.value = cloudProfile.name;

      const editAvatarOptions = document.querySelectorAll('#edit-avatar-emoji-selector .avatar-emoji-option');
      editAvatarOptions.forEach(opt => {
        if (opt.getAttribute('data-emoji') === cloudProfile.emoji) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      showAuthView('profile');
    } else {
      // Pre-fill remembered email if saved
      const savedEmail = localStorage.getItem('saved_auth_email');
      if (savedEmail && authSigninEmail) {
        authSigninEmail.value = savedEmail;
      }
      showAuthView('signin');
    }
  }
}

function closeProfileModal() {
  if (profileModal) {
    profileModal.classList.add('hidden');
  }
  // Clear inputs
  if (authSigninEmail) authSigninEmail.value = '';
  if (authSigninPassword) authSigninPassword.value = '';
  if (authSignupEmail) authSignupEmail.value = '';
  if (authSignupName) authSignupName.value = '';
  if (authSignupPassword) authSignupPassword.value = '';
}

async function handleCloudSignIn() {
  const email = authSigninEmail.value.trim();
  const password = authSigninPassword.value.trim();
  const btn = document.getElementById('btn-do-signin');
  const rememberMe = document.getElementById('remember-me');

  if (!email || !password) {
    alert('กรุณากรอกอีเมลและรหัสผ่านด้วยนะครับ 😊');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('กรุณากรอกอีเมลให้ถูกต้องด้วยนะครับ (เช่น khoun@gmail.com) 📧');
    return;
  }

  if (rememberMe && rememberMe.checked) {
    localStorage.setItem('saved_auth_email', email);
  } else {
    localStorage.removeItem('saved_auth_email');
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังเข้าสู่ระบบ...</span>';
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) {
        const createNow = confirm('ไม่พบข้อมูลบัญชีหรือรหัสผ่านไม่ถูกต้องในระบบ 🔑\n\nคุณต้องการสลับไปหน้าสมัครสมาชิกใหม่ด้วยอีเมลนี้ทันทีหรือไม่?');
        if (createNow) {
          if (authSignupEmail) authSignupEmail.value = email;
          if (authSignupPassword) authSignupPassword.value = password;
          showAuthView('signup');
        }
        return;
      } else if (msg.includes('Email not confirmed')) {
        msg = 'อีเมลนี้ยังไม่ได้กดกดยืนยันใน Inbox ครับ 📧\n\n💡 วิธีเข้าใช้งานได้ทันที 100%:\nโปรดไปที่ Supabase Dashboard -> Authentication -> Providers -> Email -> ปิด (Uncheck) "Confirm email" ครับ ⚙️';
      }
      alert(`การเข้าสู่ระบบล้มเหลว: ${msg}`);
    } else {
      showToast('🎉 เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ!');
      closeProfileModal();
    }
  } catch (err) {
    console.error('Sign in error', err);
    alert('เกิดข้อผิดพลาดในการลงชื่อเข้าใช้: กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรืออีเมล/รหัสผ่านอีกครั้งครับ ❌');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔑 ลงชื่อเข้าใช้งาน</span>';
    }
  }
}

async function handleForgotPassword(e) {
  if (e) e.preventDefault();
  const email = authSigninEmail ? authSigninEmail.value.trim() : '';
  const targetEmail = email || prompt('กรุณากรอกอีเมลของคุณเพื่อขอรับลิงก์ตั้งรหัสผ่านใหม่:');
  if (!targetEmail) return;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.href
    });
    if (error) {
      alert(`ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้: ${error.message} ❌`);
    } else {
      alert(`📧 ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${targetEmail} เรียบร้อยแล้วครับ กรุณาเช็กในกล่องจดหมายของคุณ`);
    }
  } catch (err) {
    console.error('Reset password error', err);
    alert('เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน ❌');
  }
}

async function handleMagicLinkSignIn() {
  if (!isConfigured) return;
  const email = authSigninEmail ? authSigninEmail.value.trim() : '';
  const targetEmail = email || prompt('กรุณากรอกอีเมลของคุณเพื่อรับลิงก์ล็อกอิน (Magic Link):');
  if (!targetEmail) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(targetEmail)) {
    alert('กรุณากรอกอีเมลให้ถูกต้องด้วยนะครับ (เช่น khoun@gmail.com) 📧');
    return;
  }

  const btn = document.getElementById('btn-magic-link');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังส่งลิงก์ยืนยันทางอีเมล...</span>';
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });

    if (error) {
      alert(`การส่งลิงก์ล็อกอินล้มเหลว: ${error.message} ❌`);
    } else {
      alert(`📧 ส่งลิงก์เข้าสู่ระบบไปยัง ${targetEmail} เรียบร้อยแล้ว!\n\nกรุณาเปิดอีเมลและกดปุ่มยืนยันเพื่อเข้าสู่ระบบได้ทันทีโดยไม่ต้องใช้รหัสผ่านครับ ✨`);
      closeProfileModal();
    }
  } catch (err) {
    console.error('Magic Link sign in error', err);
    alert('เกิดข้อผิดพลาดในการส่งลิงก์เข้าสู่ระบบทางอีเมล ❌');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>✉️ ล็อกอินด้วยลิงก์ยืนยันทางอีเมล (Magic Link)</span>';
    }
  }
}

async function handleGoogleSignIn() {
  if (!isConfigured) return;
  const btn = document.getElementById('btn-do-google-signin');
  if (btn) btn.disabled = true;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) {
      console.error('Google OAuth Error:', error);
      let msg = error.message;
      if (msg.includes('provider is not enabled') || error.code === 'validation_failed') {
        alert('⚙️ การเข้าสู่ระบบด้วย Google ยังไม่ได้กดเปิดใช้งานใน Supabase Dashboard ครับ\n\nวิธีเปิดใช้งานง่ายๆ:\n1. ไปที่ Supabase Dashboard (supabase.com) -> เลือกโปรเจกต์ของคุณ\n2. ไปที่เมนู Authentication -> Providers -> กดเลือก Google -> สวิตช์เปิด Enable\n\n💡 ในระหว่างนี้ ท่านสามารถกดสมัครสมาชิก/เข้าสู่ระบบด้วย "อีเมล + รหัสผ่าน" ได้ทันทีและใช้งานได้ 100% ครับ! 😊');
      } else {
        alert(`การเข้าสู่ระบบด้วย Google ล้มเหลว: ${msg} ❌`);
      }
    }
  } catch (err) {
    console.error('Google sign in error', err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign In ❌');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleCloudSignUp() {
  const email = authSignupEmail.value.trim();
  const name = authSignupName.value.trim();
  const password = authSignupPassword.value.trim();
  const btn = document.getElementById('btn-do-signup');

  if (!email || !name || !password) {
    alert('กรุณากรอกข้อมูลสมัครสมาชิกให้ครบถ้วนด้วยนะครับ 😊');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('กรุณากรอกอีเมลให้ถูกต้องตามรูปแบบด้วยนะครับ (เช่น khoun@gmail.com หรือ name@example.com) 📧');
    return;
  }

  if (password.length < 6) {
    alert('กรุณาตั้งรหัสผ่านยาวอย่างน้อย 6 ตัวอักษรขึ้นไปเพื่อความปลอดภัยครับ 🔒');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังสร้างบัญชี...</span>';
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: name,
          avatar: selectedCreateAvatar
        }
      }
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('User already registered')) {
        msg = 'อีเมลนี้เคยสมัครสมาชิกไปแล้ว กรุณากดปุ่ม "มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่" เพื่อลงชื่อเข้าใช้ครับ 🔑';
      }
      alert(`การสมัครสมาชิกล้มเหลว: ${msg}`);
      return;
    }

    if (data && data.user) {
      // Create user record in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          nickname: name,
          avatar: selectedCreateAvatar,
          total_minutes: 0,
          sessions: 0,
          streak: 0,
          last_date: null,
          unlocked_badges: []
        });

      if (profileError) {
        console.error('Failed to create cloud profile record:', profileError);
      }

      if (data.session) {
        showToast(`✨ สมัครบัญชีสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว! ยินดีต้อนรับคุณ ${name} 🧘`);
        closeProfileModal();
      } else {
        // Attempt instant auto-login immediately after sign up
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInData && signInData.session) {
          showToast(`✨ สมัครบัญชีสำเร็จและเข้าสู่ระบบเรียบร้อยแล้ว! ยินดีต้อนรับคุณ ${name} 🧘`);
          closeProfileModal();
        } else {
          let extraGuide = '';
          if (signInErr && signInErr.message.includes('Email not confirmed')) {
            extraGuide = '\n\n⚙️ วิธีตั้งค่าให้สมัครปุ๊บเข้าใช้งานได้เลยทันที (ไม่ต้องเช็กอีเมล):\n1. ไปที่ Supabase Dashboard (supabase.com) -> เลือกโปรเจกต์ของคุณ\n2. ไปที่ Authentication -> Providers -> กดเลือก Email\n3. ปิดสวิตช์ (Uncheck) "Confirm email" -> กด Save';
          }
          alert(`✨ สมัครสมาชิกสำเร็จ!${extraGuide}\n\nในตอนนี้ท่านสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่คุณตั้งไว้ได้เลยครับ 🔑`);
          showAuthView('signin');
        }
      }
    }
  } catch (err) {
    console.error('Sign up error', err);
    alert(`การสมัครสมาชิกล้มเหลว (${err.message || 'Failed to fetch'}): กรุณากรอกอีเมลจริง (เช่น khoun@gmail.com) หรือตรวจสอบ Project URL ใน Supabase ครับ ❌`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>💾 สมัครบัญชีผู้ใช้</span>';
    }
  }
}

async function handleCloudSignOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`การออกจากระบบล้มเหลว: ${error.message} ❌`);
    } else {
      showToast('🕊️ ออกจากระบบเรียบร้อยแล้ว');
      closeProfileModal();
    }
  } catch (err) {
    console.error('Sign out error', err);
  }
}

async function handleSaveProfileEdit() {
  if (!isConfigured || !currentUserSession) return;
  const editNameInput = document.getElementById('edit-profile-name');
  const btn = document.getElementById('btn-save-profile-edit');
  
  const newName = editNameInput ? editNameInput.value.trim() : '';
  if (!newName) {
    alert('กรุณากรอกชื่อเล่นด้วยนะครับ 😊');
    return;
  }

  const activeEmojiOpt = document.querySelector('#edit-avatar-emoji-selector .avatar-emoji-option.active');
  const newEmoji = activeEmojiOpt ? activeEmojiOpt.getAttribute('data-emoji') : '🧘';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ กำลังบันทึก...</span>';
  }

  try {
    const userId = currentUserSession.user.id;
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        nickname: newName,
        avatar: newEmoji,
        total_minutes: dbStats.totalMinutes,
        sessions: dbStats.sessions,
        streak: dbStats.streak,
        last_date: dbStats.lastDate,
        unlocked_badges: dbStats.unlockedBadges
      });

    if (error) {
      alert(`ไม่สามารถบันทึกการแก้ไขโปรไฟล์ได้: ${error.message} ❌`);
    } else {
      cloudProfile = { name: newName, emoji: newEmoji };
      updateProfileHeaderUI();
      renderStatsDashboard();
      showToast('✨ บันทึกการแก้ไขโปรไฟล์เรียบร้อยแล้ว!');
      closeProfileModal();
    }
  } catch (err) {
    console.error('Edit profile error', err);
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลครับ ❌');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>💾 บันทึกการแก้ไขโปรไฟล์</span>';
    }
  }
}

/* ==========================================================================
   ACHIEVEMENT SHARING MANAGER
   ========================================================================== */

function generateShareText() {
  const name = currentUserSession ? cloudProfile.name : 'ผู้ปฏิบัติธรรม';
  const emoji = currentUserSession ? cloudProfile.emoji : '🧘';
  
  let shareText = `🕊️ บันทึกความดีและผลปฏิบัติธรรม\n`;
  shareText += `👤 ผู้ใช้: ${emoji} ${name}\n`;
  shareText += `🧘 นั่งสมาธิสะสม: ${dbStats.totalMinutes} นาที\n`;
  shareText += ` Sessions: ${dbStats.sessions} ครั้ง\n`;
  shareText += `🔥 ความเพียรต่อเนื่อง: ${dbStats.streak} วัน\n`;
  shareText += `🏅 เหรียญรางวัลที่ปลดล็อก: ${dbStats.unlockedBadges.length} / 5 เหรียญ\n`;
  
  if (dbStats.journal.length > 0) {
    const lastEntry = dbStats.journal[0];
    let moodEmoji = '😌';
    let moodLabel = 'สงบ';
    if (lastEntry.mood === 'peaceful') { moodEmoji = '😇'; moodLabel = 'ผ่องใส'; }
    else if (lastEntry.mood === 'refreshed') { moodEmoji = '🍃'; moodLabel = 'สดชื่น'; }
    else if (lastEntry.mood === 'sleepy') { moodEmoji = '🥱'; moodLabel = 'ง่วงนอน'; }
    else if (lastEntry.mood === 'restless') { moodEmoji = '😟'; moodLabel = 'ฟุ้งซ่าน'; }
    
    shareText += `\n📖 สภาวะธรรมล่าสุด (${moodEmoji} ${moodLabel}):\n`;
    shareText += `"${lastEntry.note || 'กายสงบนิ่ง ใจหยุดเป็นกุศล'}"\n`;
  }
  
  shareText += `\nมาร่วมทำจิตใจให้สงบและผ่องใสด้วยกันได้ที่: ${window.location.origin + window.location.pathname}`;
  return shareText;
}

function openShareModal() {
  if (!shareModal) return;
  const text = generateShareText();
  if (sharePreviewText) {
    sharePreviewText.textContent = text;
  }
  shareModal.classList.remove('hidden');
}

function closeShareModal() {
  if (shareModal) {
    shareModal.classList.add('hidden');
  }
}

function doNativeShare() {
  const text = generateShareText();
  if (navigator.share) {
    navigator.share({
      title: 'บันทึกปฏิบัติธรรม - Khoun Monk',
      text: text,
      url: window.location.href
    }).catch(err => {
      console.warn('Native share failed or cancelled', err);
    });
  } else {
    copyShareText();
  }
}

function copyShareText() {
  const text = generateShareText();
  navigator.clipboard.writeText(text).then(() => {
    alert('คัดลอกบันทึกความดีลงคลิปบอร์ดแล้ว! นำไปวางส่งในโซเชียลหรือแชร์ต่อได้ทันทีครับ 😊');
    closeShareModal();
  }).catch(err => {
    console.error('Failed to copy text', err);
    alert('ไม่สามารถคัดลอกลงคลิปบอร์ดได้ กรุณาคัดลอกจากกล่องข้อความพรีวิวด้วยตนเองครับ');
  });
}

function handleShareSite() {
  const shareTitle = 'Khoun Monk - แอปพลิเคชันฝึกสมาธิออนไลน์';
  const shareText = '🕊️ ชวนร่วมนั่งสมาธิ ปฏิบัติธรรม สะสมเวลาความเพียรและบันทึกสภาวะธรรมทางออนไลน์ด้วยกันครับ 🧘✨\n';
  const shareUrl = window.location.origin + window.location.pathname;

  if (navigator.share) {
    navigator.share({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    }).catch(err => {
      console.warn('Native share failed or cancelled', err);
    });
  } else {
    // Copy website link to clipboard
    navigator.clipboard.writeText(`${shareText}${shareUrl}`).then(() => {
      alert('คัดลอกลิงก์เว็บไซต์ลงคลิปบอร์ดแล้ว! ส่งต่อชวนเพื่อน ๆ มาร่วมทำสมาธิด้วยกันในโซเชียลได้เลยครับ 😊');
    }).catch(err => {
      console.error('Failed to copy share link', err);
      alert('ไม่สามารถคัดลอกลิงก์ได้โดยอัตโนมัติ คุณสามารถคัดลอก URL หน้าเว็บส่งแชร์ต่อได้ทันทีครับ');
    });
  }
}
