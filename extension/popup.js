document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("switch");
  console.log("Check 1: ", this.checked);
  // TOGGLE SWITCH LOGIC
  document;
  toggleBtn.addEventListener("change", async function () {
    const heading = document.getElementById("heading");
    const result = document.getElementById("result");

    // Switch is "ON", start detecting email content logic:
    if (this.checked) {
      console.log("Check 2: ", this.checked);
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
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBPYkR62S1gLg0nDS2csp3ckexUxycLfXk",
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
      console.log("Check 3: ", this.checked);
      heading.textContent = "Start detection:";
      result.innerText = "";
      return;
    }
  });
});
