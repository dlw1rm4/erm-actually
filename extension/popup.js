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

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getEmail" },
        async ({ text }) => {
          if (!text) {
            result.innerText = "No email found. Open an email in Gmail first.";
            return;
          }
          const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBPYkR62S1gLg0nDS2csp3ckexUxycLfXk",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are a fact-checker. Analyze this email and identify claims that are false, misleading, or unverified. Be concise and specific.\n\nEmail:\n${text}`,
                      },
                    ],
                  },
                ],
              }),
            },
          );

          const data = await response.json();
          result.innerText = data.candidates[0].content.parts[0].text;
        },
      );
    } else {
      console.log("[popup] Toggle OFF — stopping detection...");
      heading.textContent = "Start detection:";
      chrome.tabs.sendMessage(tab.id, { action: "stopDetection" });
    }
  });
});