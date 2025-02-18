// Configuration constants
export const CONFIG = {
    API: {
        GROQ_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
        MODEL: 'gemma2-9b-it',
        TEMPERATURE: 0.1,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        BATCH_SIZE: 5,
        CACHE_DURATION: 1000 * 60 * 60, // 1 hour
    },
    STORAGE_KEYS: {
        API_KEY: 'groqApiKey',
        IS_ENABLED: 'isEnabled',
        CRINGE_COUNT: 'cringeCount',
        TIME_SAVED: 'timeSavedInMinutes',
        CUSTOM_CRITERIA: 'customCriteria',
    },
    UI: {
        DEBOUNCE_DELAY: 500,
        POST_SELECTOR: '.update-components-update-v2__commentary',
        BLUR_AMOUNT: '10px',
        ANIMATION_DURATION: '0.3s',
    },
    DEFAULT_CRITERIA: [
        'Selling a course with emotional unrelated story',
        'Overly emotional or clickbait stories with no tech-related content',
        'Using "life lessons" or motivational quotes without tech context',
        'Non-tech political or social commentary',
        'Purely personal posts without professional context',
        'Engagement bait ("Comment interested", "Tag 3 people")',
        'Generic advice without specific actionable items',
        'Brand promotional content / Ads',
        'Content likely written by AI/LLM',
        'Excessive self-promotion or bragging',
        'Inappropriate workplace behavior',
        'Forced or artificial inspiration',
        'Obvious humble bragging',
        'Inappropriate emotional display',
        'Misleading or out-of-context information'
    ]
};

// Error messages
export const ERRORS = {
    API_KEY_MISSING: 'GROQ API key not found. Please set your API key in the extension settings.',
    API_ERROR: 'Error analyzing post content:',
    RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    STORAGE_ERROR: 'Error accessing extension storage.',
};