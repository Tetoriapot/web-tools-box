import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOfflineSupport } from '../../src/lib/offline';

class Port {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  close = vi.fn();
}
class Channel {
  port1 = new Port();
  port2 = { target: this.port1, close: vi.fn() };
}
class Worker extends EventTarget {
  state = 'activated';
  response: unknown = { ready: true };
  silent = false;
  postMessage = vi.fn((_message: unknown, ports: Channel['port2'][]) => {
    if (!this.silent) ports[0]!.target.onmessage?.({ data: this.response });
  });
}
function environment() {
  const worker = new Worker();
  const registration = Object.assign(new EventTarget(), {
    active: worker as Worker | null,
    waiting: null as Worker | null,
    installing: null as Worker | null,
  });
  const container = Object.assign(new EventTarget(), { register: vi.fn(async () => registration) });
  vi.stubGlobal('window', Object.assign(new EventTarget(), { isSecureContext: true }));
  vi.stubGlobal('navigator', { serviceWorker: container });
  vi.stubGlobal('MessageChannel', Channel);
  return { worker, registration, container };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('offline support', () => {
  it('registers within a project subdirectory', async () => {
    const { container } = environment();
    await createOfflineSupport(true, '/web-tools-box/').start();
    expect(container.register).toHaveBeenCalledWith('/web-tools-box/sw.js', {
      scope: '/web-tools-box/',
      updateViaCache: 'none',
    });
  });
  it('never registers a service worker in development', async () => {
    const { container } = environment();
    const store = createOfflineSupport(false);
    await store.start();
    expect(store.getSnapshot()).toBe('development');
    expect(container.register).not.toHaveBeenCalled();
  });
  it.each(['insecure', 'missing'] as const)('handles an %s environment', async (mode) => {
    environment();
    if (mode === 'insecure') vi.stubGlobal('window', { isSecureContext: false });
    else vi.stubGlobal('navigator', {});
    const store = createOfflineSupport(true);
    await store.start();
    expect(store.getSnapshot()).toBe('unsupported');
  });
  it('survives registration denied by browser settings', async () => {
    const { container } = environment();
    container.register.mockRejectedValue(new Error('denied'));
    const store = createOfflineSupport(true);
    await store.start();
    expect(store.getSnapshot()).toBe('unavailable');
  });
  it('registers once, validates caches, and reports waiting updates without activating them', async () => {
    const { container, registration, worker } = environment();
    const store = createOfflineSupport(true);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    await store.start();
    await store.refresh();
    await store.start();
    expect(container.register).toHaveBeenCalledExactlyOnceWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    expect(store.getSnapshot()).toBe('ready');
    registration.waiting = new Worker();
    await store.refresh();
    expect(store.getSnapshot()).toBe('update-ready');
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
    expect(
      worker.postMessage.mock.calls.every(
        ([message]) => JSON.stringify(message) === '{"type":"OFFLINE_STATUS"}',
      ),
    ).toBe(true);
    unsubscribe();
    listener.mockClear();
    worker.response = { ready: false };
    await store.refresh();
    expect(store.getSnapshot()).toBe('unavailable');
    expect(listener).not.toHaveBeenCalled();
  });
  it('follows installation success and failure', async () => {
    const { worker, registration } = environment();
    worker.state = 'installing';
    registration.active = null;
    registration.installing = worker;
    const store = createOfflineSupport(true);
    await store.start();
    expect(store.getSnapshot()).toBe('preparing');
    registration.installing = null;
    worker.state = 'redundant';
    worker.dispatchEvent(new Event('statechange'));
    expect(store.getSnapshot()).toBe('unavailable');
    registration.active = worker;
    worker.state = 'activated';
    worker.dispatchEvent(new Event('statechange'));
    await vi.waitFor(() => expect(store.getSnapshot()).toBe('ready'));
  });
  it('treats a malformed status response or missing messaging API as unavailable', async () => {
    const { worker } = environment();
    const store = createOfflineSupport(true);
    worker.response = { ready: 'true' };
    await store.start();
    await store.refresh();
    expect(store.getSnapshot()).toBe('unavailable');
    vi.stubGlobal('MessageChannel', undefined);
    await store.refresh();
    expect(store.getSnapshot()).toBe('unavailable');
  });
  it('bounds unresponsive workers and recovers after a later successful check', async () => {
    vi.useFakeTimers();
    const { worker } = environment();
    worker.silent = true;
    const store = createOfflineSupport(true);
    await store.start();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(store.getSnapshot()).toBe('unavailable');
    worker.silent = false;
    await store.refresh();
    expect(store.getSnapshot()).toBe('ready');
  });
});
