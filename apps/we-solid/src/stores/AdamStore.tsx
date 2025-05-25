import Space from '@/models/Space';
import { Ad4mClient, Agent, AITask } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { createContext, createEffect, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

// TODO:
// + move theme settings and modals to separate stores
// + move types to a separate file

export type Theme = { name: string; icon: string };
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type ThemeSettings = {
  allThemes: Theme[];
  currentTheme: Theme;
  iconWeight: IconWeight;
  currentTemplate: string;
};
export type ActiveModals = { createSpace: boolean };

export interface AdamStore {
  state: {
    loading: boolean;
    ad4mClient: Ad4mClient | undefined;
    me: Agent | undefined;
    mySpaces: Space[];
    // TODO: move to separate stores
    myAI: { models: any[]; tasks: AITask[] };
    myThemeSettings: ThemeSettings;
    activeModals: ActiveModals;
  };
  actions: {
    setMySpaces: (spaces: Space[]) => void;
    setMyThemeSettings: (settings: ThemeSettings) => void;
    setActiveModals: (modals: ActiveModals) => void;
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

const defaultState: AdamStore['state'] = {
  loading: true,
  ad4mClient: undefined,
  me: undefined,
  mySpaces: [],
  myAI: { models: [], tasks: [] },
  myThemeSettings: defaultThemeSettings,
  activeModals: { createSpace: false },
};

// Create the context
const adamContext = createContext<AdamStore>();

// Create the provider component
export function AdamProvider(props: ParentProps) {
  const [state, setState] = createStore(defaultState);

  // Helpers
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
      const spaces = await Promise.all(perspectives.map(async (perspective) => (await Space.findAll(perspective))[0]));
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

  // Setters
  const setMySpaces = (spaces: Space[]) => setState('mySpaces', spaces);
  const setMyThemeSettings = (settings: ThemeSettings) => setState('myThemeSettings', settings);
  const setActiveModals = (modals: ActiveModals) => setState('activeModals', modals);

  // Main data fetching function
  async function initialiseStore(): Promise<void> {
    // Get the ad4m client
    const client = await getAdamClient();
    if (!client) return;
    console.log('client:', client);
    setState('ad4mClient', client);

    // Then use it to fetch all other required data
    await Promise.all([getMe(client), getMySpaces(client), getMyThemeSettings(client)]);

    setState('loading', false);
  }

  // getData on mount
  createEffect(() => {
    console.log('AdamContext mounted');
    initialiseStore();
  });

  // Theme effect
  createEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(state.myThemeSettings.currentTheme.name.toLowerCase());
  });

  return (
    <adamContext.Provider value={{ state, actions: { setMySpaces, setMyThemeSettings, setActiveModals } }}>
      {props.children}
    </adamContext.Provider>
  );
}

// Custom hook for using the context
export function useAdamStore(): AdamStore {
  const context = useContext(adamContext);
  if (!context) throw new Error('useAdamStore must be used within an AdamProvider');
  return context;
}

export default AdamProvider;

// import Space from '@/models/Space';
// import { Ad4mClient, AITask, Perspective } from '@coasys/ad4m';
// import Ad4mConnect from '@coasys/ad4m-connect';
// import { createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

// export type Theme = { name: string; icon: string };
// export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
// export type ThemeSettings = {
//   allThemes: Theme[];
//   currentTheme: Theme;
//   iconWeight: IconWeight;
//   currentTemplate: string;
// };
// export type ActiveModals = { createSpace: boolean };

// export interface IAdamContext {
//   loading: () => boolean;
//   ad4mClient: () => Ad4mClient | undefined;
//   myDid: () => string;
//   myAgentData: () => Perspective | undefined;
//   mySpaces: () => Space[];
//   myAI: () => { models: any[]; tasks: AITask[] };
//   myThemeSettings: () => ThemeSettings;
//   activeModals: () => ActiveModals;
//   setMySpaces: (spaces: Space[] | ((prev: Space[]) => Space[])) => void;
//   setMyThemeSettings: (settings: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void;
//   setActiveModals: (modals: ActiveModals | ((prev: ActiveModals) => ActiveModals)) => void;
// }

// const themes = {
//   light: { name: 'Light', icon: 'sun' },
//   dark: { name: 'Dark', icon: 'moon' },
// };

// const defaultAdamContext: IAdamContext = {
//   loading: () => true,
//   ad4mClient: () => undefined,
//   myDid: () => '',
//   myAgentData: () => undefined,
//   mySpaces: () => [],
//   myAI: () => ({ models: [], tasks: [] }),
//   myThemeSettings: () => ({
//     allThemes: [themes.light, themes.dark],
//     currentTheme: themes.dark,
//     iconWeight: 'regular',
//     currentTemplate: 'default',
//   }),
//   activeModals: () => ({ createSpace: false }),
//   setMySpaces: () => {},
//   setMyThemeSettings: () => {},
//   setActiveModals: () => {},
// };

// // Create the context
// const adamContext = createContext<IAdamContext>(defaultAdamContext);

// // Create the provider component
// export function AdamProvider(props: ParentProps) {
//   const [loading, setLoading] = createSignal(defaultAdamContext.loading());
//   const [ad4mClient, setAd4mClient] = createSignal(defaultAdamContext.ad4mClient());
//   const [myDid, setMyDid] = createSignal(defaultAdamContext.myDid());
//   const [myAgentData, setMyAgentData] = createSignal(defaultAdamContext.myAgentData());
//   const [mySpaces, setMySpaces] = createSignal(defaultAdamContext.mySpaces());
//   const [myAI, setMyAI] = createSignal(defaultAdamContext.myAI());
//   const [myThemeSettings, setMyThemeSettings] = createSignal(defaultAdamContext.myThemeSettings());
//   const [activeModals, setActiveModals] = createSignal(defaultAdamContext.activeModals());

//   async function getAdamClient() {
//     try {
//       const ui = Ad4mConnect({
//         appName: 'WE',
//         appDesc: 'Social media for a new internet',
//         appDomain: 'ad4m.weco.io',
//         appIconPath: 'https://avatars.githubusercontent.com/u/34165012',
//         capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
//       });
//       return await ui.connect();
//     } catch (error) {
//       console.error('AdamStore: getAdamClient error', error);
//     }
//   }

//   async function getMyAgentData(client: Ad4mClient): Promise<void> {
//     try {
//       const { did, perspective } = await client.agent.me();
//       setMyDid(did);
//       setMyAgentData(perspective);
//     } catch (error) {
//       console.error('AdamStore: getMyAgentData error', error);
//     }
//   }

//   async function getMySpaces(client: Ad4mClient): Promise<void> {
//     try {
//       const perspectives = await client.perspective.all();
//       const spaces = await Promise.all(
//         perspectives.map(async (spacePerspective) => (await Space.findAll(spacePerspective))[0]),
//       );
//       setMySpaces(spaces.filter((s) => s).sort((a, b) => Number(a.timestamp) - Number(b.timestamp)));
//       console.log('Updated mySpaces:', mySpaces());
//     } catch (error) {
//       console.error('AdamStore: getMySpaces error', error);
//     }
//   }

//   async function getMyAI(client: Ad4mClient): Promise<void> {
//     try {
//       const models = await client.ai.getModels();
//       const tasks = await client.ai.tasks();
//       setMyAI({ models, tasks });
//     } catch (error) {
//       console.error('AdamStore: getMyAI error', error);
//     }
//   }

//   async function getMyThemeSettings(client: Ad4mClient): Promise<void> {
//     try {
//       // Get theme settings from personal settings perspective
//       // setMyThemeSettings()
//     } catch (error) {
//       console.error('AdamStore: getMyThemeSettings error', error);
//     }
//   }

//   async function getData(): Promise<void> {
//     // Get the ad4m client
//     const client = await getAdamClient();
//     if (!client) return;
//     console.log('client:', client);
//     setAd4mClient(client);

//     // Then use it to fetch all other required data
//     await Promise.all([getMyAgentData(client), getMySpaces(client), getMyThemeSettings(client)]);

//     setLoading(false);
//   }

//   // onMount equivalent
//   createEffect(() => {
//     console.log('AdamContext mounted');
//     getData();
//   });

//   // Theme effect
//   createEffect(() => {
//     document.documentElement.classList.remove('dark', 'light');
//     document.documentElement.classList.add(myThemeSettings().currentTheme.name.toLowerCase());
//   });

//   const contextValue: IAdamContext = {
//     // Getters
//     loading,
//     ad4mClient,
//     myDid,
//     myAgentData,
//     mySpaces,
//     myAI,
//     myThemeSettings,
//     activeModals,

//     // Setters
//     setMySpaces,
//     setMyThemeSettings,
//     setActiveModals,
//   };

//   return <adamContext.Provider value={contextValue}>{props.children}</adamContext.Provider>;
// }

// // Custom hook for using the context
// export function useAdamStore() {
//   return useContext(adamContext);
// }

// export default AdamProvider;
