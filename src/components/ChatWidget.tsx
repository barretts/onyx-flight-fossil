import React, { useState, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // Highlight.js theme
import styled from "styled-components";

// Configure marked.js
marked.setOptions({
  highlight: (code, lang) => (lang && hljs.getLanguage(lang) 
    ? hljs.highlight(code, { language: lang }).value 
    : hljs.highlightAuto(code).value),
  langPrefix: "hljs language-",
});

// Base Button Style (Extensible)
const ButtonBase = styled.button`
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
`;

// Primary Action Button
const PrimaryButton = styled(ButtonBase)`
  background: #4f46e5;
  color: white;
  &:hover {
    background: #4338ca;
  }
`;

// Secondary (Lighter) Button
const SecondaryButton = styled(ButtonBase)`
  background: transparent;
  color: white;
  &:hover {
    opacity: 0.8;
  }
`;

// Shared Box Style for Messages, Inputs, etc.
const Box = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
`;

// Chat Container
const ChatContainer = styled(Box)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 380px;
  max-height: 80vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
`;

// Chat Header (Extends Box)
const ChatHeader = styled(Box).attrs({ as: "header" })`
  background: linear-gradient(90deg, #7c3aed, #4f46e5);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  border-bottom: none;
`;

// Chat Messages List
const ChatMessages = styled(Box)`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-size: 14px;
`;

// Input & Send Button Wrapper
const ChatInputContainer = styled.div`
  display: flex;
  margin-top: 12px;
`;

// Styled Textarea
const ChatTextarea = styled.textarea`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: none;
  outline: none;
  border-radius: 8px 0 0 8px;
  resize: none;
  &:focus {
    border: 2px solid #6366f1;
  }
`;

// Send Button (Extends PrimaryButton)
const ChatSendButton = styled(PrimaryButton)`
  border-radius: 0 8px 8px 0;
`;

const ChatWidget: React.FC = () => {
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [status, setStatus] = useState("Ready");
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "User", content: input }]);
    setInput("");
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <span>Chat Assistant</span>
        <div>
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
              <div key={idx} style={{ marginBottom: "10px" }}>
                <strong>{msg.role}:</strong> <span dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
              </div>
            ))}
          </ChatMessages>

          <ChatInputContainer>
            <ChatTextarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <ChatSendButton onClick={sendMessage}>Send</ChatSendButton>
          </ChatInputContainer>
        </>
      )}
    </ChatContainer>
  );
};

export default ChatWidget;
