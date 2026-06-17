# NGO Volunteer & Event Management Portal

A beginner-friendly full-stack project for learning how React, TypeScript, hooks, Context API, Express.js, and SQLite work together.

## What this project does

- Register volunteers with name, email, mobile, city, and skills.
- View volunteers in a responsive card layout.
- Create, update, delete, and list events.
- Register volunteers for events.
- Track dashboard statistics.
- Search and filter volunteers and events.
- Use a global React Context to share data across the app.

## Project Structure

- `frontend/` - React + TypeScript + Tailwind UI
- `backend/` - Node.js + Express.js + SQLite API
- `backend/schema.sql` - Database schema and seed data

## Setup Instructions

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on the Vite dev server, usually `http://localhost:5173`.

## API Endpoints

### Volunteers

- `GET /api/volunteers`
- `GET /api/volunteers/:id`
- `POST /api/volunteers`
- `PUT /api/volunteers/:id`
- `DELETE /api/volunteers/:id`

### Events

- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

### Event Registration

- `POST /api/events/:id/register`

### Dashboard

- `GET /api/dashboard/stats`

## How the React Hooks Work

This project uses hooks directly in the main dashboard file so you can see how data moves through the UI.

### `useState`

Used for form inputs, selected filters, toast messages, and local UI state.

Examples:

- Volunteer form values
- Event form values
- Current role mode
- Selected volunteer in volunteer mode

### `useEffect`

Used to load data from the backend when the app starts.

That means the dashboard gets its volunteer and event data automatically after the page mounts.

### `useMemo`

Used for derived values that should only recalculate when their dependencies change.

Examples:

- Dashboard stats
- Filtered volunteer list
- Filtered event list
- Volunteer skill distribution

### `useContext`

Used through the NGO Context so the app can share volunteers, events, and actions without passing props through many levels.

This solves the prop drilling problem.

## Data Flow Summary

1. React loads the app.
2. `useEffect` requests volunteers and events from the backend.
3. Express reads data from SQLite.
4. The frontend stores the API response in context state.
5. Components read that shared state through `useContext`.
6. When a form is submitted, the app sends a REST request.
7. The backend updates SQLite.
8. The frontend reloads data and the UI updates.

## Learning Goals Covered

- Functional components
- State management with `useState`
- Side effects with `useEffect`
- Shared state with `useContext`
- Derived state with `useMemo`
- REST APIs
- CRUD operations
- Frontend-backend communication
- SQLite persistence

## Notes

- The frontend includes a fallback mode so the UI can still show sample data if the backend is offline.
- The backend automatically loads the schema and seed data from `schema.sql`.
