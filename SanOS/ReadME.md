# **🌟 SanOS**

**Advanced Browser-Based Operating System Platform**

SanOS is a production-grade Progressive Web Application (PWA) that simulates a complete desktop operating system entirely within your web browser. Built with a stunning glass-morphism UI inspired by macOS, Windows 11, and Material You, it offers a fully functional, persistent workspace without requiring any actual software installation.

## **✨ Key Features**

### **🪟 Advanced Window Manager**

* Draggable and resizable windows with z-index stacking.  
* Minimize, maximize, and restore functionality with smooth CSS micro-animations.  
* Active app tracking integrated directly into the taskbar.

### **💾 Persistent Virtual File System**

* Powered by **IndexedDB** — your files, folders, and apps are saved permanently across page reloads.  
* Built-in **File Explorer** to navigate default directories (Desktop, Documents, Images, Videos).  
* Right-click context menus to create new folders, text files, and manage your desktop.

### **🎬 Media & Document Engine (Drag & Drop)**

Drag and drop files from your real computer directly onto the SanOS desktop to save and view them\!

* **Photo Viewer (Gallery):** Renders rich image thumbnails and views .jpg, .png, etc.  
* **Video Player:** Simulates a VLC-like experience for your local .mp4 files.  
* **Music Player:** Beautiful audio player interface for your .mp3 files.  
* **PDF Reader:** Native high-performance viewing for .pdf documents.

### **🚀 Developer Web App Deployment**

* Drag and drop any local .html project file onto the desktop.  
* SanOS will "install" it as a local Web App with its own desktop icon.  
* Double-click to run your HTML files inside a sandboxed iframe window — perfect for testing tools and web designs locally\!

### **🌐 Built-in Web Browser & Quick Links**

* Fully functional iframe-based web browser.  
* Integrated search engine selector (Google, DuckDuckGo, Brave, Bing).  
* **Quick Links:** Right-click the desktop to add a URL. SanOS will automatically fetch the website's official Favicon/Logo and create a clickable app shortcut.

### **🎨 Deep Customization**

* **Custom Icons:** Right-click any file, shortcut, or HTML app to rename it or upload a custom Logo/Icon.  
* **Theme Engine:** Toggle between Light Glass and Dark Glass modes.  
* **Wallpapers:** Paste any image URL into the Settings app to change your background.

### **🛡️ Simulated Secure VPN Interface**

* A sleek, animated VPN panel located in the system tray.  
* Simulates encrypted connections to global servers (US, UK, Japan, etc.) with fake IP masking for a highly professional, tech-heavy aesthetic. *(Note: This is a visual simulation for UI/UX purposes and does not route real network traffic).*

## **🛠️ Tech Stack**

* **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox/Grid, Backdrop Filters), Vanilla JavaScript (ES6).  
* **Icons:** [Lucide Icons](https://lucide.dev/).  
* **Storage Layer:** \* IndexedDB for the virtual filesystem and Blob storage (saving images, videos, and HTML files).  
  * localStorage for system preferences (theme, wallpaper, welcome tour state).

## **🚀 Getting Started**

1. Download the index.html file.  
2. Double-click the file to open it in any modern web browser (Chrome, Edge, Safari, Firefox).  
3. **That's it\!** No server required for the core OS features.  
   *(Note: To enable full offline PWA installability on desktop/mobile, host the file on a web server alongside a standard sw.js Service Worker file).*

## **👥 The SanStudio Developer Team**

SanOS is proudly developed and maintained by the **SanStudio** team:

* **Santhosh A** — Lead Architect & Creator  
* **Deva** — Core Developer  
* **Vicky** — UI/UX & Integration

🔗 **Visit the Hub:** [SanStudio Developer Team](https://sanstudio-hub.github.io/SanStudio-Hub/in)

*“Creating a browser-based operating system experience usable daily.”*

![3D Model Viewer Screenshot](https://github.com/A-Santhosh-Hub/WEB_APPLICATION-S/blob/main/SanOS/San.png)
