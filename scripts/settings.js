import { CONFIG } from './config.js';
import { getChromeStorage, setChromeStorage } from './utils.js';

/**
 * Settings UI Controller
 */
class SettingsController {
    constructor() {
        this.elements = {
            apiKeyInput: null,
            saveButton: null,
            successMessage: null,
            container: null
        };
    }

    /**
     * Initialize the settings page
     */
    async init() {
        this.#bindElements();
        this.#createSuccessMessage();
        this.#attachEventListeners();
        await this.#loadInitialState();
    }

    /**
     * Bind DOM elements
     */
    #bindElements() {
        this.elements.apiKeyInput = document.getElementById('api-key');
        this.elements.saveButton = document.getElementById('save-button');
        this.elements.container = document.querySelector('.api-key-section');
    }

    /**
     * Create success message element
     */
    #createSuccessMessage() {
        const successMessage = document.createElement('p');
        successMessage.innerText = '✅ API Key saved successfully!';
        successMessage.style.cssText = `
            color: #0077b5;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            margin-top: 10px;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;

        this.elements.successMessage = successMessage;
        this.elements.container.appendChild(successMessage);
    }

    /**
     * Attach event listeners
     */
    #attachEventListeners() {
        // Save button handler
        this.elements.saveButton.addEventListener('click', async () => {
            await this.#saveApiKey();
        });

        // Enter key handler
        this.elements.apiKeyInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                await this.#saveApiKey();
            }
        });

        // Input validation
        this.elements.apiKeyInput.addEventListener('input', () => {
            this.#validateInput();
        });
    }

    /**
     * Load initial state from storage
     */
    async #loadInitialState() {
        try {
            const data = await getChromeStorage([CONFIG.STORAGE_KEYS.API_KEY]);
            if (data[CONFIG.STORAGE_KEYS.API_KEY]) {
                this.elements.apiKeyInput.value = data[CONFIG.STORAGE_KEYS.API_KEY];
                this.#validateInput();
            }
        } catch (error) {
            console.error('Error loading API key:', error);
            this.#showError('Error loading API key');
        }
    }

    /**
     * Save API key to storage
     */
    async #saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        
        if (!this.#validateInput()) {
            return;
        }

        try {
            await setChromeStorage({
                [CONFIG.STORAGE_KEYS.API_KEY]: apiKey
            });
            
            this.#showSuccess();
        } catch (error) {
            console.error('Error saving API key:', error);
            this.#showError('Error saving API key');
        }
    }

    /**
     * Validate input field
     * @returns {boolean}
     */
    #validateInput() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        const isValid = apiKey.length > 0;
        
        this.elements.saveButton.disabled = !isValid;
        this.elements.apiKeyInput.style.borderColor = isValid ? '#e5e7eb' : '#ef4444';
        
        return isValid;
    }

    /**
     * Show success message
     */
    #showSuccess() {
        this.elements.successMessage.style.display = 'block';
        // Force reflow
        this.elements.successMessage.offsetHeight;
        this.elements.successMessage.style.opacity = '1';

        setTimeout(() => {
            this.elements.successMessage.style.opacity = '0';
            setTimeout(() => {
                this.elements.successMessage.style.display = 'none';
            }, 300);
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message 
     */
    #showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-top: 12px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        errorDiv.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            ${message}
        `;

        this.elements.container.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const settings = new SettingsController();
    settings.init();
});
