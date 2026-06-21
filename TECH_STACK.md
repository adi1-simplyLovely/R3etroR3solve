# 💻 THE TECH STACK: R3etroR3solve

This document serves as an architectural deep-dive into the technologies used to build **R3etroR3solve**. It is designed to explain *what* tools we used, *why* we chose them over the alternatives, and *how* they work together to create an enterprise-grade Helpdesk platform disguised as a retro OS.

---

## 🎨 THE FRONTEND STACK

### 1. React 18 & Vite
*   **What it is:** React is a JavaScript library for building component-based user interfaces. Vite is a next-generation frontend build tool that is significantly faster than standard Webpack/Create-React-App.
*   **Why we chose it:** A Helpdesk application requires extremely complex state management. Modals need to open and close, WebSockets need to push live data to dashboards, and the AI needs to stream text. React allows us to break the UI down into isolated, manageable components (like `<ChatSidebar />` or `<ClippyCopilot />`). Vite was chosen because it provides near-instant Hot Module Replacement (HMR) during development.
*   **How we used it:** We used React Hooks (`useState`, `useEffect`, `useRef`) heavily. For example, `useRef` is used to track the exact `X` and `Y` pixel coordinates of the user's mouse to allow the retro windows to be smoothly dragged across the screen.

### 2. Pure Vanilla CSS
*   **What it is:** Standard Cascading Style Sheets without any utility frameworks.
*   **Why we chose it:** In 2026, almost everyone uses TailwindCSS or Bootstrap. However, those frameworks are designed for *modern, flat* designs. We needed 1995 3D bevels, inset borders, phosphor CRT glows, and DOS scanlines. Trying to force Tailwind to do this would be messy. By using Pure CSS, we had absolute, pixel-perfect control over every shadow and keyframe animation (like the lightning logo).

### 3. React Router DOM
*   **What it is:** The standard routing library for React.
*   **How we used it:** We implemented a `<ProtectedRoute>` wrapper. This intercepts users trying to access URLs they shouldn't. If an Employee tries to type `/agent-workspace` into their URL bar, React Router instantly kicks them back to the Employee Dashboard based on their role.

---

## ⚙️ THE BACKEND STACK

### 1. Java 17 & Spring Boot 3
*   **What it is:** The industry standard for building robust, scalable enterprise backends. Spring Boot handles all the boilerplate configuration for setting up web servers and databases.
*   **Why we chose it:** A ticketing system needs to be reliable, type-safe, and capable of handling complex business logic (e.g., escalating tickets, assigning agents, tracking audit trails). Java provides immense stability, and Spring Boot provides out-of-the-box security and database integrations.

### 2. Spring Security & JWT (JSON Web Tokens)
*   **What it is:** A security framework combined with a stateless authentication method.
*   **How we used it:** When a user logs in, the Spring backend verifies their password and generates a cryptographic "Ticket" (the JWT). This token contains their User ID, Role, and Full Name. The React frontend stores this token and attaches it to every future request. 
*   **The Benefit:** The backend is stateless. It doesn't need to look up the user's session in the database on every request; it just verifies the cryptographic signature of the JWT, making the API incredibly fast.

### 3. Spring WebSocket & STOMP
*   **What it is:** WebSockets provide a persistent, two-way connection between the browser and the server. STOMP is a messaging protocol that runs on top of WebSockets.
*   **Why we chose it:** Traditional HTTP is a "pull" mechanism (the browser has to constantly ask "Are there new tickets?"). WebSockets are a "push" mechanism. 
*   **How we used it:** When an employee submits a ticket, the Spring backend uses STOMP to broadcast a message to `/topic/tickets`. Any Agent's browser that is subscribed to that topic instantly receives the data and updates the UI, resulting in zero-latency notifications.

### 4. Spring Data JPA & Hibernate
*   **What it is:** An Object-Relational Mapping (ORM) framework.
*   **How we used it:** Instead of writing raw SQL queries (`SELECT * FROM users`), we write Java interfaces. Spring Data automatically translates our Java code into optimized SQL. This handles the complex relationships between Users, Tickets, and TicketHistory logs.

---

## 🤖 THE AI INFRASTRUCTURE

### 1. Groq Cloud API
*   **What it is:** An AI inference engine that runs on specialized hardware (LPUs - Language Processing Units) instead of standard GPUs.
*   **Why we chose it:** Groq is currently the fastest inference engine on the planet. For an interactive Copilot in a Helpdesk, waiting 10 seconds for ChatGPT to respond ruins the illusion. Groq returns massive responses in milliseconds.

### 2. Meta Llama-3 (8B Instruct)
*   **What it is:** An open-source, highly capable Large Language Model.
*   **How we used it:** We feed Llama-3 the entire active ticket queue as a hidden "System Prompt". This gives the AI total context awareness. We specifically instruct it to act as "Clippy", a slightly nostalgic but highly efficient IT assistant. We use it for two primary functions:
    1.  **Global Summarization:** Analyzing the entire queue to find patterns or bottlenecks.
    2.  **Smart Drafting:** Reading a specific ticket's description and automatically generating a professional resolution note for the agent to use.

---

## 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```text
[ React Frontend ] <------- HTTP / REST --------> [ Spring Boot API ]
       |                                                 |
       |                                                 |
       +------------ WebSocket / STOMP ------------------+
                                                         |
                                                [ JWT Security Filter ]
                                                         |
                                            +------------+------------+
                                            |                         |
                                     [ Groq API ]              [ PostgreSQL / H2 ]
                                     (Llama-3 LLM)                (Database)
```
