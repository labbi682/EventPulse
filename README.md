<div align="center">
  <img src="public/icons.svg" alt="EventPulse Logo" width="120" />

  # EventPulse
  **College Event Analytics & Registration Management System**

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)

  A modern, high-performance web application designed to streamline event tracking, participant registration, waitlisting, and post-event feedback analytics for universities and colleges.
</div>

---

## ✨ Key Features

- **🛡️ Secure Authentication**: Robust user registration and login powered by Supabase Auth.
- **📊 Real-time Dashboard**: Live metrics, charts, and statistics tracking registrations, event status, and attendance.
- **🎫 Smart Registrations**: Automated waitlist management using advanced SQL triggers. When a spot opens up, the next student is automatically promoted!
- **🌐 Dual-Mode Database**: Run in "Offline Simulator Mode" with seeded mock data, or connect to a Live Supabase backend.
- **📝 Public Feedback Portal**: A dedicated portal for attendees to rate events and leave feedback seamlessly.
- **🎨 Stunning UI/UX**: Premium dark mode design with glassmorphism, dynamic gradients, and micro-animations.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS v4 + Vanilla CSS (Glassmorphism) |
| **Icons & UI** | Lucide React |
| **Data Visualization** | Recharts |
| **Backend / Database** | Supabase (PostgreSQL + Auth) |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the repository
```bash
git clone https://github.com/labbi682/EventPulse.git
cd EventPulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup (Optional but Recommended)
To run the live database version, you need a Supabase project.
1. Create a project on [Supabase](https://supabase.com/).
2. Run the `schema.sql` file provided in this repository inside your Supabase SQL Editor. This will create all necessary tables, policies, triggers, and mock data.
3. You can configure your keys directly via the app's UI on the Login Page, or create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 📂 Project Structure

```text
EventPulse/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and visual assets
│   ├── components/         # Reusable UI components (Sidebar, Toasts, etc.)
│   ├── views/              # Main application pages (Dashboard, Events, Login, Register)
│   ├── App.tsx             # Root component & Routing
│   ├── index.css           # Global styles and Tailwind imports
│   ├── mockDatabase.ts     # Offline demo data engine
│   ├── supabase.ts         # Supabase client configuration
│   └── types.ts            # TypeScript interfaces
├── schema.sql              # Supabase database schema, triggers, and seed data
└── package.json            # Dependencies and scripts
```

---

## ⚙️ Database Architecture (schema.sql)

The system relies on 4 primary PostgreSQL tables:
1. **`events`**: Stores event details, venue, dates, and capacities.
2. **`participants`**: Student directory containing names, emails, and departments.
3. **`registrations`**: Junction table tracking who registered for what, handling **waitlist positioning** logic.
4. **`feedback`**: Post-event ratings and reviews submitted by attendees.

*Custom PL/pgSQL triggers handle auto-waitlisting, waitlist promotion on cancellations, and capacity expansion handling.*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  <i>Designed and developed for seamless college event management.</i>
</div>
