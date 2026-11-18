# Dr Deepika Skin & Hair Clinic – Frontend

Website and admin panel for the clinic. Patients can browse services and book appointments online (OTP verification + Razorpay payment). The clinic team manages everything from the admin dashboard.

Built with React 19, Vite, React Router and React Toastify. It talks to the backend (Express + MySQL) through `VITE_API_URL`.

## Setup

1. Install Node.js (18 or newer).
2. Install packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in this folder:
   ```
   VITE_API_URL=http://localhost:5000
   ```
   For production, set this to the live backend address (no `/` at the end), for example `https://api.example.com`.
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Pages

| URL | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/services` | Services |
| `/appointment` | Book appointment |
| `/pages/contact` | Contact form |
| `/pages/admin/login` | Admin login |
| `/admin/forgot-password` | Admin forgot password |
| `/admin/dashboard` | Admin dashboard |

## Folder structure

```
src/
  admin/       Admin login, forgot password, dashboard
  component/   Navbar, Footer, calendar, scroll helpers
  pages/       Public pages
  css/         Page-wise CSS
  assets/      Images
  utils/       Helpers (time slots)
```

## Deployment notes

- Run `npm run build` and upload the `dist/` folder.
- Set `VITE_API_URL` **before** building. Vite puts it into the build, so changing it later needs a new build.
- Because this is a single-page app, the host must send every URL to `index.html` (otherwise refreshing `/appointment` gives 404).
- Deploy the frontend and backend **together**. The appointment page now sends an OTP-verification token (`x-verify-token`) to the backend, so an old frontend with a new backend will not auto-fill returning patients.

## How appointment OTP works

1. Patient enters phone number, then `POST /api/appointments/send-otp`.
2. Patient enters OTP, then `POST /api/appointments/verify-otp`. The response includes a `verifyToken` (valid for 15 minutes).
3. The page sends that token in the `x-verify-token` header to `GET /api/appointments/patient-by-phone` to fill details of returning patients.

The backend limits OTP requests and wrong attempts, so users may see "Too many requests" messages if they retry too fast.

## Admin dashboard

- Auto-refreshes appointments, contacts and slots every 30 seconds (skipped when the tab is hidden).
- Login is limited to 5 wrong attempts per 15 minutes by the backend.