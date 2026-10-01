ROLES = {
    "Frontend": ["HTML/CSS", "JavaScript", "React"],
    "Backend": ["Python", "SQL", "Java"],
}

VALID_STACKS = sorted({stack for stacks in ROLES.values() for stack in stacks})

VALID_LEVELS = ["Básico", "Intermedio", "Avanzado"]

# Hand-curated topics per stack, used to scope the content of AI-generated
# questions. The first entry is always a catch-all "General / Mixto" that
# lets the AI choose freely within the stack.
TOPICS = {
    "HTML/CSS": [
        "General / Mixto",
        "Selectores y especificidad",
        "Flexbox y Grid",
        "Responsive design",
        "Accesibilidad (a11y)",
        "Box model y layout",
    ],
    "JavaScript": [
        "General / Mixto",
        "Closures y scope",
        "Asincronía (promises, async/await)",
        "Prototipos y clases",
        "Manejo de errores",
        "Estructuras de datos y arrays",
    ],
    "React": [
        "General / Mixto",
        "Hooks (useState, useEffect, custom hooks)",
        "Gestión de estado",
        "Renderizado y performance",
        "Componentes y props",
        "Formularios y eventos",
    ],
    "Python": [
        "General / Mixto",
        "Estructuras de datos",
        "POO en Python",
        "Manejo de excepciones",
        "Decoradores y generadores",
        "Concurrencia (threading/asyncio)",
    ],
    "SQL": [
        "General / Mixto",
        "Joins y subqueries",
        "Índices y performance",
        "Normalización",
        "Transacciones",
        "Agregaciones y agrupamiento",
    ],
    "Java": [
        "General / Mixto",
        "OOP (herencia, interfaces, polimorfismo)",
        "Collections y Generics",
        "Exceptions",
        "Concurrencia básica (threads, synchronized)",
        "Spring básico",
    ],
}

VALID_TOPICS = {stack: set(topics) for stack, topics in TOPICS.items()}

# Names these topics had before their accents were fixed. A browser tab opened
# before that change still sends the old name; mapping it keeps the chosen
# topic instead of silently falling back to the catch-all.
LEGACY_TOPIC_ALIASES = {
    "React": {"Gestion de estado": "Gestión de estado"},
    "SQL": {
        "Indices y performance": "Índices y performance",
        "Normalizacion": "Normalización",
    },
    "Java": {
        "Concurrencia basica (threads, synchronized)": "Concurrencia básica (threads, synchronized)",
        "Spring basico": "Spring básico",
    },
}
