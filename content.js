(function () {
  const LM_API_URL = "http://127.0.0.1:1283/v1/chat/completions";
  const API_KEY = "YOUR_API_KEY_HERE";

  const container = document.createElement('div');
  container.id = 'lm-chat-widget';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ddd;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    overflow: hidden;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    z-index: 10000;
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #lm-chat-widget header {
      background: linear-gradient(135deg, #4c6ef5, #15aabf);
      color: #fff;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
    }
    #lm-chat-widget header button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
    }
    #lm-chat-widget .body {
      padding: 15px;
      overflow-y: auto;
      max-height: calc(80vh - 50px);
    }
    #lm-chat-widget .controls {
      margin-bottom: 10px;
    }
    #lm-chat-widget .controls button {
      background: #4c6ef5;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 5px;
    }
    #lm-chat-widget .status {
      font-size: 13px;
      color: #555;
      margin-top: 5px;
    }
    #lm-chat-widget .chat-log {
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 8px;
      max-height: 150px;
      overflow-y: auto;
      background: #fafafa;
      margin-bottom: 10px;
      font-size: 14px;
    }
    #lm-chat-widget .chat-log .message {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    #lm-chat-widget .chat-log .message span {
      display: block;
    }
    #lm-chat-widget .chat-log .message .user {
      font-weight: bold;
      color: #333;
    }
    #lm-chat-widget .chat-log .message .assistant {
      color: #444;
      margin-left: 10px;
    }
    #lm-chat-widget .input-group {
      display: flex;
    }
    #lm-chat-widget .input-group input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px 0 0 4px;
      font-size: 14px;
    }
    #lm-chat-widget .input-group button {
      background: #15aabf;
      border: none;
      color: #fff;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      font-size: 14px;
    }
    #lm-chat-widget .markdown-view {
      border: 1px solid #eee;
      padding: 10px;
      background: #fff;
      border-radius: 4px;
      font-size: 14px;
      overflow-x: auto;
    }
  `;
  document.head.appendChild(styleEl);

  container.innerHTML = `
    <header>
      <span>LM Studio Chat</span>
      <div>
        <button id="minimize-chat" title="Minimize">&#8211;</button>
        <button id="close-chat" title="Close">&times;</button>
      </div>
    </header>
    <div class="body">
      <div class="controls">
        <button id="send-page">Send Page Context</button>
        <span class="status" id="status"></span>
      </div>
      <div class="chat-area" id="chat-area" style="display: none;">
        <div class="chat-log" id="chat-log"></div>
        <div class="input-group">
          <input type="text" id="chat-input" placeholder="Type your message here..." />
          <button id="send-message">Send</button>
        </div>
        <div class="markdown-view" id="markdown-view" style="margin-top:10px;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const minimizeBtn = document.getElementById("minimize-chat");
  let isMinimized = false;

  minimizeBtn.addEventListener("click", () => {
    const bodyEl = container.querySelector(".body");
    if (isMinimized) {
      bodyEl.style.display = "block";
      minimizeBtn.innerHTML = "&#8211;";
    } else {
      bodyEl.style.display = "none";
      minimizeBtn.innerHTML = "&#x25B2;";
    }
    isMinimized = !isMinimized;
  });

  document.getElementById("close-chat").addEventListener("click", () => {
    container.remove();
  });

  let conversation = [];

  function setStatus(text) {
    document.getElementById("status").textContent = text;
  }

  function addMessage(sender, text) {
    const chatLog = document.getElementById("chat-log");
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.innerHTML = `<span class="user">${sender}:</span>
                       <span class="${sender === "LM Studio" ? "assistant" : "user"}">${text}</span>`;
    chatLog.appendChild(msgEl);
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
    document.getElementById("chat-area").style.display = "block";
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
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const jsonStr = line.slice(6).trim();

                  if (jsonStr === "[DONE]") {
                    continue;
                  }

                  try {
                    const dataObj = JSON.parse(jsonStr);
                    const delta = dataObj.choices[0].delta;

                    if (delta && delta.content) {
                      markdownResponse += delta.content;
                    }

                    renderMarkdown(markdownResponse);
                  } catch (e) {
                    console.error("Error parsing JSON:", e);
                  }
                }
              }
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
