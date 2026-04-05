# JoinEazy Round 2 - Full Stack Assignment Workflow

This repository implements the complete Round-2 application from the provided PDF:

- Role-based authentication (Student / Professor)
- Responsive React + Tailwind frontend
- Node + Express + MongoDB backend with JWT
- Assignment management (individual + group)
- Group leader acknowledgment reflected across all members
- Dashboard analytics and progress visualization

## Project Structure

- frontend: React, Vite, Tailwind CSS
- backend: Node.js, Express.js, MongoDB, JWT
- data: Original task PDF

## UI/UX Design Choices

- Authentication pages include validation states, loading spinners, and clear error messages.
- Dashboard cards use responsive grid layouts with status badges and visual progress indicators.
- Assignment view includes:
  - title, description, deadline, submission type
  - progress bar and status chips
  - submission table for transparency
  - group info section for group assignments
- Color direction: deep slate + emerald accent for better clarity and contrast.

## Backend Highlights

- JWT auth with role-aware route protection
- Mongo schema design includes:
  - User
  - Course
  - Assignment
  - Submission
  - Group
- Professor flow:
  - create/edit assignments
  - view submissions and progress analytics
  - create groups for group assignments
- Student flow:
  - submit assignment
  - acknowledge assignment
  - for group type, only group leader can acknowledge
  - leader acknowledgment updates all group member submissions

## Local Setup

## 1) Backend

1. Open terminal in backend folder.
2. Install dependencies:
   npm install
3. Copy env:
   - create .env file from .env.example
4. Start server:
   npm run dev

Optional seed:

- npm run seed

Seed users:

- Professor: prof@example.com / password123
- Student: student1@example.com / password123

## 2) Frontend

1. Open terminal in frontend folder.
2. Install dependencies:
   npm install
3. Copy env:
   - create .env file from .env.example
4. Start client:
   npm run dev

## API Base URL

Frontend expects:

- VITE_API_URL=http://localhost:5000/api

## Screenshots / GIF Section

Add your captures here before submission:

- Login flow
- Registration flow
- Student dashboard
- Professor dashboard
- Assignment detail page (individual)
- Assignment detail page (group)

## Deployment Notes

- Frontend: Vercel or Netlify
- Backend: Render / Railway / any Node host
- Make sure frontend env points to deployed backend API URL

## Key Endpoints

Auth:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Courses:

- GET /api/courses/my

Assignments:

- POST /api/assignments (Professor)
- PUT /api/assignments/:id (Professor)
- GET /api/assignments/:id
- GET /api/assignments/:id/submissions (Professor)
- POST /api/assignments/:id/submit (Student)
- POST /api/assignments/:id/acknowledge (Student)

Groups:

- POST /api/groups (Professor)

## Validation Checklist

- Frontend production build passes.
- Backend app module loads successfully.
- Role-based redirects implemented.
- Group acknowledgment rule implemented.
- Dashboard and assignment status visualization implemented.
