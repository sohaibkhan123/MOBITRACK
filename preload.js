const { contextBridge } = require('electron')

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
})

console.log('[MobiTrack] Desktop mode active')
