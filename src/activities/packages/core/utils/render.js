import { createRoot } from 'react-dom/client'

export function render(container, element) {
    const root = createRoot(container)
    root.render(element)
}