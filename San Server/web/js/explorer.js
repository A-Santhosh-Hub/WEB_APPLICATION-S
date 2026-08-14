/**
 * SanLAN — File Explorer Component
 *
 * Renders share cards on the home page and directory listings
 * when browsing inside a share.
 */

const Explorer = {

    // ============================================================
    // Share Cards (Home Page)
    // ============================================================

    /**
     * Render the shares grid on the home page.
     * @param {Array} shares — Array of share objects from the API
     */
    renderShares(shares) {
        const el = SanLAN.els.content;

        if (!shares || shares.length === 0) {
            el.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📂</div>
                    <h2 class="empty-state__title">No Shares Configured</h2>
                    <p class="empty-state__message">
                        Edit <code class="text-mono">config.json</code> to add shared folders,
                        then restart the server.
                    </p>
                </div>
            `;
            return;
        }

        const shareIcons = {
            'games': '🎮',
            'movies': '🎬',
            'music': '🎵',
            'projects': '💻',
            'documents': '📄',
            'downloads': '📥',
            'photos': '📷',
            'videos': '🎥',
            'backup': '💾',
        };

        let html = `
            <div class="section-title">
                <span class="section-title__icon">🌐</span>
                Shared Folders
            </div>
            <div class="shares-grid">
        `;

        for (const share of shares) {
            const icon = shareIcons[share.id] || '📁';
            const badgeClass = share.available
                ? 'share-card__badge--available'
                : 'share-card__badge--unavailable';
            const badgeText = share.available ? '● Available' : '● Offline';

            html += `
                <div class="share-card"
                     id="share-${escapeHtml(share.id)}"
                     onclick="navigateTo('/browse/${escapeHtml(share.id)}')"
                     ${!share.available ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                    <div class="share-card__icon">${icon}</div>
                    <h2 class="share-card__name">${escapeHtml(share.name)}</h2>
                    <p class="share-card__path">${escapeHtml(share.path)}</p>
                    <span class="share-card__badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
        }

        html += '</div>';
        el.innerHTML = html;
    },


    // ============================================================
    // Directory Listing
    // ============================================================

    /**
     * Render a directory listing inside a share.
     * @param {object} listing  — DirectoryListing from the API
     * @param {string} shareId  — Current share ID
     * @param {string} basePath — Current path within the share
     */
    renderDirectory(listing, shareId, basePath) {
        const el = SanLAN.els.content;
        const children = listing.children || [];

        // Directory header with stats
        let html = `
            <div class="dir-header">
                <h1 class="dir-header__title">${escapeHtml(listing.name || 'Root')}</h1>
                <div class="dir-header__meta">
                    <div class="dir-header__meta-item">
                        📁 <span>${listing.folder_count} folder${listing.folder_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="dir-header__meta-item">
                        📄 <span>${listing.file_count} file${listing.file_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="dir-header__meta-item">
                        💾 <span>${listing.total_size_human || '—'}</span>
                    </div>
                    <button class="btn btn--secondary btn--sm" style="margin-left: var(--space-4);"
                            onclick="Downloader.downloadFolder('${escapeHtml(shareId)}', '${escapeHtml(basePath)}')">
                        ⬇ Download Entire Folder
                    </button>
                </div>
            </div>
        `;

        if (children.length === 0) {
            html += `
                <div class="empty-state">
                    <div class="empty-state__icon">📭</div>
                    <h2 class="empty-state__title">Empty Directory</h2>
                    <p class="empty-state__message">This folder contains no files or subdirectories.</p>
                </div>
            `;
            el.innerHTML = html;
            return;
        }

        // Listing items
        html += '<div class="dir-listing">';

        for (const item of children) {
            if (item.type === 'directory') {
                html += Explorer._renderFolderItem(item, shareId);
            } else {
                html += Explorer._renderFileItem(item, shareId);
            }
        }

        html += '</div>';
        el.innerHTML = html;
    },


    /**
     * Render a single folder row in the listing.
     */
    _renderFolderItem(item, shareId) {
        const path = item.path;
        const href = `/browse/${shareId}/${path}`;

        return `
            <div class="dir-item dir-item--folder"
                 id="folder-${escapeHtml(item.name)}"
                 onclick="navigateTo('${href}')">
                <div class="dir-item__icon dir-item__icon--folder">📁</div>
                <span class="dir-item__name">${escapeHtml(item.name)}</span>
                <span class="dir-item__size text-muted">—</span>
                <span class="dir-item__date">${formatDate(item.modified)}</span>
                <div class="dir-item__actions">
                    <button class="btn btn--secondary btn--sm"
                            onclick="event.stopPropagation(); Downloader.downloadFolder('${escapeHtml(shareId)}', '${escapeHtml(path)}')">
                        ⬇ Download
                    </button>
                </div>
            </div>
        `;
    },


    /**
     * Render a single file row in the listing.
     */
    _renderFileItem(item, shareId) {
        const icon = Explorer._getFileIcon(item.name);
        const path = item.path;

        return `
            <div class="dir-item dir-item--file" id="file-${escapeHtml(item.name)}">
                <div class="dir-item__icon dir-item__icon--file">${icon}</div>
                <span class="dir-item__name">${escapeHtml(item.name)}</span>
                <span class="dir-item__size">${item.size_human || '—'}</span>
                <span class="dir-item__date">${formatDate(item.modified)}</span>
                <div class="dir-item__actions">
                    <button class="btn btn--primary btn--sm"
                            onclick="event.stopPropagation(); downloadFile('${escapeHtml(shareId)}', '${escapeHtml(path)}')">
                        ⬇ Download
                    </button>
                </div>
            </div>
        `;
    },


    // ============================================================
    // File Type Icons
    // ============================================================

    _getFileIcon(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();

        const iconMap = {
            // Executables
            'exe': '⚙️', 'msi': '⚙️', 'bat': '⚙️', 'cmd': '⚙️', 'ps1': '⚙️',

            // Archives
            'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',

            // Images
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
            'bmp': '🖼️', 'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️',

            // Video
            'mp4': '🎥', 'mkv': '🎥', 'avi': '🎥', 'mov': '🎥',
            'wmv': '🎥', 'flv': '🎥', 'webm': '🎥',

            // Audio
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵',
            'ogg': '🎵', 'wma': '🎵',

            // Documents
            'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗',
            'xlsx': '📗', 'ppt': '📙', 'pptx': '📙',

            // Text
            'txt': '📝', 'md': '📝', 'log': '📝', 'csv': '📝',
            'json': '📝', 'xml': '📝', 'yaml': '📝', 'yml': '📝',
            'ini': '📝', 'cfg': '📝', 'conf': '📝',

            // Code
            'py': '🐍', 'js': '💛', 'ts': '💙', 'html': '🌐',
            'css': '🎨', 'java': '☕', 'c': '🔧', 'cpp': '🔧',
            'h': '🔧', 'cs': '🔮', 'go': '🐹', 'rs': '🦀',
            'rb': '💎', 'php': '🐘', 'swift': '🐦', 'kt': '🟣',

            // Libraries
            'dll': '📚', 'so': '📚', 'lib': '📚', 'a': '📚',

            // Game data
            'dat': '💿', 'pak': '💿', 'bin': '💿', 'wad': '💿',
            'vpk': '💿', 'bsp': '💿',
        };

        return iconMap[ext] || '📄';
    },
};
