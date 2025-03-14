// // src/content.tsx
// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';
// import './index.css';

// const HoverComponent: React.FC = () => {
//   const [hovered, setHovered] = useState(false);

//   return (
//     <div className="fixed bottom-4 right-4 z-50">
//       <div
//         className="p-2 bg-blue-500 text-white rounded shadow cursor-pointer transition duration-200 hover:bg-blue-600"
//         onMouseEnter={() => setHovered(true)}
//         onMouseLeave={() => setHovered(false)}
//       >
//         Hover me!
//       </div>
//       {hovered && (
//         <div className="mt-2 p-2 bg-gray-800 text-white rounded shadow">
//           In-page hover element content!
//         </div>
//       )}
//     </div>
//   );
// };

// // Create a container div and append it to the body
// const container = document.createElement('div');
// document.body.appendChild(container);

// // Mount the React component into the container
// ReactDOM.render(<HoverComponent />, container);
import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";

// const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your LM Studio API key

// Create a container element and mount the React app.
const widgetContainer = document.createElement("div");
document.body.appendChild(widgetContainer);

const root = ReactDOM.createRoot(widgetContainer);
const asdfads = <ChatWidget apiKey="" />;
root.render(<div id="barrett" className="barrett">{asdfads}</div>);