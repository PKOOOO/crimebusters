import { useSelector } from 'react-redux';

// Resuelve el fondo a renderizar con prioridad:
//   1) override de la partida en curso (transitorio, no persiste en la actividad)
//   2) fondo configurado en la actividad
//   3) { src: null } -> el consumidor aplica su fallback por defecto
export function useMatchBackground() {
    const matchOverride = useSelector(state => state.multiplayer?.settings?.backgroundImage);
    const activityBg = useSelector(state => state.settings.customizations.backgroundImage);
    if (matchOverride) {
        // Respetamos showGame de la actividad: si la actividad declara que no quiere
        // fondo personalizado en la pantalla de juego (p.ej. FROGGY_JUMPS usa su
        // propio fondo de agua), el override de la partida tampoco debe colarse ahí.
        return { src: matchOverride, showGame: activityBg?.showGame ?? true };
    }
    return activityBg ?? { src: null, showGame: true };
}
