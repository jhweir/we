/**
 * Call session factory adapter — bridges the AD4M `NeighbourhoodProxy.createSession` API to the
 * call module's `createBackend` dependency.
 *
 * The call module declares a `CallBackend` structural interface (topology-agnostic, no AD4M
 * imports). AD4M's `Session` satisfies it structurally. This adapter provides a factory function
 * the host wires into the call module's `CallStoreDeps.createBackend` — so the module stays
 * backend-agnostic and the host does the AD4M-specific construction.
 */
import { Ad4mClient, NeighbourhoodProxy, type PerspectiveProxy } from '@coasys/ad4m';
import type { DatasetHandle } from '@we/backend-shared';

/**
 * Build a factory function that creates a `CallBackend` (Session) for a given call room.
 *
 * Every argument is a **getter**, read at call time rather than captured — so the factory is safe
 * to construct before the backend connects, and it follows navigation between spaces. This matches
 * the late-binding contract every other module host service uses.
 *
 * At call time it:
 * 1. Reads the current backend client, dataset (perspective) and agent identity
 * 2. Constructs a `NeighbourhoodProxy` for that perspective
 * 3. Calls `createSession(callId)` to get a Session with auto topology resolution
 *
 * The Session handles mesh ↔ SFU topology switching, SDP negotiation, SFU cascade failover,
 * simulcast quality preferences, and data channel relay internally.
 *
 * @param getBackendClient  Reactive accessor for the `Ad4mClient` (typed `unknown` at the port boundary).
 * @param getCurrentDataset  Reactive accessor for the current dataset (perspective).
 * @param getSelfId  Reactive accessor for the current agent DID.
 */
export function createCallSessionFactory(
  getBackendClient: () => unknown,
  getCurrentDataset: () => DatasetHandle | null,
  getSelfId: () => string | null,
): (callId: string) => Promise<unknown> {
  return async (callId: string) => {
    const raw = getBackendClient();
    if (!raw) throw new Error('Cannot create call session — no backend client');
    const client = raw as Ad4mClient;

    const dataset = getCurrentDataset();
    if (!dataset) throw new Error('Cannot create call session — no active dataset');

    const proxy = dataset as PerspectiveProxy;
    const selfId = getSelfId();
    if (!selfId) throw new Error('Cannot create call session — no agent identity');

    const neighbourhoodUrl = proxy.sharedUrl ?? '';

    // Construct with the agent DID so call-presence links carry the right source.
    const nhProxy = new NeighbourhoodProxy(client.neighbourhood, proxy.uuid, selfId);

    return await nhProxy.createSession(callId, {
      neighbourhoodUrl,
      topology: 'auto',
    });
  };
}
