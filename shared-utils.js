/* ============================================
   Calendar Systems Explorer - Shared Utilities
   ============================================

   Common JavaScript utilities used across all calendar pages:
   - Theme management (dark mode)
   - Progress tracking (localStorage)
   - Calendar date conversions
   - Sound management
   - Helper functions
*/

'use strict';

/* ============================================
   Theme Manager (Dark Mode)
   ============================================ */

class ThemeManager {
    constructor() {
        // Check localStorage first, then system preference
        this.theme = localStorage.getItem('calendar-theme') ||
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.apply();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('calendar-theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                this.apply();
            }
        });
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.apply();
        localStorage.setItem('calendar-theme', this.theme);
        return this.theme;
    }

    apply() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    get isDark() {
        return this.theme === 'dark';
    }
}

// Global instance
const themeManager = new ThemeManager();

/* ============================================
   Progress Tracker
   ============================================ */

class ProgressTracker {
    constructor(pageId, totalScreens = 4) {
        this.pageId = pageId;
        this.totalScreens = totalScreens;
        this.key = `calendar-progress-${pageId}`;
        this.data = this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(this.key);
            return stored ? JSON.parse(stored) : this.getDefaultData();
        } catch (error) {
            console.warn('Failed to load progress:', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            screensVisited: [],
            quizScores: {},
            lastVisit: null,
            completedAt: null,
            totalVisits: 0
        };
    }

    save() {
        try {
            this.data.lastVisit = new Date().toISOString();
            localStorage.setItem(this.key, JSON.stringify(this.data));
        } catch (error) {
            console.warn('Failed to save progress:', error);
        }
    }

    visitScreen(screenId) {
        if (!this.data.screensVisited.includes(screenId)) {
            this.data.screensVisited.push(screenId);
            this.save();
        }
    }

    recordQuizScore(quizId, score) {
        this.data.quizScores[quizId] = Math.max(this.data.quizScores[quizId] || 0, score);
        this.save();
    }

    markComplete() {
        if (!this.data.completedAt) {
            this.data.completedAt = new Date().toISOString();
            this.save();
        }
    }

    incrementVisits() {
        this.data.totalVisits++;
        this.save();
    }

    getProgress() {
        const screensProgress = this.totalScreens > 0
            ? (this.data.screensVisited.length / this.totalScreens) * 100
            : 0;

        return {
            percentage: Math.min(100, screensProgress),
            screensVisited: this.data.screensVisited.length,
            totalScreens: this.totalScreens,
            isComplete: !!this.data.completedAt,
            lastVisit: this.data.lastVisit,
            totalVisits: this.data.totalVisits
        };
    }

    reset() {
        this.data = this.getDefaultData();
        this.save();
    }
}

/* ============================================
   Sound Manager
   ============================================ */

class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('calendar-sound-enabled') !== 'false';
        this.context = null;
        this.sounds = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;

            // Generate simple beep sounds
            this.generateBeep('click', 523.25, 0.1);      // C5 - quick click
            this.generateBeep('success', 659.25, 0.2);    // E5 - success
            this.generateBeep('milestone', 783.99, 0.3);  // G5 - milestone
            this.generateBeep('complete', 1046.50, 0.5);  // C6 - completion
            this.generateBeep('error', 246.94, 0.3);      // B3 - error
        } catch (err) {
            console.warn('Failed to initialize audio:', err);
            this.enabled = false;
        }
    }

    generateBeep(name, frequency, duration) {
        // Create a simple beep sound using oscillator
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        this.sounds[name] = { frequency, duration };
    }

    async play(name) {
        if (!this.enabled || !this.sounds[name]) return;

        if (!this.initialized) {
            await this.init();
        }

        try {
            const sound = this.sounds[name];
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.frequency.value = sound.frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + sound.duration);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + sound.duration);
        } catch (err) {
            console.warn('Failed to play sound:', err);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('calendar-sound-enabled', this.enabled.toString());
        return this.enabled;
    }
}

// Global instance
const soundManager = new SoundManager();

/* ============================================
   Calendar Date Conversion Utilities
   ============================================ */

const CalendarUtils = {
    /* Gregorian Calendar Utils */
    isGregorianLeapYear(year) {
        return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
    },

    getDaysInGregorianYear(year) {
        return this.isGregorianLeapYear(year) ? 366 : 365;
    },

    getJulianGregorianOffset(year) {
        // Calculate the number of days difference between Julian and Gregorian calendars
        const century = Math.floor(year / 100);
        return century - Math.floor(century / 4) - 2;
    },

    calculateEasterDate(year) {
        // Meeus/Jones/Butcher algorithm for Easter date
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        return `${monthNames[month - 1]} ${day}, ${year}`;
    },

    /* Hebrew Calendar Utils */
    isHebrewLeapYear(year) {
        // Hebrew calendar uses 19-year Metonic cycle
        // Leap years are years 3, 6, 8, 11, 14, 17, 19 of the cycle
        const cycleYear = year % 19;
        return [3, 6, 8, 11, 14, 17, 0].includes(cycleYear);
    },

    getMonthsInHebrewYear(year) {
        return this.isHebrewLeapYear(year) ? 13 : 12;
    },

    gregorianToHebrew(date) {
        // Simplified approximation (real calculation is complex)
        // Hebrew year starts roughly in September/October
        const year = date.getFullYear();
        const hebrewYear = year + 3760 + (date.getMonth() >= 9 ? 1 : 0);

        const months = ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
                       'Tishrei', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar'];

        // Rough month approximation
        const monthIndex = (date.getMonth() + 6) % 12;
        const month = months[monthIndex];
        const day = date.getDate();

        return `${day} ${month} ${hebrewYear}`;
    },

    /* Islamic Calendar Utils */
    isIslamicLeapYear(year) {
        // Islamic calendar uses 30-year cycle
        // Leap years are years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 (1-indexed)
        const cycleYear = year % 30;
        return [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(cycleYear);
    },

    getDaysInIslamicYear(year) {
        return this.isIslamicLeapYear(year) ? 355 : 354;
    },

    gregorianToIslamic(date) {
        // Simplified approximation (real calculation is complex)
        const year = date.getFullYear();
        const islamicYear = Math.floor((year - 622) * 1.030684) + 1;

        const months = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
                       'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
                       'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'];

        // Rough month approximation (Islamic months drift through the year)
        const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        const monthIndex = Math.floor((dayOfYear % 354) / 29.5) % 12;
        const month = months[monthIndex];
        const day = Math.floor((dayOfYear % 354) % 29.5) + 1;

        return `${day} ${month} ${islamicYear} AH`;
    },

    calculateRamadanStart(gregorianYear) {
        // Approximate Ramadan start (9th month of Islamic calendar)
        // Ramadan moves back ~11 days each year
        const baseYear = 2024;
        const baseDate = new Date(2024, 2, 10); // March 10, 2024 (approximate)
        const yearsDiff = gregorianYear - baseYear;
        const daysBack = yearsDiff * 11;

        const ramadanStart = new Date(baseDate);
        ramadanStart.setDate(ramadanStart.getDate() - daysBack);

        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `${months[ramadanStart.getMonth()]} ${ramadanStart.getDate()}, ${gregorianYear}`;
    },

    getSeason(dateString) {
        const date = new Date(dateString);
        const month = date.getMonth();

        if (month >= 2 && month <= 4) return 'Spring';
        if (month >= 5 && month <= 7) return 'Summer';
        if (month >= 8 && month <= 10) return 'Fall';
        return 'Winter';
    },

    /* Hindu Calendar Utils */
    gregorianToHindu(date) {
        // Highly simplified approximation
        // Real Hindu calendar calculation is extremely complex
        const year = date.getFullYear();
        const vikramYear = year + 57; // Vikram Samvat approximation
        const shakaYear = year - 78;  // Shaka Samvat approximation

        const months = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
                       'Shravana', 'Bhadrapada', 'Ashwin', 'Kartik',
                       'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];

        // Rough month approximation (offset by ~2 months)
        const monthIndex = (date.getMonth() + 10) % 12;
        const month = months[monthIndex];
        const day = date.getDate();

        return `${day} ${month} ${vikramYear} (Vikram Samvat)`;
    },

    calculateDiwali(year) {
        // Diwali is on new moon day of Kartik (Oct-Nov)
        // Approximate calculation
        const base = new Date(year, 9, 15); // Mid-October base
        const offset = Math.floor(Math.sin(year) * 15); // Varies by lunar cycle
        base.setDate(base.getDate() + offset);

        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `${months[base.getMonth()]} ${base.getDate()}, ${year}`;
    },

    calculateHoli(year) {
        // Holi is in Phalguna (Feb-March)
        const base = new Date(year, 2, 8); // Early March base
        const offset = Math.floor(Math.cos(year) * 12);
        base.setDate(base.getDate() + offset);

        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `${months[base.getMonth()]} ${base.getDate()}, ${year}`;
    },

    calculateNavratri(year) {
        // Navratri is in Ashwin (Sep-Oct)
        const base = new Date(year, 8, 20); // Late September base
        const offset = Math.floor(Math.sin(year + 1) * 10);
        base.setDate(base.getDate() + offset);

        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `${months[base.getMonth()]} ${base.getDate()}, ${year}`;
    }
};

/* ============================================
   CDN Resource Loader with Fallbacks
   ============================================ */

class ResourceLoader {
    constructor() {
        this.loaded = new Set();
        this.failed = new Set();
    }

    async loadScript(primary, fallback, testFunction, name) {
        return new Promise((resolve, reject) => {
            if (this.loaded.has(name)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = primary;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                if (testFunction()) {
                    this.loaded.add(name);
                    resolve();
                } else {
                    this.loadFallback(fallback, testFunction, name, resolve, reject);
                }
            };

            script.onerror = () => {
                this.loadFallback(fallback, testFunction, name, resolve, reject);
            };

            document.head.appendChild(script);
        });
    }

    loadFallback(fallback, testFunction, name, resolve, reject) {
        if (!fallback) {
            this.failed.add(name);
            this.showError(name);
            reject(new Error(`Failed to load ${name}`));
            return;
        }

        const script = document.createElement('script');
        script.src = fallback;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            if (testFunction()) {
                this.loaded.add(name);
                resolve();
            } else {
                this.failed.add(name);
                this.showError(name);
                reject(new Error(`Failed to load ${name} from fallback`));
            }
        };

        script.onerror = () => {
            this.failed.add(name);
            this.showError(name);
            reject(new Error(`Failed to load ${name} from fallback`));
        };

        document.head.appendChild(script);
    }

    showError(name) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #111; margin-bottom: 12px;">Loading Error</h2>
            <p style="color: #666; margin-bottom: 20px;">
                Failed to load ${name}. Please check your internet connection and try again.
            </p>
            <button onclick="location.reload()" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            ">
                Reload Page
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
}

const resourceLoader = new ResourceLoader();

/* ============================================
   Animation Controls
   ============================================ */

class AnimationController {
    constructor() {
        this.enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.loadPreference();
        this.apply();
    }

    loadPreference() {
        const saved = localStorage.getItem('calendar-animations-enabled');
        if (saved !== null) {
            this.enabled = saved === 'true';
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        this.apply();
        localStorage.setItem('calendar-animations-enabled', this.enabled.toString());
        return this.enabled;
    }

    apply() {
        if (!this.enabled) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }
}

const animationController = new AnimationController();

/* ============================================
   Font Size Controller
   ============================================ */

class FontSizeController {
    constructor() {
        this.size = parseInt(localStorage.getItem('calendar-font-size')) || 100;
        this.apply();
    }

    increase(amount = 10) {
        this.size = Math.min(150, this.size + amount);
        this.apply();
        this.save();
        return this.size;
    }

    decrease(amount = 10) {
        this.size = Math.max(75, this.size - amount);
        this.apply();
        this.save();
        return this.size;
    }

    reset() {
        this.size = 100;
        this.apply();
        this.save();
        return this.size;
    }

    apply() {
        document.documentElement.style.fontSize = `${this.size}%`;
    }

    save() {
        localStorage.setItem('calendar-font-size', this.size.toString());
    }
}

const fontSizeController = new FontSizeController();

/* ============================================
   Share Functionality
   ============================================ */

async function shareContent(title, text, url) {
    const shareData = {
        title: title || document.title,
        text: text || 'Check out this interactive calendar explanation!',
        url: url || window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return true;
        } catch (err) {
            if (err.name === 'AbortError') {
                return false; // User cancelled
            }
            // Fall back to clipboard
            return copyToClipboard(shareData.url);
        }
    } else {
        // Fall back to clipboard
        return copyToClipboard(shareData.url);
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Link copied to clipboard!');
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        showToast('Failed to copy link', 'error');
        return false;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ============================================
   Helper Functions
   ============================================ */

function formatDate(date, format = 'long') {
    const options = format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/* ============================================
   Initialize on Load
   ============================================ */

// Initialize theme and font size on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager.apply();
        fontSizeController.apply();
        animationController.apply();
    });
} else {
    themeManager.apply();
    fontSizeController.apply();
    animationController.apply();
}

/* ============================================
   Export for use in other scripts
   ============================================ */

// Make utilities available globally
window.CalendarUtils = CalendarUtils;
window.themeManager = themeManager;
window.soundManager = soundManager;
window.ProgressTracker = ProgressTracker;
window.resourceLoader = resourceLoader;
window.animationController = animationController;
window.fontSizeController = fontSizeController;
window.shareContent = shareContent;
window.copyToClipboard = copyToClipboard;
window.showToast = showToast;
window.formatDate = formatDate;
window.debounce = debounce;
window.throttle = throttle;
