import { ReactNode } from 'react';
import AdamContext from './AdamContext';
import SpaceContext from './SpaceContext';

export default function ContextProvider(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <AdamContext>
      <SpaceContext>{children}</SpaceContext>
    </AdamContext>
  );
}
