document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("switch");
  const heading = document.getElementById("heading");
  const result = document.getElementById("result");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("[popup] Raw tab object:", tab);
  console.log("[popup] tab.url:", tab.url);


  const isGmail = /^https:\/\/mail\.google\.com\//.test(tab.url);
  const isSpecificEmail = /mail\.google\.com\/mail\/u\/\d+\/#\w+\/[A-Za-z0-9]+$/.test(tab.url); //mail.google.com/mail/u/<number>/#<section>/<message-id>
  console.log("[popup] isGmail:", isGmail, "| isSpecificEmail:", isSpecificEmail);

  if (!isGmail) { // Not on Gmail
    toggleBtn.disabled = true;
    result.innerText = "Please open your Gmail to use this extension.";
    console.warn("[popup] Toggle disabled — not on Gmail.");
  } else if (!isSpecificEmail) {
    toggleBtn.disabled = true;
    result.innerText = "Click into a specific email to start analyzing.";
    console.warn("[popup] Toggle disabled — no specific email open.");
  } else {
    toggleBtn.disabled = false;
    console.log("[popup] Toggle enabled — valid email detected.");
  }

  // TOGGLE SWITCH LOGIC
  toggleBtn.addEventListener("change", async () => {
    if (toggleBtn.checked) {
      console.log("[popup] Toggle ON — requesting email content...");
      heading.textContent = "Detecting...";

      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: "getEmail" });
        console.log("[popup] Received email content:", response);

        if (!response?.text) { //If nothing on email content
          result.innerText = "No email found. Open an email in Gmail first.";
          console.warn("[popup] Can't read email content.");
          return;
        }

        result.innerText = "Analyzing...";
        console.log("[popup] Received email content:", response.text);

        const apiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDntlgaSGehodDB1up1yZPZE8uyTmEG_MA",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a fact-checker. Analyze this email and identify claims that are false, misleading, or unverified. Be concise and specific.\n\nEmail:\n${response.text}`,
                }],
              }],
            }),
          }
        );

        const data = await apiResponse.json();
        console.log("[popup] Gemini response:", data);
        result.innerText = data.candidates[0].content.parts[0].text;

      } catch (err) {
        console.error("[popup] Error:", err);
        result.innerText = "Something went wrong. Try refreshing the Gmail tab.";
      }

    } else {
      console.log("[popup] Toggle OFF");
      heading.textContent = "Start detection:";
      result.innerText = "";
    }
  });
});
