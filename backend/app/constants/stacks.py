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
        "Gestion de estado",
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
        "Indices y performance",
        "Normalizacion",
        "Transacciones",
        "Agregaciones y agrupamiento",
    ],
    "Java": [
        "General / Mixto",
        "OOP (herencia, interfaces, polimorfismo)",
        "Collections y Generics",
        "Exceptions",
        "Concurrencia basica (threads, synchronized)",
        "Spring basico",
    ],
}

VALID_TOPICS = {stack: set(topics) for stack, topics in TOPICS.items()}
