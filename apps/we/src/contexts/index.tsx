"use client";

import { ReactNode } from "react";
import AdamContext from "./AdamContext";
// import SpaceContext from "./SpaceContext";
// import UserContext from "./UserContext";

export default function ContextProvider(props: { children: ReactNode }) {
  const { children } = props;

    // <SpaceContext>
    // <UserContext>

    return (
        <AdamContext>
        {/* <SpaceContext>
            <UserContext> */}
            {children}
            {/* </UserContext>
        </SpaceContext> */}
        </AdamContext>
    );
}
