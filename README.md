# InterviewKit

> Practica entrevistas técnicas reales con IA — preguntas de código, feedback inmediato y cards para repasar.

🌐 **[interviewkit.dev](https://interviewkit.dev)** · [Repositorio](https://github.com/albertsp/interview-prep-app)

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## ¿Por qué existe esto?

Mientras estudiaba programación y me preparaba para mi primer empleo, me di cuenta de que practicar entrevistas técnicas solo con teoría no funciona. Necesitaba preguntas reales de código, alguien que me dijera exactamente qué había fallado, y una forma de repasar lo aprendido.

No encontré ninguna herramienta que hiciera las tres cosas a la vez sin costar dinero, así que la construí.

**InterviewKit** genera 5 preguntas de código adaptadas a tu stack y nivel, evalúa tus respuestas con IA y guarda cada concepto como una card Q&A para repasar cuando quieras.

---

## Funcionalidades

| | |
|---|---|
| ![Session setup](frontend/public/screenshots/session-setup.png) | ![Dashboard](frontend/public/screenshots/dashboard-cards.png) |
| ![Stats](frontend/public/screenshots/stats-overview.png) | ![Card detail](frontend/public/screenshots/card-detail.png) |

- **Simulador de entrevista** — Elige rol (Frontend/Backend), tecnología y nivel. La IA genera 5 preguntas de código adaptadas, no definiciones teóricas.
- **Feedback real** — Cada respuesta es evaluada con explicación de qué estuvo bien, qué falló y cuál es la solución correcta.
- **Cards Q&A** — Cada pregunta se convierte en una card de estudio con concepto, definición, ejemplo de código y casos de uso.
- **Dashboard** — Busca y filtra todas tus cards por tecnología o concepto.
- **Estadísticas** — Gráficos de resultados por sesión, tags más practicados y progreso en el tiempo.
- **Sistema de XP y niveles** — Ganas experiencia con cada sesión según la dificultad de tus respuestas.
- **Autenticación** — Login con Google, GitHub o email/contraseña.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 + React 19 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Animaciones | Framer Motion |
| Backend | Flask 3 (Python) |
| Base de datos | PostgreSQL 16 + SQLAlchemy |
| Migraciones | Alembic (Flask-Migrate) |
| Auth | JWT en httpOnly cookies + OAuth 2.0 (Authlib) |
| IA | Groq API (Llama 3.3 70B) |
| Deploy | Vercel (frontend) + Fly.io (backend) |

---

## Decisiones técnicas

**¿Por qué Flask y no Django o FastAPI?**
Flask me daba control total sobre la estructura sin imponer patrones. Para una API REST de este tamaño, Django hubiera sido excesivo y FastAPI habría requerido aprender async desde cero simultáneamente.

**¿Por qué Groq y no OpenAI?**
Groq tiene un free tier generoso con latencia muy baja (~500ms vs 2-3s de OpenAI). Para un proyecto donde el usuario espera las preguntas en tiempo real, la velocidad importa. El modelo Llama 3.3 70B es suficientemente capaz para generar preguntas técnicas de calidad.

**Rate limiting en dos capas**
El free tier de Groq tiene un presupuesto compartido para toda la app. Implementé dos límites: por usuario (evita que una cuenta lo agote) y uno global (protege el presupuesto real). Si solo hubiera limitado por usuario, un ataque coordinado podría igualmente agotar la cuota.

**JWT en httpOnly cookies para OAuth**
El flujo OAuth redirige desde el backend al frontend. En vez de exponer el token en la URL (visible en historial del navegador y logs del servidor), el backend establece directamente una cookie httpOnly. El frontend nunca toca el token — lo envía automáticamente en cada request via `credentials: include`.

**Mitigación de prompt injection**
Las respuestas de los usuarios van directamente al modelo de IA para evaluación. Envolví el input del usuario con delimitadores `###ANSWER_START###` / `###ANSWER_END###` e incluí instrucciones explícitas en el system prompt para tratar ese bloque como datos, no como instrucciones.

---

## Retos y lo que aprendí

**El problema N+1 en las estadísticas**
La primera versión de `/me/stats` hacía una query por cada sesión para obtener sus preguntas. Con pocos datos no se nota, pero es un bug de rendimiento que escala fatal. Lo detecté analizando las queries generadas por SQLAlchemy y lo resolví con un `JOIN` que trae todo en una sola query. También añadí índices de clave foránea que faltaban.

**OAuth es más complejo de lo que parece**
Implementar login social con Google y GitHub parecía sencillo hasta que llegué a los detalles: cookies cross-origin requieren `SameSite=None; Secure`, el token JWT no puede viajar en la URL (queda en el historial del navegador), y hay que decidir qué pasa cuando alguien intenta entrar con Google usando un email que ya tiene cuenta con contraseña. Cada decisión tiene implicaciones de seguridad.

**Gestionar el estado global de autenticación en Next.js**
Coordinar el estado de sesión entre el servidor (cookie httpOnly) y el cliente (React Context) con el App Router de Next.js 15 fue el reto frontend más difícil. El layout protegido tiene que manejar el estado de carga correctamente para no mostrar contenido protegido antes de verificar la sesión.

**Diseñar los prompts de IA**
La calidad de las preguntas generadas depende completamente del prompt. Las primeras versiones generaban preguntas demasiado teóricas ("¿Qué es un closure?"). Iterar el system prompt para forzar preguntas de código concretas fue un proceso de prueba y error que no esperaba que llevara tanto tiempo.

---

## Tests

```bash
# Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pytest

# Frontend
cd frontend
npm test
```

El backend tiene tests de integración para autenticación, modelos, OAuth y el flujo de sesiones. El frontend tiene tests del contexto de autenticación con Vitest.

---

## Instalación y desarrollo local

### Prerrequisitos

- Node.js v18+
- Python 3.12+
- Docker Desktop

### Setup

```bash
git clone https://github.com/albertsp/interview-prep-app.git
cd interview-prep-app

# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Edita con tus claves

# Base de datos
cd ..
docker compose up -d

# Migraciones
cd backend && flask db upgrade

# Frontend
cd ../frontend
npm install
cp .env.example .env            # NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Arrancar el proyecto

```bash
# Terminal 1 — Base de datos
docker compose up -d

# Terminal 2 — Backend
cd backend && flask run          # http://localhost:5000

# Terminal 3 — Frontend
cd frontend && npm run dev       # http://localhost:3000
```

### Variables de entorno

**`backend/.env`**
```
GROQ_API_KEY=
JWT_SECRET_KEY=
DATABASE_URL=postgresql://admin:admin@localhost:5432/interview_prep
FLASK_ENV=development
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env`**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Estructura del proyecto

```
interview-prep-app/
├── backend/
│   ├── app/
│   │   ├── models/          # User, Session, Question, Card, OAuthAccount
│   │   ├── routes/          # auth, oauth, sessions, cards, user, stacks
│   │   ├── services/        # Lógica de negocio e integración con Groq
│   │   ├── constants/       # Configuración de gamificación
│   │   ├── __init__.py      # Fábrica de la app Flask + OAuth init
│   │   └── config.py        # Configuración desde variables de entorno
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   └── (app)/
│   │       ├── page.jsx               # Landing page
│   │       ├── login/
│   │       ├── register/
│   │       ├── auth/callback/         # OAuth callback handler
│   │       └── (protected)/
│   │           ├── dashboard/
│   │           ├── session/
│   │           ├── stats/
│   │           └── profile/
│   ├── src/
│   │   ├── components/
│   │   ├── context/                   # AuthContext
│   │   └── services/                  # Llamadas a la API
│   └── public/
├── docker-compose.yml
└── README.md
```

---

## Deploy

**Backend — Fly.io**

```bash
cd backend && fly deploy
```

Las migraciones se ejecutan automáticamente en cada deploy (`release_command` en `fly.toml`). Las variables de entorno se configuran con `fly secrets set`.

**Frontend — Vercel**

Push a `main` despliega automáticamente. Las variables de entorno se configuran en el dashboard de Vercel.
