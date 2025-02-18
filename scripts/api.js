import { CONFIG, ERRORS } from './config.js';
import { retry, getCache, setCache, sanitizeText } from './utils.js';

/**
 * API Service for handling GROQ API interactions
 */
class ApiService {
    constructor() {
        this.apiKey = null;
    }

    /**
     * Initialize the API service with the API key
     * @param {string} apiKey 
     */
    initialize(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if the service is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return Boolean(this.apiKey);
    }

    /**
     * Generate system prompt for content analysis
     * @returns {string}
     */
    #generateSystemPrompt() {
        return `
            You are a LinkedIn post analyzer. Your job is to determine if a post meets the following criteria:
            ${CONFIG.DEFAULT_CRITERIA.map(criteria => `- ${criteria}`).join('\n')}

            If any of the above criteria are met, the post should be considered as a cringe post.
            Analyze the post and respond with ONLY one of these formats:
            - "true: reason1, reason2, reason3" (if cringe)
            - "false: reason1, reason2, reason3" (if not cringe)
        `.trim();
    }

    /**
     * Analyze post content for cringe detection
     * @param {string} content 
     * @returns {Promise<{isCringe: boolean, reasons: string[]}>}
     */
    async analyzeContent(content) {
        if (!this.isInitialized()) {
            throw new Error(ERRORS.API_KEY_MISSING);
        }

        const sanitizedContent = sanitizeText(content);
        const cacheKey = `analysis_${sanitizedContent}`;
        const cachedResult = getCache(cacheKey);
        
        if (cachedResult) {
            return cachedResult;
        }

        try {
            const response = await retry(async () => {
                const result = await fetch(CONFIG.API.GROQ_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: CONFIG.API.MODEL,
                        messages: [
                            { role: "system", content: this.#generateSystemPrompt() },
                            { role: "user", content: sanitizedContent }
                        ],
                        temperature: CONFIG.API.TEMPERATURE
                    })
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        throw new Error(ERRORS.RATE_LIMIT);
                    }
                    throw new Error(`${ERRORS.API_ERROR} ${response.status}`);
                }

                return response.json();
            });

            const analysisText = response.choices[0].message.content.toLowerCase();
            const [result, reasonsText] = analysisText.split(':').map(s => s.trim());
            const reasons = reasonsText ? reasonsText.split(',').map(r => r.trim()) : [];
            
            const analysis = {
                isCringe: result === 'true',
                reasons
            };

            setCache(cacheKey, analysis);
            return analysis;

        } catch (error) {
            console.error(`${ERRORS.API_ERROR} ${error.message}`);
            throw error;
        }
    }
}

// Export singleton instance
export const apiService = new ApiService();