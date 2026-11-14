# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- Debajo de la racha: mejor racha, total de esta semana ("🕒 Esta semana: 4 h 28 min") y días estudiados este mes ("📅 Este mes: N días").
- `formatMinutes()` muestra los minutos como "X h Y min". Solo afecta a cómo se ve: se siguen guardando minutos.
- **Mapa de calor (spec 001, implementada):** sección "Últimas 12 semanas" entre la racha y el formulario.
  - 5 niveles de azul, punto en hoy, contorno en el día seleccionado, leyenda y línea de detalle.
  - Teclado con flechas (rejilla ARIA con `aria-activedescendant`).
  - Spec, plan y tareas en `specs/001-heat-map/`.
- Estructura:
  - `logic.js`: lógica pura (fechas, formato, estadísticas y mapa) con hoy como parámetro.
  - `app.js`: interfaz; `todayKey()` es lo único que lee el reloj.
  - `tests/`: 47 tests con `node --test`.
  - `docs/constitution.md`: 6 principios.
- Datos en localStorage. Si no se puede guardar, se avisa en el formulario y no se borra lo escrito; con error de validación, el cursor va al campo que falla.
- Diseño (skill frontend-design): hoja de cuaderno de cuadrícula con margen rojo, tinta azul `#1B3A8C` y fosforito `#FFE94D` animado bajo el número de la racha (única animación; se desactiva con reduced-motion). Fuentes del sistema: Rockwell (slab) en títulos y cifras.
- Kit SDD (curso de desarrollo con IA): skill `sdd` y comandos `/sdd-*` para Claude Code. El flujo también está explicado en `AGENTS.md`, para seguirlo con cualquier IA.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Las estadísticas se calculan, no se guardan: no cambia el formato de los datos y nunca se desfasan.
- Semana de lunes a domingo (lo habitual en España). "Este mes" = mes natural, cuenta días y no sesiones, como la racha.
- Sin fuentes externas, para que funcione sin internet. El naranja `#F26B1D` con texto blanco no llegaba al contraste mínimo (3:1); se cambió a tinta azul (10:1).
- Mapa de calor: minutos del día redondeados (nivel, leyenda y detalle coinciden). `formatDate` sin `Intl` (listas fijas) para que los tests no dependan del entorno: comprobado idéntico en 730 días. Diferencia aceptada con datos dañados: la racha, "Este mes" y "Esta semana" pueden contar sesiones que el mapa ignora.
- El proyecto debe poder trabajarse con cualquier IA: todo lo necesario está en `AGENTS.md`, `docs/` y `specs/`; las skills, los comandos y los MCP son atajos.
- Skills en `.agents/skills/` (la leen Codex, Cursor, Gemini CLI, OpenCode, Windsurf y el agente de Copilot) con copia idéntica en `.claude/skills/` (Claude Code solo lee esa). Copias reales, no enlaces: los enlaces de Windows se rompen al clonar.
## Aprendizajes y errores a evitar
- `AGENTS.md` llegó a indicar una clave de localStorage distinta de la del código. Se corrigió con el código como fuente de verdad: cambiar la clave habría hecho perder las sesiones guardadas.
- De OpenCode (curso) a Claude Code:
  - comandos en `.claude/commands/` y MCP en `.mcp.json`;
  - sin `agent: plan`/`build` (el agente `Plan` de Claude Code no puede escribir archivos; para revisar sin cambios, modo Plan con `Shift+Tab`);
  - la skill se llama `SKILL.md`, el frontmatter empieza por `---` y los argumentos empiezan en `$0` (OpenCode: `$1`).
- MCP: chrome-devtools (en Windows, `npx` va con `cmd /c`), context7, github, figma y supabase. Las claves nunca van en el archivo: se leen de variables de entorno (`CONTEXT7_API_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`). Figma y Supabase se autorizan desde `/mcp`. Las variables nuevas solo se leen al reiniciar el editor.
- Chrome DevTools MCP: usa su propio perfil de Chrome y a veces se reinicia entre llamadas; agrupar los pasos en pocas llamadas (`evaluate_script`). La captura `fullPage` puede salir sin el fosforito (reinicia la animación): no es un fallo.
- Capturas con Edge sin ventana (`--headless`): no baja de ~492 px de ancho; para ver el móvil, meter la página en un iframe de 375 px. Usar `--virtual-time-budget` para que terminen las animaciones.
## Próximos pasos
- Flujo SDD: constitución → spec → clarificación → plan → tareas → implementación (una tarea cada vez, tests primero) → validación.
- Pendientes detectados en la verificación del mapa (fuera de su alcance):
  - con el texto al 200 %, la línea "Esta semana" se sale 11 px a 375 px;
  - en modo de alto contraste, el botón "Guardar sesión" pierde el borde.
