// LOCAL VARIABLES
const timeout = 5000;
let isAnalyzing = false;


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

  const header = document.createElement("div");
  header.className = "chatbot-header";

  const title = document.createElement("div");
  title.className = "chatbot-title";
  title.textContent = "Erm... Actually!";

  const closeBtn = document.createElement("button");
  closeBtn.className = "chatbot-close";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => {
    chatbot.remove();
    chrome.storage.local.set({ isDetecting: false, activeTabUrl: null });
    console.log("[content] Chatbot closed by user.");
  });

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "chatbot-body";
  body.textContent = output;

  chatbot.appendChild(header);
  chatbot.appendChild(body);
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
    if (isAnalyzing) {
      console.warn("[content] Already analyzing, ignoring duplicate request.");
      return;
    }
    isAnalyzing = true;

    waitForGmailUI(timeout)
      .then(() => {
        const text = getEmailText();
        if (!text) {
          console.warn("[content] No email text found.");
          isAnalyzing = false;
          return;
        }
        analyzeEmail(text)
          .then((output) => {
            showChatbot(output);
            isAnalyzing = false;
          })
          .catch((err) => {
            console.error("[content] Analysis error:", err);
            isAnalyzing = false;
          });
      })
      .catch((err) => {
        console.warn("[content] Gmail UI timeout:", err.message);
        isAnalyzing = false;
      });
  }

  if (request.action === "stopDetection") {
    isAnalyzing = false;
    removeChatbot();
  }
});
