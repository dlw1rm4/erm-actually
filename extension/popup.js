document.addEventListener("DOMContentLoaded", async () => {
    const toggleBtn = document.getElementById("switch");
    const heading = document.getElementById("heading");
    const result = document.getElementById("result");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("[popup] Current tab:", tab.id, tab.url);

    const tabUrl = new URL(tab.url);
    const isGmail = tabUrl.hostname === "mail.google.com";
    const isSpecificEmail = tabUrl.hash.split("/").length >= 2 && tabUrl.hash.split("/")[1].length > 0;
    console.log("[popup] isGmail:", isGmail, "| isSpecificEmail:", isSpecificEmail);

    if (!isGmail) {
        toggleBtn.disabled = true;
        result.innerText = "Please open Gmail to use this extension.";
        console.warn("[popup] Toggle disabled — not on Gmail.");
    } else if (!isSpecificEmail) {
        toggleBtn.disabled = true;
        result.innerText = "Click into a specific email to start analyzing.";
        console.warn("[popup] Toggle disabled — no specific email open.");
    } else {
        toggleBtn.disabled = false;
        console.log("[popup] Toggle enabled — valid email detected.");

        // restore toggle state if same tab
        const stored = await chrome.storage.local.get(["isDetecting", "activeTabUrl"]);
        console.log("[popup] Stored state:", stored);


        if (stored.isDetecting && stored.activeTabUrl === tab.url) {
            toggleBtn.checked = true;
            heading.textContent = "Detecting...";
          console.log("[popup] Restored ON state for tab:", tab.url);
        } else {
          // if not detecting or different email, ensure state is cleared
          await chrome.storage.local.set({ isDetecting: false, activeTabUrl: null });
            console.log("[popup] Different email detected, cleared old state.");
        }
    }

    toggleBtn.addEventListener("change", async () => {
        if (toggleBtn.checked) {
            console.log("[popup] Toggle ON — notifying content script...");
            heading.textContent = "Detecting...";

            // save state with current email URL
            await chrome.storage.local.set({ isDetecting: true, activeTabUrl: tab.url });
            console.log("[popup] Saved ON state for url:", tab.url);

            chrome.tabs.sendMessage(tab.id, { action: "startDetection" });

        } else {
            console.log("[popup] Toggle OFF — stopping detection...");
            heading.textContent = "Start detection:";

            // clear saved state
            await chrome.storage.local.set({ isDetecting: false, activeTabUrl: null });
            console.log("[popup] Cleared detection state.");

            chrome.tabs.sendMessage(tab.id, { action: "stopDetection" });
        }
    });
});