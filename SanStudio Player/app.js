class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.lyrics = [];
        this.currentLyricIndex = -1;
        
        // Audio Context for spectrum analyzer
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.animationId = null;
        
        // Canvas for spectrum visualization
        this.canvas = document.getElementById('spectrumCanvas');
        this.canvasCtx = this.canvas.getContext('2d');
        
        this.initializeElements();
        this.bindEvents();
        this.setupAudioContext();
    }
    
    initializeElements() {
        // File inputs
        this.audioFileInput = document.getElementById('audioFile');
        this.lyricsFileInput = document.getElementById('lyricsFile');
        
        // File name displays
        this.audioFileName = document.getElementById('audioFileName');
        this.lyricsFileName = document.getElementById('lyricsFileName');
        
        // Player controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        
        // Progress controls
        this.progressTrack = document.getElementById('progressTrack');
        this.progressFill = document.getElementById('progressFill');
        this.progressThumb = document.getElementById('progressThumb');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        
        // Volume controls
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // Lyrics container
        this.lyricsContainer = document.getElementById('lyricsContainer');
        
        // Error modal
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.closeError = document.getElementById('closeError');
    }
    
    bindEvents() {
        // File upload events
        this.audioFileInput.addEventListener('change', (e) => this.handleAudioUpload(e));
        this.lyricsFileInput.addEventListener('change', (e) => this.handleLyricsUpload(e));
        
        // Player control events
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Progress bar events
        this.progressTrack.addEventListener('click', (e) => this.seek(e));
        this.progressTrack.addEventListener('mousedown', (e) => this.startDragging(e));
        
        // Volume events
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('canplaythrough', () => this.onCanPlayThrough());
        this.audio.addEventListener('error', (e) => this.onError(e));
        
        // Error modal events
        this.closeError.addEventListener('click', () => this.hideError());
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) this.hideError();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Window resize for canvas
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            // Configure analyser
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    connectAudioSource() {
        if (this.audioContext && this.analyser && !this.source) {
            try {
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            } catch (error) {
                console.warn('Error connecting audio source:', error);
            }
        }
    }
    
    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const validTypes = ['.mp3', '.wav', '.m4a', '.ogg'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            this.showError('Please select a valid audio file (MP3, WAV, M4A, or OGG)');
            return;
        }
        
        // Update file name display
        this.audioFileName.textContent = file.name;
        this.audioFileName.parentElement.classList.add('upload-success');
        
        // Create object URL and load audio
        const audioUrl = URL.createObjectURL(file);
        this.audio.src = audioUrl;
        this.audio.load();
        
        // Show loading state
        this.playPauseBtn.classList.add('loading');
    }
    
    handleLyricsUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.lrc')) {
            this.showError('Please select a valid LRC lyrics file');
            return;
        }
        
        // Update file name display
        this.lyricsFileName.textContent = file.name;
        this.lyricsFileName.parentElement.classList.add('upload-success');
        
        // Read and parse LRC file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseLRC(e.target.result);
            } catch (error) {
                this.showError('Error parsing lyrics file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    parseLRC(lrcContent) {
        const lines = lrcContent.split('\n');
        this.lyrics = [];
        
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\](.*)/;
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            // Skip metadata lines
            if (line.startsWith('[ti:') || line.startsWith('[ar:') || line.startsWith('[al:')) {
                return;
            }
            
            const match = line.match(timeRegex);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const centiseconds = parseInt(match[3]);
                const text = match[4].trim();
                
                const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
                
                this.lyrics.push({
                    time: timeInSeconds,
                    text: text
                });
            }
        });
        
        // Sort lyrics by time
        this.lyrics.sort((a, b) => a.time - b.time);
        
        this.displayLyrics();
    }
    
    displayLyrics() {
        if (this.lyrics.length === 0) return;
        
        this.lyricsContainer.innerHTML = '';
        
        this.lyrics.forEach((lyric, index) => {
            const lyricElement = document.createElement('div');
            lyricElement.className = 'lyric-line';
            lyricElement.textContent = lyric.text || '♪';
            lyricElement.dataset.index = index;
            
            // Add click event to seek to lyric time
            lyricElement.addEventListener('click', () => {
                if (this.audio.src) {
                    this.audio.currentTime = lyric.time;
                }
            });
            
            this.lyricsContainer.appendChild(lyricElement);
        });
    }
    
    onLoadedMetadata() {
        this.duration = this.audio.duration;
        this.totalTimeEl.textContent = this.formatTime(this.duration);
        
        // Enable controls
        this.playPauseBtn.disabled = false;
        this.playPauseBtn.classList.remove('loading');
        
        // Connect audio source for spectrum analysis
        this.connectAudioSource();
    }
    
    onTimeUpdate() {
        this.currentTime = this.audio.currentTime;
        this.currentTimeEl.textContent = this.formatTime(this.currentTime);
        
        // Update progress bar
        const progress = (this.currentTime / this.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressThumb.style.left = `${progress}%`;
        
        // Update lyrics
        this.updateCurrentLyric();
    }
    
    updateCurrentLyric() {
        if (this.lyrics.length === 0) return;
        
        let newCurrentIndex = -1;
        
        // Find the current lyric
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.currentTime >= this.lyrics[i].time) {
                newCurrentIndex = i;
            } else {
                break;
            }
        }
        
        // Update lyric highlighting
        if (newCurrentIndex !== this.currentLyricIndex) {
            // Remove previous highlighting
            const previousCurrent = this.lyricsContainer.querySelector('.lyric-line.current');
            if (previousCurrent) {
                previousCurrent.classList.remove('current', 'previous', 'next');
            }
            
            const previousPrev = this.lyricsContainer.querySelector('.lyric-line.previous');
            if (previousPrev) {
                previousPrev.classList.remove('previous');
            }
            
            const previousNext = this.lyricsContainer.querySelector('.lyric-line.next');
            if (previousNext) {
                previousNext.classList.remove('next');
            }
            
            this.currentLyricIndex = newCurrentIndex;
            
            if (newCurrentIndex >= 0) {
                const lyricElements = this.lyricsContainer.querySelectorAll('.lyric-line');
                
                // Highlight current lyric
                lyricElements[newCurrentIndex].classList.add('current');
                
                // Add previous and next classes
                if (newCurrentIndex > 0) {
                    lyricElements[newCurrentIndex - 1].classList.add('previous');
                }
                if (newCurrentIndex < lyricElements.length - 1) {
                    lyricElements[newCurrentIndex + 1].classList.add('next');
                }
                
                // Auto-scroll to current lyric
                this.scrollToCurrentLyric(lyricElements[newCurrentIndex]);
            }
        }
    }
    
    scrollToCurrentLyric(element) {
        const container = this.lyricsContainer;
        const containerHeight = container.clientHeight;
        const elementTop = element.offsetTop;
        const elementHeight = element.clientHeight;
        
        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
        
        container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }
    
    togglePlayPause() {
        if (!this.audio.src) return;
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    async play() {
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audio.play();
            this.isPlaying = true;
            
            // Update UI
            this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            document.body.classList.add('playing');
            
            // Start spectrum animation
            this.startSpectrumAnimation();
            
        } catch (error) {
            this.showError('Error playing audio: ' + error.message);
        }
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        
        // Update UI
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        document.body.classList.remove('playing');
        
        // Stop spectrum animation
        this.stopSpectrumAnimation();
    }
    
    seek(event) {
        if (!this.audio.src) return;
        
        const rect = this.progressTrack.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const seekTime = percentage * this.duration;
        
        this.audio.currentTime = Math.max(0, Math.min(seekTime, this.duration));
    }
    
    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.volumeSlider.value = value * 100;
        
        // Update volume icon
        let icon = 'fas fa-volume-up';
        if (value === 0) {
            icon = 'fas fa-volume-mute';
        } else if (value < 0.5) {
            icon = 'fas fa-volume-down';
        }
        
        this.volumeBtn.innerHTML = `<i class="${icon}"></i>`;
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.7);
        }
    }
    
    startSpectrumAnimation() {
        if (!this.analyser) return;
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            this.drawSpectrum();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    stopSpectrumAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    drawSpectrum() {
        const canvas = this.canvas;
        const ctx = this.canvasCtx;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw spectrum bars
        const barCount = 64;
        const barWidth = (width / barCount) - 2;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (this.dataArray.length / barCount));
            const barHeight = (this.dataArray[dataIndex] / 255) * height * 0.8;
            
            const x = i * (barWidth + 2);
            const y = height - barHeight;
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#00d4ff');
            gradient.addColorStop(0.5, '#ff006e');
            gradient.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Add glow effect
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.shadowBlur = 0;
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = Math.min(800, rect.width - 48);
        this.canvas.height = 200;
    }
    
    previousTrack() {
        // Placeholder for future playlist functionality
        console.log('Previous track');
    }
    
    nextTrack() {
        // Placeholder for future playlist functionality
        console.log('Next track');
    }
    
    onCanPlayThrough() {
        // Audio is ready to play
        console.log('Audio ready to play');
    }
    
    onEnded() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        document.body.classList.remove('playing');
        this.stopSpectrumAnimation();
        
        // Reset to beginning
        this.audio.currentTime = 0;
    }
    
    onError(event) {
        console.error('Audio error:', event);
        this.showError('Error loading or playing audio file');
    }
    
    handleKeyPress(event) {
        // Prevent default if audio is loaded
        if (!this.audio.src) return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.audio.currentTime = Math.min(this.duration, this.audio.currentTime + 10);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.setVolume(Math.min(1, this.volume + 0.1));
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.setVolume(Math.max(0, this.volume - 0.1));
                break;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.remove('hidden');
    }
    
    hideError() {
        this.errorModal.classList.add('hidden');
    }
    
    startDragging(event) {
        event.preventDefault();
        
        const onMouseMove = (e) => {
            this.seek(e);
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}

// Initialize the music player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
    
    // Set initial volume
    player.setVolume(0.7);
    
    // Resize canvas on load
    player.resizeCanvas();
    
    // Add sample lyrics as fallback demonstration
    if (!player.lyrics.length) {
        // This could be used for demonstration purposes
        console.log('Music player initialized successfully');
    }
});