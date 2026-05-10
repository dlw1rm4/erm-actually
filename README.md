# Erm... Actually! 🔍

A Chrome extension that fact-checks political and scam emails using AI, with an interactive chatbot for follow-up questions.

---

## Overview

Erm... Actually! is a Chrome extension that automatically analyzes emails open in Gmail and identifies false, misleading, or unverified claims using the Gemini AI API. When detection is toggled on, a chatbot appears on the Gmail page with a bullet-point breakdown of the email's claims, and users can ask follow-up questions about the content.

---

## File Structure

```
extension/
├── manifest.json         # Extension config, permissions, content scripts
├── popup.html            # Extension popup UI
├── popup.js              # Toggle logic, URL validation, state persistence
├── popup.css             # Styles for popup and injected chatbot
├── content.js            # Email reading, API calls, chatbot rendering
├── config.js             # API key (gitignored, never committed)
└── images/
    ├── favicon.png       # Extension icon
    └── chatbot.png       # Chatbot avatar
```

---

## Features

### Toggle Detection
- Toggle button in the popup activates/deactivates email analysis
- Heading changes between `"Start detection:"` and `"Detecting..."` based on state
- Toggle is **disabled** unless the user is on a specific Gmail email URL
- Different messages shown for: not on Gmail, on Gmail inbox but no email open, valid email open

### URL Validation
Uses the built-in `URL` object (no regex) to check:
- `tabUrl.hostname === "mail.google.com"` — confirms user is on Gmail
- `tabUrl.hash.split("/").length >= 2` — confirms a specific email is open (not just the inbox)

### State Persistence
- Uses `chrome.storage.local` to save `isDetecting` and `activeTabUrl`
- When popup reopens on the **same email URL**, toggle restores to ON without re-sending an API request
- When popup opens on a **different email**, state is cleared and toggle starts fresh
- Checks if chatbot is already visible on page before re-sending `startDetection`

### Flood Protection
Two independent layers:
1. **Cooldown timer in `popup.js`** — 3 second cooldown between toggle actions, with a live countdown in the heading and the toggle disabled during cooldown
2. **`isAnalyzing` flag in `content.js`** — blocks duplicate API requests even if multiple `startDetection` messages arrive

### Chatbot UI
- Injected directly into the Gmail page as a fixed floating card
- Shows an **"Analyzing..."** card with a pulsing indicator while the API request is in flight
- Replaces with full chatbot once response arrives
- Response formatted as **bullet points**
- Includes avatar image, title, and close (✕) button
- Close button clears storage and resets toggle state

### Follow-up Questions
- Users can type follow-up questions in the chatbot input
- Conversation history is maintained for context
- System prompt restricts the bot to only answer questions about the email content
- Off-topic or manipulation attempts are politely declined by the API
- "Thinking..." indicator shown while waiting for follow-up response

### Security
- `textContent` used instead of `innerHTML` to prevent XSS from email or API content
- API key stored in `config.js` which is listed in `.gitignore`
- `web_accessible_resources` in manifest scopes image access to Gmail only

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/dlw1rm4/erm-actually.git
cd erm-actually/extension
```

### 2. Add your API key
Create `config.js` in the `extension/` folder (this file is gitignored):
```js
const GEMINI_API_KEY = "your-gemini-api-key-here";
```

Get a free API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 3. Load the extension in Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

### 5. Use it
1. Open Gmail in Chrome
2. Click into a specific email
3. Click the extension icon and toggle detection ON
4. Wait for the chatbot to appear on the page
5. Ask follow-up questions in the chatbot input

---

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Access the current tab's URL and send messages |
| `scripting` | Inject content scripts programmatically |
| `tabs` | Query tab URL for Gmail validation |
| `storage` | Persist toggle state across popup open/close |

---

## Known Limitations

- Gmail's DOM class names (e.g. `.a3s.aiL`) may change with Gmail updates, breaking email text extraction
- API key is client-side — for production, route requests through a backend proxy
- Chatbot state is lost on page refresh since it lives in the DOM
- Follow-up conversation history resets if the chatbot is closed and reopened

---

## Open Issues

| # | Issue |
|---|---|
| #12 | Multiple Gmail tabs — only active tab should have chatbot |
| #11 | Closing extension should close chatbot |
| #9 | Auto turn-off after inactivity timeout |

---

## Tech Stack

- **Chrome Extensions Manifest V3**
- **Vanilla JS** — no frameworks or build tools
- **Gemini 2.5 Flash API** — via Google AI Studio
- **Chrome Storage API** — for state persistence
- **Chrome Tabs & Scripting APIs** — for tab communication
