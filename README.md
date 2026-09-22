# Production-Ready Enterprise Canteen Feedback Management System

An enterprise-grade, high-performance **Canteen Feedback Management System** built for manufacturing plants and corporate facilities. Features an interactive, high-speed kiosk interface for employees (< 30 seconds completion) and a real-time analytics dashboard with Supabase integration, role-based security, PDF/Excel reporting, and multilingual support.

---

## 🌟 Key Features

### Employee Feedback Kiosk
- **Fast 30-Second Flow**: Progressive one-question-per-screen kiosk designed for touchscreens.
- **Multilingual Support**: Instant switching between **English 🇬🇧** and **Hindi 🇮🇳** (`i18next`).
- **Interactive Rating Cards**: 5 animated emoji cards (*Very Good*, *Good*, *Average*, *Poor*, *Very Poor*) with hover glow, bounce, scale, and green border feedback.
- **8 Core Rating Parameters**: Food Taste, Quality, Quantity, Cleanliness, Staff Behaviour, Service Speed, Hygiene, Overall Experience.
- **Context & Optional Info**: Meal Type (*Breakfast, Lunch, Dinner, Snacks*), Shift (*Morning, General, Evening, Night*), Plant Location, Department, Employee Name/ID/Phone, and auto-expanding remark textarea (max 500 chars).
- **Celebratory Thank You Screen**: Confetti explosion, animated checkmark, and 3-second auto-reset timer.

### Admin Portal & Real-time Analytics
- **Role-Based Access Control (RBAC)**: Super Admin, HR Admin, Canteen Admin, Read-Only Admin.
- **Supabase Realtime Sync**: Dashboard stats update instantly whenever a kiosk feedback is submitted.
- **Interactive Recharts Suite**: Daily/Weekly/Monthly trend line/area charts, Department-wise performance, Plant-wise ratings, Rating distribution (5-star down to 1-star), and Radar quality parameter breakdown.
- **Feedback Logs Table**: Live search, multi-faceted filtering (Date, Department, Plant, Meal, Shift, Min Rating), detail modal view, and record deletion.
- **Automated Report Engine**: Export Executive PDF reports (formatted summary tables & logs using `jspdf` & `jspdf-autotable`), Excel spreadsheets (`xlsx`), CSV files, and Print layout.
- **System Settings Manager**: Custom Company Name, Logo, Active Language Toggles, Plant, and Department settings.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Animations**: Framer Motion, Canvas Confetti
- **Backend & DB**: Supabase ONLY (PostgreSQL, Row Level Security, Realtime Engine, Supabase Auth)
- **Charts & Reports**: Recharts, jsPDF, jsPDF-AutoTable, SheetJS XLSX
- **Internationalization**: i18next, react-i18next
- **Notifications**: Sonner Toast

---

## 📁 Project Structure

```
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── DashboardOverview.tsx
│   │   │   ├── FeedbackTable.tsx
│   │   │   ├── ReportGenerator.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── kiosk/
│   │       ├── ContextStep.tsx
│   │       ├── FeedbackFlow.tsx
│   │       ├── LanguageSelector.tsx
│   │       ├── OptionalStep.tsx
│   │       ├── QuestionCard.tsx
│   │       ├── ThankYouScreen.tsx
│   │       └── WelcomeScreen.tsx
│   ├── i18n/
│   │   └── index.ts
│   ├── lib/
│   │   ├── mockData.ts
│   │   └── supabase.ts
│   ├── types/
│   │   └── database.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── schema.sql
│   └── migrations/
│       └── 20260724000000_initial_schema.sql
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The application runs immediately in **Demo & Offline Mode** with full mock data, live stats, charts, export tools, and auth roles.

---

## 🗄️ Supabase Backend Setup

To connect to your live Supabase project:

1. Create a project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Enable Row Level Security (RLS) and Realtime for the `feedback` table.
4. Copy your project credentials into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart your Vite development server (`npm run dev`).

---

## ☁️ Vercel Deployment Guide

### Deploy via Vercel CLI or Dashboard:
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Connect your repo to [Vercel](https://vercel.com).
3. Set the Environment Variables in Vercel settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build and publish your Vite application.

---

## 🔒 Security & Row Level Security (RLS)

- **Employees (Public Kiosk)**: `INSERT` only access on `feedback` table. No `UPDATE`, `DELETE`, or `SELECT` access to protect employee anonymity and data privacy.
- **Administrators**: Require Supabase Authentication. Role permissions determine `DELETE` and setting modification rights.
