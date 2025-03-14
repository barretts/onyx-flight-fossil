import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import styled from "styled-components";

marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-"
});

const BaseButton = styled.button`
  padding: 10px 16px;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.1s ease;
  &:active {
    transform: scale(0.98);
  }
`;

const PrimaryButton = styled(BaseButton)`
  background-color: #2563eb;
  color: #fff;
  &:hover {
    background-color: #1d4ed8;
  }
`;

const SecondaryButton = styled(BaseButton)`
  background-color: transparent;
  color: #fff;
  &:hover {
    color: #fff;
  }
`;

const ChatContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const ChatHeader = styled.header`
  background: #2563eb;
  color: #ffffff;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f6f8fa;
  font-size: 14px;
  color: #333;
`;

const ChatInputContainer = styled.div`
  display: flex;
  border-top: 1px solid #e1e4e8;
`;

const ChatTextarea = styled.textarea`
  flex: 1;
  padding: 12px;
  font-size: 14px;
  border: none;
  outline: none;
  resize: none;
  height: 60px;
  &:focus {
    background-color: #f0f4ff;
  }
`;

const ChatSendButton = styled(PrimaryButton)`
  border-radius: 0;
  padding: 0 20px;
`;

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatWidgetProps {
  apiKey: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ apiKey }) => {
  const [minimized, setMinimized] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const chatLogRef = useRef<HTMLDivElement>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendPageContext = () => {
    setStatus("Extracting page context...");
    const pageContent = document.body.innerText;
    const pageUrl = window.location.href;
    const contextMsg: ChatMessage = {
      role: "system",
      content: `Context from page (${pageUrl}):\n${pageContent}`
    };
    setMessages(prev => [...prev, contextMsg]);
    setStatus("Context sent. Start chatting!");
  };

  const appendMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendUserMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    appendMessage(userMsg);
    setInput('');
    sendChatMessage([...messages, userMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  const sendChatMessage = async (conversation: ChatMessage[]) => {
    setStatus("Sending message...");
    setStreamingContent('');
    const payload = {
      model: "gpt-3.5-turbo",
      messages: conversation,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    };

    try {
      const response = await fetch("http://127.0.0.1:1283/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder("utf-8");
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const dataObj = JSON.parse(jsonStr);
              const delta = dataObj.choices[0].delta;
              if (delta && delta.content) {
                accumulated += delta.content;
                setStreamingContent(accumulated);
              }
            } catch (e) {
              console.error("JSON parse error:", e);
            }
          }
        }
      }
      appendMessage({ role: "assistant", content: accumulated });
      setStatus("Response complete.");
    } catch (error) {
      console.error("Fetch error:", error);
      setStatus("Error sending message.");
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <span>Chat Assistant</span>
        <div>
          <SecondaryButton onClick={sendPageContext}>Context</SecondaryButton>
          <SecondaryButton onClick={() => setMinimized(!minimized)}>
            {minimized ? "Expand" : "Collapse"}
          </SecondaryButton>
          <SecondaryButton onClick={() => {}}>×</SecondaryButton>
        </div>
      </ChatHeader>

      {!minimized && (
        <>
          <ChatMessages ref={chatLogRef}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <strong>{msg.role}:</strong>{" "}
                <span
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                />
              </div>
            ))}
          </ChatMessages>

          <ChatInputContainer>
            <ChatTextarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), sendUserMessage())
              }
            />
            <ChatSendButton onClick={sendUserMessage}>Send</ChatSendButton>
          </ChatInputContainer>
        </>
      )}
    </ChatContainer>
  );
};

export default ChatWidget;
