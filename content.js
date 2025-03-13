(function () {
  const LM_API_URL = "http://127.0.0.1:1283/v1/chat/completions";
  const API_KEY = "YOUR_API_KEY_HERE";

  const container = document.createElement("div");
  container.id = "lm-studio-chat-widget";
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  container.innerHTML = `
    <div id="chat-header" style="background: #f1f1f1; padding: 5px; display: flex; justify-content: space-between; align-items: center;">
      <span>LLM API Chat</span>
      <button id="close-chat" style="background: transparent; border: none; font-size: 18px; cursor: pointer;">&times;</button>
    </div>
    <div id="chat-body" style="padding: 10px;">
      <button id="send-page">Send Page to LLM API</button>
      <div id="status" style="margin-top: 5px; color: #555;"></div>
      <div id="chat-container" style="margin-top: 10px; display: none;">
        <div id="chat-log" style="height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; margin-bottom: 10px;"></div>
        <input type="text" id="chat-input" placeholder="Type your message..." style="width: calc(100% - 60px);" />
        <button id="send-message">Send</button>
        <div id="markdown-view" style="margin-top: 10px; border: 1px solid #eee; padding: 5px;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  function loadMarked() {
    return new Promise((resolve, reject) => {
      if (window.marked) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load marked library"));

      document.head.appendChild(script);
    });
  }

  loadMarked()
    .then(() => {
      console.log("Marked loaded successfully.");
    })
    .catch((err) => console.error(err));

  let conversation = [];

  document.getElementById("close-chat").addEventListener("click", () => {
    container.style.display = "none";
  });

  document.getElementById("send-page").addEventListener("click", () => {
    setStatus("Fetching page content...");

    const pageContent = document.body.innerText;
    const pageUrl = window.location.href;
    const contextMessage = {
      role: "system",
      content: `Context from page (${pageUrl}):\n${pageContent}`,
    };

    conversation.push(contextMessage);

    setStatus("Page context added. You can now chat about the page.");
    document.getElementById("chat-container").style.display = "block";
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

  function addMessage(sender, text) {
    const chatLog = document.getElementById("chat-log");

    const msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "8px";
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;

    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function renderMarkdown(markdownText) {
    const markdownView = document.getElementById("markdown-view");

    if (window.marked) {
      markdownView.innerHTML = window.marked.parse(markdownText);
    } else {
      markdownView.textContent = markdownText;
    }
  }

  function setStatus(text) {
    document.getElementById("status").textContent = text;
  }

  function sendChatMessage() {

    setStatus("Sending chat message...");
    const payload = {
      model: "gpt-3.5-turbo",
      messages: conversation,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    };
    fetch(LM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let markdownResponse = "";
        function readStream() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                conversation.push({
                  role: "assistant",
                  content: markdownResponse,
                });
                addMessage("LLM API", markdownResponse);

                setStatus("Reply complete.");
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              markdownResponse += chunk;

              renderMarkdown(markdownResponse);
              readStream();
            })
            .catch((error) => {
              console.error("Stream reading error:", error);

              setStatus("Error in streaming response.");
            });
        }
        readStream();
      })
      .catch((error) => {
        console.error("Fetch error:", error);

        setStatus("Error sending chat message.");
      });
  }
})();
