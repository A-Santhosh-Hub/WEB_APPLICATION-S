/**
 * SanLAN — Transfer Manager (Phase 3)
 *
 * Handles transfer sessions, progress tracking, and fallback ZIP downloads.
 * In Phase 4, this will be expanded with WebSocket support for live updates.
 */

const TransferManager = {
    activeTransfers: {},

    /**
     * Start a folder transfer session.
     */
    async startTransfer(shareId, path) {
        showToast(`Preparing download for ${path || 'folder'}...`, 'info');
        
        try {
            const response = await fetch(SanLAN.apiBase + '/api/transfers/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ share_id: shareId, path: path })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to start transfer');
            }

            const manifest = await response.json();
            return manifest;

        } catch (err) {
            showError(`Transfer failed: ${err.message}`);
            return null;
        }
    },

    /**
     * Trigger a fallback ZIP download for an entire folder.
     */
    downloadAsZip(transferId, folderName) {
        showToast(`Starting ZIP download for ${folderName}. This may take a while for large folders.`, 'warning', 6000);
        const url = `${SanLAN.apiBase}/api/transfers/${transferId}/zip`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};
