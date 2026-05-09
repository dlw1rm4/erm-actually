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
            return;
        }

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDntlgaSGehodDB1up1yZPZE8uyTmEG_MA',
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'You are a fact-checker. Analyze this email and identify claims that are false, misleading, or unverified. Be concise and specific.\n\nEmail:\n${text}'
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        result.innerText = data.candidates[0].content.parts[0].text;
    })
})
