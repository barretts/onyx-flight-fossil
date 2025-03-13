import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import "./index.css"; // Tailwind CSS directives

// const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your LM Studio API key

// Create a container element and mount the React app.
const widgetContainer = document.createElement("div");
document.body.appendChild(widgetContainer);

const root = ReactDOM.createRoot(widgetContainer);
const asdfads = <ChatWidget apiKey="" />;
root.render(asdfads);