const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 브라우저 창을 생성합니다.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 700,
    title: "생활기록부 스마트 점검 프로그램",
    icon: path.join(__dirname, 'icon.png'), // 아이콘이 있으면 로드 (없어도 무방)
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#37352f',
      height: 40
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // 상단 메뉴바 숨기기 (노션처럼 깔끔한 브라우저리스 스타일 유지)
  mainWindow.setMenuBarVisibility(false);

  // 로컬 index.html 파일을 로드합니다.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 렌더러 콘솔 메시지를 메인 프로세스 터미널로 포워딩 (디버깅)
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE] [Level:${level}] ${message} (Source:${sourceId}:${line})`);
  });

  // 개발자 도구를 엽니다 (개발 시 확인용, 필요한 경우 해제 가능)
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Electron이 초기화를 완료하고 브라우저 창을 생성할 준비가 되었을 때 호출됩니다.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // macOS에서는 독(dock) 아이콘을 클릭하고 열려 있는 다른 창이 없는 경우
    // 앱에 새로운 창을 다시 만드는 것이 일반적입니다.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// macOS를 제외한 모든 창이 닫히면 종료합니다.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
