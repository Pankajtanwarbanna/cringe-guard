document.addEventListener("DOMContentLoaded", function () {
    const apiKeyInput = document.getElementById("api-key");
    const saveButton = document.getElementById("save-button");
    const clearButton = document.getElementById("clear-button");
    const successMessage = document.createElement("p");
    const clearMessage = document.createElement("p");

    successMessage.innerText = "✅ API Key saved successfully!";
    successMessage.style.color = "#0077b5";
    successMessage.style.fontSize = "14px";
    successMessage.style.fontWeight = "500";
    successMessage.style.textAlign = "center";
    successMessage.style.marginTop = "10px";
    successMessage.style.display = "none";


    clearMessage.innerText = "✅ API Key deleted successfully!";
    clearMessage.style.color = "#0077b5";
    clearMessage.style.fontSize = "14px";
    clearMessage.style.fontWeight = "500";
    clearMessage.style.textAlign = "center";
    clearMessage.style.marginTop = "10px";
    clearMessage.style.display = "none";

    document.querySelector(".api-key-section").appendChild(successMessage);
    document.querySelector(".api-key-section").appendChild(clearMessage);

    // Load API key from Chrome storage
    chrome.storage.sync.get("groqApiKey", function (data) {
        if (data.groqApiKey) {
            apiKeyInput.value = data.groqApiKey;
        }
    });

    // Save API key to Chrome storage
    saveButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) return;

        chrome.storage.sync.set({ groqApiKey: apiKey }, function () {
            successMessage.style.display = "block";
            successMessage.style.opacity = "1";

            // Hide message after 3 seconds
            setTimeout(() => {
                successMessage.style.opacity = "0";
                setTimeout(() => {
                    successMessage.style.display = "none";
                }, 300);
            }, 3000);
        });
    });



    // Remove API key to Chrome storage
    clearButton.addEventListener("click", function () {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) return;
        apiKeyInput.value = "";
        chrome.storage.sync.remove("groqApiKey", function () {
            clearMessage.style.display = "block";
            clearMessage.style.opacity = "1";

            // Hide message after 3 seconds
            setTimeout(() => {
                clearMessage.style.opacity = "0";
                setTimeout(() => {
                    clearMessage.style.display = "none";
                }, 300);
            }, 3000);
        });
    });
});
