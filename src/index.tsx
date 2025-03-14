import ReactDOM from "react-dom/client";
import { ShadowDOM } from 'react-shadow';
import ChatWidget from "./components/ChatWidget";

const API_KEY = "YOUR_API_KEY_HERE";

const widgetContainer = document.createElement("div");
document.body.appendChild(widgetContainer);

const root = ReactDOM.createRoot(widgetContainer);
root.render(<ShadowDOM><ChatWidget apiKey={API_KEY} /></ShadowDOM>);