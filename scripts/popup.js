import { CONFIG } from './config.js';
import { getChromeStorage, setChromeStorage } from './utils.js';

/**
 * Popup UI Controller
 */
class PopupController {
    constructor() {
        this.elements = {
            errorCard: null,
            toggleSwitch: null,
            cringeCount: null,
            timeSaved: null,
            settingsButton: null
        };
    }

    /**
     * Initialize the popup
     */
    async init() {
        this.#bindElements();
        this.#attachEventListeners();
        await this.#loadInitialState();
    }

    /**
     * Bind DOM elements
     */
    #bindElements() {
        this.elements.errorCard = document.querySelector('.error-card');
        this.elements.toggleSwitch = document.getElementById('toggle-switch');
        this.elements.cringeCount = document.getElementById('cringe-count');
        this.elements.timeSaved = document.getElementById('time-saved');
        this.elements.settingsButton = document.querySelector('.settings-icon');
    }

    /**
     * Attach event listeners
     */
    #attachEventListeners() {
        // Toggle switch handler
        this.elements.toggleSwitch.addEventListener('change', async () => {
            try {
                await setChromeStorage({
                    [CONFIG.STORAGE_KEYS.IS_ENABLED]: this.elements.toggleSwitch.checked
                });
            } catch (error) {
                console.error('Error saving extension state:', error);
            }
        });

        // Settings button handler
        this.elements.settingsButton.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    /**
     * Load initial state from storage
     */
    async #loadInitialState() {
        try {
            // Get all required data
            const data = await getChromeStorage([
                CONFIG.STORAGE_KEYS.API_KEY,
                CONFIG.STORAGE_KEYS.IS_ENABLED,
                CONFIG.STORAGE_KEYS.CRINGE_COUNT,
                CONFIG.STORAGE_KEYS.TIME_SAVED
            ]);

            // Update API key status
            this.#updateApiKeyStatus(data[CONFIG.STORAGE_KEYS.API_KEY]);

            // Update toggle state
            this.elements.toggleSwitch.checked = data[CONFIG.STORAGE_KEYS.IS_ENABLED] ?? true;

            // Update stats
            this.#updateStats(
                data[CONFIG.STORAGE_KEYS.CRINGE_COUNT] || 0,
                data[CONFIG.STORAGE_KEYS.TIME_SAVED] || 0
            );

        } catch (error) {
            console.error('Error loading initial state:', error);
            this.#showError('Error loading extension state');
        }
    }

    /**
     * Update API key status UI
     * @param {string|null} apiKey 
     */
    #updateApiKeyStatus(apiKey) {
        if (apiKey) {
            this.elements.errorCard.style.display = 'none';
        } else {
            this.elements.errorCard.style.display = 'flex';
        }
    }

    /**
     * Update stats display
     * @param {number} cringeCount 
     * @param {number} timeSaved 
     */
    #updateStats(cringeCount, timeSaved) {
        this.elements.cringeCount.innerText = cringeCount.toString();
        this.elements.timeSaved.innerText = `${Math.ceil(timeSaved)}m`;
    }

    /**
     * Show error message
     * @param {string} message 
     */
    #showError(message) {
        const errorCard = document.createElement('div');
        errorCard.className = 'error-card';
        errorCard.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            ${message}
        `;
        
        document.querySelector('.container').prepend(errorCard);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const popup = new PopupController();
    popup.init();
});