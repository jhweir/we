import ContextProvider from '@/contexts';
import Home from '@/pages/Home';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Template from './templates';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ContextProvider>
        <Template>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* <Route path="/about" element={<About />} />
          <Route path="/space/:spaceId" element={<Space />} /> */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </Template>
      </ContextProvider>
    </BrowserRouter>
  </StrictMode>,
);
