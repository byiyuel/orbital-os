# Orbital_OS: Global Economic Matrix

Orbital_OS is a high-end, interactive 3D macroeconomic dashboard built with Next.js 15, Three.js, and D3. It provides a real-time, tactical visualization of global economic health, designed for quantitative analysts and fintech enthusiasts.

## Key Features

*   **Interactive 3D Grid:** A high-fidelity Three.js globe serving as a navigation portal to dynamic country dashboards.
*   **Live Data Uplink:** Seamless integration with the **World Bank Open Data API** for real-time GDP, inflation, and growth metrics.
*   **Tactical HUD Interface:** A premium cyberpunk-luxury aesthetic with glassmorphism, neon emerald accents, and scanline effects.
*   **Dynamic Analytics:** Categorized time-series charts using **D3.js** for deep-dive economic progression analysis.
*   **Quant-Ready Architecture:** 
    *   **Secure Fetching:** All API keys and data streams are handled via Server Components (ISR).
    *   **High Performance:** Incremental Static Regeneration (ISR) ensures 24-hour caching for lightning-fast loads.
    *   **Adapter Pattern:** Raw API JSON is standardized into quantitative data arrays.

## Tech Stack

*   **Framework:** Next.js 15 (App Router)
*   **3D Engine:** Three.js
*   **Data Visualization:** D3.js (Charts & Globe)
*   **Styling:** Tailwind CSS 4
*   **Database:** PostgreSQL & Prisma (Schema ready for historical data storage)
*   **Icons:** Lucide-React

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
## Environment Setup

Orbital OS requires several environment variables to function correctly. Follow these steps to set up your local environment:

1.  **Copy the template:**
    ```bash
    cp .env.example .env
    cp .env.local.example .env.local
    ```

2.  **Configure Core Variables:**
    - `WORLD_BANK_API_URL`: Pre-configured to `https://api.worldbank.org/v2`.
    - `DATABASE_URL`: Set this to your PostgreSQL connection string for Prisma features.
    - `NEXT_PUBLIC_APP_URL`: Set to `http://localhost:3000` for local development.

3.  **Optional API Keys:**
    - `FRED_API_KEY`: Required for Federal Reserve data modules.
    - `TCMB_API_KEY`: Required for Turkey-specific market analysis.

See `.env.example` for more details on where to obtain these keys.

4.  **Launch the Grid:**
    ```bash
    npm run dev
    ```
5.  Access the terminal at `http://localhost:3000`.

## Data Sources

*   **Macro Fundamentals:** World Bank Open Data API.
*   **Global Finance:** FRED API (Integration modules ready).
*   **Local Markets:** TCMB EVDS API (Custom Turkey fetcher included).

---
Developed by Gemini CLI
