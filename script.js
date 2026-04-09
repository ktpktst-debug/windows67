function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}`;
}
setInterval(updateClock, 1000);
updateClock();

function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.style.display = startMenu.style.display === 'none' ? 'flex' : 'none';
}

document.addEventListener('click', function(e) {
    const startMenu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn');
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
        startMenu.style.display = 'none';
    }
});

const windows = document.querySelectorAll('.window');
let activeWindow = null;
let highestZIndex = 100;

windows.forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    
    win.addEventListener('mousedown', function() {
        bringToFront(win);
    });
    
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    titleBar.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragOffsetX = e.clientX - win.offsetLeft;
        dragOffsetY = e.clientY - win.offsetTop;
        bringToFront(win);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            const maxX = window.innerWidth - win.offsetWidth;
            const maxY = window.innerHeight - win.offsetHeight - 32;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            win.style.left = newX + 'px';
            win.style.top = newY + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
});

function bringToFront(win) {
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    windows.forEach(w => {
        const tb = w.querySelector('.title-bar');
        if (w === win) {
            tb.classList.remove('inactive');
            w.classList.add('active');
        } else {
            tb.classList.add('inactive');
            w.classList.remove('active');
        }
    });
}

function closeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.style.display = 'none';
        removeTaskbarItem(windowId);
    }
}

function openWindow(windowName) {
    const windowId = windowName + '-window';
    const win = document.getElementById(windowId);
    if (win) {
        win.style.display = 'block';
        bringToFront(win);
        addTaskbarItem(windowId, win.querySelector('.title-bar-text').textContent);
    }
}

const desktopIcons = document.querySelectorAll('.desktop-icon');
let clickCounts = {};
let clickTimers = {};

desktopIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
        const iconName = this.getAttribute('data-name');
        const link = this.getAttribute('data-link');
        desktopIcons.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        if (!clickCounts[iconName]) clickCounts[iconName] = 0;
        clickCounts[iconName]++;
        if (clickCounts[iconName] === 1) {
            clickTimers[iconName] = setTimeout(() => {
                clickCounts[iconName] = 0;
            }, 300);
        } else if (clickCounts[iconName] === 2) {
            clearTimeout(clickTimers[iconName]);
            clickCounts[iconName] = 0;
            handleDoubleClick(this, link);
        }
    });
});

function handleDoubleClick(icon, link) {
    icon.classList.add('opening');
    setTimeout(() => icon.classList.remove('opening'), 200);
    if (link === '#') {
        const windowName = icon.getAttribute('data-name').toLowerCase();
        openWindow(windowName);
    } else {
        window.open(link, '_blank');
    }
}

const desktop = document.getElementById('desktop');
desktop.addEventListener('click', function(e) {
    if (e.target === desktop) {
        desktopIcons.forEach(i => i.classList.remove('selected'));
    }
});

const taskbarItems = {};

function addTaskbarItem(windowId, title) {
    removeTaskbarItem(windowId);
    const container = document.getElementById('taskbar-items');
    const item = document.createElement('div');
    item.className = 'taskbar-item active';
    item.textContent = title;
    item.onclick = function() {
        const win = document.getElementById(windowId);
        if (win.style.display === 'none') {
            win.style.display = 'block';
            bringToFront(win);
            item.classList.add('active');
        } else if (win.classList.contains('active')) {
            win.style.display = 'none';
            item.classList.remove('active');
        } else {
            bringToFront(win);
        }
    };
    container.appendChild(item);
    taskbarItems[windowId] = item;
}

function removeTaskbarItem(windowId) {
    if (taskbarItems[windowId]) {
        taskbarItems[windowId].remove();
        delete taskbarItems[windowId];
    }
}

window.addEventListener('load', function() {
    const welcomeWin = document.getElementById('welcome-window');
    if (welcomeWin) {
        addTaskbarItem('welcome-window', welcomeWin.querySelector('.title-bar-text').textContent);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('start-menu').style.display = 'none';
    }
});

document.querySelectorAll('.btn.maximize').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const win = this.closest('.window');
        if (win.dataset.maximized === 'true') {
            win.style.width = '';
            win.style.height = '';
            win.style.left = win.dataset.prevLeft || '100px';
            win.style.top = win.dataset.prevTop || '50px';
            win.dataset.maximized = 'false';
        } else {
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevTop = win.style.top;
            win.style.width = '100%';
            win.style.height = 'calc(100% - 32px)';
            win.style.left = '0';
            win.style.top = '0';
            win.dataset.maximized = 'true';
        }
    });
});

document.querySelectorAll('.btn.minimize').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const win = this.closest('.window');
        win.style.display = 'none';
        const windowId = win.id;
        if (taskbarItems[windowId]) {
            taskbarItems[windowId].classList.remove('active');
        }
    });
});

// Settings functionality
let clockFormat = '24h';
let soundEnabled = true;

function setTheme(color) {
    document.getElementById('desktop').style.background = `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`;
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function setClockFormat(format) {
    clockFormat = format;
    updateClock();
}

function toggleSound(enabled) {
    soundEnabled = enabled;
}

const originalUpdateClock = updateClock;
updateClock = function() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    if (clockFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
    } else {
        hours = String(hours).padStart(2, '0');
        document.getElementById('clock').textContent = `${hours}:${minutes}`;
    }
};

// Control Panel functionality
const cpItemData = {
    'accessibility': {
        name: 'アクセシビリティ',
        description: 'マウス、キーボード、サウンド、表示の設定を変更して、コンピュータをより使いやすくします。'
    },
    'hardware': {
        name: 'ハードウェアの追加',
        description: '新しいハードウェア デバイスをコンピュータにインストールするためのウィザードを開始します。'
    },
    'programs': {
        name: 'プログラムの追加と削除',
        description: 'コンピュータにインストールされているプログラムを追加、削除、または変更します。'
    },
    'datetime': {
        name: '日付と時刻',
        description: 'システムの日付、時刻、タイムゾーンを設定します。'
    },
    'display': {
        name: 'ディスプレイ',
        description: 'デスクトップの外観、画面の解像度、色の設定を変更します。'
    },
    'fonts': {
        name: 'フォント',
        description: 'システムにインストールされているフォントを表示、追加、削除します。'
    },
    'game': {
        name: 'ゲーム コントローラ',
        description: 'ジョイスティックやゲームパッドなどのゲーム機器を設定します。'
    },
    'internet': {
        name: 'インターネット オプション',
        description: 'ブラウザの設定、インターネット接続、セキュリティ設定を変更します。'
    },
    'keyboard': {
        name: 'キーボード',
        description: 'キーボードの速度、レイアウト、言語設定を変更します。'
    },
    'mouse': {
        name: 'マウス',
        description: 'マウスボタンの設定、ポインタの外観、移動速度を変更します。'
    },
    'multimedia': {
        name: 'マルチメディア',
        description: 'オーディオ、ビデオ、MIDIデバイスの設定を管理します。'
    },
    'network': {
        name: 'ネットワーク',
        description: 'ネットワーク接続、コンポーネント、プロトコルを設定します。'
    },
    'passwords': {
        name: 'パスワード',
        description: 'ユーザーアカウントのパスワードを変更、管理します。'
    },
    'power': {
        name: '電源管理',
        description: '省電力機能、モニタとハードディスクの電源設定を構成します。'
    },
    'printers': {
        name: 'プリンタ',
        description: 'プリンタのインストール、設定、印刷ジョブの管理を行います。'
    },
    'regional': {
        name: '地域の設定',
        description: '言語、日付形式、通貨、数字の表示形式を設定します。'
    },
    'sound': {
        name: 'サウンド',
        description: 'システムサウンドとイベントの音声を設定します。'
    },
    'system': {
        name: 'システム',
        description: 'コンピュータのシステム情報、デバイスマネージャ、環境設定を表示します。'
    },
    'users': {
        name: 'ユーザー',
        description: 'ユーザーアカウントを追加、削除、変更します。顔おもろいと思わない?'
    }
};

let selectedCpItem = null;

function selectCpItem(element, item) {
    // Remove previous selection
    document.querySelectorAll('.cp-icon-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked item
    element.classList.add('selected');
    selectedCpItem = item;
    
    // Update description pane
    const data = cpItemData[item];
    if (data) {
        const descBox = document.getElementById('cp-item-description');
        descBox.innerHTML = `
            <p><strong>${data.name}</strong></p>
            <p style="margin-top: 8px;">${data.description}</p>
            <p style="margin-top: 10px; color: #000080;">ダブルクリックして開く</p>
        `;
    }
}

function openCpItem(item) {
    const data = cpItemData[item];
    const msg = data ? `${data.name}: ${data.description}` : 'このコントロール パネルの項目は使用できません。';
    alert(msg);
}

// CMD functionality
let cmdHistory = [];
let cmdHistoryIndex = -1;
let currentDir = 'C:\\WINDOWS';

const cmdCommands = {
    'help': 'コマンドの一覧を表示します。',
    'dir': 'ディレクトリ内のファイル一覧を表示します。',
    'cd': '現在のディレクトリを変更します。',
    'cls': '画面をクリアします。',
    'echo': 'メッセージを表示します。',
    'date': '現在の日付を表示します。',
    'time': '現在の時刻を表示します。',
    'ver': 'Windowsのバージョンを表示します。',
    'exit': 'コマンドプロンプトを終了します。',
    'rick': '？？？？？'

};

document.addEventListener('DOMContentLoaded', function() {
    const cmdInput = document.getElementById('cmd-input');
    if (cmdInput) {
        cmdInput.addEventListener('keydown', handleCmdInput);
    }
});

function handleCmdInput(e) {
    if (e.key === 'Enter') {
        const input = e.target;
        const command = input.value.trim();
        
        if (command) {
            cmdHistory.push(command);
            cmdHistoryIndex = cmdHistory.length;
            executeCommand(command);
        }
        
        input.value = '';
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistoryIndex > 0) {
            cmdHistoryIndex--;
            e.target.value = cmdHistory[cmdHistoryIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cmdHistoryIndex < cmdHistory.length - 1) {
            cmdHistoryIndex++;
            e.target.value = cmdHistory[cmdHistoryIndex];
        } else {
            cmdHistoryIndex = cmdHistory.length;
            e.target.value = '';
        }
    }
}

function executeCommand(command) {
    const cmdScreen = document.getElementById('cmd-screen');
    const output = cmdScreen.querySelector('.cmd-output');
    const inputLine = cmdScreen.querySelector('.cmd-input-line');
    
    // Add command to output
    const cmdLine = document.createElement('p');
    cmdLine.textContent = `${currentDir}>${command}`;
    output.appendChild(cmdLine);
    
    // Process command
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    let response = '';
    
    switch (cmd) {
        case 'help':
            response = '次のコマンドが使用可能です:\n' + 
                      Object.keys(cmdCommands).map(c => `  ${c.padEnd(8)} - ${cmdCommands[c]}`).join('\n');
            break;
        case 'dir':
            response = ' ドライブ C のボリューム ラベルがありません。\n' +
                      ' ディレクトリは ' + currentDir + '\\ です\n\n' +
                      '.              <DIR>          .\n' +
                      '..             <DIR>          ..\n' +
                      'COMMAND  COM         47,845  04-10-95   6:22a\n' +
                      'CONFIG   SYS            128  04-10-95   6:22a\n' +
                      'AUTOEXEC BAT            256  04-10-95   6:22a\n' +
                      'WIN      <DIR>          .\n' +
                      'SYSTEM   <DIR>          .\n' +
                      '                      2 ファイル(s)          48,229 バイト\n' +
                      '                      4 ディレクトリ    847,249,408 バイト空き';
            break;
        case 'cd':
            if (args.length === 0) {
                response = currentDir;
            } else if (args[0] === '\\' || args[0].toLowerCase() === 'c:\\\\') {
                currentDir = 'C:\\';
                response = '';
            } else if (args[0] === '..') {
                const parts = currentDir.split('\\');
                if (parts.length > 1) {
                    parts.pop();
                    currentDir = parts.join('\\') || 'C:\\';
                }
                response = '';
            } else {
                currentDir = args[0].startsWith('C:') || args[0].startsWith('c:') ? 
                    args[0] : currentDir + '\\' + args[0];
                response = '';
            }
            updateCmdPrompt();
            break;
        case 'cls':
            output.innerHTML = '';
            return;
        case 'echo':
            response = args.join(' ');
            break;
        case 'date':
            const now = new Date();
            response = `現在の日付: ${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`;
            break;
        case 'time':
            const time = new Date();
            response = `現在の時刻: ${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}:${String(time.getSeconds()).padStart(2,'0')}`;
            break;
        case 'ver':
            response = 'Microsoft(R) Windows 95\n (C)Copyright Microsoft Corp 1981-1995.\n\n' +
                      'Windows 67 [Version 4.00.950]';
            break;

        case 'rick':
            window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            break;
        case 'exit':
            closeWindow('cmd-window');
            return;
        case '':
            response = '';
            break;
        default:
            response = `「${cmd}」は、内部コマンドまたは外部コマンド、\n実行可能なプログラムまたはバッチファイルとして認識されていません。`;
    }
    
    // Add response to output
    if (response) {
        const lines = response.split('\n');
        lines.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            output.appendChild(p);
        });
    }
    
    // Scroll to bottom
    cmdScreen.scrollTop = cmdScreen.scrollHeight;
}

function updateCmdPrompt() {
    const prompts = document.querySelectorAll('.cmd-prompt');
    prompts.forEach(p => p.textContent = currentDir + '>');
}
