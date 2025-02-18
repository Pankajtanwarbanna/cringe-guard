import { CONFIG, ERRORS } from './config.js';
import { debounce, getChromeStorage, processBatch } from './utils.js';
import { apiService } from './api.js';
import { uiService } from './ui.js';

/**
 * Initialize the extension
 * @returns {Promise<void>}
 */
async function initExtension() {
    try {
        // Get API key and enabled status
        const data = await getChromeStorage([
            CONFIG.STORAGE_KEYS.API_KEY,
            CONFIG.STORAGE_KEYS.IS_ENABLED
        ]);

        const apiKey = data[CONFIG.STORAGE_KEYS.API_KEY];
        const isEnabled = data[CONFIG.STORAGE_KEYS.IS_ENABLED] ?? true;

        if (!isEnabled) {
            console.log('Cringe Guard is disabled');
            return;
        }

        if (!apiKey) {
            console.warn(ERRORS.API_KEY_MISSING);
            return;
        }

        // Initialize API service
        apiService.initialize(apiKey);

        // Start processing posts
        processExistingPosts();
        observeNewPosts();

    } catch (error) {
        console.error('Error initializing extension:', error);
    }
}

/**
 * Process a single post
 * @param {HTMLElement} post 
 */
async function processPost(post) {
    try {
        const content = post.innerText.trim();
        if (!content) return;

        const analysis = await apiService.analyzeContent(content);
        
        if (analysis.isCringe) {
            uiService.blurPost(post, analysis.reasons);
            await uiService.updateStats(content);
        }
    } catch (error) {
        console.error('Error processing post:', error);
    }
}

/**
 * Process all existing posts on the page
 */
function processExistingPosts() {
    const posts = document.querySelectorAll(CONFIG.UI.POST_SELECTOR);
    processBatch(Array.from(posts), processPost);
}

/**
 * Create and start MutationObserver for new posts
 */
function observeNewPosts() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const posts = node.querySelectorAll(CONFIG.UI.POST_SELECTOR);
                        processBatch(Array.from(posts), processPost);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
} else {
    initExtension();
}
