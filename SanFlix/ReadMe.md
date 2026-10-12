# SANFLIX

A personal media library built with Flask, browser JavaScript, and FFmpeg. Supports movies, series, music videos, and audio files.

## Run on Windows

Install Python 3.10 or later, FFmpeg and FFprobe, then install the Python dependency:

```powershell
python -m pip install -r requirements.txt
.\start.bat
```

The launcher scans the library, starts background HLS preparation, and opens http://localhost:5000. The converter log is `database/hls-conversion.log`. Close the server with Ctrl+C.

You can run each step separately:

```powershell
python scan_media.py
python app.py
# Optional: prepare all files for remote playback
python convert_hls.py
# Rebuild even if completed conversions exist
python convert_hls.py --force
```

FFmpeg/FFprobe must be on PATH. The existing Windows `LOCALAPPDATA/ffmpegio/ffmpeg-downloader/ffmpeg/bin` installation is also detected.

## Passwords and sharing

Browsing directly on this computer is password-free. Remote and LAN visitors must sign in. Uploads always require the admin password. By default, the server generates an admin password at startup and prints it in its terminal; it changes on restart.

Set passwords before launching to keep them stable:

```powershell
$env:SANFLIX_ADMIN_PASSWORD = 'replace-with-your-own-long-password'
$env:SANFLIX_VIEW_PASSWORD = 'a-different-password-for-viewers'
.\start.bat
```

If `SANFLIX_VIEW_PASSWORD` is unset, remote viewing uses the admin password. Viewing access does not grant upload access. Use the Admin link in the footer to sign in for uploads. The old embedded password has been removed.

The server binds to `127.0.0.1` and has debugging disabled. For LAN access, set `SANFLIX_HOST=0.0.0.0`; LAN users still need the viewing password. A tunnel to localhost is recognized by its forwarding headers and also requires sign-in. Reverse proxies must retain forwarding headers; do not strip them while rewriting the host to localhost. Use HTTPS for shared access. `SANFLIX_HTTPS_ONLY=1` enables secure-only session cookies (local HTTP sign-in then requires HTTPS too).

`SANFLIX_SECRET_KEY` optionally supplies a persistent, random Flask session secret; otherwise sessions expire after restarting the server. `SANFLIX_PORT` changes the port (default 5000). The built-in Flask server is intended for personal use; use a production WSGI server for a production deployment. `.env` files are not automatically loaded.

## Organize your media

```text
media/
  movies/Movie.mp4
  series/Show Name/Season 1/Show.S01E01.mkv
  music/Song.mp3
```

Supported video extensions: `.mp4`, `.mkv`, `.webm`, `.avi`, `.mov`.
Supported audio extensions: `.mp3`, `.m4a`, `.aac`, `.wav`, `.flac`, `.ogg`, `.opus`.

For series uploads, enter a show name and include season/episode numbers in the filename. Uploads are validated using FFprobe. Duplicate filenames are rejected instead of overwriting originals. Temporary uploads stay out of scans, and the browser waits for indexing to complete before refreshing.

Run the scanner again after manually adding or replacing files. Catalog writes are atomic, and scans are serialized across processes. Thumbnails include the source identity and version, so same-named episodes do not share artwork.

## Streaming and saved progress

Compatible files use direct streaming with HTTP range support. Other formats are remuxed or transcoded; the player retains its conversion mode while seeking. HLS playback resumes saved progress just like direct playback. Favorites, history, and progress remain specific to each browser; blocked or corrupt browser storage does not prevent playback.

HLS preparation is shared between the server and standalone converter. One process at a time performs background HLS conversion. Completed playlists are published atomically with unique segment directories; existing streams and caches are not deleted on restart or during a forced rebuild. Source replacements invalidate the cache. Missing tools and interrupted jobs produce retryable errors. The server limits its conversion queue and permits at most two live remux/transcode streams at once.

Completed HLS generations and old thumbnails persist. If reclaiming disk space manually, stop playback and converters first; these derived files can be regenerated. Original media files are never removed by cache maintenance.

The HLS JavaScript player is bundled locally with its license. Browsing uses system fonts and works without external services. The player has an optional Google Font with system fallbacks.

## Browsing and design

The responsive interface includes a manually controlled featured title, horizontal home
shelves, full category grids with sorting, mobile bottom navigation, and dedicated search.
Shows are grouped with season selection in title details. My List stays synchronized across
cards and details; Continue Watching excludes removed and completed items. Keyboard users
can navigate cards and dialogs, and seek with the focused playback timeline. The next-episode
prompt can be cancelled before its ten-second transition.

Landscape artwork is generated at 1280×720 using a frame 15% into each video (up to 15
minutes), with short-video fallbacks. Run `python scan_media.py` to refresh older libraries.
Previous thumbnails and original media are retained. Display-title cleanup does not rename
files. Subtitles are not currently supported; the previously inactive subtitle button is hidden.

See [the UI architecture](docs/UI-ARCHITECTURE.md) for component boundaries, research
references, future extension points and verification details.

## Verify changes

```powershell
python -B -m unittest discover -s tests -v
node --test tests/frontend.test.cjs
# Optional: real-template DOM integration checks (Node.js 18+)
npm.cmd ci
npm.cmd test
```

Backend tests create short FFmpeg fixtures in isolated temporary directories and cover authentication, uploads, range requests, catalog concurrency, path boundaries, HLS persistence, force conversion, audio indexing, and thumbnails. JavaScript tests execute the real application scripts with isolated DOM/media doubles; they do not replace visual testing in a real browser.
