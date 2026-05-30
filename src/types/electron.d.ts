// Type declarations for Electron desktop app integration

interface ElectronAPI {
  isDesktop: boolean
  platform: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
