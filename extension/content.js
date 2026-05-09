// LOCAL VARIABLES
const timeout = 5000; // 5 seconds

// TEST URL location
if (window.location.href.includes("mail.google.com")) {
    console.log("Check 2: Gmail detected, content script running.");
} else {
    console.log("Check 3: Not Gmail, content script will not run.");
}

// Make sure the Gmail DOM is fully loaded before trying to access elements
function waitForGmailUI(timeout) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const inbox = document.querySelector('[role="main"]');

      if (inbox) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve(inbox);
      }
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Gmail UI not ready within 5s"));
    }, timeout);
  });
}


function getEmailText() {
    const emailBody = document.querySelector(".a3s.aiL");
    return emailBody ? emailBody.innerText : null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getEmail") {
        sendResponse({ text: getEmailText() });
    }
});