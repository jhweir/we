import { Ad4mClient } from '@coasys/ad4m';
import { Column } from '@we/components/solid';
import { Block, CollectionBlock, ImageBlock, Space, TextBlock } from '@we/models';
import { createSignal, JSX } from 'solid-js';

export interface CreateSpaceModalWidgetProps {
  adamClient: Ad4mClient | undefined;
  close: () => void;
  addNewSpace: (space: Space) => void;
  class?: string;
  style?: JSX.CSSProperties;
}

// type SpaceVisibility = 'hidden' | 'private' | 'public';

export function CreateSpaceModalWidget(props: CreateSpaceModalWidgetProps) {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  // const [locations, setLocations] = createSignal([]);
  // const [visibility, setVisibility] = createSignal<SpaceVisibility>('private');
  const [loading, setLoading] = createSignal(false);

  async function createSpace() {
    console.log('createspace', name(), description()); // locations(), visibility()
    const client = props.adamClient;
    if (!client) return;
    setLoading(true);

    // Create the perspective for the space
    const spacePerspective = await client.perspective.add(name());

    // Add models to the perspectives SDNA
    const models = [Space, Block, ImageBlock, TextBlock, CollectionBlock];
    await Promise.all(models.map((model) => spacePerspective.ensureSDNASubjectClass(model)));

    // Create an instance of the space model and save it in the perspective
    const space = new Space(spacePerspective);
    space.uuid = spacePerspective.uuid;
    space.name = name();
    space.description = description();
    await space.save();

    console.log('New space', space);

    // Add the new space to the Adam store
    props.addNewSpace(space);

    props.close();
  }

  return (
    <we-modal close={props.close}>
      <Column p="600" gap="400" ax="center">
        <we-text variant="heading">Create a new space</we-text>

        <we-input
          label="Name"
          placeholder="Space name"
          value={name()}
          onInput={(e: InputEvent) => setName((e.target as HTMLInputElement)?.value)}
        />

        <we-input
          label="Description"
          placeholder="Space description"
          value={description()}
          onInput={(e: InputEvent) => setDescription((e.target as HTMLInputElement)?.value)}
        />

        <we-button variant="primary" disabled={!name()} loading={loading()} onClick={createSpace}>
          Create
        </we-button>
      </Column>
    </we-modal>
  );
}
