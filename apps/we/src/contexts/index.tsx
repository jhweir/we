'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
// import AdamContext from './AdamContext';
// import SpaceContext from "./SpaceContext";
// import UserContext from "./UserContext";

const AdamContext = dynamic(() => import('./AdamContext'), { ssr: false });

export default function ContextProvider(props: { children: ReactNode }) {
  const { children } = props;

  // <SpaceContext>
  // <UserContext>

  return (
    <AdamContext>
      {/* <SpaceContext> */}
      {/* <UserContext> */}
      {children}
      {/* </UserContext> */}
      {/* </SpaceContext> */}
    </AdamContext>
  );
}
