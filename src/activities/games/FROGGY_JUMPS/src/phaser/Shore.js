/**
 * Shore – La isla/orilla final ("suelo") a la que salta la rana al terminar.
 *
 * Centraliza TODA la gestión del sprite de la isla para evitar disonancias de
 * posicionamiento entre las distintas escenas (single-player, player y host de
 * multijugador). El componente posee un único sprite persistente y expone
 * métodos de intención en vez de obligar a cada escena a recalcular posiciones.
 *
 * Modelo de posición:
 *   - La isla se ancla al nenúfar correcto de la pregunta (anchorKey).
 *   - Posición canónica: (col.headX, col.headY - scene.lastHeight - SHORE_GAP).
 *   - Sobre esa base se aplican offsets extra (en unidades base, sin escalar)
 *     que se reescalan en cada resize: el "avance" del multijugador y el
 *     desplazamiento tras un fallo lateral en la penúltima pregunta.
 */

const PAD_BASE_SIZE = 200;
// Hueco fijo entre la cabeza del nenúfar y la base de la isla (unidades base).
const SHORE_GAP = 25;
// Caída inicial de la isla al aparecer "a lo lejos" en la penúltima pregunta.
const FALL_DISTANCE = 1000;
const FALL_DURATION = 1000;
// Deslizamiento suave de la isla hasta su posición final en single-player.
// Punto único de ajuste si la llegada necesita afinarse.
const SETTLE_DURATION = 700;

export default class Shore {
    /**
     * @param {Phaser.Scene} scene - Escena que aloja la isla (lee scene.add,
     *   scene.tweens, scene.columns, scene.lastHeight, scene.currentAnswers...).
     */
    constructor(scene) {
        this.scene = scene;
        this.sprite = null;
        // Clave (A/B/C) del nenúfar correcto al que está anclada la isla.
        this.anchorKey = null;
        // Offsets extra respecto a la posición canónica, en unidades base.
        this._offsetX = 0;
        this._offsetY = 0;
    }

    static create(scene) {
        return new Shore(scene);
    }

    get exists() {
        return !!this.sprite;
    }

    /**
     * Penúltima pregunta: crea la isla "a lo lejos" sobre el nenúfar correcto
     * y la hace caer desde arriba.
     */
    appearInDistance({ scale }) {
        const correctKey = this._findCorrectKey();
        if (!correctKey) return;

        this.anchorKey = correctKey;
        this._offsetX = 0;
        this._offsetY = 0;

        const { x, y } = this._targetFor(correctKey, scale);
        this._createSpriteAt(x, y - FALL_DISTANCE, scale);
        this.scene.tweens.add({
            targets: this.sprite,
            y,
            duration: FALL_DURATION,
        });
    }

    /**
     * Última pregunta: lleva la isla a su posición final sobre el nenúfar
     * correcto.
     *
     * @param {number}  scale            - Factor de escala actual.
     * @param {boolean} useAdvanceOffsets- true en multijugador (player/host),
     *   donde la rana resetea a posición canónica entre preguntas: la isla se
     *   aparta del lado de la respuesta correcta y se baja para no taparla.
     *   false en single-player: la isla queda justo sobre el nenúfar correcto
     *   y la rana le salta encima en la animación de victoria.
     * @param {boolean} animate          - true para deslizar suavemente desde
     *   la posición previa (single-player); false para colocarla al instante.
     */
    settleAt({ scale, useAdvanceOffsets = false, animate = false }) {
        const correctKey = this._findCorrectKey();
        if (!correctKey) return;

        this.anchorKey = correctKey;
        if (useAdvanceOffsets) {
            const { offsetX, offsetY } = this._advanceOffsetsBase(correctKey);
            this._offsetX = offsetX;
            this._offsetY = offsetY;
        } else {
            this._offsetX = 0;
            this._offsetY = 0;
        }

        const { x, y } = this._targetFor(correctKey, scale);

        // Si la isla no existe (p.ej. tras goToQuestion en multijugador, que la
        // destruye, o un arranque posicionado en la última pregunta) se crea ya
        // colocada en su sitio.
        if (!this.sprite) {
            this._createSpriteAt(x, y, scale);
            return;
        }

        this.scene.tweens.killTweensOf(this.sprite);
        if (animate) {
            this.scene.tweens.add({
                targets: this.sprite,
                x,
                y,
                duration: SETTLE_DURATION,
                ease: "Sine.easeInOut",
            });
        } else {
            this.sprite.setScale(scale).setPosition(x, y);
        }
    }

    /**
     * Penúltima pregunta con fallo lateral (A/C): aparta y sube la isla para
     * que no tape el nenúfar donde la rana reaparece.
     */
    applyLateralMissOffset({ scale }) {
        if (!this.sprite || !this.anchorKey) return;
        this._offsetX = PAD_BASE_SIZE + 8;
        this._offsetY = -(PAD_BASE_SIZE / 2 + 25);
        this.reposition({ scale });
    }

    /**
     * Recoloca la isla tras un resize, reanclándola al nenúfar correcto y
     * reaplicando los offsets vigentes (reescalados).
     */
    reposition({ scale }) {
        if (!this.sprite || !this.anchorKey) return;
        const col = this.scene.columns?.[this.anchorKey];
        if (!col) return;
        const { x, y } = this._targetFor(this.anchorKey, scale);
        this.sprite.setScale(scale).setPosition(x, y);
    }

    /**
     * Victoria alcanzada vía respawn tras un fallo: coloca la isla justo encima
     * de la rana para la animación de saltos finales. No queda anclada a una
     * columna (la posición es relativa a la rana), por lo que un resize no la
     * recoloca.
     */
    placeAtFrog({ x, y, scale }) {
        this.anchorKey = null;
        this._offsetX = 0;
        this._offsetY = 0;
        this._createSpriteAt(x, y - this.scene.lastHeight - SHORE_GAP, scale);
    }

    destroy() {
        this._destroySprite();
        this.anchorKey = null;
        this._offsetX = 0;
        this._offsetY = 0;
    }

    // ─── Internos ────────────────────────────────────────────────────

    _findCorrectKey() {
        const answers = this.scene.currentAnswers;
        const correct = this.scene.currentCorrectAnswers || [];
        if (!answers) return undefined;
        return Object.keys(answers).find((k) => {
            const answer = answers[k];
            return answer && correct.includes(answer.id);
        });
    }

    /**
     * Offsets de "avance" (multijugador) en unidades base: suben/bajan y
     * apartan la isla del lado de la respuesta correcta.
     */
    _advanceOffsetsBase(correctKey) {
        const sideOffset = PAD_BASE_SIZE + 15;
        return {
            offsetX: correctKey === "C" ? -sideOffset : sideOffset,
            offsetY: PAD_BASE_SIZE / 2,
        };
    }

    /**
     * Posición absoluta de la isla para una columna dada, aplicando los offsets
     * vigentes reescalados.
     */
    _targetFor(key, scale) {
        const col = this.scene.columns[key];
        return {
            x: col.headX + this._offsetX * scale,
            y: col.headY - this.scene.lastHeight - SHORE_GAP + this._offsetY * scale,
        };
    }

    _createSpriteAt(x, y, scale) {
        this._destroySprite();
        this.sprite = this.scene.add
            .sprite(x, y, "suelo")
            .setDepth(5)
            .setScale(scale)
            .setOrigin(0.5, 1);
    }

    _destroySprite() {
        if (this.sprite) {
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
    }
}
