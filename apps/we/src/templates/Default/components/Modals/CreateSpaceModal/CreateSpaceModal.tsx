import Block from '@/models/Block';
import Space from '@/models/Space';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import { useAdamStore, useModalStore } from '@/stores';
import { createSignal } from 'solid-js';

type SpaceVisibility = 'hidden' | 'private' | 'public';

export default function CreateSpaceModal() {
  const adamStore = useAdamStore();
  const modalStore = useModalStore();

  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [locations, setLocations] = createSignal([]);
  const [visibility, setVisibility] = createSignal<SpaceVisibility>('private');
  const [loading, setLoading] = createSignal(false);

  function close() {
    modalStore.actions.closeModal('createSpace');
  }

  async function createSpace() {
    console.log('createspace', name(), description(), locations(), visibility());
    const client = adamStore.state.ad4mClient;
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
    adamStore.actions.addNewSpace(space);

    close();
  }

  return (
    <we-modal close={close}>
      <we-column p="600" gap="400" ax="center">
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
      </we-column>
    </we-modal>
  );
}
