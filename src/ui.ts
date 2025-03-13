export interface WidgetElements {
  container: HTMLElement;
  statusEl: HTMLElement;
  chatLog: HTMLElement;
  chatInput: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  minimizeButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  createStreamingMessage: () => HTMLElement;
  appendMessage: (sender: string, htmlContent: string) => void;
  updateStreamingMessage: (msgEl: HTMLElement, htmlContent: string) => void;
}

export function createWidget(): WidgetElements {
  // Create main container.
  const container: HTMLDivElement = document.createElement("div");
  container.id = "lm-chat-widget";
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

  // Inject widget HTML.
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
      <div class="chat-log" id="chat-log"></div>
      <div class="input-area">
        <textarea id="chat-input" placeholder="Type your message here..."></textarea>
        <button id="send-message">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Inject additional styles.
  const styleEl = document.createElement("style");
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
      background: #fafafa;
      overflow-y: auto;
      font-size: 14px;
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

  // Gather UI element references.
  const statusEl = container.querySelector("#status") as HTMLElement;
  const chatLog = container.querySelector("#chat-log") as HTMLElement;
  const chatInput = container.querySelector("#chat-input") as HTMLTextAreaElement;
  const sendButton = container.querySelector("#send-message") as HTMLButtonElement;
  const minimizeButton = container.querySelector("#minimize-chat") as HTMLButtonElement;
  const closeButton = container.querySelector("#close-chat") as HTMLButtonElement;

  function appendMessage(sender: string, htmlContent: string): void {
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.innerHTML = `<span class="sender">${sender}:</span>
                         <span class="content">${htmlContent}</span>`;
    chatLog.appendChild(msgEl);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function createStreamingMessage(): HTMLElement {
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.innerHTML = `<span class="sender">LM Studio:</span>
                         <span class="content" id="streaming-content"></span>`;
    chatLog.appendChild(msgEl);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msgEl;
  }

  function updateStreamingMessage(msgEl: HTMLElement, htmlContent: string): void {
    const contentEl = msgEl.querySelector("#streaming-content") as HTMLElement;
    if (contentEl) {
      contentEl.innerHTML = htmlContent;
    }
  }

  return {
    container,
    statusEl,
    chatLog,
    chatInput,
    sendButton,
    minimizeButton,
    closeButton,
    createStreamingMessage,
    appendMessage,
    updateStreamingMessage
  };
}
