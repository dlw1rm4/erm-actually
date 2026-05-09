function getEmailText() {
    const emailBody = document.querySelector(".a3s.aiL");
    return emailBody ? emailBody.innerText : null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getEmail") {
        sendResponse({ text: getEmailText() });
    }
});