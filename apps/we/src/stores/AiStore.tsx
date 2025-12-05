import { Ad4mClient, AITask } from '@coasys/ad4m';
import { Model } from '@coasys/ad4m/lib/src/ai/AIResolver';
import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

import { schemaPromptContext } from '@/prompts/schemaContext';
import { schemaPromptExamples } from '@/prompts/schemaExamples';
import { useAdamStore, useTemplateStore } from '@/stores';

const extractJSON = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const jsonFence = extractJSONFence(text);
      if (!jsonFence) return null;
      return JSON.parse(jsonFence);
    } catch {
      return null;
    }
  }
};

const extractJSONFence = (text: string): string | null => {
  const regex = /```json([\s\S]*?)```/;
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
};

export interface AiStore {
  // State
  models: Accessor<Model[]>;
  tasks: Accessor<AITask[]>;

  // Actions
  handleSchemaPrompt: (prompt: string) => Promise<string | undefined>;
}

const AiContext = createContext<AiStore>();

const schemaTask: Omit<AITask, 'createdAt' | 'updatedAt'> = {
  taskId: 'we-schema-generation',
  name: 'WE Schema Generation',
  modelId: 'default',
  systemPrompt: schemaPromptContext,
  promptExamples: schemaPromptExamples,
  metaData: 'Generates UI JSON schema based on user requirements',
};

export function AiStoreProvider(props: ParentProps) {
  const adamStore = useAdamStore();
  const templateStore = useTemplateStore();

  const [models, setModels] = createSignal<Model[]>([]);
  const [tasks, setTasks] = createSignal<AITask[]>([]);

  async function initialiseStore(client: Ad4mClient): Promise<void> {
    try {
      setModels(await client.ai.getModels());
      setTasks(await client.ai.tasks());

      // Ensure schema task is set up
      const existingSchemaTask = tasks().find((r) => r.name === schemaTask.name);
      if (!existingSchemaTask) {
        console.log('Creating schema task');
        await client.ai.addTask(
          schemaTask.name,
          schemaTask.modelId,
          schemaTask.systemPrompt,
          schemaTask.promptExamples,
        );
        setTasks(await client.ai.tasks());
        console.log('Schema task created', { tasks: tasks() });
      }
    } catch (error) {
      console.error('AdamStore: getMyAI error', error);
    }
  }

  async function handleSchemaPrompt(textPrompt: string) {
    const client = adamStore.adamClient();
    if (!client) return;

    const fullPrompt = `{ "request": "${textPrompt}", "currentSchema": ${JSON.stringify(templateStore.currentTemplate)} }`;

    const existingSchemaTask = tasks().find((t) => t.name === schemaTask.name);
    const taskId = existingSchemaTask ? existingSchemaTask.taskId : null;

    if (!taskId) {
      console.error('Schema task not found');
      return;
    }

    const result = await client.ai.prompt(taskId, fullPrompt);

    try {
      console.log('Schema generation result', result);
      const parsedResult = extractJSON(result);
      console.log('Schema generation result', parsedResult);
      const updatedSchema = parsedResult.updatedSchema;
      const response = parsedResult.response;

      console.log('updatedSchema', updatedSchema);
      console.log('response', response);

      if (updatedSchema) {
        // Update the current template schema
        console.log('Updating template schema in store');
        templateStore.updateTemplate(updatedSchema);
      }
      return response;
    } catch (e) {
      console.error('Failed to parse schema generation result', e);
      return 'Failed to parse schema generation result';
    }
  }

  createEffect(() => {
    const client = adamStore.adamClient();
    if (client) initialiseStore(client);
  });

  const store: AiStore = {
    // State
    models,
    tasks,

    // Actions
    handleSchemaPrompt,
  };

  return <AiContext.Provider value={store}>{props.children}</AiContext.Provider>;
}

export function useAiStore(): AiStore {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error('useAiStore must be used within AiStoreProvider');
  return ctx;
}

export default AiStoreProvider;
