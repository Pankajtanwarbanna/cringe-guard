import { CONFIG, ERRORS } from './config.js';

// Cache implementation
const cache = new Map();

/**
 * Debounce function with proper typing
 * @template T
 * @param {(...args: any[]) => Promise<T> | void} func 
 * @param {number} wait 
 * @returns {(...args: any[]) => void}
 */
export function debounce(func, wait) {
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

/**
 * Safely access chrome storage with error handling
 * @template T
 * @param {string[]} keys 
 * @returns {Promise<T>}
 */
export function getChromeStorage(keys) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(ERRORS.STORAGE_ERROR));
                } else {
                    resolve(result);
                }
            });
        } catch (error) {
            reject(new Error(ERRORS.STORAGE_ERROR));
        }
    });
}

/**
 * Safely set chrome storage with error handling
 * @param {Record<string, any>} items 
 * @returns {Promise<void>}
 */
export function setChromeStorage(items) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set(items, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(ERRORS.STORAGE_ERROR));
                } else {
                    resolve();
                }
            });
        } catch (error) {
            reject(new Error(ERRORS.STORAGE_ERROR));
        }
    });
}

/**
 * Cache API responses
 * @template T
 * @param {string} key 
 * @param {T} value 
 */
export function setCache(key, value) {
    cache.set(key, {
        value,
        timestamp: Date.now()
    });
}

/**
 * Get cached value if not expired
 * @template T
 * @param {string} key 
 * @returns {T | null}
 */
export function getCache(key) {
    const cached = cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CONFIG.API.CACHE_DURATION;
    if (isExpired) {
        cache.delete(key);
        return null;
    }

    return cached.value;
}

/**
 * Retry a function with exponential backoff
 * @template T
 * @param {() => Promise<T>} fn 
 * @param {number} maxRetries 
 * @returns {Promise<T>}
 */
export async function retry(fn, maxRetries = CONFIG.API.MAX_RETRIES) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.message.includes('rate limit')) {
                const delay = CONFIG.API.RETRY_DELAY * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw lastError;
}

/**
 * Sanitize text content
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeText(text) {
    return text
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
}

/**
 * Estimate time saved based on post length
 * @param {string} postText 
 * @returns {number}
 */
export function estimateTimeSaved(postText) {
    const wordCount = postText.split(/\s+/).length;
    if (wordCount <= 20) return 5;   // Short posts (~5 sec saved)
    if (wordCount <= 50) return 10;  // Medium posts (~10 sec saved)
    return 20;                       // Long posts (~20 sec saved)
}

/**
 * Process posts in batches
 * @template T
 * @param {T[]} items 
 * @param {(item: T) => Promise<void>} processor 
 */
export async function processBatch(items, processor) {
    const batches = [];
    for (let i = 0; i < items.length; i += CONFIG.API.BATCH_SIZE) {
        batches.push(items.slice(i, i + CONFIG.API.BATCH_SIZE));
    }

    for (const batch of batches) {
        await Promise.all(batch.map(processor));
    }
}