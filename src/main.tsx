import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/allura/400.css';
import '@fontsource/pinyon-script/400.css';
import '@fontsource-variable/oswald';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import '@fontsource/gowun-dodum/400.css';
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
