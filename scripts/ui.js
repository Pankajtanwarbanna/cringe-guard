import { CONFIG } from './config.js';
import { getChromeStorage, setChromeStorage } from './utils.js';

/**
 * UI Service for handling DOM manipulations and visual effects
 */
class UiService {
    constructor() {
        this.processedPosts = new Set();
    }

    /**
     * Create blur overlay for cringe content
     * @param {HTMLElement} post 
     * @param {string[]} reasons 
     */
    blurPost(post, reasons) {
        const parentDiv = post.closest('.feed-shared-update-v2__control-menu-container');
        if (!parentDiv || this.processedPosts.has(post)) return;

        // Create wrapper for the post content
        const wrapper = document.createElement('div');
        while (parentDiv.firstChild) {
            wrapper.appendChild(parentDiv.firstChild);
        }

        // Apply blur effect
        wrapper.style.cssText = `
            filter: blur(${CONFIG.UI.BLUR_AMOUNT});
            transition: all ${CONFIG.UI.ANIMATION_DURATION} ease;
            width: 100%;
            height: 100%;
            position: relative;
            opacity: 0.95;
        `;

        parentDiv.style.position = 'relative';

        // Create "Click to View" button
        const button = this.#createViewButton();
        
        // Create reasons tooltip
        const tooltip = this.#createReasonTooltip(reasons);

        // Add event listeners
        button.addEventListener('click', () => {
            wrapper.style.filter = '';
            wrapper.style.opacity = '1';
            button.style.display = 'none';
            tooltip.style.display = 'none';
        });

        button.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translate(-50%, -120%) scale(1)';
        });

        button.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translate(-50%, -110%) scale(0.95)';
        });

        // Append elements
        parentDiv.appendChild(wrapper);
        parentDiv.appendChild(button);
        parentDiv.appendChild(tooltip);

        this.processedPosts.add(post);
    }

    /**
     * Create styled button element
     * @returns {HTMLButtonElement}
     */
    #createViewButton() {
        const button = document.createElement('button');
        button.innerText = 'Click to View';
        button.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            background-color: #0a66c2;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 14px;
            border-radius: 24px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
        `;

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#004182';
            button.style.boxShadow = '0 0 12px rgba(0,0,0,0.15)';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#0a66c2';
            button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        });

        return button;
    }

    /**
     * Create tooltip with reasons
     * @param {string[]} reasons 
     * @returns {HTMLDivElement}
     */
    #createReasonTooltip(reasons) {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -110%) scale(0.95);
            background-color: #1f2937;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 280px;
            opacity: 0;
            transition: all 0.2s ease;
            z-index: 20;
            pointer-events: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        const title = document.createElement('div');
        title.textContent = 'Why was this hidden?';
        title.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            color: #e5e7eb;
        `;

        const reasonsList = document.createElement('ul');
        reasonsList.style.cssText = `
            margin: 0;
            padding-left: 16px;
            color: #d1d5db;
        `;

        reasons.forEach(reason => {
            const li = document.createElement('li');
            li.textContent = reason;
            reasonsList.appendChild(li);
        });

        tooltip.appendChild(title);
        tooltip.appendChild(reasonsList);

        return tooltip;
    }

    /**
     * Update stats in storage
     * @param {string} postText 
     */
    async updateStats(postText) {
        try {
            const data = await getChromeStorage([
                CONFIG.STORAGE_KEYS.CRINGE_COUNT,
                CONFIG.STORAGE_KEYS.TIME_SAVED
            ]);

            const newCount = (data[CONFIG.STORAGE_KEYS.CRINGE_COUNT] || 0) + 1;
            const newTimeSaved = (data[CONFIG.STORAGE_KEYS.TIME_SAVED] || 0) + 
                (estimateTimeSaved(postText) / 60); // Convert to minutes

            await setChromeStorage({
                [CONFIG.STORAGE_KEYS.CRINGE_COUNT]: newCount,
                [CONFIG.STORAGE_KEYS.TIME_SAVED]: newTimeSaved
            });
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Export singleton instance
export const uiService = new UiService();