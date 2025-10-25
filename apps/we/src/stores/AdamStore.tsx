import { Ad4mClient, Agent } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { useNavigate } from '@solidjs/router';
import { Space } from '@we/models';
import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';
export { type Ad4mClient, PerspectiveProxy } from '@coasys/ad4m';

// TODO:
// + move ai to separate stores
// + rename to AppStore

type NavigateFunction = ReturnType<typeof useNavigate>;

export interface AdamStore {
  // State
  loading: Accessor<boolean>;
  adamClient: Accessor<Ad4mClient | undefined>;
  me: Accessor<Agent | undefined>;
  mySpaces: Accessor<Space[]>;

  // Setters
  setNavigateFunction: (navigate: NavigateFunction) => void;

  // Actions
  navigate: (to: string, options?: Record<string, unknown>) => void;
  addNewSpace: (space: Space) => void;
}

const AdamContext = createContext<AdamStore>();

export function AdamStoreProvider(props: ParentProps) {
  const [loading, setLoading] = createSignal(true);
  const [navigateFunction, setNavigateFunction] = createSignal<NavigateFunction | null>(null);
  const [adamClient, setAdamClient] = createSignal<Ad4mClient | undefined>(undefined);
  const [me, setMe] = createSignal<Agent | undefined>(undefined);
  const [mySpaces, setMySpaces] = createSignal<Space[]>([
    // { name: 'A', uuid: 'a' },
    // { name: 'B', uuid: 'b' },
  ]);

  async function getAdamClient() {
    try {
      const connect = Ad4mConnect({
        appName: 'WE',
        appDesc: 'Social media for the new internet',
        appDomain: 'ad4m.weco.io',
        appIconPath: 'https://avatars.githubusercontent.com/u/34165012',
        capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      });
      return await connect.getAd4mClient();
    } catch (error) {
      console.error('AdamStore: getAdamClient error', error);
    }
  }

  async function getMe(client: Ad4mClient): Promise<void> {
    try {
      setMe(await client.agent.me());
    } catch (error) {
      console.error('AdamStore: getMyAgentData error', error);
    }
  }

  async function getMySpaces(client: Ad4mClient): Promise<void> {
    try {
      const perspectives = await client.perspective.all();
      // console.log('AdamStore: getMySpaces perspectives', perspectives);
      const spaces = await Promise.all(perspectives.map(async (perspective) => (await Space.findAll(perspective))[0]));
      // console.log('AdamStore: getMySpaces spaces', spaces);
      const filteredSpaces = spaces.filter((s) => s).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
      setMySpaces(filteredSpaces);
    } catch (error) {
      console.error('AdamStore: getMySpaces error', error);
    }
  }

  // async function getMyAI(client: Ad4mClient): Promise<void> {
  //   try {
  //     const models = await client.ai.getModels();
  //     const tasks = await client.ai.tasks();
  //     setMyAI({ models, tasks });
  //   } catch (error) {
  //     console.error('AdamStore: getMyAI error', error);
  //   }
  // }

  async function initialiseStore(): Promise<void> {
    const client = await getAdamClient();
    if (!client) return;
    setAdamClient(client);

    await Promise.all([getMe(client), getMySpaces(client)]);

    setLoading(false);
  }

  function addNewSpace(space: Space): void {
    // console.log('AdamStore: addNewSpace', space);
    setMySpaces((prev) => [...prev, space]);
  }

  createEffect(initialiseStore);

  function navigate(to: string, options?: Record<string, unknown>) {
    // Skip if already on target path
    if (window.location.pathname === to) return;

    const nav = navigateFunction();
    if (nav) nav(to, options);
    else console.warn('Navigate function not available yet');
  }

  const store: AdamStore = {
    // State
    loading,
    adamClient,
    me,
    mySpaces,

    // Setters
    setNavigateFunction,

    // Actions
    navigate,
    addNewSpace,
  };

  return <AdamContext.Provider value={store}>{props.children}</AdamContext.Provider>;
}

export function useAdamStore(): AdamStore {
  const context = useContext(AdamContext);
  if (!context) throw new Error('useAdamStore must be used within the AdamProvider');
  return context;
}

export default AdamStoreProvider;
