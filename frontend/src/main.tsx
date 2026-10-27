import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.js';
import { OperacaoProvider } from './context/OperacaoContext.js';
import { ConfigProvider } from './context/ConfigProvider.js';
import { BusinessModeProvider } from './context/BusinessModeContext.js';
import { AuthProvider } from './context/AuthContext.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <BusinessModeProvider>
        <ThemeProvider>
          <OperacaoProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </OperacaoProvider>
        </ThemeProvider>
      </BusinessModeProvider>
    </ConfigProvider>
  </StrictMode>,
);
