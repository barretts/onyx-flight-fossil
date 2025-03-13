const LM_API_URL = "http://192.168.1.237:1283/v1/chat/completions";
const API_KEY = "YOUR_API_KEY_HERE";

let conversation = [];

document.getElementById("send-page").addEventListener("click", () => {
  setStatus("Fetching page content...");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      { target: { tabId: activeTab.id }, func: () => document.body.innerText },
      (results) => {
        if (chrome.runtime.lastError || !results || !results[0].result) {
          setStatus("Error fetching page content.");
          return;
        }

        const pageContent = results[0].result;
        const contextMessage = {
          role: "system",
          content: `Context from page (${activeTab.url}):\n${pageContent}`,
        };

        conversation.push(contextMessage);

        setStatus("Page context added. You can now chat about the page.");
        document.getElementById("chat-container").style.display = "block";
      }
    );
  });
});
document.getElementById("send-message").addEventListener("click", () => {
  const inputEl = document.getElementById("chat-input");
  const userMessage = inputEl.value.trim();

  if (!userMessage) return;
  addMessage("User", userMessage);
  conversation.push({ role: "user", content: userMessage });
  inputEl.value = "";

  sendChatMessage();
});
function sendChatMessage() {
  setStatus("Sending chat message...");

  fetch(LM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_KEY,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: conversation,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.choices && data.choices.length > 0) {
        const assistantReply = data.choices[0].message.content;

        addMessage("LLM API", assistantReply);
        conversation.push({ role: "assistant", content: assistantReply });

        setStatus("Reply received.");
      } else {
        setStatus("No reply received from LLM API.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);

      setStatus("Error sending chat message.");
    });
}
function addMessage(sender, text) {
  const chatLog = document.getElementById("chat-log");
  const msgDiv = document.createElement("div");

  msgDiv.className = "message";
  msgDiv.innerHTML = `
    <span class="user">${sender}:</span> 
    <span class="${sender === "LLM API" ? "assistant" : "user"}">${text}</span>
  `;

  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function setStatus(text) {
  document.getElementById("status").textContent = text;
}
