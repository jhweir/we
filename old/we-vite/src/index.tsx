import ContextProvider from '@/contexts';
import HomePage from '@/pages/Home';
import NewPost from '@/pages/New/page';
import SpacePage from '@/pages/Space/page';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.scss';
import Template from './templates';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContextProvider>
        <Template>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<NewPost />} />
            <Route path="/space/:spaceHandle/*" element={<SpacePage />} />
          </Routes>
        </Template>
      </ContextProvider>
    </BrowserRouter>
  </StrictMode>,
);

/*
<Route path="/about" element={<About />} />
<Route path="/space/:spaceId" element={<Space />} />
<Route path="*" element={<NotFound />} />
*/
