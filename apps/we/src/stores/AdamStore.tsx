import { Ad4mClient, Agent } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { Space } from '@we/models';
import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

// TODO:
// + move ai to separate stores

export interface AdamStore {
  loading: Accessor<boolean>;
  ad4mClient: Accessor<Ad4mClient | undefined>;
  me: Accessor<Agent | undefined>;
  mySpaces: Accessor<Space[]>;
  // myAI: Accessor<{ models: any[]; tasks: AITask[] }>;
  addNewSpace: (space: Space) => void;
  setLoading: (v: boolean) => void;
  setAd4mClient: (c: Ad4mClient) => void;
  setMe: (a: Agent) => void;
  setMySpaces: (spaces: Space[]) => void;
  // setMyAI: (ai: { models: any[]; tasks: AITask[] }) => void;
}

const AdamContext = createContext<AdamStore>();

export function AdamProvider(props: ParentProps) {
  const [loading, setLoading] = createSignal(true);
  const [ad4mClient, setAd4mClient] = createSignal<Ad4mClient | undefined>(undefined);
  const [me, setMe] = createSignal<Agent | undefined>(undefined);
  const [mySpaces, setMySpaces] = createSignal<Space[]>([]);
  // const [myAI, setMyAI] = createSignal<{ models: any[]; tasks: AITask[] }>({ models: [], tasks: [] });

  async function getAdamClient() {
    try {
      const connect = Ad4mConnect({
        appName: 'WE',
        appDesc: 'Social media for a new internet',
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
      console.log('Updated mySpaces:', filteredSpaces);
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
    console.log('client:', client);
    setAd4mClient(client);

    await Promise.all([getMe(client), getMySpaces(client)]);

    setLoading(false);
  }

  function addNewSpace(space: Space): void {
    setMySpaces((prev) => [...prev, space]);
  }

  createEffect(() => {
    console.log('AdamContext mounted');
    // initialiseStore();
  });

  const store: AdamStore = {
    loading,
    ad4mClient,
    me,
    mySpaces,
    // myAI,
    addNewSpace,
    setLoading,
    setAd4mClient,
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

export default AdamProvider;
