function getApiKeyIfEnabled() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["groqApiKey", "isEnabled"], (data) => {
            if (data.isEnabled && data.groqApiKey) {
                resolve(data.groqApiKey);
            } else {
                console.warn("GROQ API key not found or extension is disabled.");
                resolve(null);
            }
        });
    });
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

async function initExtension() {
    const apiKey = await getApiKeyIfEnabled();
    if (!apiKey) {
        console.warn("GROQ API key not found. Please set your API key in the extension settings.");
        return; // Stop execution if no API key
    }

    // Clean up expired job posts (older than 24 hours)
    cleanupExpiredJobPosts();
    
    cringeGuardExistingPosts();
    observeNewPosts();
}

function estimateTimeSavedInSeconds(postText) {
    const wordCount = postText.split(/\s+/).length;

    if (wordCount <= 20) return 5;   // Short posts (~5 sec saved)
    if (wordCount <= 50) return 10;  // Medium posts (~10 sec saved)
    return 20;                       // Long posts (~20 sec saved)
}

function updateCringeStats(postText) {
    chrome.storage.sync.get(["cringeCount", "timeSavedInMinutes"], (data) => {
        const newCount = (data.cringeCount || 0) + 1;
        const estimatedTimeSavedInSeconds = estimateTimeSavedInSeconds(postText);

        const newTimeSavedInMinutes = parseFloat(data.timeSavedInMinutes || 0) + estimatedTimeSavedInSeconds / 60; // Convert to minutes

        chrome.storage.sync.set({ cringeCount: newCount, timeSavedInMinutes: newTimeSavedInMinutes });
    });
}

function saveAIJobPost(post, postText, modelOutput) {
    const timestamp = new Date().toISOString();
    
    // Extract email, phone, and links using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    
    const email = (postText.match(emailRegex) || [""])[0];
    const phone = (postText.match(phoneRegex) || [""])[0];
    const links = postText.match(linkRegex) || [];
    
    const jobPost = {
        content: postText,
        timestamp: timestamp,
        modelOutput: modelOutput,
        email: email,
        phone: phone,
        links: links
    };

    chrome.storage.local.get(['aiJobPosts'], (data) => {
        let posts = data.aiJobPosts || [];
        posts.push(jobPost);
        chrome.storage.local.set({ aiJobPosts: posts });
    });
}

function cleanupExpiredJobPosts() {
    chrome.storage.local.get(['aiJobPosts'], (data) => {
        if (!data.aiJobPosts) return;
        
        const now = new Date();
        const filteredPosts = data.aiJobPosts.filter(post => {
            const postDate = new Date(post.timestamp);
            const hoursDiff = (now - postDate) / (1000 * 60 * 60);
            return hoursDiff < 24; // Keep posts less than 24 hours old
        });
        
        chrome.storage.local.set({ aiJobPosts: filteredPosts });
    });
}

function cringeGuardThisPost(post) {
    const parentDiv = post.closest('.feed-shared-update-v2__control-menu-container');

    if (parentDiv) {
        const wrapper = document.createElement('div');
        while (parentDiv.firstChild) {
            wrapper.appendChild(parentDiv.firstChild);
        }

        wrapper.style.filter = 'blur(10px)';
        wrapper.style.transition = 'all 0.3s ease';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.opacity = '0.95';

        parentDiv.style.position = 'relative';

        const button = document.createElement('button');
        button.innerText = 'Click to View';
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style.left = '50%';
        button.style.transform = 'translate(-50%, -50%)';
        button.style.zIndex = '10';
        button.style.backgroundColor = '#0a66c2';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '12px 24px';
        button.style.fontSize = '14px';
        button.style.borderRadius = '24px';
        button.style.cursor = 'pointer';
        button.style.fontWeight = '600';
        button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        button.style.transition = 'all 0.2s ease';

        button.onmouseover = () => {
            button.style.backgroundColor = '#004182';
            button.style.boxShadow = '0 0 12px rgba(0,0,0,0.15)';
        };

        button.onmouseout = () => {
            button.style.backgroundColor = '#0a66c2';
            button.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        };

        button.addEventListener('click', () => {
            wrapper.style.filter = '';
            wrapper.style.opacity = '1';
            button.style.display = 'none';
        });

        parentDiv.appendChild(wrapper);
        parentDiv.appendChild(button);
    }
}

function highlightAIJobPost(post) {
    const parentDiv = post.closest('.feed-shared-update-v2__control-menu-container');

    if (parentDiv) {
        // Create a wrapper div to apply the teal background highlight
        const wrapper = document.createElement('div');
        while (parentDiv.firstChild) {
            wrapper.appendChild(parentDiv.firstChild);
        }

        // Apply teal background with slight transparency
        wrapper.style.backgroundColor = 'rgba(0, 128, 128, 0.1)'; // Teal color with transparency
        wrapper.style.transition = 'all 0.3s ease';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.style.borderRadius = '8px';
        wrapper.style.border = '2px solid rgba(0, 128, 128, 0.7)'; // Teal border
        wrapper.style.boxShadow = '0 0 10px rgba(0, 128, 128, 0.3)'; // Teal shadow

        parentDiv.style.position = 'relative';
        
        // Add a small badge indicating it's an AI job post
        const badge = document.createElement('div');
        badge.innerText = 'AI Job';
        badge.style.position = 'absolute';
        badge.style.top = '10px';
        badge.style.right = '10px';
        badge.style.backgroundColor = 'magenta'; // magenta background
        badge.style.color = 'white';
        badge.style.padding = '3px 8px';
        badge.style.borderRadius = '12px';
        badge.style.fontSize = '12px';
        badge.style.fontWeight = 'bold';
        badge.style.zIndex = '5';
        
        parentDiv.appendChild(wrapper);
        parentDiv.appendChild(badge);
    }
}

async function analyzePost(post) {
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const apiKey = await getApiKeyIfEnabled();
    if (!apiKey) return { type: 'GENERAL_POST' }; // Stop execution if no API key

    const postText = post.innerText.trim();
    
    const SYSTEM_PROMPT = `
        You are a LinkedIn post analyzer. Your job is to categorize posts into one of three categories:
        
        1. CRINGE_POST: Posts that meet any of the following criteria:
           - Selling a course, and using some emotional unrelated story
           - Overly emotional or clickbait stories with no tech-related content
           - Using "life lessons" or motivational quotes that aren't tied to personal growth in tech or learning
           - Non-tech political or social commentary that doesn't add value to professional discussions
           - Posts that are purely personal (vacations, family pictures) without a professional context
           - Asking to "Comment 'interested' if you want to get the job!"
           - "Tag 3 people" or "like if you agree" with no substance or tech-related discussions
           - Generalized or redundant content
           - Any brand promotional content / Ad
           - Overly generic advice like "Keep learning every day" without mentioning any specific tools, frameworks, or learning paths
           - Anything that's just a viral meme or random content not related to a professional or technical goal
           - Overly personal or TMI content
           - Excessive self-promotion or bragging
           - Inappropriate workplace behavior
           - Forced or artificial inspiration
           - Obvious humble bragging
           - Inappropriate emotional display for professional setting
           - Contains misleading or out-of-context information
        
        2. AI_JOB_POST: Posts that are primarily about someone offering to  hire for AI-related positions or roles, including:
           - Job postings looking for AI ML, NLP, Gen AI, Computer Vision, data scientists, ML engineers, etc.
           - Genuinely looking for AI related talent
           - Recruitment posts for AI-ML Data  science related positions
           - Posts mentioning hiring for roles involving AI, machine learning, LLMs, etc.
        
        3. GENERAL_POST: Any post that doesn't fall into the above categories.
        
        Analyze the post and respond with exactly one of: CRINGE_POST, AI_JOB_POST, or GENERAL_POST.
    `;

    let modelOutput = '';
    let postType = 'GENERAL_POST';
    
    try {
        // Make API request
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gemma2-9b-it",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: "LinkedIn Post:\n\n" + postText + "\n\nCategorize this post as either CRINGE_POST, AI_JOB_POST, or GENERAL_POST." }
                ],
                temperature: 0.1 // Lowering temperature for more consistent responses
            })
        });

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            return { type: 'GENERAL_POST' };
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error('Unexpected API response format:', data);
            return { type: 'GENERAL_POST' };
        }
        
        modelOutput = data.choices[0].message.content.toLowerCase();
        
        // Determine post type
        if (modelOutput.includes('cringe_post')) {
            postType = 'CRINGE_POST';
        } else if (modelOutput.includes('ai_job_post')) {
            postType = 'AI_JOB_POST';
        }
        
        // Handle post based on its type
        if (postType === 'CRINGE_POST') {
            cringeGuardThisPost(post);
            updateCringeStats(postText);
        } else if (postType === 'AI_JOB_POST') {
            highlightAIJobPost(post);
            saveAIJobPost(post, postText, modelOutput);
        }
        
    } catch (error) {
        console.error('Error analyzing post:', error);
        // Keep the default GENERAL_POST type in case of errors
    }
    
    return { type: postType, modelOutput: modelOutput };
}

async function checkForCringe(post) {
    const result = await analyzePost(post);
    return result.type === 'CRINGE_POST';
}

const debouncedCheckForCringe = debounce(checkForCringe, 1000);

function cringeGuardExistingPosts() {
    const posts = document.querySelectorAll('.update-components-update-v2__commentary');
    for (const post of posts) {
        debouncedCheckForCringe(post);
    }
}

function observeNewPosts() {
    const alreadyProcessedPosts = new Set();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const posts = node.querySelectorAll('.update-components-update-v2__commentary');
                        for (const post of posts) {
                            if (!alreadyProcessedPosts.has(post)) {
                                alreadyProcessedPosts.add(post);
                                checkForCringe(post);
                            }
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

initExtension();
