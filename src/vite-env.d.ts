/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

import type { MatchState } from './types/match'

declare global {
  interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer: import('electron').IpcRenderer
    matchAPI?: {
      getState: () => Promise<MatchState>
      updateState: (payload: MatchState) => Promise<void>
      onStateChange: (callback: (state: MatchState) => void) => () => void
    }
  }
}

export {}
