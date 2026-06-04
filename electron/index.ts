// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, shell, Menu, dialog, nativeImage } from 'electron';

import pt from '../src/locales/pt';
import en from '../src/locales/en';
import es from '../src/locales/es';

// Fix without GPU: disable hardware acceleration to avoid GPU process crash
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');

// Hide some warnings from terminal
app.commandLine.appendSwitch('log-level', '3');

let activeLanguage: string | null = null;

function getTranslation() {
  const locale = (activeLanguage || app.getLocale()).toLowerCase();
  if (locale.startsWith('pt')) return pt.translations.electron;
  if (locale.startsWith('es')) return es.translations.electron;
  return en.translations.electron;
}

function setupMenu(window: BrowserWindow) {
  const isMac = process.platform === 'darwin';
  const iconPath = join(app.getAppPath(), 'resources/icon.png');
  const image = nativeImage.createFromPath(iconPath);
  const translate = getTranslation();

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'MTG Deck Forge',
            submenu: [
              {
                label: translate.aboutTitle,
                click: async () => {
                  const result = await dialog.showMessageBox(window, {
                    type: 'info',
                    title: translate.aboutTitle,
                    message: 'MTG Deck Forge',
                    detail: translate.aboutDetail,
                    icon: image.resize({ width: 64, height: 64 }),
                    buttons: [translate.aboutButtonsOk, translate.aboutButtonsGitHub],
                    defaultId: 0,
                    cancelId: 0
                  });
                  if (result.response === 1) {
                    shell.openExternal('https://github.com/AleBL/magic-the-gathering-deckforge');
                  }
                }
              },
              { type: 'separator' },
              { role: 'services', label: translate.services },
              { type: 'separator' },
              { role: 'hide', label: translate.hide },
              { role: 'hideOthers', label: translate.hideOthers },
              { role: 'unhide', label: translate.showAll },
              { type: 'separator' },
              { role: 'quit', label: translate.quit }
            ] as Electron.MenuItemConstructorOptions[]
          } as Electron.MenuItemConstructorOptions
        ]
      : []),
    {
      label: translate.file,
      submenu: [
        {
          label: translate.clearDeck,
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            window.webContents.send('menu-clear-deck');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: translate.close } : { role: 'quit', label: translate.exit }
      ]
    },
    {
      label: translate.edit,
      submenu: [
        { role: 'undo', label: translate.undo },
        { role: 'redo', label: translate.redo },
        { type: 'separator' },
        { role: 'cut', label: translate.cut },
        { role: 'copy', label: translate.copy },
        { role: 'paste', label: translate.paste },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle', label: translate.pasteMatch },
              { role: 'selectAll', label: translate.selectAll },
              { type: 'separator' },
              {
                label: translate.speech,
                submenu: [
                  { role: 'startSpeaking', label: translate.startSpeaking },
                  { role: 'stopSpeaking', label: translate.stopSpeaking }
                ]
              }
            ]
          : [{ role: 'selectAll', label: translate.selectAll }])
      ] as Electron.MenuItemConstructorOptions[]
    },
    {
      label: translate.view,
      submenu: [
        { role: 'reload', label: translate.reload },
        { role: 'forceReload', label: translate.forceReload },
        { role: 'toggleDevTools', label: translate.toggleDevTools },
        { type: 'separator' },
        { role: 'resetZoom', label: translate.resetZoom },
        { role: 'zoomIn', label: translate.zoomIn },
        { role: 'zoomOut', label: translate.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: translate.fullscreen }
      ]
    },
    ...(!isMac
      ? [
          {
            role: 'help' as const,
            label: translate.help,
            submenu: [
              {
                label: translate.aboutTitle,
                click: async () => {
                  const result = await dialog.showMessageBox(window, {
                    type: 'info',
                    title: translate.aboutTitle,
                    message: 'MTG Deck Forge',
                    detail: translate.aboutDetail,
                    icon: image.resize({ width: 64, height: 64 }),
                    buttons: [translate.aboutButtonsOk, translate.aboutButtonsGitHub],
                    defaultId: 0,
                    cancelId: 0
                  });
                  if (result.response === 1) {
                    shell.openExternal('https://github.com/AleBL/magic-the-gathering-deckforge');
                  }
                }
              }
            ]
          } as Electron.MenuItemConstructorOptions
        ]
      : [])
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    title: 'MTG Deck Forge',
    width: 1600,
    height: 900,
    minWidth: 400,
    minHeight: 500,
    show: false, // Start hidden to prevent white flash before React renders
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Setup custom native OS application menu
  setupMenu(window);

  // Smooth fade-in of the application window once React is fully loaded and ready
  window.once('ready-to-show', () => {
    window.show();
  });

  // Intercept default link navigation to open Scryfall and other external URLs in system browser
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Intercept window opens (e.g. target="_blank") to open in system browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const url = process.env.VITE_DEV_SERVER_URL;
  const indexHtml = join(__dirname, '../dist-vite/index.html');

  // and load the index.html of the app.
  if (url) {
    window?.loadURL(url);
    window.webContents.openDevTools();
  } else {
    window?.loadFile(indexHtml);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent) => {
  setTimeout(() => event.sender.send('message', 'hi from electron'), 500);
});

// Listen for dynamic language changes from the React frontend to rebuild the native OS menu on the fly
ipcMain.on('change-language', (_event: IpcMainEvent, lang: string) => {
  activeLanguage = lang;
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    setupMenu(window);
  }
});
