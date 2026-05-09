document.addEventListener('DOMContentLoaded', () => {
    // TOGGLE SWITCH LOGIC
    document.getElementById("switch").addEventListener("change", async function () {
        const heading = document.getElementById("heading");
        const result = document.getElementById("result");

        // Switch is "ON", start detecting email content logic:
        if (this.checked) {
            heading.textContent = "Detecting...";
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { action: "getEmail" }, async ({ text }) => {
                if (!text) {
                    result.innerText = "No email found. Open an email in Gmail first.";
                    return;
                }
            });
        } else {
            heading.textContent = "Start detection:";
            result.innerText = "";
        }
    });
});