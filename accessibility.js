/* ============================================
   Calendar Systems Explorer - Accessibility Utilities
   ============================================

   Accessibility helpers and utilities:
   - ARIA label generators
   - Keyboard navigation helpers
   - Screen reader announcements
   - Focus management
*/

'use strict';

/* ============================================
   ARIA Label Helpers
   ============================================ */

const ARIAHelpers = {
    /**
     * Add ARIA labels to emojis
     * @param {string} emoji - The emoji character
     * @param {string} label - The descriptive label
     * @returns {string} - HTML with proper ARIA
     */
    labelEmoji(emoji, label) {
        return `<span role="img" aria-label="${label}">${emoji}</span>`;
    },

    /**
     * Create accessible button with proper ARIA
     * @param {string} text - Button text
     * @param {string} action - What the button does
     * @param {boolean} pressed - Is button pressed/active
     * @returns {Object} - ARIA attributes
     */
    createButtonAttrs(text, action, pressed = false) {
        return {
            'aria-label': action || text,
            'aria-pressed': pressed.toString(),
            role: 'button',
            tabIndex: 0
        };
    },

    /**
     * Create accessible slider/range input
     * @param {number} value - Current value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {string} label - Description of what slider controls
     * @returns {Object} - ARIA attributes
     */
    createSliderAttrs(value, min, max, label) {
        const percentage = ((value - min) / (max - min)) * 100;
        return {
            'aria-label': label,
            'aria-valuemin': min.toString(),
            'aria-valuemax': max.toString(),
            'aria-valuenow': value.toString(),
            'aria-valuetext': `${value} (${Math.round(percentage)}%)`,
            role: 'slider'
        };
    },

    /**
     * Create accessible progress indicator
     * @param {number} current - Current step
     * @param {number} total - Total steps
     * @param {string} title - Title of current step
     * @returns {Object} - ARIA attributes
     */
    createProgressAttrs(current, total, title) {
        return {
            'aria-label': `Screen ${current} of ${total}: ${title}`,
            'aria-current': 'page',
            'aria-posinset': current.toString(),
            'aria-setsize': total.toString()
        };
    },

    /**
     * Auto-generate ARIA labels for common emojis
     * @param {string} emoji - The emoji to label
     * @returns {string} - Descriptive label
     */
    getEmojiLabel(emoji) {
        const emojiLabels = {
            '🌍': 'Earth',
            '🌎': 'Earth Americas',
            '🌏': 'Earth Asia',
            '☪️': 'Star and crescent',
            '🕎': 'Menorah',
            '🕉️': 'Om symbol',
            '✝️': 'Cross',
            '🌙': 'Crescent moon',
            '☀️': 'Sun',
            '⭐': 'Star',
            '✨': 'Sparkles',
            '🎉': 'Party popper',
            '🎊': 'Confetti ball',
            '🎓': 'Graduation cap',
            '📅': 'Calendar',
            '📆': 'Tear-off calendar',
            '⏰': 'Alarm clock',
            '🔄': 'Counterclockwise arrows',
            '⚖️': 'Balance scale',
            '❄️': 'Snowflake',
            '🌸': 'Cherry blossom',
            '🍂': 'Fallen leaf',
            '🔥': 'Fire',
            '💥': 'Collision',
            '🌪️': 'Tornado',
            '⚠️': 'Warning',
            '🚨': 'Police car light',
            '✓': 'Check mark',
            '✅': 'Check mark button',
            '❌': 'Cross mark',
            '🎯': 'Direct hit',
            '🧮': 'Abacus',
            '🤔': 'Thinking face',
            '😊': 'Smiling face',
            '😟': 'Worried face',
            '😰': 'Anxious face with sweat',
            '😱': 'Face screaming in fear',
            '🥳': 'Partying face',
            '🫨': 'Shaking face',
            '🤩': 'Star-struck',
            '🎂': 'Birthday cake',
            '🎄': 'Christmas tree',
            '🎃': 'Jack-o-lantern',
            '🏖️': 'Beach with umbrella',
            '⛷️': 'Skier',
            '🏊': 'Person swimming'
        };

        return emojiLabels[emoji] || 'Emoji';
    }
};

/* ============================================
   Keyboard Navigation Manager
   ============================================ */

class KeyboardNavigationManager {
    constructor() {
        this.focusableElements = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        this.currentFocusIndex = 0;
    }

    /**
     * Get all focusable elements in a container
     * @param {HTMLElement} container - Container element
     * @returns {Array} - Array of focusable elements
     */
    getFocusableElements(container = document) {
        return Array.from(container.querySelectorAll(this.focusableElements));
    }

    /**
     * Focus first element in container
     * @param {HTMLElement} container - Container element
     */
    focusFirst(container = document) {
        const elements = this.getFocusableElements(container);
        if (elements.length > 0) {
            elements[0].focus();
            this.currentFocusIndex = 0;
        }
    }

    /**
     * Focus last element in container
     * @param {HTMLElement} container - Container element
     */
    focusLast(container = document) {
        const elements = this.getFocusableElements(container);
        if (elements.length > 0) {
            elements[elements.length - 1].focus();
            this.currentFocusIndex = elements.length - 1;
        }
    }

    /**
     * Focus next element
     * @param {HTMLElement} container - Container element
     */
    focusNext(container = document) {
        const elements = this.getFocusableElements(container);
        if (elements.length > 0) {
            this.currentFocusIndex = (this.currentFocusIndex + 1) % elements.length;
            elements[this.currentFocusIndex].focus();
        }
    }

    /**
     * Focus previous element
     * @param {HTMLElement} container - Container element
     */
    focusPrevious(container = document) {
        const elements = this.getFocusableElements(container);
        if (elements.length > 0) {
            this.currentFocusIndex = this.currentFocusIndex - 1;
            if (this.currentFocusIndex < 0) {
                this.currentFocusIndex = elements.length - 1;
            }
            elements[this.currentFocusIndex].focus();
        }
    }

    /**
     * Trap focus within a container (for modals)
     * @param {HTMLElement} container - Container element
     */
    trapFocus(container) {
        const elements = this.getFocusableElements(container);
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);

        // Return cleanup function
        return () => container.removeEventListener('keydown', handleTabKey);
    }
}

const keyboardNav = new KeyboardNavigationManager();

/* ============================================
   Screen Reader Announcements
   ============================================ */

class ScreenReaderAnnouncer {
    constructor() {
        this.liveRegion = null;
        this.createLiveRegion();
    }

    createLiveRegion() {
        // Create hidden live region for screen reader announcements
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-only';
        document.body.appendChild(this.liveRegion);
    }

    /**
     * Announce a message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
        if (!this.liveRegion) {
            this.createLiveRegion();
        }

        this.liveRegion.setAttribute('aria-live', priority);

        // Clear and then set message (ensures announcement)
        this.liveRegion.textContent = '';

        setTimeout(() => {
            this.liveRegion.textContent = message;
        }, 100);

        // Clear after announcement
        setTimeout(() => {
            this.liveRegion.textContent = '';
        }, 5000);
    }

    /**
     * Announce urgent message to screen readers
     * @param {string} message - Urgent message
     */
    announceUrgent(message) {
        this.announce(message, 'assertive');
    }
}

const screenReader = new ScreenReaderAnnouncer();

/* ============================================
   Focus Management
   ============================================ */

class FocusManager {
    constructor() {
        this.previousFocus = null;
    }

    /**
     * Save current focus and move to new element
     * @param {HTMLElement} element - Element to focus
     */
    moveFocus(element) {
        this.previousFocus = document.activeElement;
        element.focus();
    }

    /**
     * Restore previously focused element
     */
    restoreFocus() {
        if (this.previousFocus && this.previousFocus.focus) {
            this.previousFocus.focus();
            this.previousFocus = null;
        }
    }

    /**
     * Ensure element is visible when focused
     * @param {HTMLElement} element - Element to make visible
     */
    ensureVisible(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
    }
}

const focusManager = new FocusManager();

/* ============================================
   Skip Links Generator
   ============================================ */

function addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);
}

/* ============================================
   Contrast Checker (Development Mode)
   ============================================ */

const ContrastChecker = {
    /**
     * Calculate relative luminance of color
     * @param {string} color - RGB color string
     * @returns {number} - Relative luminance
     */
    getLuminance(color) {
        const rgb = color.match(/\d+/g).map(Number);
        const [r, g, b] = rgb.map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },

    /**
     * Calculate contrast ratio between two colors
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {number} - Contrast ratio
     */
    getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    },

    /**
     * Check if contrast meets WCAG standards
     * @param {string} foreground - Foreground color
     * @param {string} background - Background color
     * @param {string} level - 'AA' or 'AAA'
     * @param {boolean} largeText - Is text large (18pt+ or 14pt+ bold)
     * @returns {boolean} - Meets standard
     */
    meetsStandard(foreground, background, level = 'AA', largeText = false) {
        const ratio = this.getContrastRatio(foreground, background);
        const requiredRatio = level === 'AAA'
            ? (largeText ? 4.5 : 7)
            : (largeText ? 3 : 4.5);

        return ratio >= requiredRatio;
    },

    /**
     * Scan page for contrast issues (dev mode)
     */
    scanPage() {
        const elements = document.querySelectorAll('*');
        const issues = [];

        elements.forEach(el => {
            if (el.textContent.trim().length === 0) return;

            const style = window.getComputedStyle(el);
            const color = style.color;
            const bgColor = style.backgroundColor;
            const fontSize = parseInt(style.fontSize);
            const fontWeight = style.fontWeight;

            if (color === 'rgba(0, 0, 0, 0)' || bgColor === 'rgba(0, 0, 0, 0)') return;

            const largeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));

            if (!this.meetsStandard(color, bgColor, 'AA', largeText)) {
                issues.push({
                    element: el,
                    color,
                    bgColor,
                    ratio: this.getContrastRatio(color, bgColor).toFixed(2)
                });
            }
        });

        if (issues.length > 0) {
            console.warn(`Found ${issues.length} contrast issues:`, issues);
        } else {
            console.log('✓ No contrast issues found!');
        }

        return issues;
    }
};

/* ============================================
   Accessible Modal/Dialog Helper
   ============================================ */

class AccessibleModal {
    constructor(modalElement) {
        this.modal = modalElement;
        this.previousFocus = null;
        this.removeFocusTrap = null;
    }

    open() {
        // Save current focus
        this.previousFocus = document.activeElement;

        // Show modal
        this.modal.style.display = 'block';
        this.modal.setAttribute('aria-hidden', 'false');

        // Trap focus
        this.removeFocusTrap = keyboardNav.trapFocus(this.modal);

        // Focus first element
        keyboardNav.focusFirst(this.modal);

        // Prevent background scroll
        document.body.style.overflow = 'hidden';

        // Listen for Escape key
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);

        // Announce to screen readers
        screenReader.announce('Dialog opened');
    }

    close() {
        // Hide modal
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');

        // Remove focus trap
        if (this.removeFocusTrap) {
            this.removeFocusTrap();
            this.removeFocusTrap = null;
        }

        // Restore focus
        if (this.previousFocus) {
            this.previousFocus.focus();
        }

        // Restore background scroll
        document.body.style.overflow = '';

        // Remove escape listener
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        // Announce to screen readers
        screenReader.announce('Dialog closed');
    }
}

/* ============================================
   Accessible Tooltip
   ============================================ */

function makeTooltipAccessible(triggerElement, tooltipText) {
    const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

    // Add ARIA attributes
    triggerElement.setAttribute('aria-describedby', tooltipId);

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'tooltip-content';
    tooltip.textContent = tooltipText;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.style.display = 'none';

    triggerElement.parentNode.insertBefore(tooltip, triggerElement.nextSibling);

    // Show/hide on hover and focus
    const show = () => {
        tooltip.style.display = 'block';
    };

    const hide = () => {
        tooltip.style.display = 'none';
    };

    triggerElement.addEventListener('mouseenter', show);
    triggerElement.addEventListener('mouseleave', hide);
    triggerElement.addEventListener('focus', show);
    triggerElement.addEventListener('blur', hide);

    return { show, hide, tooltip };
}

/* ============================================
   Global Keyboard Shortcuts
   ============================================ */

function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Skip if user is typing in input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            return;
        }

        // Arrow keys for navigation (if React screen state is available)
        if (e.key === 'ArrowRight' && window.setScreen) {
            e.preventDefault();
            window.setScreen(prev => Math.min(prev + 1, (window.totalScreens || 3)));
            screenReader.announce('Next screen');
        } else if (e.key === 'ArrowLeft' && window.setScreen) {
            e.preventDefault();
            window.setScreen(prev => Math.max(prev - 1, 0));
            screenReader.announce('Previous screen');
        }

        // Home/End for first/last screen
        if (e.key === 'Home' && window.setScreen) {
            e.preventDefault();
            window.setScreen(0);
            screenReader.announce('First screen');
        } else if (e.key === 'End' && window.setScreen) {
            e.preventDefault();
            window.setScreen(window.totalScreens || 3);
            screenReader.announce('Last screen');
        }

        // ? for help (could show keyboard shortcuts)
        if (e.key === '?' && e.shiftKey) {
            e.preventDefault();
            showKeyboardShortcutsHelp();
        }
    });
}

function showKeyboardShortcutsHelp() {
    screenReader.announce('Keyboard shortcuts: Arrow keys to navigate screens, Tab to move between elements, Enter or Space to activate buttons, Escape to close dialogs');
}

/* ============================================
   Initialize Accessibility Features
   ============================================ */

function initializeAccessibility() {
    // Add skip links
    addSkipLinks();

    // Setup global keyboard shortcuts
    setupGlobalKeyboardShortcuts();

    // Add focus outlines for keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // Log accessibility readiness
    console.log('✓ Accessibility features initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
    initializeAccessibility();
}

/* ============================================
   Export for use in other scripts
   ============================================ */

window.ARIAHelpers = ARIAHelpers;
window.keyboardNav = keyboardNav;
window.screenReader = screenReader;
window.focusManager = focusManager;
window.ContrastChecker = ContrastChecker;
window.AccessibleModal = AccessibleModal;
window.makeTooltipAccessible = makeTooltipAccessible;
