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
  }

  toggleBtn.addEventListener("change", async () => {
    if (toggleBtn.checked) {
      console.log("[popup] Toggle ON — notifying content script...");
      heading.textContent = "Detecting...";

      chrome.tabs.sendMessage(tab.id, { action: "startDetection" });

    } else {
      console.log("[popup] Toggle OFF — stopping detection...");
      heading.textContent = "Start detection:";
      chrome.tabs.sendMessage(tab.id, { action: "stopDetection" });
    }
  });
});