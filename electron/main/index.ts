import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
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

// 获取配置文件路径
// 开发环境：使用项目根目录的 config 文件夹
// 生产环境：使用用户数据目录的 config 文件夹（可写）
function getConfigPath(): string {
  if (VITE_DEV_SERVER_URL) {
    // 开发环境：项目根目录的 config 文件夹
    return path.join(process.env.APP_ROOT || __dirname, 'config/match.json')
  } else {
    // 生产环境：使用 userData 目录（始终可写）
    return path.join(app.getPath('userData'), 'config/match.json')
  }
}

const configPath = getConfigPath()

let matchState: MatchState = { ...defaultMatchState }

// 从 JSON 文件加载配置
function loadMatchStateFromFile(): MatchState {
  try {
    // 确保 config 目录存在
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      try {
        const loadedState = JSON.parse(content) as MatchState
        console.log('[match] 从 JSON 文件加载配置成功:', configPath)
        return loadedState
      } catch (parseError) {
        console.error('[match] 解析 JSON 文件失败:', parseError)
      }
    } else {
      // 如果配置文件不存在，尝试从默认位置（开发环境或 resources）复制
      const defaultConfigPaths = [
        path.join(process.env.APP_ROOT || __dirname, 'config/match.json'), // 开发环境
        path.join(process.resourcesPath, 'config/match.json'), // 生产环境 resources
      ]
      
      for (const defaultConfigPath of defaultConfigPaths) {
        if (fs.existsSync(defaultConfigPath) && defaultConfigPath !== configPath) {
          try {
            fs.copyFileSync(defaultConfigPath, configPath)
            const content = fs.readFileSync(configPath, 'utf-8')
            const loadedState = JSON.parse(content) as MatchState
            console.log('[match] 从默认配置文件复制并加载成功:', configPath)
            return loadedState
          } catch (error) {
            console.error('[match] 复制默认配置文件失败:', error)
          }
        }
      }
    }
  } catch (error) {
    console.error('[match] 读取配置文件失败:', error)
  }
  console.log('[match] 使用默认配置')
  return { ...defaultMatchState }
}

// 保存配置到 JSON 文件
function saveMatchStateToFile(state: MatchState) {
  try {
    // 确保 config 目录存在
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // 将状态转换为格式化的 JSON 字符串，使用 2 空格缩进
    const jsonStr = JSON.stringify(state, null, 2)
    fs.writeFileSync(configPath, jsonStr, 'utf-8')
    console.log('[match] 配置已保存到 JSON 文件:', configPath)
  } catch (error) {
    console.error('[match] 保存配置到 JSON 文件失败:', error)
  }
}

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
  // 自动保存到文件
  saveMatchStateToFile(matchState)
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

  overlayWindow.on('close', () => {
    // 在悬浮窗关闭前保存配置
    saveMatchStateToFile(matchState)
  })
  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
  controlWindow.on('close', () => {
    // 在控制窗口关闭前保存配置
    saveMatchStateToFile(matchState)
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

// 应用启动时加载配置
matchState = loadMatchStateFromFile()

app.whenReady().then(createWindows)

app.on('window-all-closed', () => {
  // 在所有窗口关闭时保存配置
  saveMatchStateToFile(matchState)
  overlayWindow = null
  controlWindow = null
  if (process.platform !== 'darwin') app.quit()
})

// 应用关闭前保存配置
app.on('before-quit', (event) => {
  saveMatchStateToFile(matchState)
})

// 使用 will-quit 作为备用，确保保存
app.on('will-quit', (event) => {
  saveMatchStateToFile(matchState)
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
