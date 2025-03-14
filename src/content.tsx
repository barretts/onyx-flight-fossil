import ReactDOM from "react-dom/client";
import shadowRoot from 'react-shadow/styled-components';
import ChatWidget from "./components/ChatWidget";

const API_KEY = "YOUR_API_KEY_HERE";

const widgetContainer = document.createElement("div");
document.body.appendChild(widgetContainer);

const root = ReactDOM.createRoot(widgetContainer);
root.render(<shadowRoot.div><ChatWidget apiKey={API_KEY} /></shadowRoot.div>);