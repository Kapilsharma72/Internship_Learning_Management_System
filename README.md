## Internship Learning Management System (LMS)

This project is a **full‑stack internship Learning Management System** with strict
**Role‑Based Access Control (RBAC)**. It simulates a small internship platform where
students follow a structured course, mentors design and manage that course, and admins
control the whole system.

The assignment was designed to feel “production‑style”, so I focused on:

- Clean separation between **Student**, **Mentor** and **Admin** experiences
- Enforcing business rules (sequential chapters, completion checks, mentor approval)
- A simple but modern **React SPA** UI
- Tests around authentication, RBAC and completion rules

---

### Tech stack

- **Frontend**: React (Vite), React Router, Axios
- **Backend**: Node.js, Express.js, Jest, Supertest
- **Database**: MongoDB with Mongoose (persistent, production‑grade DB)
- **Auth**: JWT (JSON Web Tokens) + bcrypt password hashing

MongoDB is explicitly allowed in the assignment as an alternative to PostgreSQL and
Supabase, so I used a stack I can run locally and reason about quickly.

---

## What the system does

### Roles & permissions

- **Student**
  - Register and log in
  - See **only** the courses assigned to them
  - Open a course and view its chapters one by one
  - Chapters are **locked until the previous one is completed**
  - Track progress per course and overall
  - View chapter content (image links + video links)
  - Download a **PDF completion certificate** when the course reaches 100%

- **Mentor**
  - Register as mentor (must be **approved by an Admin** before login works)
  - Create and update courses
  - Add chapters with title, description, image URL, video URL and sequence order
  - Admin allocates students to mentors; mentors can then:
    - Assign their courses only to **allocated students**
    - View a chapter outline for each course
    - Track progress of their students in that course (percentage + progress bar)

- **Admin**
  - Log in with an admin account
  - View all users (students, mentors, admins) without passwords
  - Approve mentor accounts or remove users
  - Allocate students to mentors (controls who mentors can assign courses to)
  - View platform analytics: total users, roles, courses, certificates issued

All restricted endpoints pass through **JWT auth** and an **RBAC middleware**. The
assignment’s security rules (401 vs 403, role separation, mentor approval gate, etc.)
are enforced at the API layer.

---

## Running the project locally

You need **Node.js** and a running **MongoDB** instance. The commands below assume you
run everything from the project root.

### 1. Backend (API)

```bash
cd backend
npm install
```

Create a `.env` file in `backend` with at least:

```bash
MONGO_URI=mongodb://localhost:27017/internship_lms
JWT_SECRET=some-long-random-secret
PORT=<PORT>
```

Then start the API:

```bash
npm run dev   # or: npm start
```

The backend will listen on `http://localhost:<PORT>` (default configured in your `backend/.env`).

---

## Creating the first Admin (bootstrap)

Admin accounts are **not publicly registerable**. This is intentional to keep RBAC strict.

To set up the platform on a fresh database, the backend provides a **one-time** admin bootstrap endpoint:

- `POST /api/auth/bootstrap-admin`

It only works when **no admin exists yet**. After an admin exists, the endpoint will return **409**.

### Local (running on your machine)

1. Set a bootstrap token in `backend/.env` (do **not** commit this file):

```bash
ADMIN_BOOTSTRAP_TOKEN=some-long-random-token
```

2. Create the first admin by calling the endpoint.

Example using `curl`:

```bash
curl -X POST "http://localhost:<PORT>/api/auth/bootstrap-admin" \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-token: some-long-random-token" \
  -d '{"name":"Admin","email":"admin@example.com","password":"Admin@123"}'
```

3. Log in normally from the UI (or via `POST /api/auth/login`) using the admin credentials.

4. After the admin is created, **remove/rotate** `ADMIN_BOOTSTRAP_TOKEN`.

### Deployed 

If you are using the live deployment.

live deployment link: https://internship-learning-management-syst.vercel.app/

Login AS Admin use this Gmail & Password:
Gmail : admin@gmail.com
Password: Shara@123

Notes:

- The `ADMIN_BOOTSTRAP_TOKEN` must be set in your backend hosting provider’s environment variables.
- This endpoint is meant only for initial setup. Once the first admin exists, it is automatically locked.

### 2. Frontend (SPA)

```bash
cd frontend
npm install
npm run dev
```

Vite will print a URL such as `http://localhost:5173`. Open that in your browser.
The frontend is configured to call the backend via `VITE_API_URL` (see `frontend/.env.example`).

---

## Typical flows to try

### 1. Admin

1. Create the first admin using the **bootstrap admin** instructions above.
2. Log in with that admin account.
3. Open the **Admin panel**:
   - See analytics cards for users, roles, courses and certificates.
   - View all users in the table.
   - Allocate students to mentors via the “Allocate students to mentors” section.
   - Approve or remove mentors as needed.

### 2. Mentor

1. Register as **mentor**.
2. As admin, go to the Admin panel and **approve** the mentor.
3. Log in as the mentor:
   - Create a course with title and description.
   - Add chapters in order (sequence numbers) with optional image & video URLs.
   - Once an admin has allocated some students to this mentor, assign the course
     to those students from the dropdown.
   - Use the course dashboard to see which students are progressing and their
     completion percentages.

### 3. Student

1. Register as **student** and log in.
2. Once a mentor assigns a course to you, you will see it on the **Student dashboard**.
3. Open a course:
   - Work through chapters in order (previous chapter must be completed first).
   - Follow image and video links for content.
4. When progress reaches **100%**, click **Download Certificate** to receive a PDF.

---

## Testing

Backend tests live in `backend/src/tests`. To run them:

```bash
cd backend
npm test
```

The tests focus on:

- Authentication and RBAC behaviour (401 vs 403)
- Sequential chapter completion rules (cannot skip chapters)
- Certificate eligibility checks

The tests are intentionally small and focused so they are easy to understand in an
interview setting.

---

## “My AI Usage” (required by assignment)

The assignment encourages responsible AI use and asks for a short explanation.

### Tools used

- ChatGPT

### How AI helped

- **Architecture and brainstorming** – I used AI to discuss possible folder
  structures, entity relationships (Users, Courses, Chapters, Assignments, Progress,
  Certificates) and where to enforce business rules.
- **Boilerplate and wiring** – I let the assistant suggest some repetitive pieces,
  such as React route wiring, Axios configuration, and simple Express route scaffolds.
- **Review and refactoring** – I asked AI to point out missing edge‑cases and
  opportunities to simplify code without hiding important logic.

### How I validated AI output

- I **never pasted code blindly**. Every suggestion was read, adapted and re‑written
  where needed to match the assignment and my own style.
- I ran the app end‑to‑end for all three roles (student, mentor, admin) and wrote
  small Jest tests for the most critical rules (auth, RBAC, completion gates).
- I verified that all endpoints, status codes and UI flows line up with the written
  requirements in the assignment.

The goal was to use AI the way you would pair‑program with a colleague: as a second
pair of eyes, not as a code generator that replaces understanding.

---

