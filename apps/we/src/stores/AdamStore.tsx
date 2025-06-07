import Space from '@/models/Space';
import { Ad4mClient, Agent, AITask } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { createContext, createEffect, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

// TODO:
// + move theme settings and ai to separate stores
// + move types to a separate file

export type Theme = { name: string; icon: string };
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type ThemeSettings = {
  allThemes: Theme[];
  currentTheme: Theme;
  iconWeight: IconWeight;
  currentTemplate: string;
};
export interface AdamStore {
  state: {
    loading: boolean;
    ad4mClient: Ad4mClient | undefined;
    me: Agent | undefined;
    mySpaces: Space[];
    // TODO: move to separate stores
    myAI: { models: any[]; tasks: AITask[] };
    myThemeSettings: ThemeSettings;
  };
  actions: {
    addNewSpace: (space: Space) => void;
  };
}

const themes = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
};

const defaultThemeSettings: ThemeSettings = {
  allThemes: [themes.light, themes.dark],
  currentTheme: themes.dark,
  iconWeight: 'regular',
  currentTemplate: 'default',
};

const adamContext = createContext<AdamStore>();

export function AdamProvider(props: ParentProps) {
  const [state, setState] = createStore<AdamStore['state']>({
    loading: true,
    ad4mClient: undefined,
    me: undefined,
    mySpaces: [],
    myAI: { models: [], tasks: [] },
    myThemeSettings: defaultThemeSettings,
  });

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
      console.error('AdamStore: getAdamClient error', error);
    }
  }

  async function getMe(client: Ad4mClient): Promise<void> {
    try {
      setState('me', await client.agent.me());
    } catch (error) {
      console.error('AdamStore: getMyAgentData error', error);
    }
  }

  async function getMySpaces(client: Ad4mClient): Promise<void> {
    try {
      const perspectives = await client.perspective.all();
      console.log('AdamStore: getMySpaces perspectives', perspectives);
      const spaces = await Promise.all(perspectives.map(async (perspective) => (await Space.findAll(perspective))[0]));
      console.log('AdamStore: getMySpaces spaces', spaces);
      const filteredSpaces = spaces.filter((s) => s).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
      setState('mySpaces', filteredSpaces);
      console.log('Updated mySpaces:', state.mySpaces);
    } catch (error) {
      console.error('AdamStore: getMySpaces error', error);
    }
  }

  async function getMyAI(client: Ad4mClient): Promise<void> {
    try {
      const models = await client.ai.getModels();
      const tasks = await client.ai.tasks();
      setState('myAI', { models, tasks });
    } catch (error) {
      console.error('AdamStore: getMyAI error', error);
    }
  }

  async function getMyThemeSettings(client: Ad4mClient): Promise<void> {
    try {
      // Get theme settings from personal settings perspective
      // setState('myThemeSettings', ...)
    } catch (error) {
      console.error('AdamStore: getMyThemeSettings error', error);
    }
  }

  async function initialiseStore(): Promise<void> {
    // First get the ad4m client
    const client = await getAdamClient();
    if (!client) return;
    console.log('client:', client);
    setState('ad4mClient', client);

    // Then use it to fetch all other required data
    await Promise.all([getMe(client), getMySpaces(client), getMyThemeSettings(client)]);

    setState('loading', false);
  }

  const actions = {
    addNewSpace: (space: Space): void => setState('mySpaces', (prevSpaces) => [...prevSpaces, space]),
  };

  createEffect(() => {
    console.log('AdamContext mounted');
    initialiseStore();
  });

  createEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(state.myThemeSettings.currentTheme.name.toLowerCase());
  });

  return <adamContext.Provider value={{ state, actions }}>{props.children}</adamContext.Provider>;
}

// Custom hook for using the context
export function useAdamStore(): AdamStore {
  const context = useContext(adamContext);
  if (!context) throw new Error('useAdamStore must be used within the AdamProvider');
  return context;
}

export default AdamProvider;
