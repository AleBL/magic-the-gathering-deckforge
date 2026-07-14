/** Renderer-facing bridge exposed by `electron/preload.ts` via `contextBridge.exposeInMainWorld('electronAPI', ...)`. */
export interface ElectronAPI {
  send: (channel: string, ...args: unknown[]) => void;
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
  off: (channel: string, listener: (...args: unknown[]) => void) => void;
}

export interface WindowWithElectronAPI {
  electronAPI?: ElectronAPI;
}
