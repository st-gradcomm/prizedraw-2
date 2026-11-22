import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/allura/400.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/noto-serif-kr/500.css';
import '@fontsource/noto-serif-kr/700.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/base.css';
import './styles/stage.css';
import './styles/reveal.css';
import './styles/credits.css';
import './styles/setup.css';
import './styles/winners.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
