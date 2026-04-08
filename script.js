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
