'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const AdamContext = dynamic(() => import('./AdamContext'), { ssr: false });
const SpaceContext = dynamic(() => import('./SpaceContext'), { ssr: false });

export default function ContextProvider(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <AdamContext>
      <SpaceContext>{children}</SpaceContext>
    </AdamContext>
  );
}
