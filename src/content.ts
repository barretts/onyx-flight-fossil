// Declare external libraries loaded via <script> tags.
declare const marked: any;
declare const hljs: any;

(function () {
  const LM_API_URL = "http://127.0.0.1:1283/v1/chat/completions";
  const API_KEY = "YOUR_API_KEY_HERE";
  if (window.marked && window.hljs) {
    marked.setOptions({

      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      langPrefix: 'hljs language-'
    });

  }

  const container: HTMLDivElement = document.createElement('div');
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
    display: flex;
    flex-direction: column;
  `;

  const styleEl: HTMLStyleElement = document.createElement('style');
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
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 15px;
      overflow: hidden;
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
      margin-left: 10px;
    }
    #lm-chat-widget .chat-log {
      flex: 1;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 8px;
      overflow-y: auto;
      font-size: 14px;
      background: #fafafa;
      margin-bottom: 10px;
    }
    #lm-chat-widget .chat-log .message {
      margin-bottom: 8px;
      line-height: 1.4;
    }
    #lm-chat-widget .chat-log .message .sender {
      font-weight: bold;
      color: #333;
    }
    #lm-chat-widget .chat-log .message .content {
      margin-left: 10px;
      color: #444;
    }
    #lm-chat-widget .input-area {
      display: flex;
      align-items: flex-end;
    }
    #lm-chat-widget .input-area textarea {
      flex: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      resize: none;
      height: 50px;
    }
    #lm-chat-widget .input-area button {
      background: #15aabf;
      border: none;
      color: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 5px;
    }
  `;
  document.head.appendChild(styleEl);

  container.innerHTML = `
    <header>
      <span> LLM API Chat</span>
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
      <div class="chat-log" id="chat-log"></div>
      <div class="input-area">
        <textarea id="chat-input" placeholder="Type your message here..."></textarea>
        <button id="send-message">Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const minimizeBtn = document.getElementById("minimize-chat") as HTMLButtonElement;
  let isMinimized = false;

  minimizeBtn.addEventListener("click", () => {
    const bodyEl = container.querySelector(".body") as HTMLElement;
    if (isMinimized) {
      bodyEl.style.display = "flex";
      minimizeBtn.innerHTML = "&#8211;";
    } else {
      bodyEl.style.display = "none";
      minimizeBtn.innerHTML = "&#x25B2;";
    }
    isMinimized = !isMinimized;
  });

  (document.getElementById("close-chat") as HTMLButtonElement).addEventListener("click", () => {
    container.remove();
  });

  const conversation: { role: string; content: string }[] = [];

  function setStatus(text: string): void {
    (document.getElementById("status") as HTMLElement).textContent = text;
  }

  function appendMessage(sender: string, htmlContent: string): void {
    const chatLog = document.getElementById("chat-log") as HTMLElement;
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.innerHTML = `<span class="sender">${sender}:</span>
                       <span class="content">${htmlContent}</span>`;
    chatLog.appendChild(msgEl);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  let streamingMsgEl: HTMLDivElement | null = null;
  function createStreamingMessage(): void {
    const chatLog = document.getElementById("chat-log") as HTMLElement;
    streamingMsgEl = document.createElement("div");
    streamingMsgEl.className = "message";
    streamingMsgEl.innerHTML = `<span class="sender"> LLM API:</span>
                                <span class="content" id="streaming-content"></span>`;
    chatLog.appendChild(streamingMsgEl);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderMarkdown(text: string): string {
    if (window.marked) {
      return marked.parse(text);
    }
    return text;
  }

  (document.getElementById("send-page") as HTMLButtonElement).addEventListener("click", () => {
    setStatus("Fetching page content...");

    const pageContent = document.body.innerText;
    const pageUrl = window.location.href;
    const contextMessage = {
      role: "system",
      content: `Context from page (${pageUrl}):\n${pageContent}`,
    };

    conversation.push(contextMessage);

    setStatus("Page context added. You can now chat about the page.");
  });

  function sendUserMessage() {
    const textarea = document.getElementById("chat-input") as HTMLTextAreaElement;
    const msg = textarea.value.trim();

    if (!msg) return;

    appendMessage("User", msg);
    conversation.push({ role: "user", content: msg });
    textarea.value = "";

    sendChatMessage();
  }

  (document.getElementById("send-message") as HTMLButtonElement).addEventListener("click", sendUserMessage);

  const textarea = document.getElementById("chat-input") as HTMLTextAreaElement;
  textarea.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.ctrlKey) {
        return;
      } else {
        e.preventDefault();
        sendUserMessage();
      }
    }
  });

  function sendChatMessage(): void {
    setStatus("Sending chat message...");

    createStreamingMessage();

    let streamingText = "";
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

        const reader = response.body!.getReader();
        const decoder = new TextDecoder("utf-8");

        function readStream(): void {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                conversation.push({ role: "assistant", content: streamingText });

                if (streamingMsgEl) {
                  streamingMsgEl.querySelector("#streaming-content")!.innerHTML = renderMarkdown(streamingText);
                }

                setStatus("Reply complete.");
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");

              lines.forEach(line => {
                if (line.startsWith("data: ")) {
                  const jsonStr = line.slice(6).trim();

                  if (jsonStr === "[DONE]") return;

                  try {
                    const dataObj = JSON.parse(jsonStr);
                    const delta = dataObj.choices[0].delta;

                    if (delta && delta.content) {
                      streamingText += delta.content;
                    }

                    if (streamingMsgEl) {
                      streamingMsgEl.querySelector("#streaming-content")!.innerHTML = renderMarkdown(streamingText);
                    }
                  } catch (e) {
                    console.error("JSON parse error:", e);
                  }
                }
              });

              (document.getElementById("chat-log") as HTMLElement).scrollTop = (document.getElementById("chat-log") as HTMLElement).scrollHeight;

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
