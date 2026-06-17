import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import './utils/format'; // Initialize timezone
import App from './App';
import './i18n';
import './styles/global.css';
import './utils/leafletConfig';
import { useAppStore } from './store/useAppStore';

const antdLocales: Record<string, typeof zhCN> = { zh: zhCN, en: enUS, es: esES };

function Root() {
  const lang = useAppStore((s) => s.lang);
  
  React.useEffect(() => {
    dayjs.locale(lang === 'zh' ? 'zh-cn' : lang);
  }, [lang]);

  return (
    <ConfigProvider 
      locale={antdLocales[lang] || zhCN}
      theme={{
        token: {
          fontSize: 15,
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
