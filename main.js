const path = require('path');
const os = require('os');
const { app, BrowserWindow, screen, Menu, ipcMain , shell} = require('electron');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');
const log = require('electron-log');

// Set env
process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production' ? true : false;

const isMac = process.platform === 'darwin' ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {

    let display = screen.getPrimaryDisplay()
        mainWindow = new BrowserWindow({
            title: 'ImageShrink',
            x: display.bounds.x,
            y: display.bounds.y,
            icon: './assets/icons/Icon_256x256.png',
            resizable: isDev ? true : false,
            width: display.size.width,
            height: display.size.height,
            fullscreen: true,
            kiosk: true,
            focusable: false,
            backgroundColor: 'white',
            webPreferences: {
                nodeIntegration: true,
            }
        });

    // if (os.platform !== 'linux') {
        
    //     mainWindow = new BrowserWindow({
    //         title: 'ImageShrink',
    //         width: isDev ? 700 : 500,
    //         height: 840,
    //         icon: './assets/icons/Icon_256x256.png',
    //         resizable: isDev ? true : false,
    //         alwaysOnTop: false,
    //         fullscreen: false,
    //         kiosk: false,
    //         backgroundColor: 'white',
    //         webPreferences: {
    //             nodeIntegration: true,
    //         }
    //     });
    // } else {
    //     let display = screen.getPrimaryDisplay()
    //     mainWindow = new BrowserWindow({
    //         title: 'ImageShrink',
    //         x: display.bounds.x,
    //         y: display.bounds.y,
    //         icon: './assets/icons/Icon_256x256.png',
    //         resizable: isDev ? true : false,
    //         width: display.size.width,
    //         height: display.size.height,
    //         fullscreen: true,
    //         kiosk: true,
    //         focusable: true,
    //         backgroundColor: 'white',
    //         webPreferences: {
    //             nodeIntegration: true,
    //         }
    //     });
    // }

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.loadFile('./app/index.html')
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: 'About ImageShrink',
        width: 300,
        height: 300,
        icon: './assets/icons/Icon_256x256.png',
        resizable: false,
        backgroundColor: 'white',
    });

    aboutWindow.loadFile('./app/about.html')
}

app.on('ready', () => {

    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu)

    Menu.setApplicationMenu(mainMenu)

    // globalShortcut.register('CmdOrCtrl+R', () => (mainWindow.reload()))
    // globalShortcut.register(isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I', () => (mainWindow.toggleDevTools()))

    mainWindow.on('ready', () => mainWindow = null)
});

const menu = [

    ...(isMac ? [{ 
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow,
            }
        ]
     }] : [
            {

                label: 'Help',
                submenu: [
                    {
                        label: 'About',
                        click: createAboutWindow,
                    },
                ]
            }
     ]),

    {
        role: 'appMenu',
    },
    {
        role: 'fileMenu',
    },
    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'toggledevtools' },
            ],
        }
    ] : [])
]

ipcMain.on('image:minimize', (e, options) => {
    // console.log(options);
    options.dest = path.join(os.homedir(), 'imageshrinkOutput')
    shrinkImage(options)
})

async function shrinkImage({ imgPath, quality, dest}) {
    try {
        
        const pngQuality = quality/100

        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
             imageminMozjpeg({ quality }),
             imageminPngquant({ 
                 quality: [pngQuality, pngQuality]
              })
            ]
        })
        // console.log(files);
        log.info(files);

        let newFile = files[0].destinationPath

        shell.openItem(dest);

        mainWindow.webContents.send('image:done',newFile);
        
    } catch (error) {
        // console.log(error);
        log.error(error)
        
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

app.allowRendererProcessReuse = true;