"use client";

import { Ad4mClient } from "@coasys/ad4m";
import Ad4mConnect from "@coasys/ad4m-connect";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Client = Ad4mClient | undefined;

interface IAdamContext {
  client: Client;
  loading: boolean;
}

const context = createContext<IAdamContext>({ loading: true, client: undefined });

const AdamContext = (props: { children: ReactNode }) => {
  const { children } = props;
  const [client, setClient] = useState<Client>();
  const [loading, setLoading] = useState(true);

  async function connectAdamClient() {
    console.log("Connecting to Ad4m client...");
    try {
      const ui = Ad4mConnect({
        appName: "WE",
        appDesc: "",
        appDomain: "weco.io",
        appIconPath: "https://avatars.githubusercontent.com/u/34165012",
        capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
      });
      const client = await ui.connect();
      setClient(client);
    } catch (error) {
      console.error("Ad4mConnect error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // connectAdamClient();
  }, []);

  return <context.Provider value={{ client, loading }}>{children}</context.Provider>;
};

export const useAdamContext = () => useContext(context);

export default AdamContext;
