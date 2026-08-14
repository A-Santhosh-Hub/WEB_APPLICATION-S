/**
 * SanLAN — Downloader Engine (Phase 3)
 *
 * Implements folder downloads using the File System Access API
 * where supported (Chrome/Edge), with an automatic fallback
 * to ZIP downloads for unsupported browsers (Firefox/Safari).
 */

const Downloader = {
    /**
     * Initiates a folder download process.
     */
    async downloadFolder(shareId, path) {
        // 1. Get transfer manifest
        const manifest = await TransferManager.startTransfer(shareId, path);
        if (!manifest) return;

        // 2. Check if File System Access API is supported
        if (window.showDirectoryPicker) {
            await this._downloadWithFileSystemAPI(manifest);
        } else {
            // Fallback to ZIP
            TransferManager.downloadAsZip(manifest.transfer_id, manifest.root);
        }
    },

    /**
     * Download using the native File System Access API.
     */
    async _downloadWithFileSystemAPI(manifest) {
        let rootHandle;
        try {
            // Prompt user to select destination folder
            rootHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
        } catch (err) {
            // User cancelled the picker
            if (err.name === 'AbortError') return;
            
            showError('Failed to access destination folder. Falling back to ZIP.');
            TransferManager.downloadAsZip(manifest.transfer_id, manifest.root);
            return;
        }

        showToast(`Starting download: ${manifest.files.length} files...`, 'info');

        let completedFiles = 0;
        let failedFiles = 0;

        // Process files sequentially to avoid overwhelming the browser
        for (const file of manifest.files) {
            try {
                await this._downloadSingleFile(manifest, file, rootHandle);
                completedFiles++;
            } catch (err) {
                console.error(`Failed to download ${file.path}:`, err);
                failedFiles++;
            }
        }

        if (failedFiles > 0) {
            showError(`Download completed with ${failedFiles} errors.`);
        } else {
            showSuccess(`Successfully downloaded ${manifest.root} (${completedFiles} files)`);
        }
    },

    /**
     * Download a single file and write it to the native filesystem.
     */
    async _downloadSingleFile(manifest, file, rootHandle) {
        const pathParts = file.path.split('/');
        const fileName = pathParts.pop();
        
        // 1. Traverse/Create directories
        let currentHandle = rootHandle;
        for (const part of pathParts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
        }

        // 2. Create file handle
        const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        
        // 3. Create writable stream
        const writable = await fileHandle.createWritable();

        // 4. Fetch the file content
        // Need to construct the full path within the share
        const fullSharePath = manifest.root_path 
            ? `${manifest.root_path}/${file.path}`
            : file.path;

        const response = await fetch(`${SanLAN.apiBase}/api/download/${manifest.share_id}/${fullSharePath}`);
        
        if (!response.ok) {
            await writable.close();
            throw new Error(`HTTP ${response.status}`);
        }

        // 5. Pipe stream directly to disk
        await response.body.pipeTo(writable);
    }
};
