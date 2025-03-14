import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // npm-installed highlight theme
// import "../content.css"; // Tailwind CSS directives

// Configure marked to use highlight.js for code blocks.
marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-"
});

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
  const [streamingContent, setStreamingContent] = useState<string>('');
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Send page context as a system message.
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

  // Send a chat message to LM Studio and process the streaming response.
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
      const response = await fetch("https://api.lmstudio.ai/v1/chat/completions", {
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
    <div className="fixed bottom-6 right-6 w-96 max-h-[80vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden z-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat Assistant</h1>
        <div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="mr-3 focus:outline-none hover:text-gray-300"
            title="Toggle"
          >
            {minimized ? "Expand" : "Collapse"}
          </button>
          <button
            onClick={() => { /* You can implement widget removal if desired */ }}
            className="focus:outline-none hover:text-gray-300"
            title="Close"
          >
            ×
          </button>
        </div>
      </header>
      {!minimized && (
        <div className="flex flex-col flex-1 p-4">
          <div className="mb-3 flex items-center">
            <button
              onClick={sendPageContext}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md focus:outline-none hover:bg-indigo-500"
            >
              Send Page Context
            </button>
            <span className="ml-4 text-sm text-gray-600">{status}</span>
          </div>
          <div ref={chatLogRef} className="flex-1 border border-gray-300 rounded-md p-3 bg-gray-50 overflow-y-auto mb-3 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <span className="font-bold text-gray-800">{msg.role}:</span>
                <span className="ml-2" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
              </div>
            ))}
            {streamingContent && (
              <div className="mb-2">
                <span className="font-bold text-gray-800">Assistant:</span>
                <span className="ml-2" dangerouslySetInnerHTML={{ __html: marked.parse(streamingContent) }} />
              </div>
            )}
          </div>
          <div className="flex">
            <textarea
              className="flex-1 border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none h-20"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendUserMessage}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md focus:outline-none text-sm hover:bg-indigo-500"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
