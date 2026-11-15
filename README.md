# Diario de Estudio

Web sencilla para apuntar tus sesiones de estudio y motivarte viendo tu racha de días seguidos.

## Qué hace
- Registrar sesiones: fecha, tema y minutos.
- Racha actual y mejor racha.
- Minutos de esta semana, días estudiados este mes y mapa de calor de las últimas semanas.
- Objetivo semanal de minutos, con barra de progreso.

Los datos se guardan solo en tu navegador (`localStorage`).

## Cómo usarlo
Descarga el repositorio y abre `index.html` con doble clic. No hace falta instalar nada ni usar un servidor.

## Tests
Con [Node.js](https://nodejs.org) instalado:

```
node --test
```

## Estructura
| Archivo o carpeta | Contenido |
|---|---|
| `index.html`, `styles.css` | Página y estilos |
| `logic.js` | Cálculos (rachas, semanas, objetivo), sin depender de la interfaz |
| `app.js` | Interfaz y datos guardados |
| `tests/` | Tests de `logic.js` |
| `specs/` | Especificación de cada funcionalidad (Spec-Driven Development) |
| `docs/constitution.md` | Principios del proyecto |

HTML, CSS y JavaScript puros: sin frameworks, dependencias ni paso de build.
