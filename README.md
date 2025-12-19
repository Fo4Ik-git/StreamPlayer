# 🎥 Stream Player

A modern, high-performance web application designed for streamers to display and manage video requests from their audience. Integrated with **DonationAlerts** and **YouTube**, this player handles video queuing, reordering, and playback with a sleek, interactive UI.

![Stream Player Preview](https://github.com/Fo4Ik-git/StreamPlayer/raw/main/public/preview.png) *(Note: Replace with actual preview image if available)*

## ✨ Features

- **Vidstack 1.12 Integration:** Ultra-stable video playback with support for various providers (YouTube primarily).
- **Real-time Donation Alerts:** Automatically listen for incoming donations via the official DonationAlerts SDK and add requested videos to the queue.
- **Interactive Control Panel:**
  - Manual video addition via YouTube URLs.
  - Drag-and-drop queue reordering.
  - Persistent volume control (remembered across tracks).
  - Play/Pause, Next, and Previous controls.
- **Beautiful UI:** Built with Next.js, Tailwind CSS, and Lucide icons for a premium look and feel.
- **Easy Configuration:** In-app setup guides with direct links to API consoles.
- **Vercel Ready:** Optimized for quick deployment and production use.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [YouTube Data API v3 Key](https://console.cloud.google.com/)
- [DonationAlerts Application credentials](https://www.donationalerts.com/application) (Client ID & Secret)

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:Fo4Ik-git/StreamPlayer.git
   cd StreamPlayer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### 1. YouTube API Key
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Create an **API Key** under the Credentials tab.
4. In the Stream Player app, open the **Control Panel** (Settings icon) and paste your key.

### 2. DonationAlerts OAuth
1. Go to [DonationAlerts Applications](https://www.donationalerts.com/application).
2. Create a new application.
3. Set the **Redirect URI** to `http://localhost:3000`.
4. Copy your **Client ID** and **Client Secret**.
5. In the Stream Player app, enter these credentials in the Control Panel and click **Connect**.

## ☁️ Deployment (Vercel)

1. Push your code to your GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. (Optional) Set environment variables for automation:
   - `NEXT_PUBLIC_YOUTUBE_API_KEY`
   - `NEXT_PUBLIC_DONATIONALERTS_CLIENT_ID`
   - `DONATIONALERTS_CLIENT_SECRET`
4. **Important:** Add your Vercel deployment URL (e.g., `https://your-app.vercel.app`) to the **Redirect URIs** in your DonationAlerts application settings.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Player:** [Vidstack](https://vidstack.io/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **API Integration:** `@donation-alerts/api`, `@donation-alerts/auth`, `@donation-alerts/events`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
