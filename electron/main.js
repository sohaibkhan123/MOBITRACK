const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow = null
let nextProcess = null
const NEXT_PORT = 3000

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'MobiTrack — Mobile Shop Installment Manager',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready
    backgroundColor: '#0f172a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  // Build application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MobiTrack',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MobiTrack',
              message: 'MobiTrack — Mobile Shop Installment Manager',
              detail: 'Version 1.0.0\n\nA comprehensive mobile shop installment management system for tracking inventory, customers, contracts, payments, and vendor accounts.',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged
    const appPath = app.getAppPath()

    console.log(`[Electron] Starting Next.js server...`)
    console.log(`[Electron] App path: ${appPath}`)
    console.log(`[Electron] isDev: ${isDev}`)

    if (isDev) {
      // In development mode, Next.js is already running via `bun run dev`
      // Just connect to the existing server
      console.log(`[Electron] Development mode - connecting to http://localhost:${NEXT_PORT}`)
      resolve(`http://localhost:${NEXT_PORT}`)
      return
    }

    // In production, start the standalone Next.js server
    const serverPath = path.join(appPath, '.next', 'standalone', 'server.js')

    console.log(`[Electron] Starting production server from: ${serverPath}`)

    const env = { ...process.env, NODE_ENV: 'production', PORT: String(NEXT_PORT), HOSTNAME: '127.0.0.1' }

    nextProcess = spawn(process.execPath, [serverPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(appPath, '.next', 'standalone'),
    })

    nextProcess.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`)
    })

    nextProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`)
    })

    nextProcess.on('error', (err) => {
      console.error(`[Electron] Failed to start Next.js:`, err)
      reject(err)
    })

    // Wait for the server to be ready
    let retries = 0
    const maxRetries = 30
    const checkServer = () => {
      const http = require('http')
      const req = http.get(`http://127.0.0.1:${NEXT_PORT}`, (res) => {
        resolve(`http://127.0.0.1:${NEXT_PORT}`)
      })
      req.on('error', () => {
        retries++
        if (retries < maxRetries) {
          setTimeout(checkServer, 1000)
        } else {
          reject(new Error('Next.js server failed to start'))
        }
      })
      req.setTimeout(2000, () => {
        req.destroy()
        retries++
        if (retries < maxRetries) {
          setTimeout(checkServer, 1000)
        } else {
          reject(new Error('Next.js server failed to start'))
        }
      })
    }
    setTimeout(checkServer, 2000)
  })
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    const serverUrl = await startNextServer()
    console.log(`[Electron] Server ready at ${serverUrl}`)

    createWindow()
    mainWindow.loadURL(serverUrl)

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
        mainWindow.loadURL(serverUrl)
      }
    })
  } catch (err) {
    console.error('[Electron] Failed to start:', err)
    app.quit()
  }
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up the Next.js process on exit
app.on('before-quit', () => {
  if (nextProcess) {
    console.log('[Electron] Stopping Next.js server...')
    nextProcess.kill('SIGTERM')
    nextProcess = null
  }
})

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== `http://localhost:${NEXT_PORT}` && parsedUrl.origin !== `http://127.0.0.1:${NEXT_PORT}`) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
})
