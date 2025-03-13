import { marked } from "marked";
import hljs from "highlight.js";
import { createWidget, WidgetElements } from "./ui";
import { sendChatMessage } from "./api";
import { processStream } from "./streaming";
import { ConversationMessage } from "./types";

// Configure marked to use highlight.js for syntax highlighting.
marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-"
});

(function () {
  // Create the UI widget.
  const widget: WidgetElements = createWidget();

  // Toggle minimize/restore.
  widget.minimizeButton.addEventListener("click", () => {
    const bodyEl = widget.container.querySelector(".body") as HTMLElement;
    if (bodyEl.style.display === "none") {
      bodyEl.style.display = "flex";
      widget.minimizeButton.innerHTML = "&#8211;";
    } else {
      bodyEl.style.display = "none";
      widget.minimizeButton.innerHTML = "&#x25B2;";
    }
  });

  // Close the widget.
  widget.closeButton.addEventListener("click", () => {
    widget.container.remove();
  });

  // Global conversation history.
  const conversation: ConversationMessage[] = [];
  const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your LM Studio API key

  // Helper: update status text.
  function setStatus(text: string): void {
    widget.statusEl.textContent = text;
  }

  // Handle the "Send Page Context" button.
  const sendPageButton = widget.container.querySelector("#send-page") as HTMLButtonElement;
  sendPageButton.addEventListener("click", () => {
    setStatus("Extracting page context...");
    const pageContent = document.body.innerText;
    const pageUrl = window.location.href;
    const contextMsg: ConversationMessage = {
      role: "system",
      content: `Context from page (${pageUrl}):\n${pageContent}`
    };
    conversation.push(contextMsg);
    setStatus("Context sent. Start chatting!");
  });

  // Function to send a user message.
  function sendUserMessage(): void {
    const msg = widget.chatInput.value.trim();
    if (!msg) return;
    widget.appendMessage("User", msg);
    conversation.push({ role: "user", content: msg });
    widget.chatInput.value = "";
    sendChat();
  }

  widget.sendButton.addEventListener("click", sendUserMessage);
  widget.chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.ctrlKey) {
        // Allow newline.
        return;
      } else {
        e.preventDefault();
        sendUserMessage();
      }
    }
  });

  // Send the chat message and process the streaming response.
  async function sendChat(): Promise<void> {
    setStatus("Sending message...");
    const streamingMsgEl = widget.createStreamingMessage();
    let streamingText = "";
    try {
      const reader = await sendChatMessage(conversation, API_KEY);
      await processStream(reader, (delta: string) => {
        streamingText += delta;
        widget.updateStreamingMessage(streamingMsgEl, marked.parse(streamingText));
      });
      conversation.push({ role: "assistant", content: streamingText });
      setStatus("Response complete.");
    } catch (err) {
      console.error("Error sending message:", err);
      setStatus("Error sending message.");
    }
  }
})();
