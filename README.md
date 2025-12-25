# PAW App 
This repository contains the desktop application for PAW (Puppy's Avatar World), a VRChat avatar database and search platform.

[![Discord](https://img.shields.io/discord/1331153121472282652?color=%23512BD4&label=Discord&logo=discord&logoColor=white&style=flat)](https://discord.gg/zHhs4nQYxX)

## Overview
The application is built using Tauri and Next.js. It provides a native desktop experience for searching, browsing, and discovering VRChat avatars. A key feature of the application is the ability to "force clone" avatars you have encountered directly from within the app.

## Getting Started
### Prerequisites
*   Node.js (v18 or later)
*   npm or yarn
*   Rust (latest stable)

### Installation
1.  Clone the PAW repository.
2.  Install dependencies: `npm install` or `yarn install`

### Development
1.  Start the development server: `npm run tauri dev` or `yarn tauri dev`

### Building for Production
1.  Run the build command: `npm run tauri build` or `yarn tauri build`

### Technologies Used
*   [Tauri](https://tauri.app)
*   [Next.js](https://nextjs.org)
*   [React](https://react.dev)
*   [Tailwind CSS](https://tailwindcss.com)
*   [Shadcn UI](https://ui.shadcn.com)

## Credits
Fetching and posting avatars to PAW leverages [VRC-LOG](https://github.com/ShayBox/VRC-LOG) in the background.