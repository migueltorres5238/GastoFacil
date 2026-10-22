# GastoFácil (Next.js)

Sistema web de control de gastos personales para estudiantes, construido con Next.js 15 a partir de la SRS (ISO/IEC/IEEE 29148) v2.0.

## Requisitos

- Node.js 18.18 o superior (recomendado 20 o 22)
- npm

## Cómo correrlo

```bash
npm install
npm run start
```

`npm run start` compila el proyecto automáticamente (script `prestart` → `next build`) y luego levanta el servidor en **http://localhost:8501**.

Para desarrollo con recarga en caliente: `npm run dev`.
Pruebas unitarias de la lógica de negocio: `npm test`.

## Funciones (alcance de la SRS)

1. Registro e inicio de sesión con contraseña cifrada (bcrypt) y sesión en cookie httpOnly.
2. Alta, edición y eliminación de ingresos y gastos (monto, fecha, categoría, descripción).
3. Categorías predefinidas (Comida, Transporte, Escuela, Entretenimiento, Otros) y personalizadas.
4. Presupuesto mensual por categoría con aviso al 80 % y al 100 %.
5. Panel con gráficas: gasto por categoría, evolución de 6 meses y saldo acumulado.
6. Exportación de movimientos a CSV (por mes o todos).

## Arquitectura en capas

| Capa | Archivos |
|---|---|
| Presentación | `app/` (páginas) y `components/` |
| API | `app/api/**/route.js` |
| Lógica de negocio | `lib/finance.js`, `lib/auth.js` |
| Acceso a datos | `lib/db.js` |
| Almacenamiento | `data/gastofacil.json` (se crea solo al registrar el primer usuario) |

Los datos se guardan únicamente en la computadora del usuario. El almacenamiento es un archivo JSON local para no depender de módulos nativos; como todo el acceso pasa por `lib/db.js`, se puede cambiar a SQLite sin tocar la lógica.

Para borrar todos los datos, elimina la carpeta `data/`.
