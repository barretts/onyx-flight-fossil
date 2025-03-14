import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { sendChatMessage } from "../api";
import { processStream } from "../streaming";
import { SecondaryButton } from "./Buttons";
import { ChatContainer, ChatHeader, ChatMessages, ChatInputContainer, ChatTextarea, ChatSendButton } from "./Chat";

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
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendUserMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    appendMessage(userMsg);
    setInput('');
    setStatus("Sending message...");
    
    try {
      const reader = await sendChatMessage([...messages, userMsg], apiKey);
      let accumulated = '';

      await processStream(reader, (delta: string) => {
        accumulated += delta;
        setMessages(prev => {
          if (prev[prev.length - 1].role !== "user") {
            prev.pop();}
       return   [...prev, { role: "assistant", content: accumulated }]
      });
      }, () => {
        setStatus("Response complete.");
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setStatus("Error sending message.");
    }
  };

  const sendPageContext = async () => {
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

  return (
    <ChatContainer>
      <ChatHeader>
        <span>Chat Assistant</span>
        <div>
          <div>
            <SecondaryButton onClick={sendPageContext}>Send Context</SecondaryButton>
            <SecondaryButton onClick={() => setMinimized(!minimized)}>
              {minimized ? "▲" : "▼"}
            </SecondaryButton>
          </div>
        
          <div>
            <span>{status}</span>
          </div>
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


// import React, { useState, useRef, useEffect } from "react";
// import { marked } from "marked";
// import hljs from "highlight.js";
// import "highlight.js/styles/github-dark.css";
// import { SecondaryButton } from "./Buttons";
// import { ChatContainer, ChatHeader, ChatMessages, ChatInputContainer, ChatTextarea, ChatSendButton } from "./Chat";

// marked.setOptions({
//   highlight: (code: string, lang: string) => {
//     if (lang && hljs.getLanguage(lang)) {
//       return hljs.highlight(code, { language: lang }).value;
//     }
//     return hljs.highlightAuto(code).value;
//   },
//   langPrefix: "hljs language-"
// });

// interface ChatMessage {
//   role: string;
//   content: string;
// }

// interface ChatWidgetProps {
//   apiKey: string;
// }

// const ChatWidget: React.FC<ChatWidgetProps> = ({ apiKey }) => {
//   const [minimized, setMinimized] = useState(false);
//   const [status, setStatus] = useState<string>('');
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState<string>('');
//   const chatLogRef = useRef<HTMLDivElement>(null);
//   const [streamingContent, setStreamingContent] = useState<string>('');

//   useEffect(() => {
//     if (chatLogRef.current) {
//       chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
//     }
//   }, [messages, streamingContent]);

//   const sendPageContext = () => {
//     setStatus("Extracting page context...");
//     const pageContent = document.body.innerText;
//     const pageUrl = window.location.href;
//     const contextMsg: ChatMessage = {
//       role: "system",
//       content: `Context from page (${pageUrl}):\n${pageContent}`
//     };
//     setMessages(prev => [...prev, contextMsg]);
//     setStatus("Context sent. Start chatting!");
//   };

//   const appendMessage = (msg: ChatMessage) => {
//     setMessages(prev => [...prev, msg]);
//   };

//   const sendUserMessage = () => {
//     if (!input.trim()) return;
//     const userMsg: ChatMessage = { role: "user", content: input.trim() };
//     appendMessage(userMsg);
//     setInput('');
//     sendChatMessage([...messages, userMsg]);
//   };

//   const sendChatMessage = async (conversation: ChatMessage[]) => {
//     setStatus("Sending message...");
//     setStreamingContent('');
//     const payload = {
//       model: "gpt-3.5-turbo",
//       messages: conversation,
//       temperature: 0.7,
//       max_tokens: 1024,
//       stream: true
//     };

//     try {
//       const response = await fetch("http://127.0.0.1:1283/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": "Bearer " + apiKey
//         },
//         body: JSON.stringify(payload)
//       });
//       if (!response.ok) throw new Error("Network response was not ok");
//       const reader = response.body?.getReader();
//       if (!reader) throw new Error("No reader available");

//       const decoder = new TextDecoder("utf-8");
//       let accumulated = '';

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         const chunk = decoder.decode(value, { stream: true });
//         const lines = chunk.split("\n");
//         for (const line of lines) {
//           if (line.startsWith("data: ")) {
//             const jsonStr = line.slice(6).trim();
//             if (jsonStr === "[DONE]") continue;
//             try {
//               const dataObj = JSON.parse(jsonStr);
//               const delta = dataObj.choices[0].delta;
//               if (delta && delta.content) {
//                 accumulated += delta.content;
//                 setStreamingContent(accumulated);
//               }
//             } catch (e) {
//               console.error("JSON parse error:", e);
//             }
//           }
//         }
//       }
//       appendMessage({ role: "assistant", content: accumulated });
//       setStatus("Response complete.");
//     } catch (error) {
//       console.error("Fetch error:", error);
//       setStatus("Error sending message.");
//     }
//   };

//   return (
//     <ChatContainer>
//       <ChatHeader>
//         <span>Chat Assistant</span>
//         <div>
//           <SecondaryButton onClick={sendPageContext}>Send Context</SecondaryButton>
//           <SecondaryButton onClick={() => setMinimized(!minimized)}>
//             {minimized ? "▲" : "▼"}
//           </SecondaryButton>
//         </div>
//         <div>
//           <span>{status}</span>
//         </div>
//       </ChatHeader>

//       {!minimized && (
//         <>
//           <ChatMessages ref={chatLogRef}>
//             {messages.map((msg, idx) => (
//               <div key={idx} style={{ marginBottom: "12px" }}>
//                 <strong>{msg.role}:</strong>{" "}
//                 <span
//                   dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
//                 />
//               </div>
//             ))}
//           </ChatMessages>

//           <ChatInputContainer>
//             <ChatTextarea
//               placeholder="Type your message..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) =>
//                 e.key === "Enter" &&
//                 !e.shiftKey &&
//                 (e.preventDefault(), sendUserMessage())
//               }
//             />
//             <ChatSendButton onClick={sendUserMessage}>Send</ChatSendButton>
//           </ChatInputContainer>
//         </>
//       )}
//     </ChatContainer>
//   );
// };

// export default ChatWidget;
