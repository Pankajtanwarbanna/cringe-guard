document.addEventListener("DOMContentLoaded", function () {
    // check the stored API key when popup opens
    chrome.storage.sync.get("groqApiKey", function (data) {
        const errorCard = document.querySelector(".error-card");

        if (data.groqApiKey) {
            errorCard.style.display = "none";
        }
    });

    // toggle switch for cringe guard
    const toggleSwitch = document.getElementById("toggle-switch");

    // Load initial state from Chrome storage
    chrome.storage.sync.get("isEnabled", function (data) {
        toggleSwitch.checked = data.isEnabled ?? false; // Default to false
    });

    // Listen for toggle changes
    toggleSwitch.addEventListener("change", function () {
        chrome.storage.sync.set({ isEnabled: toggleSwitch.checked });
    });

    chrome.storage.sync.get(["cringeCount", "timeSavedInMinutes"], function (data) {
        document.getElementById("cringe-count").innerText = data.cringeCount || 0;
        document.getElementById("time-saved").innerText = Math.ceil(data.timeSavedInMinutes || 0) + "m";
    });

    // Check for AI job posts and update UI
    updateAIJobPostsSection();

    // Add event listener for download button
    const downloadButton = document.getElementById("download-jobs");
    downloadButton.addEventListener("click", downloadAIJobPosts);

    // take user to the settings page
    const settingsButton = document.querySelector('.settings-icon');
    settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});

// Function to update the AI job posts section
function updateAIJobPostsSection() {
    chrome.storage.local.get(['aiJobPosts'], function(data) {
        const jobPosts = data.aiJobPosts || [];
        const jobPostsSection = document.querySelector('.ai-jobs-section');
        const jobCountElement = document.querySelector('.job-count');
        
        if (jobPosts.length > 0) {
            jobPostsSection.style.display = 'block';
            jobCountElement.textContent = jobPosts.length;
        } else {
            jobPostsSection.style.display = 'none';
        }
    });
}

// Function to download AI job posts as JSON
function downloadAIJobPosts() {
    chrome.storage.local.get(['aiJobPosts'], function(data) {
        const jobPosts = data.aiJobPosts || [];
        
        if (jobPosts.length === 0) {
            return;
        }
        
        // Format the date for the filename
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Create the export data with date
        const exportData = {
            date: today.toISOString(),
            posts: jobPosts
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `ai_jobs_${dateString}.json`;
        
        // Trigger download and cleanup
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        // Clear the stored job posts after download
        chrome.storage.local.set({ aiJobPosts: [] });
        
        // Update the UI to reflect the empty job posts
        updateAIJobPostsSection();
    });
}