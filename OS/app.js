// Browser OS - Main Application Logic
class BrowserOS {
    constructor() {
        this.apps = {};
        this.windows = [];
        this.activeWindow = null;
        this.windowZIndex = 100;
        this.startMenuOpen = false;
        this.currentTheme = 'light';
        this.currentWallpaper = 0;
        
        // App data
        this.notes = JSON.parse(localStorage.getItem('browserOS_notes')) || [{
            id: 0,
            title: 'Welcome Note',
            content: 'Welcome to the Browser OS Notes app! This is a fully functional note-taking application with auto-save capabilities.',
            date: new Date().toDateString()
        }];
        this.currentNoteIndex = 0;
        
        // Calculator state
        this.calculatorState = {
            display: '0',
            expression: '',
            waitingForOperator: false,
            pendingOperator: null,
            pendingValue: null
        };
        
        // Music player state
        this.musicTracks = [
            { title: 'Sample Track 1', artist: 'Demo Artist', duration: '3:45' },
            { title: 'Sample Track 2', artist: 'Demo Artist', duration: '4:12' }
        ];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        
        // File system
        this.fileSystem = {
            Documents: ['Resume.pdf', 'Project_Plan.docx', 'Notes.txt'],
            Music: ['Song1.mp3', 'Song2.mp3', 'Playlist.m3u'],
            Pictures: ['Photo1.jpg', 'Photo2.png', 'Screenshot.png'],
            Videos: ['Movie.mp4', 'Tutorial.avi']
        };
        this.currentFolder = '';
        
        // Wallpapers
        this.wallpapers = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.startClock();
        this.setupWallpaperOptions();
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('browserOS_settings')) || {};
        this.currentTheme = settings.theme || 'light';
        this.currentWallpaper = settings.wallpaper || 0;
        
        document.documentElement.setAttribute('data-color-scheme', this.currentTheme);
        document.querySelector('.desktop').style.backgroundImage = this.wallpapers[this.currentWallpaper];
    }
    
    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            wallpaper: this.currentWallpaper
        };
        localStorage.setItem('browserOS_settings', JSON.stringify(settings));
    }
    
    setupEventListeners() {
        // Start menu toggle
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStartMenu();
            });
        }
        
        // App launches
        document.querySelectorAll('.app-item').forEach(item => {
            item.addEventListener('click', () => {
                const appId = item.dataset.app;
                this.launchApp(appId);
                this.closeStartMenu();
            });
        });
        
        // Click outside to close start menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
                this.closeStartMenu();
            }
        });
        
        // App search
        const appSearch = document.getElementById('appSearch');
        if (appSearch) {
            appSearch.addEventListener('input', (e) => {
                this.filterApps(e.target.value);
            });
        }
        
        // Desktop click to focus
        document.querySelector('.desktop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.clearActiveWindow();
            }
        });
    }
    
    toggleStartMenu() {
        const startMenu = document.getElementById('startMenu');
        if (!startMenu) return;
        
        this.startMenuOpen = !this.startMenuOpen;
        
        if (this.startMenuOpen) {
            startMenu.classList.remove('hidden');
        } else {
            startMenu.classList.add('hidden');
        }
    }
    
    closeStartMenu() {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.classList.add('hidden');
        }
        this.startMenuOpen = false;
    }
    
    filterApps(query) {
        const apps = document.querySelectorAll('.app-item');
        apps.forEach(app => {
            const name = app.querySelector('span').textContent.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                app.style.display = 'flex';
            } else {
                app.style.display = 'none';
            }
        });
    }
    
    launchApp(appId) {
        // Check if app is already open
        const existingWindow = this.windows.find(w => w.appId === appId);
        if (existingWindow) {
            this.focusWindow(existingWindow);
            return;
        }
        
        const window = this.createWindow(appId);
        this.windows.push(window);
        this.focusWindow(window);
        this.addToTaskbar(appId, window);
        
        // Load app content
        this.loadAppContent(appId, window);
    }
    
    createWindow(appId) {
        const template = document.getElementById('windowTemplate');
        if (!template) return null;
        
        const windowElement = template.content.cloneNode(true).querySelector('.window');
        
        windowElement.dataset.app = appId;
        windowElement.id = `window-${Date.now()}`;
        
        // Set window title
        const appNames = {
            notes: 'Notes',
            calculator: 'Calculator',
            search: 'Google Search',
            youtube: 'YouTube',
            media: 'Media Player',
            portfolio: 'My Portfolio',
            files: 'File Explorer',
            music: 'Music Player',
            browser: 'Browser',
            settings: 'Settings'
        };
        
        windowElement.querySelector('.window-title').textContent = appNames[appId] || 'App';
        
        // Position window
        const offset = this.windows.length * 30;
        windowElement.style.left = `${100 + offset}px`;
        windowElement.style.top = `${50 + offset}px`;
        windowElement.style.width = '600px';
        windowElement.style.height = '500px';
        windowElement.style.zIndex = ++this.windowZIndex;
        
        // Add to DOM
        const windowsContainer = document.getElementById('windowsContainer');
        if (windowsContainer) {
            windowsContainer.appendChild(windowElement);
        }
        
        // Setup window controls
        this.setupWindowControls(windowElement);
        
        const windowObj = {
            id: windowElement.id,
            appId: appId,
            element: windowElement,
            minimized: false,
            maximized: false
        };
        
        return windowObj;
    }
    
    setupWindowControls(windowElement) {
        const header = windowElement.querySelector('.window-header');
        const minimizeBtn = windowElement.querySelector('.minimize');
        const maximizeBtn = windowElement.querySelector('.maximize');
        const closeBtn = windowElement.querySelector('.close');
        
        // Make window draggable
        this.makeDraggable(windowElement, header);
        
        // Make window resizable
        this.makeResizable(windowElement);
        
        // Window controls
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizeWindow(windowElement.id);
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMaximize(windowElement.id);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeWindow(windowElement.id);
            });
        }
        
        // Focus on click
        windowElement.addEventListener('click', () => {
            this.focusWindow(this.windows.find(w => w.id === windowElement.id));
        });
    }
    
    makeDraggable(windowElement, handle) {
        if (!handle) return;
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(windowElement.style.left) || 0;
            startTop = parseInt(windowElement.style.top) || 0;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        });
        
        function drag(e) {
            if (!isDragging) return;
            const newLeft = startLeft + e.clientX - startX;
            const newTop = startTop + e.clientY - startY;
            
            windowElement.style.left = `${Math.max(0, newLeft)}px`;
            windowElement.style.top = `${Math.max(0, newTop)}px`;
        }
        
        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }
    
    makeResizable(windowElement) {
        const handles = windowElement.querySelectorAll('.resize-handle');
        
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const direction = handle.className.split(' ')[1];
                this.startResize(windowElement, direction, e);
            });
        });
    }
    
    startResize(windowElement, direction, e) {
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(windowElement.style.width) || 600;
        const startHeight = parseInt(windowElement.style.height) || 500;
        const startLeft = parseInt(windowElement.style.left) || 0;
        const startTop = parseInt(windowElement.style.top) || 0;
        
        function resize(e) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (direction.includes('e')) newWidth = Math.max(400, startWidth + deltaX);
            if (direction.includes('w')) {
                newWidth = Math.max(400, startWidth - deltaX);
                newLeft = startLeft + deltaX;
            }
            if (direction.includes('s')) newHeight = Math.max(300, startHeight + deltaY);
            if (direction.includes('n')) {
                newHeight = Math.max(300, startHeight - deltaY);
                newTop = startTop + deltaY;
            }
            
            windowElement.style.width = `${newWidth}px`;
            windowElement.style.height = `${newHeight}px`;
            windowElement.style.left = `${newLeft}px`;
            windowElement.style.top = `${newTop}px`;
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }
    
    focusWindow(window) {
        if (!window) return;
        
        if (this.activeWindow) {
            this.activeWindow.element.style.zIndex = this.windowZIndex;
        }
        
        this.activeWindow = window;
        window.element.style.zIndex = ++this.windowZIndex;
        
        // Update taskbar
        document.querySelectorAll('.taskbar-app').forEach(app => {
            app.classList.remove('active');
        });
        
        const taskbarApp = document.querySelector(`[data-window="${window.id}"]`);
        if (taskbarApp) {
            taskbarApp.classList.add('active');
        }
    }
    
    clearActiveWindow() {
        this.activeWindow = null;
        document.querySelectorAll('.taskbar-app').forEach(app => {
            app.classList.remove('active');
        });
    }
    
    minimizeWindow(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (window) {
            window.element.classList.add('minimized');
            window.minimized = true;
            
            if (this.activeWindow && this.activeWindow.id === windowId) {
                this.clearActiveWindow();
            }
        }
    }
    
    toggleMaximize(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (window) {
            if (window.maximized) {
                window.element.classList.remove('maximized');
                window.maximized = false;
            } else {
                window.element.classList.add('maximized');
                window.maximized = true;
            }
        }
    }
    
    closeWindow(windowId) {
        const windowIndex = this.windows.findIndex(w => w.id === windowId);
        if (windowIndex > -1) {
            const window = this.windows[windowIndex];
            window.element.remove();
            this.windows.splice(windowIndex, 1);
            
            // Remove from taskbar
            const taskbarApp = document.querySelector(`[data-window="${windowId}"]`);
            if (taskbarApp) {
                taskbarApp.remove();
            }
            
            // Clear active window if it was this one
            if (this.activeWindow && this.activeWindow.id === windowId) {
                this.clearActiveWindow();
            }
        }
    }
    
    addToTaskbar(appId, window) {
        const taskbarApps = document.getElementById('taskbarApps');
        if (!taskbarApps) return;
        
        const appElement = document.createElement('div');
        appElement.className = 'taskbar-app';
        appElement.dataset.window = window.id;
        
        const appNames = {
            notes: '📝 Notes',
            calculator: '🧮 Calculator',
            search: '🔍 Search',
            youtube: '📺 YouTube',
            media: '🎬 Media',
            portfolio: '💼 Portfolio',
            files: '📁 Files',
            music: '🎵 Music',
            browser: '🌐 Browser',
            settings: '⚙️ Settings'
        };
        
        appElement.innerHTML = `<span>${appNames[appId] || 'App'}</span>`;
        
        appElement.addEventListener('click', () => {
            if (window.minimized) {
                window.element.classList.remove('minimized');
                window.minimized = false;
            }
            this.focusWindow(window);
        });
        
        taskbarApps.appendChild(appElement);
    }
    
    loadAppContent(appId, window) {
        const content = window.element.querySelector('.window-content');
        const template = document.getElementById(`${appId}Template`);
        
        if (template && content) {
            content.innerHTML = '';
            content.appendChild(template.content.cloneNode(true));
            
            // Initialize app-specific functionality
            this.initializeApp(appId, window);
        }
    }
    
    initializeApp(appId, window) {
        switch (appId) {
            case 'notes':
                this.initializeNotes(window);
                break;
            case 'calculator':
                this.initializeCalculator(window);
                break;
            case 'search':
                this.initializeSearch(window);
                break;
            case 'youtube':
                this.initializeYoutube(window);
                break;
            case 'media':
                this.initializeMedia(window);
                break;
            case 'files':
                this.initializeFiles(window);
                break;
            case 'music':
                this.initializeMusic(window);
                break;
            case 'browser':
                this.initializeBrowser(window);
                break;
            case 'settings':
                this.initializeSettings(window);
                break;
        }
    }
    
    initializeNotes(window) {
        this.renderNotesList(window);
        this.loadNote(0, window);
        
        // Auto-save on content change
        const noteContent = window.element.querySelector('.note-content');
        const noteTitle = window.element.querySelector('.note-title');
        
        if (noteContent) {
            noteContent.addEventListener('input', () => {
                this.saveCurrentNote(window);
            });
        }
        
        if (noteTitle) {
            noteTitle.addEventListener('input', () => {
                this.saveCurrentNote(window);
            });
        }
    }
    
    renderNotesList(window) {
        const notesList = window.element.querySelector('.notes-list');
        if (!notesList) return;
        
        notesList.innerHTML = '';
        
        this.notes.forEach((note, index) => {
            const noteItem = document.createElement('div');
            noteItem.className = `note-item ${index === this.currentNoteIndex ? 'active' : ''}`;
            noteItem.dataset.note = index;
            noteItem.innerHTML = `
                <h4>${note.title}</h4>
                <p>${note.content.substring(0, 50)}...</p>
                <small>${note.date}</small>
            `;
            
            noteItem.addEventListener('click', () => {
                this.loadNote(index, window);
            });
            
            notesList.appendChild(noteItem);
        });
    }
    
    loadNote(index, window) {
        this.currentNoteIndex = index;
        const note = this.notes[index];
        
        if (note) {
            const titleInput = window.element.querySelector('.note-title');
            const contentInput = window.element.querySelector('.note-content');
            
            if (titleInput) titleInput.value = note.title;
            if (contentInput) contentInput.value = note.content;
            
            // Update active note in list
            window.element.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeNote = window.element.querySelector(`[data-note="${index}"]`);
            if (activeNote) activeNote.classList.add('active');
        }
    }
    
    saveCurrentNote(window) {
        const titleInput = window.element.querySelector('.note-title');
        const contentInput = window.element.querySelector('.note-content');
        
        if (!titleInput || !contentInput) return;
        
        const title = titleInput.value;
        const content = contentInput.value;
        
        this.notes[this.currentNoteIndex] = {
            ...this.notes[this.currentNoteIndex],
            title: title,
            content: content,
            date: new Date().toDateString()
        };
        
        localStorage.setItem('browserOS_notes', JSON.stringify(this.notes));
        this.renderNotesList(window);
    }
    
    initializeCalculator(window) {
        // Calculator is initialized through global functions
        this.currentCalculatorWindow = window;
    }
    
    initializeSearch(window) {
        const searchInput = window.element.querySelector('#googleSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performGoogleSearch();
                }
            });
        }
    }
    
    initializeYoutube(window) {
        const searchInput = window.element.querySelector('#youtubeSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchYouTube();
                }
            });
        }
    }
    
    initializeMedia(window) {
        // Media player initialization
    }
    
    initializeFiles(window) {
        this.renderFiles(window, '');
    }
    
    renderFiles(window, folder) {
        this.currentFolder = folder;
        const filesGrid = window.element.querySelector('#filesGrid');
        const currentPath = window.element.querySelector('#currentPath');
        
        if (!filesGrid) return;
        
        if (currentPath) {
            currentPath.textContent = folder ? ` > ${folder}` : '';
        }
        filesGrid.innerHTML = '';
        
        if (folder === '') {
            // Show folders
            Object.keys(this.fileSystem).forEach(folderName => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-icon">📁</div>
                    <div class="file-name">${folderName}</div>
                `;
                
                fileItem.addEventListener('dblclick', () => {
                    this.renderFiles(window, folderName);
                });
                
                filesGrid.appendChild(fileItem);
            });
        } else {
            // Show files in folder
            const files = this.fileSystem[folder] || [];
            files.forEach(fileName => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                const extension = fileName.split('.').pop().toLowerCase();
                let icon = '📄';
                
                if (['jpg', 'png', 'gif'].includes(extension)) icon = '🖼️';
                else if (['mp3', 'wav'].includes(extension)) icon = '🎵';
                else if (['mp4', 'avi'].includes(extension)) icon = '🎬';
                else if (['pdf'].includes(extension)) icon = '📕';
                
                fileItem.innerHTML = `
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${fileName}</div>
                `;
                
                filesGrid.appendChild(fileItem);
            });
        }
    }
    
    initializeMusic(window) {
        this.updateMusicDisplay(window);
    }
    
    updateMusicDisplay(window) {
        const track = this.musicTracks[this.currentTrackIndex];
        const currentTrack = window.element.querySelector('#currentTrack');
        const currentArtist = window.element.querySelector('#currentArtist');
        const timeDisplay = window.element.querySelector('#timeDisplay');
        
        if (currentTrack) currentTrack.textContent = track.title;
        if (currentArtist) currentArtist.textContent = track.artist;
        if (timeDisplay) timeDisplay.textContent = `0:00 / ${track.duration}`;
        
        // Update playlist
        window.element.querySelectorAll('.playlist-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentTrackIndex);
        });
        
        // Update play button
        const playBtn = window.element.querySelector('#playPauseBtn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
        }
    }
    
    initializeBrowser(window) {
        const addressBar = window.element.querySelector('#addressBar');
        if (addressBar) {
            addressBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    navigateToUrl();
                }
            });
        }
    }
    
    initializeSettings(window) {
        // Set current theme in dropdown
        const themeSelect = window.element.querySelector('select');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }
        
        // Setup wallpaper options
        this.setupWallpaperOptionsInWindow(window);
    }
    
    setupWallpaperOptions() {
        // This will be called after DOM is loaded
    }
    
    setupWallpaperOptionsInWindow(window) {
        const container = window.element.querySelector('#wallpaperOptions');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.wallpapers.forEach((wallpaper, index) => {
            const option = document.createElement('div');
            option.className = `wallpaper-option ${index === this.currentWallpaper ? 'active' : ''}`;
            option.style.background = wallpaper;
            option.addEventListener('click', () => {
                this.changeWallpaper(index);
                this.setupWallpaperOptionsInWindow(window);
            });
            container.appendChild(option);
        });
    }
    
    changeWallpaper(index) {
        this.currentWallpaper = index;
        document.querySelector('.desktop').style.backgroundImage = this.wallpapers[index];
        this.saveSettings();
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            const dateStr = now.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                const timeElement = clockElement.querySelector('.time');
                const dateElement = clockElement.querySelector('.date');
                if (timeElement) timeElement.textContent = timeStr;
                if (dateElement) dateElement.textContent = dateStr;
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
}

// Global functions for app interactions
let browserOS;

function createNewNote() {
    if (!browserOS) return;
    
    const newNote = {
        id: Date.now(),
        title: 'New Note',
        content: '',
        date: new Date().toDateString()
    };
    
    browserOS.notes.push(newNote);
    browserOS.currentNoteIndex = browserOS.notes.length - 1;
    
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.renderNotesList(window);
        browserOS.loadNote(browserOS.currentNoteIndex, window);
    }
}

function saveNote() {
    if (!browserOS) return;
    
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.saveCurrentNote(window);
    }
}

// Calculator functions
function inputNumber(num) {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    if (browserOS.calculatorState.waitingForOperator) {
        display.textContent = num;
        browserOS.calculatorState.waitingForOperator = false;
    } else {
        display.textContent = display.textContent === '0' ? num : display.textContent + num;
    }
}

function inputOperator(op) {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    const value = parseFloat(display.textContent);
    
    if (browserOS.calculatorState.pendingValue === null) {
        browserOS.calculatorState.pendingValue = value;
    } else if (browserOS.calculatorState.pendingOperator) {
        const result = calculate(browserOS.calculatorState.pendingValue, value, browserOS.calculatorState.pendingOperator);
        display.textContent = result;
        browserOS.calculatorState.pendingValue = result;
    }
    
    browserOS.calculatorState.pendingOperator = op;
    browserOS.calculatorState.waitingForOperator = true;
}

function calculate(firstValue, secondValue, operator) {
    switch (operator) {
        case '+': return firstValue + secondValue;
        case '−': return firstValue - secondValue;
        case '×': return firstValue * secondValue;
        case '÷': return firstValue / secondValue;
        default: return secondValue;
    }
}

function calculateResult() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    const value = parseFloat(display.textContent);
    
    if (browserOS.calculatorState.pendingValue !== null && browserOS.calculatorState.pendingOperator) {
        const result = calculate(browserOS.calculatorState.pendingValue, value, browserOS.calculatorState.pendingOperator);
        display.textContent = result;
        browserOS.calculatorState.pendingValue = null;
        browserOS.calculatorState.pendingOperator = null;
        browserOS.calculatorState.waitingForOperator = true;
    }
}

function clearCalculator() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    display.textContent = '0';
    browserOS.calculatorState = {
        display: '0',
        expression: '',
        waitingForOperator: false,
        pendingOperator: null,
        pendingValue: null
    };
}

function deleteLast() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    display.textContent = display.textContent.slice(0, -1) || '0';
}

function calculatePercent() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const display = window.element.querySelector('.display-result');
    if (!display) return;
    
    display.textContent = (parseFloat(display.textContent) / 100).toString();
}

function performGoogleSearch() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const searchInput = window.element.querySelector('#googleSearchInput');
    const iframe = window.element.querySelector('#googleFrame');
    
    if (!searchInput || !iframe) return;
    
    const query = searchInput.value.trim();
    
    if (query) {
        iframe.src = `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`;
    }
}

function searchYouTube() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const searchInput = window.element.querySelector('#youtubeSearchInput');
    const iframe = window.element.querySelector('#youtubeFrame');
    
    if (!searchInput || !iframe) return;
    
    const query = searchInput.value.trim();
    
    if (query) {
        iframe.src = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    }
}

function loadMediaFile(input) {
    if (!input.files[0] || !browserOS || !browserOS.activeWindow) return;
    
    const file = input.files[0];
    const mediaPlayer = browserOS.activeWindow.element.querySelector('#mediaPlayer');
    
    if (mediaPlayer) {
        const url = URL.createObjectURL(file);
        mediaPlayer.src = url;
        mediaPlayer.load();
    }
}

function togglePlayPause() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const mediaPlayer = browserOS.activeWindow.element.querySelector('#mediaPlayer');
    if (mediaPlayer) {
        if (mediaPlayer.paused) {
            mediaPlayer.play();
        } else {
            mediaPlayer.pause();
        }
    }
}

function navigateToFolder(folder) {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    browserOS.renderFiles(window, folder);
}

function createNewFolder() {
    if (!browserOS) return;
    
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        browserOS.fileSystem[folderName] = [];
        const window = browserOS.activeWindow;
        if (window) {
            browserOS.renderFiles(window, '');
        }
    }
}

function uploadFile() {
    alert('File upload functionality would be implemented here');
}

// Music player functions
function togglePlay() {
    if (!browserOS) return;
    
    browserOS.isPlaying = !browserOS.isPlaying;
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.updateMusicDisplay(window);
    }
}

function nextTrack() {
    if (!browserOS) return;
    
    browserOS.currentTrackIndex = (browserOS.currentTrackIndex + 1) % browserOS.musicTracks.length;
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.updateMusicDisplay(window);
    }
}

function previousTrack() {
    if (!browserOS) return;
    
    browserOS.currentTrackIndex = browserOS.currentTrackIndex === 0 ? 
        browserOS.musicTracks.length - 1 : browserOS.currentTrackIndex - 1;
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.updateMusicDisplay(window);
    }
}

function selectTrack(index) {
    if (!browserOS) return;
    
    browserOS.currentTrackIndex = index;
    const window = browserOS.activeWindow;
    if (window) {
        browserOS.updateMusicDisplay(window);
    }
}

// Browser functions
function browserBack() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const iframe = browserOS.activeWindow.element.querySelector('#browserFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.history.back();
    }
}

function browserForward() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const iframe = browserOS.activeWindow.element.querySelector('#browserFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.history.forward();
    }
}

function browserRefresh() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const iframe = browserOS.activeWindow.element.querySelector('#browserFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.location.reload();
    }
}

function navigateToUrl() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    const addressBar = window.element.querySelector('#addressBar');
    const iframe = window.element.querySelector('#browserFrame');
    
    if (!addressBar || !iframe) return;
    
    let url = addressBar.value.trim();
    
    if (url && !url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    if (url) {
        iframe.src = url;
    }
}

function addBookmark() {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const addressBar = browserOS.activeWindow.element.querySelector('#addressBar');
    if (addressBar) {
        const url = addressBar.value.trim();
        if (url) {
            alert(`Bookmark added: ${url}`);
        }
    }
}

// Settings functions
function showSettingsTab(tabName) {
    if (!browserOS || !browserOS.activeWindow) return;
    
    const window = browserOS.activeWindow;
    
    // Update tab buttons
    window.element.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = window.element.querySelector(`[onclick="showSettingsTab('${tabName}')"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Show corresponding section
    window.element.querySelectorAll('.settings-section').forEach(section => {
        section.classList.add('hidden');
    });
    const activeSection = window.element.querySelector(`#${tabName}-settings`);
    if (activeSection) activeSection.classList.remove('hidden');
}

function changeTheme(theme) {
    if (!browserOS) return;
    
    browserOS.currentTheme = theme;
    document.documentElement.setAttribute('data-color-scheme', theme);
    browserOS.saveSettings();
}

function restartOS() {
    if (!browserOS) return;
    
    // Close all windows
    browserOS.windows.forEach(window => {
        window.element.remove();
    });
    browserOS.windows = [];
    browserOS.activeWindow = null;
    
    // Clear taskbar
    const taskbarApps = document.getElementById('taskbarApps');
    if (taskbarApps) {
        taskbarApps.innerHTML = '';
    }
    
    // Close start menu
    browserOS.closeStartMenu();
    
    // Reset app search
    const appSearch = document.getElementById('appSearch');
    if (appSearch) {
        appSearch.value = '';
        browserOS.filterApps('');
    }
    
    alert('Browser OS restarted!');
}

// Initialize the OS when page loads
document.addEventListener('DOMContentLoaded', () => {
    browserOS = new BrowserOS();
    browserOS.init();
});