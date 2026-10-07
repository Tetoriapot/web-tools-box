export type OfflineStatus =
  'development' | 'unsupported' | 'preparing' | 'ready' | 'update-ready' | 'unavailable';

function checkCache(worker: ServiceWorker): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(ready);
    };
    const timer = setTimeout(() => finish(false), 10_000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      finish(typeof data === 'object' && data !== null && 'ready' in data && data.ready === true);
    };
    try {
      worker.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

export function createOfflineSupport(production: boolean, basePath = import.meta.env.BASE_URL) {
  let status: OfflineStatus = production ? 'preparing' : 'development';
  let started = false;
  let registration: ServiceWorkerRegistration | undefined;
  let revision = 0;
  const listeners = new Set<() => void>();
  const watched = new WeakSet<ServiceWorker>();
  const publish = (next: OfflineStatus) => {
    if (status === next) return;
    status = next;
    listeners.forEach((listener) => listener());
  };
  const refresh = async () => {
    if (!registration) return;
    const current = ++revision;
    const active = registration.active;
    if (active?.state !== 'activated') {
      publish(registration.installing || active ? 'preparing' : 'unavailable');
      return;
    }
    let ready = false;
    try {
      ready = await checkCache(active);
    } catch {
      // MessageChannel or storage may be unavailable in a restricted browser.
    }
    if (current === revision)
      publish(ready ? (registration.waiting ? 'update-ready' : 'ready') : 'unavailable');
  };
  const watch = (worker: ServiceWorker | null) => {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener('statechange', () => void refresh());
  };
  const start = async () => {
    if (started || !production) return;
    started = true;
    try {
      if (!window.isSecureContext || !('serviceWorker' in navigator)) {
        publish('unsupported');
        return;
      }
      const container = navigator.serviceWorker;
      registration = await container.register(`${basePath}sw.js`, {
        scope: basePath,
        updateViaCache: 'none',
      });
      const watchCurrent = () => {
        watch(registration?.installing ?? null);
        watch(registration?.waiting ?? null);
        watch(registration?.active ?? null);
        void refresh();
      };
      registration.addEventListener('updatefound', watchCurrent);
      container.addEventListener('controllerchange', watchCurrent);
      window.addEventListener('online', () => void refresh());
      watchCurrent();
    } catch {
      publish('unavailable');
    }
  };
  return {
    start,
    refresh,
    getSnapshot: () => status,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const offlineSupport = createOfflineSupport(import.meta.env.PROD);
