# StreamPlayer

A modern streaming tool that integrates DonationAlerts with a YouTube video player queue. Built with React, Vite, and Python (Eel).

## Features

- **DonationAlerts Integration**: Automatically listens for donations.
- **YouTube Queue**: Adds videos from donation messages to a playback queue.
- **Validation**: Checks video length, views, likes, and blacklisted words before adding.
- **Modern UI**: Built with React, TailwindCSS, and Vidstack.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)

## Quick Start

1.  **Run the setup script** (installs dependencies and sets up virtual environment):

    *   **macOS / Linux:**
        ```bash
        ./setup.sh
        ```
    *   **Windows:**
        ```cmd
        setup.bat
        ```

2.  **Start the application**:

    ```bash
    npm run start
    ```

    This command builds the React frontend and launches the Python Eel backend.

## Development

To run in development mode (with hot reload):

1.  Start Vite server:
    ```bash
    npm run dev
    ```
2.  (Optional) Run Python backend separately if needed for backend logic changes.

## Building for Distribution

To create a standalone executable, first ensure you have run the setup script. Then run the build command for your OS:

### macOS / Linux
```bash
npm run build:mac
```

### Windows
```cmd
npm run build:win
```

The executable will be in the `dist/` folder.

## Configuration

- **DonationAlerts**: Configure Client ID and Secret in the settings dashboard.
- **YouTube**: Add your YouTube Data API Key in settings.
