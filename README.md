<div align="center">

```text
       .-------.
      /       /|
     /_______/ |
     |  ...  | |
     |  :::  | |
     |_______|/
     [ DATA ]
```

# ⚡ R3ETROR3SOLVE ⚡
**[ SECURE MAINFRAME ACCESS PORTAL v9.5.1 ]**

*An AI-Powered Enterprise Helpdesk System wrapped in an immersive, highly-interactive Windows 95 / Cyberpunk aesthetic.*

---

</div>

## 🌐 INITIALIZING DIRECTIVE...
Most B2B SaaS applications and internal Helpdesks are built using the exact same generic UI component libraries, resulting in sterile, forgettable experiences. **R3etroR3solve** was engineered to rebel against that standard.

This project proves that enterprise-grade robustness (Spring Boot, JWT Security, Real-Time WebSockets) can coexist with an incredibly creative, nostalgic, and memorable User Experience (Vintage CRT boot sequences, draggable Modals, interactive DOS prompts). 

If you're reading this, prepare to be humbled by the depth of engineering behind the retro facade.

---

## 🚀 CORE FEATURES & MODULES

### 1. The Entry Gateway (Stage 1 & 2 Authentication)
We completely threw out the traditional login page. 
*   **The Blueprint Cover**: Users are greeted with a full-screen, cyan-and-black technical grid featuring a lightning-animated R3ETROR3SOLVE logo. 
*   **Physical Interactivity**: Users must literally use their mouse to drag the cover screen upwards to reveal the mainframe.
*   **DOS Terminal**: Beneath the cover lies a simulated DOS prompt demanding keyboard input (`[Y] / [N]`) to route the user to login or registration, fully immersing them before the app even loads.
*   **CRT Boot Sequence**: Upon authenticating, a classic BIOS boot sequence runs, complete with phosphor glow and simulated memory checks.

### 2. Intelligent AI Copilot (Powered by Groq & Llama-3)
*   **Full Queue Context**: The AI ("Clippy") isn't just a generic chatbot. It is fed the entire active ticket queue as context, allowing agents to ask questions like *"Give me a summary of all pending hardware issues."*
*   **Smart Drafting**: Agents can click a button to have the AI instantly read a ticket and draft a professional resolution note.
*   **Resilient Infrastructure**: Built with custom retry logic and extended timeouts to ensure the AI never drops a connection during heavy inference.

### 3. Real-Time Synchronization Engine
*   **WebSocket/STOMP Integration**: The platform utilizes full-duplex WebSocket connections. 
*   **Live Presence**: If an admin has 3 tabs open, they are instantly kept in sync. The "Online Users" count updates in real-time across all clients without polling.
*   **Instant Alerts**: When an employee submits a ticket, the Agent Workspace flashes instantly with a notification.

### 4. Dynamic Workspaces & Role-Based Access Control (RBAC)
*   **Three Tiers**: Employees (submitters), Agents (resolvers), and Admins (managers).
*   **JWT Security**: Every route and API endpoint is cryptographically secured via JSON Web Tokens, passing custom claims (like the user's Full Name) directly in the token payload to reduce database hits.
*   **Adaptive Browser Tabs**: The browser tab automatically updates its emoji and title based on your role and real name (e.g., `🎫 Aditya - Employee Workspace`).

### 5. Custom Window Manager (UI)
*   **Draggable Modals**: Instead of static popups, every modal (Ticket Details, Audit History, Action Center) behaves like a real OS window. They can be dragged anywhere on the screen.
*   **Perfected Layouts**: Complex CSS calculations ensure that even when a ticket has a massive history log, the window remains contained with an elegant scrollbar, never stretching off-screen or overlapping the Windows 95 taskbar.

---

## 📐 SYSTEM ARCHITECTURE

R3etroR3solve is a decoupled Monorepo consisting of:

1.  **`helpdesk-platform`**: The Java Spring Boot Backend.
    *   Exposes a RESTful API.
    *   Manages the WebSocket Message Broker.
    *   Handles JWT authentication filters.
    *   Interfaces with the Groq LLM API.
2.  **`helpdesk-ui`**: The React/Vite Frontend.
    *   Manages complex local state for the dragging mechanics and window management.
    *   Handles STOMP client subscriptions for real-time data.
    *   Uses pure, bespoke CSS for all styling (No Tailwind/Bootstrap) to ensure a 100% authentic retro feel.

---

## 🧠 KEY DESIGN DECISIONS

*   **Pure CSS over Frameworks**: We explicitly chose *not* to use component libraries like Material-UI or Tailwind. Recreating authentic 1995 3D bevels, CRT scanlines, and DOS terminals requires pixel-perfect, custom CSS. 
*   **WebSockets over Long-Polling**: Helpdesks require immediacy. We chose STOMP over WebSockets rather than HTTP polling to reduce server load and guarantee instant ticket delivery.
*   **Groq over OpenAI**: We chose Groq's LPU infrastructure running Llama-3 because Helpdesk agents need *instant* AI drafts. Groq provides near-zero latency inference, making the Copilot feel snappy and responsive.

---

## 🛠️ INSTALLATION & DEPLOYMENT

### Prerequisites
*   Java 17+
*   Node.js 18+
*   Maven

### Running the Backend
1. Navigate to `/helpdesk-platform`
2. Set your environment variable: `export GROQ_API_KEY=your_key_here`
3. Run `mvn spring-boot:run`
4. Server runs on `http://localhost:8080`

### Running the Frontend
1. Navigate to `/helpdesk-ui`
2. Run `npm install`
3. Run `npm run dev`
4. Access the portal at `http://localhost:5173`

---
<div align="center">
<i>"Why build a boring dashboard when you can build an experience?"</i>
</div>
