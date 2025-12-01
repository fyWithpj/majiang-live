import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import type { MatchState } from '../../src/types/match'
import { defaultMatchState } from '../../src/types/match'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable Hardware Acceleration
app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let overlayWindow: BrowserWindow | null = null
let controlWindow: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

let matchState: MatchState = { ...defaultMatchState }

const loadRoute = (window: BrowserWindow, route: string) => {
  if (VITE_DEV_SERVER_URL) {
    window.loadURL(`${VITE_DEV_SERVER_URL}#/${route}`)
    // Open devtools for both windows in dev mode
    window.webContents.openDevTools({ mode: 'detach' })
  } else {
    window.loadFile(indexHtml, { hash: route })
  }
}

const broadcastState = () => {
  overlayWindow?.webContents.send('match:state', matchState)
  controlWindow?.webContents.send('match:state', matchState)
}

ipcMain.handle('match:get-state', () => matchState)

ipcMain.handle('match:update-state', (_event, payload: MatchState) => {
  matchState = { ...payload }
  broadcastState()
})

async function createWindows() {
  overlayWindow = new BrowserWindow({
    title: '花听直播-悬浮窗',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    transparent: true, // 开发模式下不透明，方便调试
    // transparent: !VITE_DEV_SERVER_URL, // 开发模式下不透明，方便调试
    fullscreen: false,
    frame: false, // 显示边框，方便调试
    resizable: true,
    alwaysOnTop: false,
    hasShadow: false,
    skipTaskbar: true,
    backgroundColor: VITE_DEV_SERVER_URL ? '#00000000' : '#00000000', // 开发模式下有背景色
    width: 1440,
    height: 800,
    webPreferences: {
      preload,
      webSecurity: false, // 允许 blob URL 用于 mahgen Worker
    },
  })

  controlWindow = new BrowserWindow({
    title: '控制面板',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: 1420,
    height: 900,
    resizable: true,
    webPreferences: {
      preload,
      webSecurity: false, // 允许 blob URL 用于 mahgen Worker
    },
  })

  loadRoute(overlayWindow, 'overlay')
  loadRoute(controlWindow, 'control')

  controlWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  overlayWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
  controlWindow.on('closed', () => {
    controlWindow = null
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close()
    }
  })

  overlayWindow.webContents.on('did-finish-load', () => {
    broadcastState()
    // 确保开发工具在开发模式下打开
    if (VITE_DEV_SERVER_URL && !overlayWindow?.webContents.isDevToolsOpened()) {
      overlayWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })
  controlWindow.webContents.on('did-finish-load', broadcastState)
}

app.whenReady().then(createWindows)

app.on('window-all-closed', () => {
  overlayWindow = null
  controlWindow = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (controlWindow) {
    if (controlWindow.isMinimized()) controlWindow.restore()
    controlWindow.focus()
  } else if (overlayWindow) {
    if (overlayWindow.isMinimized()) overlayWindow.restore()
    overlayWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindows()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
