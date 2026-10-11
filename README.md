# VeriClaim — AI-assisted civic complaint platform

VeriClaim is a full-stack demo for smart complaint management: citizens submit text, images, and optional location; the API runs automated **category prediction**, **spam / fake heuristics**, and **department routing**; admins and department officers manage the lifecycle; **Socket.IO** pushes live updates.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React (Vite), Tailwind CSS, Axios, React Router, Recharts, Socket.IO client |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, Multer, Helmet, rate limiting, `express-mongo-sanitize` |
| AI (optional) | Python FastAPI microservice; Node falls back to local heuristics if it is offline |

## Repository layout

- `backend/` — REST API + Socket.IO + uploads
- `frontend/` — SPA
- `ai-service/` — optional `/analyze` endpoint

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas (or local MongoDB)
- Python 3.10+ (only if you run `ai-service/`)

## 1. MongoDB

1. Create a cluster in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow your IP (or `0.0.0.0/0` for dev).
3. Copy the SRV connection string and substitute password and database name, e.g.  
   `mongodb+srv://USER:PASS@cluster.mongodb.net/vericlaim?retryWrites=true&w=majority`

## 2. Backend setup

```bash
cd backend
copy .env.example .env
```

Edit `.env`:

- `MONGO_URI` — connection string above
- `JWT_SECRET` — long random string
- `CLIENT_ORIGIN` — `http://localhost:5173` (comma-separate multiple origins if needed)
- Optional: `AI_SERVICE_URL=http://127.0.0.1:8000`
- Optional: `AI_FAKE_THRESHOLD=0.65` (higher = more complaints flagged as suspicious)

Install and seed departments + admin user:

```bash
npm install
npm run seed
```

Default admin (unless overridden in `.env`):

- **Email:** `admin@vericlaim.gov`
- **Password:** `Admin123!`

Start API:

```bash
npm run dev
```

API: `http://localhost:5000` — health: `GET /api/health`

### Create a department officer (admin JWT required)

```http
POST /api/auth/officers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Field Officer",
  "email": "officer@dept.gov",
  "password": "Officer123!",
  "phone": "+10000000000",
  "departmentId": "<MongoDB _id of department from /api/departments>"
```

Get department ids: `GET /api/departments` with any authenticated user.

## 3. Optional AI microservice

From another terminal (recommended with Python 3.12 on Windows):

```bash
cd ai-service
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
set BACKEND_ROOT=..
uvicorn main:app --reload --port 8000
```

If install appears to "hang", it is usually building native wheels with an incompatible Python version. Use 3.12 and, if needed, recreate the venv:

```bash
deactivate
rmdir /s /q .venv
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Set `AI_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`. The backend merges FastAPI scores with its own heuristics.

## 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api`, `/uploads`, and `/socket.io` to port 5000.

### Production Socket.IO

If the UI is not served from the same origin as the API, set `VITE_SOCKET_URL` in `frontend/.env` to your API origin (see `frontend/.env.example`).

## 5. AI verification endpoints

- `POST /api/ai/detect-image` (auth required, multipart with `image`)
  - Returns: `prediction`, `authenticityScore`, `confidence`, `reasons`
- `POST /api/ai/detect-text` (auth required)
  - Body: `{ title, description }`
  - Returns: `prediction`, `authenticityScore`, `confidence`, `reasons`
- `GET /api/ai/rejected-logs` (admin)
  - View blocked suspicious submissions
- `POST /api/ai/rejected-logs/:id/approve` (admin)
  - Manual override and create complaint from rejected queue

Complaint creation now blocks suspicious/fake submissions with:
- `422` + message:
  - `Complaint seems suspicious or AI-generated. Please upload genuine complaint details.`

## 6. API testing tips

- Use **Postman**, **Insomnia**, or **curl**.
- Register citizen: `POST /api/auth/register` `{ name, email, password, phone? }`
- Login: `POST /api/auth/login` → copy `token`
- Authenticated requests: header `Authorization: Bearer <token>`
- Submit complaint (citizen): `POST /api/complaints` as `multipart/form-data` with fields `title`, `description`, optional `location`, `contactPhone`, optional file `image`

## Roles

| Role | Dashboard route | Capabilities |
|------|-----------------|--------------|
| `citizen` | `/app` | Submit complaints, track status, chat on ticket |
| `admin` | `/admin` | All complaints, analytics, assign dept/officer, release suspicious tickets |
| `department_officer` | `/officer` | Department queue, accept/reject, progress images, resolve |

Login supports:
- User (`loginAs: "user"`)
- Admin (`loginAs: "admin"`)
- Department admin (`loginAs: "department_admin"` + `departmentCode`)

Registration supports:
- `POST /api/auth/register` (citizen)
- `POST /api/auth/register-admin`
- `POST /api/auth/register-department-admin`

## Security notes (production)

- Rotate `JWT_SECRET`, use HTTPS, tighten CORS to real origins.
- Tune rate limits (`RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`).
- Scan uploads (antivirus / content policy) beyond MIME checks.
- The built-in “AI” uses **heuristics** + optional microservice — swap in real models behind `AI_SERVICE_URL` as needed.

## Scripts summary

| Location | Command | Purpose |
|----------|---------|---------|
| `backend` | `npm run dev` | API + sockets (nodemon) |
| `backend` | `npm run seed` | Departments + admin |
| `frontend` | `npm run dev` | Vite dev server |
| `ai-service` | `uvicorn main:app --reload --port 8000` | Optional analyzer |

If port `5000` is occupied, backend now retries the next ports automatically (configurable with `PORT_RETRY_COUNT`).

---

Built as a learning-friendly, extensible baseline for **VeriClaim** smart complaint management.
