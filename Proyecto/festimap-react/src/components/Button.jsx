// COMPONENT: Button
// Search token: COMPONENT:Button
// Presentational button wrapper used across the app.
// Props:
//  - `as`: element or component to render (default: "button").
//  - `className`: extra class names to append.
//  - `...props`: forwarded props (onClick, type, etc.).
// Useful to render semantic elements while keeping consistent button styles.
// src/components/Button.jsx
// COMPONENT: Button
// Token de búsqueda: COMPONENT:Button
// Componente presentacional pequeño para botones reutilizables.
// Props:
//  - `as`: elemento o componente para renderizar (por defecto: "button").
//  - `className`: clases adicionales.
// Buscar `COMPONENT:Button` para localizar este componente rápidamente.
export default function Button({ as: Tag = "button", className = "", ...props }) {
    return <Tag className={`btn btn--primary ${className}`} {...props} />;
}

