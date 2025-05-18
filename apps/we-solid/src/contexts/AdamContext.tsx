import Space from '@/models/Space';
import { Ad4mClient, AITask, Perspective } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

export type Theme = { name: string; icon: string };
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type ThemeSettings = {
  allThemes: Theme[];
  currentTheme: Theme;
  iconWeight: IconWeight;
  currentTemplate: string;
};
export type ActiveModals = { createSpace: boolean };

export interface IAdamContext {
  loading: () => boolean;
  ad4mClient: () => Ad4mClient | undefined;
  myDid: () => string;
  myAgentData: () => Perspective | undefined;
  mySpaces: () => Space[];
  myAI: () => { models: any[]; tasks: AITask[] };
  myThemeSettings: () => ThemeSettings;
  activeModals: () => ActiveModals;
  setMySpaces: (spaces: Space[] | ((prev: Space[]) => Space[])) => void;
  setMyThemeSettings: (settings: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void;
  setActiveModals: (modals: ActiveModals | ((prev: ActiveModals) => ActiveModals)) => void;
}

const themes = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
};

const defaultAdamContext: IAdamContext = {
  loading: () => true,
  ad4mClient: () => undefined,
  myDid: () => '',
  myAgentData: () => undefined,
  mySpaces: () => [],
  myAI: () => ({ models: [], tasks: [] }),
  myThemeSettings: () => ({
    allThemes: [themes.light, themes.dark],
    currentTheme: themes.dark,
    iconWeight: 'regular',
    currentTemplate: 'default',
  }),
  activeModals: () => ({ createSpace: false }),
  setMySpaces: () => {},
  setMyThemeSettings: () => {},
  setActiveModals: () => {},
};

// Create the context
const AdamContext = createContext<IAdamContext>(defaultAdamContext);

// Create the provider component
export function AdamProvider(props: ParentProps) {
  const [loading, setLoading] = createSignal(defaultAdamContext.loading());
  const [ad4mClient, setAd4mClient] = createSignal(defaultAdamContext.ad4mClient());
  const [myDid, setMyDid] = createSignal(defaultAdamContext.myDid());
  const [myAgentData, setMyAgentData] = createSignal(defaultAdamContext.myAgentData());
  const [mySpaces, setMySpaces] = createSignal(defaultAdamContext.mySpaces());
  const [myAI, setMyAI] = createSignal(defaultAdamContext.myAI());
  const [myThemeSettings, setMyThemeSettings] = createSignal(defaultAdamContext.myThemeSettings());
  const [activeModals, setActiveModals] = createSignal(defaultAdamContext.activeModals());

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

  // onMount equivalent
  createEffect(() => {
    console.log('AdamContext mounted');
    getData();
  });

  // Theme effect
  createEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(myThemeSettings().currentTheme.name.toLowerCase());
  });

  const contextValue: IAdamContext = {
    // Getters
    loading,
    ad4mClient,
    myDid,
    myAgentData,
    mySpaces,
    myAI,
    myThemeSettings,
    activeModals,

    // Setters
    setMySpaces,
    setMyThemeSettings,
    setActiveModals,
  };

  return <AdamContext.Provider value={contextValue}>{props.children}</AdamContext.Provider>;
}

// Custom hook for using the context
export function useAdamContext() {
  return useContext(AdamContext);
}

export default AdamProvider;
