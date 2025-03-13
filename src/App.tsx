import React, { useState } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './index.css';

marked.setOptions({
  highlight: function (code, language) {
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    return hljs.highlight(validLanguage, code).value;
  }
});

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('# Hello, Chrome Extension!');

  const getMarkdownText = () => {
    const rawMarkup = marked(markdown);
    return { __html: rawMarkup };
  };

  return (
    <div className="p-4">
      <textarea
        className="w-full h-32 border p-2 mb-4"
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
      />
      <div className="prose" dangerouslySetInnerHTML={getMarkdownText()} />
    </div>
  );
};

export default App;
