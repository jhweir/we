'use client';

import { Ad4mClient, AITask, Perspective, PerspectiveProxy } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface IAdamContext {
  loading: boolean;
  ad4mClient: Ad4mClient | undefined;
  myDid: string;
  myAgentPerspective: Perspective | undefined;
  myPerspectives: PerspectiveProxy[];
  myAIModels: any[]; // Model[] (not yet exported from @coasys/ad4m)
  myAITasks: AITask[];
}

const defaultAdamContext: IAdamContext = {
  loading: true,
  ad4mClient: undefined,
  myDid: '',
  myAgentPerspective: undefined,
  myPerspectives: [],
  myAIModels: [],
  myAITasks: [],
};

const context = createContext<IAdamContext>(defaultAdamContext);

const AdamContext = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [ad4mClient, setAd4mClient] = useState<Ad4mClient>();
  const [myDid, setMyDid] = useState('');
  const [myAgentPerspective, setMyAgentPerspective] = useState<Perspective>();
  const [myPerspectives, setMyPerspectives] = useState<PerspectiveProxy[]>([]);
  const [myAIModels, setMyAIModels] = useState<any[]>([]); // Model[];
  const [myAITasks, setMyAITasks] = useState<AITask[]>([]);

  async function getAdamClient() {
    try {
      const ui = Ad4mConnect({
        appName: 'WE',
        appDesc: 'Social media for the new internet',
        appDomain: 'ad4m.weco.io',
        appIconPath: 'https://avatars.githubusercontent.com/u/34165012',
        capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      });
      return await ui.connect();
    } catch (error) {
      console.error('AdamContext: getAdamClient error', error);
    }
  }

  async function getAgentData(client: Ad4mClient): Promise<void> {
    try {
      const { did, perspective } = await client.agent.me();
      setMyDid(did);
      setMyAgentPerspective(perspective);
    } catch (error) {
      console.error('AdamContext: getAgentData error', error);
    }
  }

  async function getPerspectives(client: Ad4mClient): Promise<void> {
    try {
      const perspectives = await client.perspective.all();
      setMyPerspectives(perspectives);
    } catch (error) {
      console.error('AdamContext: getPerspectives error', error);
    }
  }

  async function getAIData(client: Ad4mClient): Promise<void> {
    try {
      const models = await client.ai.getModels();
      const tasks = await client.ai.tasks();
      setMyAIModels(models);
      setMyAITasks(tasks);
    } catch (error) {
      console.error('AdamContext: getAIData error', error);
    }
  }

  async function getData(): Promise<void> {
    const client = await getAdamClient();
    if (!client) return;

    console.log('client:', client);
    setAd4mClient(client);

    // Fetch all other required data after the client is ready
    await Promise.all([getAgentData(client), getPerspectives(client), getAIData(client)]);

    setLoading(false);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <context.Provider value={{ loading, ad4mClient, myDid, myAgentPerspective, myPerspectives, myAIModels, myAITasks }}>
      {children}
    </context.Provider>
  );
};

export const useAdamContext = () => useContext(context);

export default AdamContext;
