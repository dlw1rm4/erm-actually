document.getElementById("check").addEventListener("click", async () => {
    const result = document.getElementById("result");
    result.innerText = "Analyzing...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "getEmail" }, async ({ text }) => {
        if (!text) {
            result.innerText = "No email found. Open an email in Gmail first.";
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