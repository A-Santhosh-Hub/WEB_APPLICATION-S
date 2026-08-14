# SanLAN — Private LAN File Sharing System

Transfer large game/project folders between Windows PCs on the same LAN — no USB drives needed.

---

## Quick Start

### 1. Install Python 3.12+

Download from [python.org](https://www.python.org/downloads/).

### 2. Clone / Download SanLAN

Place the `SanLAN` folder anywhere on your system.

### 3. Create Virtual Environment

```bash
cd SanLAN
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Shares

Edit `config.json` to point at your folders:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080
  },
  "shares": [
    {
      "name": "Games",
      "path": "D:\\Games",
      "read_only": true
    },
    {
      "name": "Movies",
      "path": "E:\\Movies",
      "read_only": true
    }
  ]
}
```

### 5. Start the Server

Double-click `start_server.bat`, or run:

```bash
python -m server.main
```

### 6. Connect from Another PC

Open the URL shown in the terminal on any browser on the same LAN:

```
http://192.168.x.x:8080
```

---

## Configuration

| Key | Description | Default |
|---|---|---|
| `server.host` | Bind address | `0.0.0.0` (all interfaces) |
| `server.port` | Listening port | `8080` |
| `shares[].name` | Display name for the share | — |
| `shares[].path` | Absolute path to the folder | — |
| `shares[].read_only` | Prevent modifications | `true` |
| `transfer.chunk_size_kb` | Streaming chunk size in KB | `1024` (1 MB) |
| `transfer.max_concurrent_transfers` | Max simultaneous transfers | `5` |
| `security.require_pin` | Enable PIN authentication | `false` |
| `security.pin` | The PIN code | `""` |

---

## Windows Firewall

When you first start the server, Windows may display a firewall prompt:

> **Allow Python to communicate on private networks?**

Click **"Allow access"** for **Private networks** only.

This is required for other devices on your LAN to reach the server. The application binds to `0.0.0.0` by default, which listens on all local network interfaces.

> ⚠️ **Do NOT allow access on Public networks** unless you understand the implications.

If you accidentally block it, you can add a firewall rule manually:

```
Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule
→ Port → TCP → 8080 → Allow → Private only
```

---

## Project Structure

```
SanLAN/
├── server/          # Python backend (FastAPI + Uvicorn)
│   ├── main.py      # Entry point
│   ├── config.py    # Configuration loader
│   ├── routes/      # API endpoints
│   ├── services/    # Business logic
│   └── utils/       # Path security, formatting
├── web/             # Frontend (HTML/CSS/JS)
├── tests/           # Automated tests
├── config.json      # Server configuration
├── requirements.txt # Python dependencies
└── start_server.bat # Windows launcher
```

---

## Development

### Run Tests

```bash
python -m pytest tests/ -v
```

### Run Server in Development

```bash
uvicorn server.main:app --reload --host 0.0.0.0 --port 8080
```

---

## License

Private use. Not for redistribution.
