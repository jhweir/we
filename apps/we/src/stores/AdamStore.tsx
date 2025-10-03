import { Ad4mClient, Agent } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { Space } from '@we/models';
import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

export { type Ad4mClient, PerspectiveProxy } from '@coasys/ad4m';

// TODO:
// + move ai to separate stores
// + rename to AppStore

export interface AdamStore {
  loading: Accessor<boolean>;
  adamClient: Accessor<Ad4mClient | undefined>;
  me: Accessor<Agent | undefined>;
  mySpaces: Accessor<Space[]>;
  // myAI: Accessor<{ models: any[]; tasks: AITask[] }>;
  addNewSpace: (space: Space) => void;
  setLoading: (v: boolean) => void;
  setAdamClient: (c: Ad4mClient) => void;
  setMe: (a: Agent) => void;
  setMySpaces: (spaces: Space[]) => void;
  // setMyAI: (ai: { models: any[]; tasks: AITask[] }) => void;
}

const AdamContext = createContext<AdamStore>();

export function AdamStoreProvider(props: ParentProps) {
  const [loading, setLoading] = createSignal(true);
  const [adamClient, setAdamClient] = createSignal<Ad4mClient | undefined>(undefined);
  const [me, setMe] = createSignal<Agent | undefined>(undefined);
  const [mySpaces, setMySpaces] = createSignal<Space[]>([]);
  // const [myAI, setMyAI] = createSignal<{ models: any[]; tasks: AITask[] }>({ models: [], tasks: [] });

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
      console.log('AdamStore: getMySpaces perspectives', perspectives);
      const spaces = await Promise.all(perspectives.map(async (perspective) => (await Space.findAll(perspective))[0]));
      console.log('AdamStore: getMySpaces spaces', spaces);
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
    setMySpaces((prev) => [...prev, space]);
  }

  createEffect(initialiseStore);

  const store: AdamStore = {
    loading,
    adamClient,
    me,
    mySpaces,
    // myAI,
    addNewSpace,
    setLoading,
    setAdamClient,
    setMe,
    setMySpaces,
    // setMyAI,
  };

  return <AdamContext.Provider value={store}>{props.children}</AdamContext.Provider>;
}

export function useAdamStore(): AdamStore {
  const context = useContext(AdamContext);
  if (!context) throw new Error('useAdamStore must be used within the AdamProvider');
  return context;
}

export default AdamStoreProvider;
