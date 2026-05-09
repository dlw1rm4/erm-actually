// LOCAL VARIABLES
const timeout = 5000;

console.log("[content] Script loaded on:", window.location.href);

if (window.location.href.includes("mail.google.com")) {
  console.log("[content] Gmail detected, content script running.");
} else {
  console.log("[content] Not Gmail, content script will not run.");
}

// Make sure the Gmail DOM is fully loaded before trying to access elements
function waitForGmailUI(timeout) {
  return new Promise((resolve, reject) => {
    console.log("[content] Waiting for Gmail UI...");
    const interval = setInterval(() => {
      const inbox = document.querySelector('[role="main"]');
      if (inbox) {
        console.log("[content] Gmail UI ready.");
        clearInterval(interval);
        clearTimeout(timer);
        resolve(inbox);
      }
    }, 200);

    const timer = setTimeout(() => {
      console.warn("[content] Gmail UI not ready within 5s, timing out.");
      clearInterval(interval);
      reject(new Error("Gmail UI not ready within 5s"));
    }, timeout);
  });
}

function getEmailText() {
  const emailBody = document.querySelector(".a3s.aiL");
  if (emailBody) {
    console.log(
      "[content] Email text found, length:",
      emailBody.innerText.length,
    );
    return emailBody.innerText;
  }
  console.warn("[content] No email body found.");
  return null;
}

async function analyzeEmail(text) {
  console.log("[content] Sending email to Gemini API...");

  const apiResponse = await fetch(
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

  const data = await apiResponse.json();
  console.log("[content] Gemini response:", data);
  return data.candidates[0].content.parts[0].text;
}

function showChatbot(output) {
  const existing = document.getElementById("erm-chatbot");
  if (existing) existing.remove();

  const chatbot = document.createElement("div");
  chatbot.id = "erm-chatbot";
  chatbot.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 340px;
        max-height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 16px;
        overflow-y: auto;
        z-index: 99999;
        font-family: sans-serif;
        font-size: 14px;
        line-height: 1.5;
    `;
  chatbot.innerHTML = `
        <div style="font-weight:700;margin-bottom:8px">Erm... Actually!</div>
        <div>${output}</div>
    `;
  document.body.appendChild(chatbot);
  console.log("[content] Chatbot displayed.");
}

function removeChatbot() {
  const chatbot = document.getElementById("erm-chatbot");
  if (chatbot) {
    chatbot.remove();
    console.log("[content] Chatbot removed.");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[content] Message received:", request.action);

  if (request.action === "startDetection") {
    waitForGmailUI(timeout)
      .then(() => {
        const text = getEmailText();
        if (!text) {
          console.warn("[content] No email text found.");
          return;
        }
        analyzeEmail(text).then((output) => showChatbot(output));
      })
      .catch((err) => console.warn("[content] Gmail UI timeout:", err.message));
  }

  if (request.action === "stopDetection") {
    removeChatbot();
  }
});
