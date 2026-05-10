let lastToggleTime = 0;
const COOLDOWN = 3000;
let cooldownTimer = null;
let isRestoring = false;
let previousState = false;

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

    const stored = await chrome.storage.local.get(["isDetecting", "activeTabUrl"]);
    console.log("[popup] Stored state:", stored);

    if (stored.isDetecting && stored.activeTabUrl === tab.url) {
      isRestoring = true;
      toggleBtn.checked = true;
      previousState = true;
      heading.textContent = "Detecting...";
      isRestoring = false;
      console.log("[popup] Restored ON state for url:", tab.url);

      try {
        chrome.tabs.sendMessage(tab.id, { action: "isChatbotVisible" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[popup] Content script not ready:", chrome.runtime.lastError.message);
            return;
          }
          if (!response?.visible) {
            console.log("[popup] Chatbot not visible, re-sending startDetection.");
            chrome.tabs.sendMessage(tab.id, { action: "startDetection" });
          } else {
            console.log("[popup] Chatbot already visible, skipping request.");
          }
        });
      } catch (err) {
        console.warn("[popup] Could not reach content script:", err.message);
      }
    } else {
      await chrome.storage.local.set({ isDetecting: false, activeTabUrl: null });
      console.log("[popup] Cleared old state.");
    }
  }

  toggleBtn.addEventListener("change", async () => {
    if (isRestoring) return;

    if (toggleBtn.checked === previousState) {
      console.log("[popup] State unchanged, ignoring.");
      return;
    }
    previousState = toggleBtn.checked;

    const now = Date.now();
    if (now - lastToggleTime < COOLDOWN) {
      console.warn("[popup] Cooldown active, reverting toggle.");
      toggleBtn.checked = false;
      previousState = false;
      toggleBtn.disabled = true;

      const remaining = Math.ceil((COOLDOWN - (now - lastToggleTime)) / 1000);
      let count = remaining;
      heading.textContent = `Please wait ${count}s...`;

      clearInterval(cooldownTimer);
      cooldownTimer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(cooldownTimer);
          toggleBtn.disabled = false;
          heading.textContent = "Start detection:";
          console.log("[popup] Cooldown finished, toggle re-enabled.");
        } else {
          heading.textContent = `Please wait ${count}s...`;
        }
      }, 1000);

      return;
    }
    lastToggleTime = now;

    if (toggleBtn.checked) {
      console.log("[popup] Toggle ON — notifying content script...");
      heading.textContent = "Detecting...";
      await chrome.storage.local.set({ isDetecting: true, activeTabUrl: tab.url });
      console.log("[popup] Saved ON state for url:", tab.url);
      chrome.tabs.sendMessage(tab.id, { action: "startDetection" });
    } else {
      console.log("[popup] Toggle OFF — stopping detection...");
      heading.textContent = "Start detection:";
      await chrome.storage.local.set({ isDetecting: false, activeTabUrl: null });
      console.log("[popup] Cleared detection state.");
      chrome.tabs.sendMessage(tab.id, { action: "stopDetection" });
    }
  });
});