import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GlobalProvider } from './contexts/GlobalContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GlobalProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </GlobalProvider>
    </ErrorBoundary>
  </StrictMode>,
);
