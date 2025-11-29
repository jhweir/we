import { Ad4mClient, Agent, PerspectiveProxy } from '@coasys/ad4m';
import Ad4mConnect from '@coasys/ad4m-connect';
import { useNavigate } from '@solidjs/router';
import { Space } from '@we/models';
import { Accessor, createContext, createEffect, createSignal, ParentProps, untrack, useContext } from 'solid-js';
export { type Ad4mClient, PerspectiveProxy } from '@coasys/ad4m';
import { A, B, C, D, E, F, G, H, I, J } from '@we/models';

// TODO:
// + move ai to separate stores
// + rename to AppStore
// + set up seperate route store?

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

  // Testing
  addItems: () => void;
  a: Accessor<A[]>;
  b: Accessor<B[]>;
  c: Accessor<C[]>;
  d: Accessor<D[]>;
  e: Accessor<E[]>;
  f: Accessor<F[]>;
  g: Accessor<G[]>;
  h: Accessor<H[]>;
  i: Accessor<I[]>;
  j: Accessor<J[]>;
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
  const [testPerspective, setTestPerspective] = createSignal<PerspectiveProxy | null>(null);

  const [a, setA] = createSignal<A[]>([]);
  const [b, setB] = createSignal<B[]>([]);
  const [c, setC] = createSignal<C[]>([]);
  const [d, setD] = createSignal<D[]>([]);
  const [e, setE] = createSignal<E[]>([]);
  const [f, setF] = createSignal<F[]>([]);
  const [g, setG] = createSignal<G[]>([]);
  const [h, setH] = createSignal<H[]>([]);
  const [i, setI] = createSignal<I[]>([]);
  const [j, setJ] = createSignal<J[]>([]);

  // const builder = Recipe.query(perspective)
  //   .where({ category: "Dessert" })
  //   .order({ rating: "DESC" })
  //   .limit(10);

  // // Run once
  // const recipes = await builder.run();

  // // Or subscribe to updates
  // await builder.subscribe(recipes => {
  //   console.log("Updated recipes:", recipes);
  // });

  // A.subscribe(handleNewEntires as (results: Ad4mModel[]) => void)

  // const { entries: tasks } = useModel({ perspective, model: Task, query: { source: column.baseExpression } });

  // space.

  const models = [
    { name: 'A', class: A },
    { name: 'B', class: B },
    { name: 'C', class: C },
    { name: 'D', class: D },
    { name: 'E', class: E },
    { name: 'F', class: F },
    { name: 'G', class: G },
    { name: 'H', class: H },
    { name: 'I', class: I },
    { name: 'J', class: J },
  ];

  function setData(modelName: string, data: any[]) {
    if (modelName === 'A') setA(data);
    else if (modelName === 'B') setB(data);
    else if (modelName === 'C') setC(data);
    else if (modelName === 'D') setD(data);
    else if (modelName === 'E') setE(data);
    else if (modelName === 'F') setF(data);
    else if (modelName === 'G') setG(data);
    else if (modelName === 'H') setH(data);
    else if (modelName === 'I') setI(data);
    else if (modelName === 'J') setJ(data);
  }

  async function fetchEntries(perspective: PerspectiveProxy, model: { name: string; class: any }) {
    await perspective.ensureSDNASubjectClass(model.class);
    // console.log(`${model.name} fetch`, model.class);

    // A.query()

    const firstResult = await model.class //.query(perspective);
      .query(perspective)
      .subscribe((laterResults) => {
        console.log(`${model.name} updated result:`, laterResults);
        setData(model.name, laterResults);
      });

    setData(model.name, firstResult);
    // console.log(`${model.name} first result:`, firstResult);
  }

  async function addEntries(perspective: PerspectiveProxy, model: { name: string; class: any }) {
    console.log('Adding 3 new entries for model', model);
    const new1 = new model.class(perspective);
    new1[`text${model.name}`] = 'test ' + Date.now();
    await new1.save();

    const new2 = new model.class(perspective);
    new2[`text${model.name}`] = 'test ' + Date.now();
    await new2.save();

    const new3 = new model.class(perspective);
    new3[`text${model.name}`] = 'test ' + Date.now();
    await new3.save();

    console.log('Added 3 new entries for model', model);
  }

  async function addItems() {
    const perspective = testPerspective();
    if (!perspective) return;

    Promise.all(models.map((model) => addEntries(perspective, model)));
  }

  createEffect(() => {
    console.log('Effect running', testPerspective());
    const perspective = testPerspective();
    if (!perspective) return;

    models.forEach((model) => fetchEntries(perspective, model));
  });

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
      console.log('perspectives', perspectives);
      const test = perspectives.find((p) => p.name === '2');
      setTestPerspective(test ?? null);
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

    // Testing
    addItems,
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    i,
    j,
  };

  return <AdamContext.Provider value={store}>{props.children}</AdamContext.Provider>;
}

export function useAdamStore(): AdamStore {
  const context = useContext(AdamContext);
  if (!context) throw new Error('useAdamStore must be used within the AdamProvider');
  return context;
}

export default AdamStoreProvider;
