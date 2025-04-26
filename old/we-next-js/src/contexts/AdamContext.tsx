'use client';

import Space from '@/models/Space';
import { Ad4mClient, AITask, Perspective } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';

export type Theme = { name: string; icon: string };
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type ThemeSettings = { allThemes: Theme[]; currentTheme: Theme; iconWeight: IconWeight };
export type ActiveModals = { createSpace: boolean };

export interface IAdamContext {
  loading: boolean;
  ad4mClient: Ad4mClient | undefined;
  myDid: string;
  myAgentData: Perspective | undefined;
  mySpaces: Space[];
  myAI: { models: any[]; tasks: AITask[] };
  myThemeSettings: ThemeSettings;
  activeModals: ActiveModals;
  setMySpaces: Dispatch<SetStateAction<Space[]>>;
  setMyThemeSettings: Dispatch<SetStateAction<ThemeSettings>>;
  setActiveModals: Dispatch<SetStateAction<ActiveModals>>;
}

const themes = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
};

const defaultAdamContext: IAdamContext = {
  loading: true,
  ad4mClient: undefined,
  myDid: '',
  myAgentData: undefined,
  mySpaces: [],
  myAI: { models: [], tasks: [] },
  myThemeSettings: { allThemes: [themes.light, themes.dark], currentTheme: themes.light, iconWeight: 'regular' },
  activeModals: { createSpace: false },
  setMySpaces: () => {},
  setMyThemeSettings: () => {},
  setActiveModals: () => {},
};

const context = createContext<IAdamContext>(defaultAdamContext);

const AdamContext = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(defaultAdamContext.loading);
  const [ad4mClient, setAd4mClient] = useState(defaultAdamContext.ad4mClient);
  const [myDid, setMyDid] = useState(defaultAdamContext.myDid);
  const [myAgentData, setMyAgentData] = useState(defaultAdamContext.myAgentData);
  const [mySpaces, setMySpaces] = useState(defaultAdamContext.mySpaces);
  const [myAI, setMyAI] = useState(defaultAdamContext.myAI);
  const [myThemeSettings, setMyThemeSettings] = useState(defaultAdamContext.myThemeSettings);
  const [activeModals, setActiveModals] = useState(defaultAdamContext.activeModals);

  async function getAdamClient() {
    try {
      const ui = Ad4mConnect({
        appName: 'WE',
        appDesc: 'Social media for a new internet',
        appDomain: 'ad4m.weco.io',
        appIconPath: 'https://avatars.githubusercontent.com/u/34165012',
        capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      });
      return await ui.connect();
    } catch (error) {
      console.error('AdamContext: getAdamClient error', error);
    }
  }

  async function getMyAgentData(client: Ad4mClient): Promise<void> {
    try {
      const { did, perspective } = await client.agent.me();
      setMyDid(did);
      setMyAgentData(perspective);
    } catch (error) {
      console.error('AdamContext: getMyAgentData error', error);
    }
  }

  async function getMySpaces(client: Ad4mClient): Promise<void> {
    try {
      const spacePerspectives = await client.perspective.all();
      const spaces = await Promise.all(
        spacePerspectives.map(async (spacePerspective) => (await Space.findAll(spacePerspective))[0]),
      );
      setMySpaces(spaces.filter((s) => s).sort((a, b) => Number(a.timestamp) - Number(b.timestamp)));
    } catch (error) {
      console.error('AdamContext: getMySpaces error', error);
    }
  }

  async function getMyAI(client: Ad4mClient): Promise<void> {
    try {
      const models = await client.ai.getModels();
      const tasks = await client.ai.tasks();
      setMyAI({ models, tasks });
    } catch (error) {
      console.error('AdamContext: getMyAI error', error);
    }
  }

  async function getMyThemeSettings(client: Ad4mClient): Promise<void> {
    try {
      // Get theme settings from personal settings perspective
      // setMyThemeSettings()
    } catch (error) {
      console.error('AdamContext: getMyThemeSettings error', error);
    }
  }

  async function getData(): Promise<void> {
    // Get the ad4m client
    const client = await getAdamClient();
    if (!client) return;
    console.log('client:', client);
    setAd4mClient(client);

    // Then use it to fetch all other required data
    await Promise.all([getMyAgentData(client), getMySpaces(client), getMyThemeSettings(client)]);

    setLoading(false);
  }

  useEffect(() => {
    console.log('AdamContext mounted');
  }, [])

  useEffect(() => {
    getData();
  }, []);

  // Update the theme class on the document element when the theme changes
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(myThemeSettings.currentTheme.name.toLowerCase());
  }, [myThemeSettings.currentTheme]);

  return (
    <context.Provider
      value={{
        loading,
        ad4mClient,
        myDid,
        myAgentData,
        mySpaces,
        myAI,
        myThemeSettings,
        activeModals,
        setMySpaces,
        setMyThemeSettings,
        setActiveModals,
      }}
    >
      {children}
    </context.Provider>
  );
};

export const useAdamContext = () => useContext(context);

export default AdamContext;
