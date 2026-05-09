document.getElementById("check").addEventListener("click", async () => {
    const result = document.getElementById("result");
    result.innerText = "Analyzing...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "getEmail" }, async ({ text }) => {
        if (!text) {
            result.innerText = "No email found. Open an email in Gmail first.";
            return;
        }
    })
})