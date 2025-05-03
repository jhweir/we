import { ReactNode } from 'react';
import AdamContext from './AdamContext';
import SpaceContext from './SpaceContext';

export default function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <AdamContext>
      <SpaceContext>{children}</SpaceContext>
    </AdamContext>
  );
}
