import React, { useEffect } from 'react';

const DifyChatbotBubble: React.FC = () => {
  useEffect(() => {
    const rawBaseUrl = import.meta.env.VITE_DIFY_BASE_URL || '';
    const token = import.meta.env.VITE_DIFY_EMBED_TOKEN || import.meta.env.VITE_DIFY_TOKEN || '';

    if (!token) {
      console.warn('Dify token (VITE_DIFY_EMBED_TOKEN or VITE_DIFY_TOKEN) is not configured.');
      return;
    }

    if (token.startsWith('app-')) {
      console.error(
        "Dify 网页嵌入组件（embed.min.js）不支持以 'app-' 开头的 API Key 作为 token！" +
        "请在 .env 中设置 VITE_DIFY_EMBED_TOKEN 为您的 Dify 应用网页嵌入 Token（通常是一串 16 位的字母数字，非 app- 开头）。"
      );
    }

    // Determine the chatbot widget baseUrl:
    // Dify SaaS API is api.dify.ai, but its chatbot widget is hosted on udify.app.
    // Self-hosted Dify usually hosts API and widget on the same domain, with API at /v1.
    const widgetBaseUrl = rawBaseUrl.includes('api.dify.ai')
      ? 'https://udify.app'
      : rawBaseUrl.replace(/\/v1\/?$/, '');

    // 1. Set global config
    window.difyChatbotConfig = {
      token,
      baseUrl: widgetBaseUrl,
      inputs: {},
      systemVariables: {},
    };

    // 2. Inject embed.min.js script
    const script = document.createElement('script');
    script.src = `${widgetBaseUrl}/embed.min.js`;
    script.id = token;
    script.defer = true;
    document.body.appendChild(script);

    // 3. Inject CSS style overrides for the button and window size
    const style = document.createElement('style');
    style.id = `style-${token}`;
    style.textContent = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
        box-shadow: 0 4px 12px rgba(28, 100, 242, 0.3) !important;
        transition: all 0.3s ease !important;
      }
      #dify-chatbot-bubble-button:hover {
        transform: scale(1.05);
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
      }
    `;
    document.head.appendChild(style);

    // 4. Cleanup on unmount
    return () => {
      script.remove();
      style.remove();
      document.getElementById('dify-chatbot-bubble-button')?.remove();
      document.getElementById('dify-chatbot-bubble-window')?.remove();
      delete window.difyChatbotConfig;
    };
  }, []);

  return null;
};

export default DifyChatbotBubble;
