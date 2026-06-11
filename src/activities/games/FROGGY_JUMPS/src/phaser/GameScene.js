import Phaser from "phaser";
import LilyColumn from "./LilyColumn";
import Shore from "./Shore";
import { shuffle } from "@educaplay/core";

// Constants
const DURATIONS = {
    JUMP: 750,
    ANSWER_CASCADE: 200,
    SINKING: 1500,
    HOVER_SCALE: 100,
    VICTORY_JUMP: 750,
};

const SCALES = {
    PLATFORM_BASE: 0.1953125,
    FROG_BASE: 0.53511705685,
};

const OFFSETS = {
    X: 215,
    SHADOW: 10,
};

const BANK = {
    VISIBLE_OFFSET_Y: 5,
    HIDDEN_OFFSET_Y: 22,
};

// Sonidos que delatan el resultado (acierto/fallo) y que silenciamos en
// multijugador (player). Aunque la animación visual sí se reproduzca en el
// dispositivo del jugador, el audio podría dar pistas a jugadores cercanos
// que todavía no hayan respondido.
const HINT_SOUNDS_MULTIPLAYER = new Set([
    "saltoOk",
    "saltoWrong",
    "coin",
    "error",
    "hundimiento",
    "burbujas",
]);

const LAYOUT = {
    FROG_PAD_BOTTOM_MARGIN: {
        LANDSCAPE: 16,
        PORTRAIT: 48,
    },
};

const FONTS = {
    UI: 'Nunito, "Segoe UI", Segoe, Helvetica, Arial, sans-serif',
};

const BADGE = {
    FILL: 0x69bb1d,
    SHADOW: 0x070e00,
};

const PAD_BASE_SIZE = 200;
const SCALE_TUNING = 0.95;

const PAD_SPACING = 230; // Vertical distance between pads in a column (base units)
const PAD_COUNT = 6; // Pads per column (covers main + extension area)
const SIDE_COLUMNS = 2; // Extra deco columns on each side beyond A/B/C

/**
 * Compute the base Y (head position) for a column at a given distance from center.
 * dist=0 (B): frogY - padSpacing (one full spacing up)
 * |dist|>=1:  frogY - |dist| * padSpacing / 2 (inverted triangle / brick pattern)
 *
 * This produces the brick-wall zigzag:
 *   dist=±1 (A/C): frogY - ps/2
 *   dist=±2:       frogY - ps   (same as B)
 *   dist=±3:       frogY - 1.5ps
 */
function getColumnBaseY(frogY, dist, padSpacing) {
    if (dist === 0) return frogY - padSpacing;
    return frogY - Math.abs(dist) * padSpacing / 2;
}

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });

        // Game state
        this.moving = false;
        this.finish = false;
        this.currentQuestionIndex = 0;
        this.scalePlatform = 1;
        this.lastHeight = undefined;

        // Callbacks
        this.onAnswer = null;
        this.onAnimatingChange = null;
        this.onBankControl = null;
        this.soundEnabled = true;

        // En multijugador (player) la escena no avanza de pregunta por su cuenta;
        // el servidor es la única fuente de verdad y lo hace vía goToQuestion.
        this.isMultiplayerPlayer = false;

        this._paused = false;
        // Se activa mientras el menú de Settings está abierto para que un clic
        // sobre la zona oscurecida del overlay no atraviese hasta el canvas y
        // dispare una respuesta en el nenúfar que haya debajo.
        this._uiBlocked = false;

        // Column-based layout
        this.frogPad = null; // { sprite, shadow }
        this.columns = null; // { A, B, C } shortcut refs
        this.decoMap = new Map(); // absolute xMul → LilyColumn (deco columns)
        this.centerXMul = 0; // absolute xMul where the frog (column B) is
        this._pendingNearDeco = null; // { xMul, col } pre-created before lateral jump

        // Shore / finish line (componente que gestiona la isla final)
        this.shore = null;
        // Columna/coords objetivo del salto en curso. Necesario para que el
        // resize pueda re-anclar la rana cuando un tween de salto se queda
        // apuntando a coordenadas obsoletas tras girar el dispositivo.
        this._jumpTargetKey = null;

        // Game-over flag (set externally by framework when lives reach 0)
        this._markedGameOver = false;
        this._onGameOverComplete = null;
    }


    init(data) {
        this.questions = data.questions || [];
        this.onAnswer = data.onAnswer;
        this.onAnimatingChange = data.onAnimatingChange;
        this.onQuestionStart = data.onQuestionStart;
        this.onBankControl = data.onBankControl;
        this.soundEnabled = data.soundEnabled !== false;
        this.randomizeAnswers = data.randomizeAnswers !== false;
        this.isMultiplayerPlayer = !!data.isMultiplayerPlayer;

        // Reset state
        this.ready = false;
        this.moving = false;
        this.finish = false;
        this.currentQuestionIndex = Number.isInteger(data.startIndex) ? data.startIndex : 0;
        this.lastHeight = undefined;
        this.shore = Shore.create(this);
        this._markedGameOver = false;
        this._onGameOverComplete = null;
        this.currentCorrectAnswers = [];
        this._pendingAnswerKey = null;
        this._jumpTargetKey = null;

        // Estado de coalescing del resize. _resizeRAF mantiene el handle del
        // requestAnimationFrame pendiente; _lastApplied* guarda las dimensiones
        // con las que ya se aplicó layout, para hacer no-op si llegan eventos
        // redundantes (ResizeObserver dispara varias veces por rotación) y
        // para detectar drift en la revalidación post-resize.
        this._resizeRAF = null;
        this._revalidationRAF = null;
        this._lastAppliedWidth = null;
        this._lastAppliedHeight = null;
        this._lastAppliedDpr = null;

        this.answerOrder = {};
    }

    create() {
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        // HiDPI: aplicar zoom de cámara y forzar el tamaño físico de la cámara
        // para cubrir el caso en que la escena arranca después del primer
        // resize global (si no, ese frame se ve recortado y los hit-rects no
        // coinciden con la zona visible → "no hay interacción").
        this.applyHiDPICamera();

        this.createBackground();
        this.setupAudio();
        // Sincroniza el mute global del SoundManager con el flag inicial. Se
        // actualiza luego desde React via setSoundEnabled() al cambiar el toggle
        this.sound.mute = !this.soundEnabled;
        this.setupKeyboard();
        this.createGameElements();
        this.setupResizeHandler();
        this.startQuestion();

        // Mark scene as ready so external callers (React) can safely
        // invoke methods like goToQuestion that depend on columns/state
        this.ready = true;
    }

    // Toggle desde React. Mantiene el flag local (cubre el guard de playSound)
    // y silencia/reactiva todo lo que pase por this.sound
    setSoundEnabled(enabled) {
        this.soundEnabled = !!enabled;
        if (this.sound) {
            this.sound.mute = !this.soundEnabled;
        }
    }

    applyHiDPICamera() {
        const dpr = this.registry.get("dpr") || 1;
        if (dpr <= 1) return;
        if (!this.cameras || !this.cameras.main) return;
        const w = this.scale.width;
        const h = this.scale.height;
        if (w <= 0 || h <= 0) return;
        const physW = Math.floor(w * dpr);
        const physH = Math.floor(h * dpr);

        // Re-sync defensivo del canvas/renderer en píxeles físicos. En
        // dispositivos móviles al rotar se han observado frames donde el
        // listener de resize de PhaserGame.jsx aún no había aplicado el
        // tamaño nuevo cuando la cámara ya estaba leyendo dimensiones nuevas
        // → la cámara queda calibrada para un canvas con dimensiones físicas
        // antiguas y todo el mundo del juego cae fuera del viewport.
        const game = this.game;
        if (game?.canvas) {
            if (game.canvas.width !== physW) game.canvas.width = physW;
            if (game.canvas.height !== physH) game.canvas.height = physH;
            game.canvas.style.width = w + "px";
            game.canvas.style.height = h + "px";
        }
        if (game?.renderer && typeof game.renderer.resize === "function") {
            game.renderer.resize(physW, physH);
        }

        // El renderer está en píxeles físicos. El mundo del juego sigue en
        // píxeles CSS, así que compensamos con setZoom(dpr).  El tamaño de
        // la cámara debe coincidir con el renderer físico para que el
        // viewport WebGL cubra todo el canvas; si no, los sprites se ven
        // pero los hit-rects de input quedan desplazados.
        this.cameras.main.setZoom(dpr);
        this.cameras.main.setSize(physW, physH);
    }

    // ─── Background ──────────────────────────────────────────────────

    createBackground() {
        this.background = null;
    }

    // ─── Audio ───────────────────────────────────────────────────────

    setupAudio() {
        // Siempre instanciamos los sonidos aunque arranquemos en mute: el
        // jugador puede reactivar el sonido durante la partida y necesitamos
        // que this.sounds esté listo. El silencio lo gestiona this.sound.mute
        this.sounds = {
            salto: this.sound.add("saltoAudio"),
            over: this.sound.add("overAudio"),
            croar: this.sound.add("croarAudio"),
            intro: this.sound.add("introAudio"),
            pressOk: this.sound.add("pressOkAudio"),
            pressWrong: this.sound.add("pressWrongAudio"),
            saltoOk: this.sound.add("saltoContactOkAudio"),
            saltoWrong: this.sound.add("saltoContactWrongAudio"),
            hundimiento: this.sound.add("hundimientoContactAudio"),
            burbujas: this.sound.add("burbujasAudio"),
            error: this.sound.add("errorAudio"),
            coin: this.sound.add("coin"),
            gameWin: this.sound.add("game_Win"),
            gameOver: this.sound.add("game_Over"),
        };
    }

    // ─── Keyboard ────────────────────────────────────────────────────

    setupKeyboard() {
        this.keys = this.input.keyboard.addKeys("A,B,C,LEFT,UP,RIGHT");

        this.keys.A.on("up", () => this.handleAnswer("A"));
        this.keys.LEFT.on("up", () => this.handleAnswer("A"));
        this.keys.B.on("up", () => this.handleAnswer("B"));
        this.keys.UP.on("up", () => this.handleAnswer("B"));
        this.keys.C.on("up", () => this.handleAnswer("C"));
        this.keys.RIGHT.on("up", () => this.handleAnswer("C"));
    }

    // ─── Game elements ───────────────────────────────────────────────

    createGameElements() {
        const centerX = this.scale.width / 2;
        const frogY = this.getFrogBlockY(this.scale.width, this.scale.height, 1);

        // Frog sprite
        this.rana = this.add
            .sprite(centerX, frogY, "rana")
            .setScale(SCALES.FROG_BASE)
            .setDepth(100)
            .setOrigin(0.5, 0.38461538461);

        // Frog pad (standalone, below column B)
        this.frogPad = this._createPad(centerX, frogY, 1);

        // Three main columns
        this.centerXMul = 0;
        this.columns = {
            A: LilyColumn.create(this, centerX - OFFSETS.X, frogY - PAD_SPACING / 2, PAD_SPACING, PAD_COUNT, 1),
            B: LilyColumn.create(this, centerX, frogY - PAD_SPACING, PAD_SPACING, PAD_COUNT, 1),
            C: LilyColumn.create(this, centerX + OFFSETS.X, frogY - PAD_SPACING / 2, PAD_SPACING, PAD_COUNT, 1),
        };

        // Decorative columns
        this._createDecoColumns(centerX, frogY);

        // Camera follows frog
        this.cameras.main.startFollow(this.rana);
        this.cameras.main.setFollowOffset(0, this.getCameraFollowOffsetY(this.scale.width, this.scale.height, 1));

        // Answer text objects
        this.createAnswerTexts();

        // Initial resize: síncrono para evitar un frame con el layout sin
        // aplicar entre createGameElements() y el primer rAF.
        this._performResize();
    }

    // ─── Pad helpers ─────────────────────────────────────────────────

    _createPad(x, y, scale) {
        const shadowOff = OFFSETS.SHADOW * scale;
        const shadow = this.add
            .image(x, y + shadowOff, "platform-shadow")
            .setScale(scale);
        const sprite = this.add
            .sprite(x, y, "platform")
            .setScale(SCALES.PLATFORM_BASE * scale);
        return { sprite, shadow };
    }

    _destroyPad(pad) {
        if (!pad) return;
        if (pad.sprite) {
            this.tweens.killTweensOf(pad.sprite);
            if (pad.sprite.anims && pad.sprite.anims.isPlaying) {
                // Dejar que la animación termine antes de destruir el sprite
                const sprite = pad.sprite;
                sprite.once("animationcomplete", () => sprite.destroy());
            } else {
                if (pad.sprite.anims) pad.sprite.anims.stop();
                pad.sprite.destroy();
            }
        }
        if (pad.shadow) {
            this.tweens.killTweensOf(pad.shadow);
            pad.shadow.destroy();
        }
    }

    _sinkPad(pad, animKey = "hundimiento_platform", scale) {
        if (!pad) return;
        pad.shadow.setAlpha(0);
        if (pad.sprite && pad.sprite.anims) {
            if (scale !== undefined) pad.sprite.setScale(scale);
            pad.sprite.anims.play(animKey);
            pad.sprite.once("animationcomplete", () => {
                pad.sprite.setAlpha(0);
            });
        }
    }

    /**
     * FIFO a column: remove old head, add new tail (maintains pad count).
     */
    _fifoColumn(col, padSpacing, scale) {
        const head = col.dequeueHead();
        if (head) this._destroyPad(head);
        col.enqueueTail(padSpacing, scale);
    }

    // ─── Decorative columns ──────────────────────────────────────────

    /**
     * Create deco columns in the decoMap (dist ±2, ±3 from center).
     * @param {number} frogX - Reference X (frog / frogPad position)
     * @param {number} frogY - Reference Y (frog / frogPad position)
     */
    _createDecoColumns(frogX, frogY) {
        const scale = this.scalePlatform || 1;
        const offsetX = OFFSETS.X * scale;
        const padSpacing = PAD_SPACING * scale;
        const center = this.centerXMul;

        this.decoMap = new Map();
        for (let d = -SIDE_COLUMNS - 1; d <= SIDE_COLUMNS + 1; d++) {
            if (d >= -1 && d <= 1) continue; // skip A/B/C positions
            const xMul = center + d;
            const cx = frogX + d * offsetX;
            const cy = getColumnBaseY(frogY, d, padSpacing);
            this.decoMap.set(xMul, LilyColumn.create(this, cx, cy, padSpacing, PAD_COUNT, scale));
        }
    }

    _destroyDecoColumns() {
        for (const col of this.decoMap.values()) {
            col.destroy();
        }
        this.decoMap = new Map();
    }

    _sinkDecoHeads(scale, count = 1) {
        for (const col of this.decoMap.values()) {
            col.sinkHeads(count, "hundimiento_platform", scale);
        }
    }

    /**
     * Pre-create the near-edge deco column that will become visible when the
     * camera pans during a lateral jump.  Stored OUTSIDE decoMap so it won't
     * be FIFOed during _advanceLateral.  Adopted into decoMap in step 8.
     */
    _preCreateNearEdgeDeco(key) {
        const scale = this.scalePlatform;
        const dir = key === "A" ? -1 : 1;
        const futureCenter = this.centerXMul + dir;
        const nearXMul = key === "A"
            ? futureCenter - SIDE_COLUMNS - 1
            : futureCenter + SIDE_COLUMNS + 1;

        // Don't recreate if it's already pending or already in decoMap
        if (this._pendingNearDeco?.xMul === nearXMul) return;
        if (this.decoMap.has(nearXMul)) return;

        const offsetX = OFFSETS.X * scale;
        const padSpacing = PAD_SPACING * scale;
        const nearDist = nearXMul - futureCenter;
        // Reference: chosen column's head (where the frog will land / future frogPad)
        const chosen = key === "A" ? this.columns.A : this.columns.C;
        const refX = chosen.headX;
        const refY = chosen.headY;

        this._pendingNearDeco = {
            xMul: nearXMul,
            col: LilyColumn.create(
                this,
                refX + nearDist * offsetX,
                getColumnBaseY(refY, nearDist, padSpacing),
                padSpacing, PAD_COUNT, scale,
            ),
        };
    }

    _destroyPendingNearDeco() {
        if (this._pendingNearDeco) {
            this._pendingNearDeco.col.destroy();
            this._pendingNearDeco = null;
        }
    }

    // ─── Answer texts ────────────────────────────────────────────────

    createAnswerTexts() {
        // Forzar rasterizado a la densidad real del display para evitar
        // texto pixelado/borroso en pantallas HiDPI (Retina, escalado Windows)
        const textResolution = window.devicePixelRatio || 2;

        const textStyle = {
            fontSize: "28px",
            fontFamily: FONTS.UI,
            color: "#ffffff",
            align: "center",
            fontStyle: "bold",
            fontWeight: 800,
            lineSpacing: 0,
            wordWrap: {
                width: 150,
                useAdvancedWrap: true,
            },
            stroke: "#ffffff",
            strokeThickness: 1,
            resolution: textResolution,
        };

        const labelStyle = {
            fontSize: "20px",
            fontFamily: FONTS.UI,
            color: "#ffffff",
            fontStyle: "bold",
            fontWeight: 800,
            resolution: textResolution,
        };

        this.textA = this.add
            .text(this.columns.A.headX, this.columns.A.headY - 10, "", textStyle)
            .setOrigin(0.5)
            .setDepth(150)
            .setAlpha(0);
        this.labelShadowA = this.add
            .circle(this.columns.A.headX, this.columns.A.headY - 30 + 2, 18, BADGE.SHADOW, 0.8)
            .setDepth(158)
            .setAlpha(0);
        this.labelBgA = this.add
            .circle(this.columns.A.headX, this.columns.A.headY - 30, 18, BADGE.FILL)
            .setDepth(159)
            .setAlpha(0);
        this.labelA = this.add
            .text(this.columns.A.headX, this.columns.A.headY - 30, "A", labelStyle)
            .setOrigin(0.5)
            .setDepth(160)
            .setAlpha(0);

        this.textB = this.add
            .text(this.columns.B.headX, this.columns.B.headY - 10, "", textStyle)
            .setOrigin(0.5)
            .setDepth(150)
            .setAlpha(0);
        this.labelShadowB = this.add
            .circle(this.columns.B.headX, this.columns.B.headY - 30 + 2, 18, BADGE.SHADOW, 0.8)
            .setDepth(158)
            .setAlpha(0);
        this.labelBgB = this.add
            .circle(this.columns.B.headX, this.columns.B.headY - 30, 18, BADGE.FILL)
            .setDepth(159)
            .setAlpha(0);
        this.labelB = this.add
            .text(this.columns.B.headX, this.columns.B.headY - 30, "B", labelStyle)
            .setOrigin(0.5)
            .setDepth(160)
            .setAlpha(0);

        this.textC = this.add
            .text(this.columns.C.headX, this.columns.C.headY - 10, "", textStyle)
            .setOrigin(0.5)
            .setDepth(150)
            .setAlpha(0);
        this.labelShadowC = this.add
            .circle(this.columns.C.headX, this.columns.C.headY - 30 + 2, 18, BADGE.SHADOW, 0.8)
            .setDepth(158)
            .setAlpha(0);
        this.labelBgC = this.add
            .circle(this.columns.C.headX, this.columns.C.headY - 30, 18, BADGE.FILL)
            .setDepth(159)
            .setAlpha(0);
        this.labelC = this.add
            .text(this.columns.C.headX, this.columns.C.headY - 30, "C", labelStyle)
            .setOrigin(0.5)
            .setDepth(160)
            .setAlpha(0);

        for (const key of ["A", "B", "C"]) {
            const answerText = this[`text${key}`];
            const labelText = this[`label${key}`];
            answerText.setShadow(0, 2, "#070e00", 0, false, true);
            labelText.setShadow(0, 1, "#070e00", 0, false, true);
        }
    }

    // ─── Resize ──────────────────────────────────────────────────────

    setupResizeHandler() {
        this.scale.on("resize", () => {
            // Sincronía HiDPI SÍNCRONA: si Phaser RESIZE pone el renderer/canvas
            // en píxeles CSS pero la cámara mantiene zoom=dpr de la aplicación
            // previa, el siguiente frame se renderiza con el mundo zoomado y
            // los sprites se ven gigantes. applyHiDPICamera() reajusta
            // canvas.width/height, renderer.resize y camera.setSize a píxeles
            // físicos antes de que Phaser pinte el siguiente frame. Es
            // idempotente para dpr=1 (early return).
            this.applyHiDPICamera();
            this._scheduleResize();
        });
    }

    // Coalesce: en una rotación móvil el navegador puede disparar varios
    // eventos de resize (window.resize, orientationchange, visualViewport.resize,
    // ResizeObserver del contenedor) con dimensiones intermedias en distintos
    // momentos. Posponer hasta el próximo rAF nos garantiza que sólo aplicamos
    // layout una vez por frame con las dimensiones más recientes.
    _scheduleResize() {
        if (this._resizeRAF) return;
        this._resizeRAF = requestAnimationFrame(() => {
            this._resizeRAF = null;
            this._performResize();
        });
    }

    // Revalidación tras aplicar layout: el contenedor puede seguir cambiando
    // de tamaño durante 1-2 frames más (barra de URL colapsando en iOS,
    // animación CSS al cerrar un modal, etc.). Comprobamos en los próximos
    // frames si las dimensiones reales han cambiado respecto a lo aplicado;
    // si es así, reaplicamos. Máximo 2 reintentos para no entrar en bucle.
    _scheduleRevalidation(remaining = 2) {
        if (remaining <= 0) return;
        if (this._revalidationRAF) cancelAnimationFrame(this._revalidationRAF);
        this._revalidationRAF = requestAnimationFrame(() => {
            this._revalidationRAF = null;
            if (!this.scale) return;
            const w = this.scale.width;
            const h = this.scale.height;
            if (w <= 0 || h <= 0) {
                this._scheduleRevalidation(remaining - 1);
                return;
            }
            if (w !== this._lastAppliedWidth || h !== this._lastAppliedHeight) {
                this._performResize();
                this._scheduleRevalidation(remaining - 1);
            }
        });
    }

    resize() {
        // Compatibilidad: cualquier llamada directa al método público se
        // canaliza por el mismo coalescing que los eventos del scale manager.
        this._scheduleResize();
    }

    _performResize() {
        const width = this.scale.width;
        const height = this.scale.height;
        const dpr = Math.max(window.devicePixelRatio || 1, 1);

        if (width <= 0 || height <= 0) return;

        // If game elements haven't been created yet (due to 0 dimensions on first create()),
        // create them now that dimensions are valid
        if (!this.rana) {
            this.createGameElements();
            this._lastAppliedWidth = width;
            this._lastAppliedHeight = height;
            this._lastAppliedDpr = dpr;
            this._scheduleRevalidation();
            return;
        }

        // Idempotencia: si las dimensiones (y el DPR, que puede cambiar al
        // arrastrar entre pantallas con distinto píxel ratio) coinciden con
        // lo último aplicado, no hay nada que hacer. Evita trabajo cuando
        // varias fuentes (window.resize + orientationchange + ResizeObserver)
        // disparan resize para el mismo estado final.
        if (
            width === this._lastAppliedWidth &&
            height === this._lastAppliedHeight &&
            dpr === this._lastAppliedDpr
        ) {
            return;
        }



        // Tweens con targets absolutos calculados ANTES del resize quedan
        // apuntando a coordenadas obsoletas (la rana saltaba a un X que ya no
        // existe). Los matamos y, si era un salto en curso, ancla la rana al
        // headSprite de la columna destino con sus coords *post*-applyScales.
        this._cancelInFlightTweensForResize();

        if (this.background) {
            this.background.setPosition(width / 2, height / 2);
            this.background.setSize(width, height);
        }

        const scalePlatform = this.getPlatformScale(width, height);

        this.lastHeight = PAD_BASE_SIZE * scalePlatform;
        this.scalePlatform = scalePlatform;

        if (this.cameras && this.cameras.main) {
            this.cameras.main.setFollowOffset(0, this.getCameraFollowOffsetY(width, height, scalePlatform));
        }

        // Reaplicar el zoom + tamaño HiDPI de la cámara. PhaserGame.jsx tiene
        // su propio listener de resize que también lo hace, pero el orden de
        // emisión no es estable en todos los navegadores: en móvil rotando
        // dispositivo se han observado frames en los que la GameScene ya está
        // activa pero el setZoom(dpr) del listener externo se aplicó cuando
        // sys.isActive() devolvía false → la cámara queda con zoom=1 sobre un
        // setSize en píxeles físicos y todo el mundo del juego cae fuera del
        // viewport ("se descolocan los elementos / desaparecen").
        this.applyHiDPICamera();

        this.applyScales(scalePlatform);

        // Re-anclar el follow con los nuevos offsets para que la cámara salte
        // a la posición correcta sin esperar al lerp del siguiente frame.
        if (this.rana && this.cameras?.main) {
            this.cameras.main.stopFollow();
            this.cameras.main.startFollow(
                this.rana,
                false,
                1,
                1,
                0,
                this.getCameraFollowOffsetY(width, height, scalePlatform),
            );
            this.cameras.main.centerOn(
                this.rana.x,
                this.rana.y - this.getCameraFollowOffsetY(width, height, scalePlatform),
            );
        }

        // Tras applyScales las columnas ya están en sus nuevas coords.
        // Si la rana estaba saltando, la reposicionamos sobre el head destino
        // y disparamos su handler de aterrizaje (el tween ya fue matado, así
        // que su onComplete no llegará a ejecutarse por sí solo).
        if (this._jumpTargetKey && this.columns?.[this._jumpTargetKey]) {
            const landingKey = this._jumpTargetKey;
            const wasCorrect = this._jumpIsCorrect;
            const col = this.columns[landingKey];
            this.rana.setPosition(col.headX, col.headY);
            this.rana.angle = 0;
            this._jumpTargetKey = null;
            this._jumpIsCorrect = null;
            if (wasCorrect) this.handleCorrectAnswer(landingKey);
            else this.handleWrongAnswer(landingKey);
        }

        // Si la cascada de respuestas estaba a medias, dejar todo visible y
        // en su sitio final (matamos el tween en _cancelInFlightTweensForResize).
        if (this._answersCascadeInFlight) {
            this.setAnswerElementsVisible(true);
            this.updateTextPositions();
            this._answersCascadeInFlight = false;
            this.enableInteraction();
            this.setBankControl({ visible: true, offsetY: BANK.VISIBLE_OFFSET_Y });
            this.setAnimating(false);
        }

        this._lastAppliedWidth = width;
        this._lastAppliedHeight = height;
        this._lastAppliedDpr = dpr;

        // Tras aplicar el layout, comprobar en los próximos frames si el
        // contenedor sigue cambiando (rotación que aún se está estabilizando,
        // colapso de la barra de URL en iOS, etc.) y reaplicar si hay drift.
        this._scheduleRevalidation();
    }

    _cancelInFlightTweensForResize() {
        const killTargets = [];
        if (this.rana) killTargets.push(this.rana);
        if (this.frogPad?.sprite) killTargets.push(this.frogPad.sprite);
        if (this.frogPad?.shadow) killTargets.push(this.frogPad.shadow);
        if (this.shore?.sprite) killTargets.push(this.shore.sprite);
        for (const key of ["A", "B", "C"]) {
            const t = this[`text${key}`];
            const l = this[`label${key}`];
            const lb = this[`labelBg${key}`];
            const ls = this[`labelShadow${key}`];
            const sp = this.columns?.[key]?.headSprite;
            const mm = this.columns?.[key]?.headMultimedia;
            if (t) killTargets.push(t);
            if (l) killTargets.push(l);
            if (lb) killTargets.push(lb);
            if (ls) killTargets.push(ls);
            if (sp) killTargets.push(sp);
            if (mm && mm.setScale) killTargets.push(mm);
        }
        for (const target of killTargets) {
            this.tweens.killTweensOf(target);
        }
    }

    getPlatformScale(width, height) {
        if (height > width) {
            return ((width * 0.3125) / PAD_BASE_SIZE) * SCALE_TUNING;
        }
        return ((height * 0.35) / PAD_BASE_SIZE) * SCALE_TUNING;
    }

    getFrogBlockY(width, height, scale) {
        const padHeight = PAD_BASE_SIZE * scale;
        const isPortrait = height > width;
        const margin = isPortrait
            ? LAYOUT.FROG_PAD_BOTTOM_MARGIN.PORTRAIT
            : LAYOUT.FROG_PAD_BOTTOM_MARGIN.LANDSCAPE;
        return height - padHeight / 2 - margin;
    }

    getCameraFollowOffsetY(width, height, scale) {
        const desiredFrogScreenY = this.getFrogBlockY(width, height, scale);
        return desiredFrogScreenY - (height / 2);
    }

    applyScales(scale) {
        const offsetX = OFFSETS.X * scale;
        const padSpacing = PAD_SPACING * scale;

        // Frog
        if (this.rana) {
            this.rana.setScale(SCALES.FROG_BASE * scale);
        }

        const frogX = this.scale.width / 2;
        const frogY = this.getFrogBlockY(this.scale.width, this.scale.height, scale);

        if (this.rana) {
            this.rana.setPosition(frogX, frogY);
        }

        // Frog pad
        if (this.frogPad) {
            this.frogPad.sprite.setScale(SCALES.PLATFORM_BASE * scale);
            this.frogPad.sprite.setPosition(frogX, frogY);
            this.frogPad.shadow.setScale(scale);
            this.frogPad.shadow.setPosition(frogX, frogY + OFFSETS.SHADOW * scale);
        }

        // Main columns
        if (this.columns) {
            this.columns.A.reposition(frogX - offsetX, frogY - padSpacing / 2, padSpacing, scale);
            this.columns.B.reposition(frogX, frogY - padSpacing, padSpacing, scale);
            this.columns.C.reposition(frogX + offsetX, frogY - padSpacing / 2, padSpacing, scale);
        }

        // Deco columns: reposition in place (no destroy/recreate)
        if (this.decoMap.size > 0) {
            const center = this.centerXMul;
            for (const [xMul, col] of this.decoMap) {
                const dist = xMul - center;
                const cx = frogX + dist * offsetX;
                const cy = getColumnBaseY(frogY, dist, padSpacing);
                col.reposition(cx, cy, padSpacing, scale);
            }
        }

        // Pending near-edge deco (creado antes de un salto lateral): también
        // debe re-escalarse para que no quede a escala/posición vieja si el
        // usuario gira el dispositivo durante el salto.
        if (this._pendingNearDeco) {
            const center = this.centerXMul;
            const dist = this._pendingNearDeco.xMul - center;
            const cx = frogX + dist * offsetX;
            const cy = getColumnBaseY(frogY, dist, padSpacing);
            this._pendingNearDeco.col.reposition(cx, cy, padSpacing, scale);
        }

        // Shore: el componente reancla la isla al nenúfar correcto y reaplica
        // los offsets vigentes (avance de multijugador o fallo lateral),
        // reescalados al nuevo tamaño.
        this.shore.reposition({ scale });

        this.updateTextPositions();
    }

    /**
     * Centro vertical del texto de respuesta (sin imagen). En lugar de centrarlo
     * sobre el nenúfar, si el texto es tan alto que su borde superior invadiría
     * la insignia de la letra (A/B/C) lo baja lo justo para dejar un hueco fijo
     * por debajo de la letra. Requiere que el tamaño de fuente ya sea el
     * definitivo, porque depende de displayHeight.
     */
    getAnswerTextCenterY(col, textObj) {
        const badgeRadius = Math.max(14, Math.round(18 * this.scalePlatform));
        const badgeBottom = (col.headY - this.lastHeight * 0.50) + badgeRadius;
        const minTop = badgeBottom + this.lastHeight * 0.06; // hueco bajo la letra
        const padCenterY = col.headY - this.lastHeight * 0.045;
        const halfHeight = (textObj?.displayHeight || 0) / 2;
        // El centro debe estar lo bastante abajo para que (centro - mitadAltura)
        // nunca suba por encima de minTop. Si el texto cabe centrado, gana padCenterY.
        return Math.max(padCenterY, minTop + halfHeight);
    }

    updateTextPositions() {
        if (!this.columns) return;
        const labelOffset = this.lastHeight * 0.50;
        const fontScale = this.scalePlatform;
        // Ancho de envoltura algo mayor para que el texto largo caiga en menos
        // líneas (menor altura) y no haya que bajarlo tanto. Se mantiene por
        // debajo de maxTextWidth (lastHeight*0.9) para no forzar el encogido de
        // fuente solo por ancho.
        const answerWrapWidth = Math.max(105, 180 * fontScale);
        const answerFontSize = Math.max(18, Math.round(28 * fontScale));
        const labelFontSize = Math.max(14, Math.round(20 * fontScale));
        const badgeRadius = Math.max(14, Math.round(18 * fontScale));

        for (const key of ["A", "B", "C"]) {
            const col = this.columns[key];
            const textObj = this[`text${key}`];
            const labelObj = this[`label${key}`];
            const labelShadowObj = this[`labelShadow${key}`];
            const badgeObj = this[`labelBg${key}`];
            const badgeY = col.headY - labelOffset;

            // Check if this answer has an image
            const answer = this.currentAnswers?.[key];
            const hasImage = answer?.source && (answer.type === "image" || answer.type?.startsWith("image/"));
            const hasImageOnly = hasImage && !answer?.answer;  // imagen sin texto

            if (textObj && col) {
                // Align text to top of its container when image is present
                if (hasImage) {
                    textObj.setOrigin(0.5, 0);
                    textObj.setPosition(col.headX, col.headY + this.lastHeight * 0.16);
                    textObj.setLineSpacing(-5); // Reduce line height when image is present
                } else {
                    textObj.setOrigin(0.5, 0.5);
                    textObj.setPosition(col.headX, this.getAnswerTextCenterY(col, textObj));
                    textObj.setLineSpacing(0); // Default line spacing
                }
                textObj.setScale(1);
                textObj.setFontSize(answerFontSize);
                textObj.setStroke(undefined, 0);
                textObj.setWordWrapWidth(answerWrapWidth, true);
            }
            if (labelObj && col) {
                labelObj.setPosition(col.headX, badgeY);
                labelObj.setScale(1);
                labelObj.setFontSize(labelFontSize);
                labelObj.setStroke(undefined, 0);
            }
            if (labelShadowObj && col) {
                labelShadowObj.setPosition(col.headX, badgeY + Math.max(1, Math.round(2 * fontScale)));
                labelShadowObj.setRadius(Math.max(12, badgeRadius - 1));
                labelShadowObj.setAlpha(0.35);
            }
            if (badgeObj && col) {
                badgeObj.setPosition(col.headX, badgeY);
                badgeObj.setRadius(badgeRadius);
            }

            // Reposition multimedia image if present, accounting for image+text centering
            const mm = col.headMultimedia;
            if (mm && mm.setPosition && hasImage) {
                if (hasImageOnly) {
                    // Centrar imagen en el nenúfar y guardar restricciones de tamaño para el fit
                    mm.setPosition(col.headX, col.headY);
                    mm.targetFitWidth = col.headSprite.displayWidth * 0.88;
                    mm.targetFitHeight = this.lastHeight * 1.0;
                    // Si la textura ya está cargada (resize), recalcular escala directamente
                    if (mm.alpha > 0 && mm.texture?.source?.[0]?.image) {
                        const img = mm.texture.source[0].image;
                        const scaleW = mm.targetFitWidth / img.naturalWidth;
                        const scaleH = mm.targetFitHeight / img.naturalHeight;
                        const fitScale = Math.min(scaleW, scaleH);
                        mm.setScale(fitScale);
                        mm.baseScale = fitScale;
                    }
                } else {
                    // imagen + texto: fit dinámico al 70% de la altura del pad
                    mm.targetFitWidth = col.headSprite.displayWidth * 0.88;
                    mm.targetFitHeight = this.lastHeight * 0.70;
                    mm.setPosition(col.headX, col.headY - this.lastHeight * 0.16);
                    if (mm.alpha > 0 && mm.texture?.source?.[0]?.image) {
                        const img = mm.texture.source[0].image;
                        const scaleW = mm.targetFitWidth / img.naturalWidth;
                        const scaleH = mm.targetFitHeight / img.naturalHeight;
                        const fitScale = Math.min(scaleW, scaleH);
                        mm.setScale(fitScale);
                        mm.baseScale = fitScale;
                    }
                }
            }
        }

        this.adjustAnswerFontSizes();

        // Con el tamaño de fuente ya definitivo, recolocar verticalmente el texto
        // sin imagen: si quedó muy alto, getAnswerTextCenterY lo baja para que no
        // invada la insignia de la letra.
        for (const key of ["A", "B", "C"]) {
            const col = this.columns[key];
            const textObj = this[`text${key}`];
            if (!textObj || !col) continue;
            const answer = this.currentAnswers?.[key];
            const hasImage = answer?.source && (answer.type === "image" || answer.type?.startsWith("image/"));
            if (!hasImage) {
                textObj.y = this.getAnswerTextCenterY(col, textObj);
            }
        }
    }

    adjustAnswerFontSizes() {
        const answerTexts = [this.textA, this.textB, this.textC].filter(Boolean);
        if (answerTexts.length === 0) return;

        const maxTextWidth = Math.max(100, this.lastHeight * 0.95);
        const maxTextHeight = Math.max(44, this.lastHeight * 0.34);

        // Calcular el fontSize necesario para cada texto individualmente
        const fontSizes = answerTexts.map((textObj) => {
            let fontSize = parseInt(textObj.style.fontSize, 10);
            if (!Number.isFinite(fontSize)) {
                fontSize = Math.max(18, Math.round(28 * this.scalePlatform));
            }

            let iterations = 0;
            while (
                iterations < 18
                && (textObj.displayWidth > maxTextWidth || textObj.displayHeight > maxTextHeight)
                && fontSize > 15
            ) {
                fontSize -= 1;
                textObj.setFontSize(fontSize);
                iterations += 1;
            }

            return parseInt(textObj.style.fontSize, 10);
        });

        // Tomar el fontSize más pequeño (el que necesita el texto más largo)
        const unifiedFontSize = Math.min(...fontSizes);

        // Aplicar el mismo fontSize a los tres textos
        for (const textObj of answerTexts) {
            textObj.setFontSize(unifiedFontSize);
        }
    }

    /**
     * Update multimedia on all three main columns based on currentAnswers
     */
    updateColumnsMultimedia() {
        if (!this.columns || !this.currentAnswers) return;
        for (const key of ["A", "B", "C"]) {
            const answer = this.currentAnswers[key];
            if (!answer) continue;

            const multimedia = answer.source && answer.type
                ? { source: answer.source, type: answer.type }
                : null;

            // Update the column's head multimedia
            this.columns[key].updateHeadMultimedia(multimedia);
        }
    }

    /**
     * Destroy multimedia on all three main columns
     */
    destroyAllMultimedia() {
        if (!this.columns) return;
        for (const key of ["A", "B", "C"]) {
            this.columns[key].updateHeadMultimedia(null);
        }
    }

    // ─── Question flow ───────────────────────────────────────────────

    goToQuestion(index) {
        if (typeof index !== 'number' || index < 0 || index >= this.questions.length) return;

        // 1. Matar todos los tweens y timers pendientes
        this.tweens.killAll();
        this.time.removeAllEvents();

        // 2. Parar animaciones de sprites en pads (frogPad, columns, decos)
        //    Necesario porque _destroyPad y LilyColumn.destroy() difieren
        //    la destrucción si hay una animación en curso (hundimiento).
        if (this.frogPad?.sprite?.anims) {
            this.frogPad.sprite.anims.stop();
        }
        if (this.columns) {
            for (const col of Object.values(this.columns)) {
                for (const pad of col._pads) {
                    if (pad.sprite?.anims?.isPlaying) pad.sprite.anims.stop();
                }
            }
        }
        for (const col of this.decoMap.values()) {
            for (const pad of col._pads) {
                if (pad.sprite?.anims?.isPlaying) pad.sprite.anims.stop();
            }
        }

        // 3. Reset de flags de estado
        this.moving = false;
        this.finish = false;
        this._markedGameOver = false;
        this.currentQuestionIndex = index;
        this.centerXMul = 0;

        // 4. Limpiar elementos visuales residuales
        this.shore.destroy();
        this.destroyAllMultimedia();
        this.setAnswerElementsVisible(false);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this.setAnimating(false);

        // 5. Resetear rana a posición canónica
        const scale = this.scalePlatform;
        const centerX = this.scale.width / 2;
        const frogY = this.getFrogBlockY(this.scale.width, this.scale.height, scale);

        if (this.rana.anims) this.rana.anims.stop();
        this.rana.setPosition(centerX, frogY);
        this.rana.setAlpha(1);
        this.rana.setScale(SCALES.FROG_BASE * scale);
        this.rana.setAngle(0);
        this.rana.setFrame(0);

        // 6. Recrear todas las plataformas desde cero
        this.recreateAllPlatforms(centerX, frogY);

        // 7. Reconfigurar cámara
        this.cameras.main.startFollow(
            this.rana, false, 1, 1, 0,
            this.getCameraFollowOffsetY(this.scale.width, this.scale.height, scale),
        );

        // 8. Iniciar la nueva pregunta
        this.startQuestion();
    }

    startQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.gameWon();
            return;
        }

        const storeIndex = this.getCurrentStoreIndex();
        if (this.onQuestionStart) {
            this.onQuestionStart(storeIndex);
        }

        const question = this.getCurrentQuestion();
        if (!question) return;

        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        const indices = [0, 1, 2];
        if (this.randomizeAnswers) {
            const shuffled = shuffle(indices);
            this.answerOrder = {
                A: shuffled[0],
                B: shuffled[1],
                C: shuffled[2],
            };
        } else {
            this.answerOrder = { A: 0, B: 1, C: 2 };
        }

        const answers = question.answers || [];
        this.currentCorrectAnswers = question.correctAnswers || [];
        this.currentAnswers = {
            A: answers[this.answerOrder.A] || null,
            B: answers[this.answerOrder.B] || null,
            C: answers[this.answerOrder.C] || null,
        };

        // Update multimedia on columns
        this.updateColumnsMultimedia();

        // Position image and text correctly before animating
        this.updateTextPositions();

        // Isla final: aparece "a lo lejos" en la penúltima pregunta (o en la
        // primera si solo hay una) y se asienta en su sitio en la última.
        const shoreQuestionIndex = this.questions.length > 1
            ? this.questions.length - 2
            : 0;
        if (this.currentQuestionIndex === shoreQuestionIndex) {
            this.shore.appearInDistance({ scale: this.scalePlatform });
        } else if (this.currentQuestionIndex > shoreQuestionIndex) {
            // Última pregunta. En single-player la cámara sigue a la rana, así
            // que la isla se desliza suavemente desde la lejanía hasta su
            // posición final sobre el nenúfar correcto. En multijugador
            // (player) la rana resetea a posición canónica entre preguntas, así
            // que la recolocamos al instante con los offsets de avance para que
            // no tape las respuestas.
            this.shore.settleAt({
                scale: this.scalePlatform,
                useAdvanceOffsets: this.isMultiplayerPlayer,
                animate: !this.isMultiplayerPlayer,
            });
        }

        // En multijugador (player) el sonido de intro lo dispara React cuando
        // termina la cuenta atrás del overlay (QuestionCountdown), no aquí
        if (!this.isMultiplayerPlayer) {
            this.playSound("croar", { delay: 0.2 });
        }
        this.animateAnswersIn();
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    getCurrentStoreIndex() {
        return this.currentQuestionIndex;
    }

    getNextStoreIndex() {
        if (this.currentQuestionIndex + 1 < this.questions.length) {
            return this.currentQuestionIndex + 1;
        }
        return undefined;
    }

    animateAnswersIn() {
        if (!this.columns || !this.currentAnswers) return;
        const duration = DURATIONS.ANSWER_CASCADE;
        const startOffset = 1000;

        for (const key of ["A", "B", "C"]) {
            const col = this.columns[key];
            const answer = this.currentAnswers[key];
            // Only move text down if there's an image
            const hasImage = answer?.source && (answer.type === "image" || answer.type?.startsWith("image/"));

            // Set origin based on image presence (la Y se fija más abajo, ya con
            // la fuente definitiva)
            this[`text${key}`].setOrigin(0.5, hasImage ? 0 : 0.5);
            this[`label${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
            this[`labelBg${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
            this[`labelShadow${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
        }

        this.textA.setText(this.formatAnswerText(this.currentAnswers.A?.answer));
        this.textB.setText(this.formatAnswerText(this.currentAnswers.B?.answer));
        this.textC.setText(this.formatAnswerText(this.currentAnswers.C?.answer));

        this.adjustAnswerFontSizes();

        // Posición vertical de partida del texto (origen del tween de cascada).
        // El texto sin imagen se calcula con la fuente ya definitiva para que, si
        // es muy alto, quede por debajo de la insignia y no la invada al aterrizar.
        for (const key of ["A", "B", "C"]) {
            const col = this.columns[key];
            const textObj = this[`text${key}`];
            const answer = this.currentAnswers[key];
            const hasImage = answer?.source && (answer.type === "image" || answer.type?.startsWith("image/"));
            const targetY = hasImage
                ? col.headY + this.lastHeight * 0.16
                : this.getAnswerTextCenterY(col, textObj);
            textObj.y = targetY - startOffset;
        }

        this.setAnswerElementsVisible(true);

        // Cascade A → B → C
        this._answersCascadeInFlight = true;
        this.tweens.add({
            targets: [this.textA, this.labelShadowA, this.labelBgA, this.labelA],
            y: `+=${startOffset}`,
            duration,
            onComplete: () => {
                this.tweens.add({
                    targets: [this.textB, this.labelShadowB, this.labelBgB, this.labelB],
                    y: `+=${startOffset}`,
                    duration,
                    onComplete: () => {
                        this.tweens.add({
                            targets: [this.textC, this.labelShadowC, this.labelBgC, this.labelC],
                            y: `+=${startOffset}`,
                            duration,
                            onComplete: () => {
                                this._answersCascadeInFlight = false;
                                this.enableInteraction();
                                this.setBankControl({ visible: true, offsetY: BANK.VISIBLE_OFFSET_Y });
                                this.setAnimating(false);
                            },
                        });
                    },
                });
            },
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }

    formatAnswerText(text) {
        const content = (text || "").replace(/\s+/g, " ").trim();
        return this.truncateText(content, 90);
    }

    setAnswerElementsVisible(isVisible) {
        const alpha = isVisible ? 1 : 0;
        for (const key of ["A", "B", "C"]) {
            this[`text${key}`]?.setAlpha(alpha);
            this[`labelShadow${key}`]?.setAlpha(alpha);
            this[`labelBg${key}`]?.setAlpha(alpha);
            this[`label${key}`]?.setAlpha(alpha);
        }
    }

    // ─── Interaction ─────────────────────────────────────────────────

    enableInteraction() {
        this.moving = false;

        if (!this.columns) return;
        if (this._paused) return;
        if (this._uiBlocked) return;
        for (const key of ["A", "B", "C"]) {
            const sprite = this.columns[key]?.headSprite;
            if (sprite) {
                sprite.setInteractive({ useHandCursor: true });
                this.setupPlatformEvents(sprite, key);
            }
        }
    }

    setupPlatformEvents(platform, key) {
        platform.off("pointerover");
        platform.off("pointerout");
        platform.off("pointerup");
        platform.off("pointerdown");

        const col = this.columns[key];

        // Helper to get current multimedia
        const getMultimedia = () => {
            return col.headMultimedia;
        };

        // Hover glow effect
        let hoverGlow = null;

        platform.on("pointerover", () => {
            if (this.moving) return;
            this.playSound("over", { volume: 0.5 });

            if (platform.preFX && !hoverGlow) {
                hoverGlow = platform.preFX.addGlow(0xb8e986, 4, 0, false, 0.1, 16);
            }

            const multimedia = getMultimedia();
            // Zoom multimedia if exists
            if (multimedia && multimedia.setScale) {
                // Kill previous tweens to prevent stacking
                this.tweens.killTweensOf(multimedia);
                this.tweens.add({
                    targets: multimedia,
                    scale: (multimedia.baseScale || multimedia.scale) * 1.5,
                    duration: DURATIONS.HOVER_SCALE,
                });

                // Hide letter badge during hover on image (only for image answers)
                const labelBg = this[`labelBg${key}`];
                const labelShadow = this[`labelShadow${key}`];
                const label = this[`label${key}`];
                if (labelBg || labelShadow || label) {
                    this.tweens.killTweensOf([labelBg, labelShadow, label]);
                    this.tweens.add({
                        targets: [labelBg, labelShadow, label],
                        alpha: 0,
                        duration: DURATIONS.HOVER_SCALE,
                    });
                }
            }

            // Kill previous tweens to prevent stacking
            this.tweens.killTweensOf(platform);
            this.tweens.add({
                targets: platform,
                scale: SCALES.PLATFORM_BASE * this.scalePlatform + 0.03,
                duration: DURATIONS.HOVER_SCALE,
            });
        });

        platform.on("pointerout", () => {
            if (this.moving) return;

            // Remove red glow
            if (hoverGlow) {
                platform.preFX.remove(hoverGlow);
                hoverGlow = null;
            }

            const multimedia = getMultimedia();
            // Reset multimedia zoom
            if (multimedia && multimedia.setScale) {
                // Kill previous tweens to reset properly
                this.tweens.killTweensOf(multimedia);
                this.tweens.add({
                    targets: multimedia,
                    scale: multimedia.baseScale || (SCALES.PLATFORM_BASE * this.scalePlatform * 0.5),
                    duration: DURATIONS.HOVER_SCALE,
                });

                // Show letter badge again after hover ends (only for image answers)
                const labelBg = this[`labelBg${key}`];
                const labelShadow = this[`labelShadow${key}`];
                const label = this[`label${key}`];
                if (labelBg || labelShadow || label) {
                    this.tweens.killTweensOf([labelBg, labelShadow, label]);
                    this.tweens.add({
                        targets: [labelBg, labelShadow, label],
                        alpha: 1,
                        duration: DURATIONS.HOVER_SCALE,
                    });
                }
            }

            // Kill previous tweens to reset properly
            this.tweens.killTweensOf(platform);
            this.tweens.add({
                targets: platform,
                scale: SCALES.PLATFORM_BASE * this.scalePlatform,
                duration: DURATIONS.HOVER_SCALE,
            });
        });

        // Handle long press for mobile modal
        let longPressTimer = null;

        platform.on("pointerdown", () => {
            const multimedia = getMultimedia();
            if (multimedia && multimedia.type === "audio") {
                // Start long press timer for audio
                longPressTimer = this.time.delayedCall(500, () => {
                    this.showMultimediaModal(multimedia);
                });
            }
        });

        platform.on("pointerup", (pointer) => {
            if (longPressTimer) {
                this.time.removeEvent(longPressTimer);
                longPressTimer = null;
            }

            if (pointer.upTime - pointer.downTime < 500) {
                const multimedia = getMultimedia();
                // Handle multimedia playback
                if (multimedia && multimedia.type === "audio") {
                    this.playAudio(multimedia.source);
                }
                this.handleAnswer(key);
            }
        });
    }

    disableInteraction() {
        if (!this.columns) return;
        for (const key of ["A", "B", "C"]) {
            const sprite = this.columns[key]?.headSprite;
            if (sprite) {
                sprite.off("pointerover");
                sprite.off("pointerout");
                sprite.off("pointerup");
                sprite.disableInteractive();

                // Clear any hover glow effect left on the platform
                if (sprite.preFX) {
                    sprite.preFX.clear();
                }
            }
        }
    }

    // ─── Answer handling ─────────────────────────────────────────────

    handleAnswer(key) {
        if (this.moving || this.finish) return;
        // En multijugador (player) bloqueamos la respuesta mientras el overlay
        // de cuenta atrás está activo (equivalente al questionScreen del host).
        // disableInteraction ya bloquea los clics, pero el teclado sigue vivo.
        if (this._paused) return;
        if (this._uiBlocked) return;

        this.moving = true;
        this.disableInteraction();

        // Reset platform scales to prevent mobile hover scale from persisting
        for (const colKey of ["A", "B", "C"]) {
            const platform = this.columns[colKey]?.headSprite;
            if (platform) {
                this.tweens.killTweensOf(platform);
                platform.setScale(SCALES.PLATFORM_BASE * this.scalePlatform);
            }
        }

        // En multijugador (player) no animamos la rana al instante: revelaría a
        // los demás jugadores si la respuesta es correcta (hundimiento) o no
        // (salto firme). Guardamos la elección y la animaremos cuando el host
        // cierre la pregunta (todos han contestado)
        if (this.isMultiplayerPlayer) {
            this._pendingAnswerKey = key;
            this.playSound("pressOk");
            this.playSound("croar");
            if (this.onAnswer) {
                const answerIndex = this.answerOrder[key];
                this.onAnswer({
                    type: "selection",
                    answer: answerIndex,
                    selectedOption: key,
                }, {
                    questionIndexAnswer: this.getCurrentStoreIndex(),
                });
            }
            return;
        }

        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        const selectedAnswer = this.currentAnswers[key];
        const isCorrect = !!selectedAnswer && this.currentCorrectAnswers.includes(selectedAnswer.id);

        this._animateAnswerJump(key, isCorrect);
    }

    // Anima el salto de la rana hacia el nenúfar elegido. Tras el salto delega
    // en handleCorrectAnswer/handleWrongAnswer para el desenlace visual y la
    // notificación a React. En modo player se reutiliza al cerrar la pregunta.
    _animateAnswerJump(key, isCorrect) {
        const col = this.columns[key];
        const targetX = col.headX;
        const targetY = col.headY;
        const angle = key === "A" ? -45 : key === "C" ? 45 : 0;

        this.playSound("salto", { delay: 0.2 });
        if (!this.isMultiplayerPlayer) {
            this.playSound("pressOk");
        }

        // Hide answer texts and destroy multimedia
        this.setAnswerElementsVisible(false);
        this.destroyAllMultimedia();

        // For lateral jumps, pre-create the near-edge deco column BEFORE the
        // tween starts.  The camera follows the frog during the jump, so the
        // far edge scrolls into view *during* the tween.  By creating the
        // column now (and keeping it out of decoMap) it's already there when
        // the camera reveals that area.
        if (key === "A" || key === "C") {
            this._preCreateNearEdgeDeco(key);
        }

        // Animate frog jump
        this.rana.angle = angle;
        this.rana.anims.play("rana_salto");

        this._jumpTargetKey = key;
        this._jumpIsCorrect = isCorrect;

        this.tweens.add({
            targets: this.rana,
            x: targetX,
            y: targetY,
            duration: DURATIONS.JUMP,
            onComplete: () => {
                if (this._jumpTargetKey == null) return; // ya resuelto vía resize
                this._jumpTargetKey = null;
                this._jumpIsCorrect = null;
                this.rana.angle = 0;
                if (isCorrect) {
                    this.handleCorrectAnswer(key);
                } else {
                    this.handleWrongAnswer(key);
                }
            },
        });
    }

    // Llamado desde React (player) cuando el host cierra la pregunta. Ejecuta
    // la animación que se difirió en handleAnswer usando la validación
    // autoritativa del backend. Libera el flag setAnimating al terminar la
    // secuencia completa (salto + hundimiento) para que el PlayerPointsModal
    // pueda aparecer después.
    playPendingAnswerAnimation(isCorrect) {
        if (!this.isMultiplayerPlayer) return;
        const key = this._pendingAnswerKey;
        if (!key) return;
        this._pendingAnswerKey = null;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this._animateAnswerJump(key, !!isCorrect);

        // Duración total de la secuencia: salto + hundimiento. Pasado este
        // tiempo el resultado ya es visible y el modal de puntos puede mostrarse
        const totalDuration = DURATIONS.JUMP + DURATIONS.SINKING + 100;
        this.time.delayedCall(totalDuration, () => {
            this.setAnimating(false);
        });
    }

    handleCorrectAnswer(key) {
        this.playSound("saltoOk");
        this.playSound("coin");

        this.sinkWrongPlatforms(key);

        // En modo player la respuesta ya se notificó al pulsar (sin isCorrect)
        // y el avance entre preguntas lo controla el servidor vía goToQuestion
        if (this.isMultiplayerPlayer) return;

        if (this.onAnswer) {
            const answerIndex = this.answerOrder[key];
            this.onAnswer({
                type: "selection",
                answer: answerIndex,
                selectedOption: key,
            }, {
                isCorrect: true,
                questionIndexAnswer: this.getCurrentStoreIndex(),
                nextQuestionIndex: this.getNextStoreIndex(),
            });
        }

        this.time.delayedCall(800, () => {
            this.advancePlatforms(key);
            this.currentQuestionIndex++;

            if (this.currentQuestionIndex >= this.questions.length) {
                this.gameWon();
            } else {
                this.startQuestion();
            }
        });
    }

    handleWrongAnswer(key) {
        this.playSound("saltoWrong");
        this.playSound("error", { delay: 0.3 });

        // Destroy the pre-created near-edge deco (answer was wrong, no advance)
        this._destroyPendingNearDeco();

        this.sinkExtraPlatformsOnWrongAnswer(key);

        // En modo player la respuesta ya se notificó al pulsar (sin isCorrect)
        // y el avance entre preguntas lo controla el servidor vía goToQuestion;
        // hundimos la rana pero sin respawn ni avance de pregunta
        if (this.isMultiplayerPlayer) {
            this._playerSinkOnly(key);
            return;
        }

        if (this.onAnswer) {
            const answerIndex = this.answerOrder[key];
            this.onAnswer({
                type: "selection",
                answer: answerIndex,
                selectedOption: key,
            }, {
                isCorrect: false,
                questionIndexAnswer: this.getCurrentStoreIndex(),
                nextQuestionIndex: this.getNextStoreIndex(),
            });
        }

        this.animateSinking(key);
    }

    // Hundimiento visual de la rana sin el respawn ni el avance de pregunta.
    // Lo usa el player tras una respuesta incorrecta: el servidor controlará
    // la siguiente pregunta vía goToQuestion
    _playerSinkOnly(key) {
        const col = this.columns[key];
        if (!col) return;

        this.playSound("hundimiento", { volume: 0.3 });
        this.playSound("burbujas", { volume: 0.3, delay: 0.3 });

        col.head.shadow.setAlpha(0);
        col.headSprite.setScale(this.scalePlatform);
        col.headSprite.anims.play("hundimiento_agua");
        col.headSprite.once("animationcomplete", () => {
            col.headSprite.setAlpha(0);
        });

        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * this.scalePlatform,
            duration: DURATIONS.SINKING,
        });
    }

    // ─── Correct answer: sink wrong platforms ────────────────────────

    sinkWrongPlatforms(correctKey) {
        this.playSound("hundimiento");
        const scale = this.scalePlatform;
        const center = this.centerXMul;

        // Sink frogPad (where the frog was standing)
        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        // Sink the heads of wrong-answer columns + decos on the opposite side.
        // Same-side columns/decos keep their heads: they become the new A/B/C
        // or stay as decos after _advanceLateral.
        switch (correctKey) {
            case "A":
                // Opposite side = C-side (xMul > center)
                this.columns.C.sinkHead("hundimiento_platform", scale);
                for (const [xMul, col] of this.decoMap) {
                    if (xMul > center) col.sinkHead("hundimiento_platform", scale);
                }
                break;
            case "B":
                // Both sides sink
                this.columns.A.sinkHead("hundimiento_platform", scale);
                this.columns.C.sinkHead("hundimiento_platform", scale);
                this._sinkDecoHeads(scale);
                break;
            case "C":
                // Opposite side = A-side (xMul < center)
                this.columns.A.sinkHead("hundimiento_platform", scale);
                for (const [xMul, col] of this.decoMap) {
                    if (xMul < center) col.sinkHead("hundimiento_platform", scale);
                }
                break;
        }
    }

    // ─── Wrong answer: sink extra platforms ──────────────────────────

    sinkExtraPlatformsOnWrongAnswer(wrongKey) {
        this.playSound("hundimiento");
        const scale = this.scalePlatform;
        // const center = this.centerXMul;

        // Sink frogPad (where the frog was standing before jumping)
        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        // Sink column heads that won't be reused.
        // - The wrongKey column sinks separately via animateSinking (water anim).
        // - For lateral wrong answers (A/C): B stays visible — the frog
        //   respawns on it, so only the opposite lateral column sinks.
        // - For center wrong answer (B): both A and C sink.
        // All decos sink (everything resets on wrong answer).
        switch (wrongKey) {
            case "A":
                this.columns.C.sinkHead("hundimiento_platform", scale);
                break;
            case "B":
                // B is a full padSpacing above frog (two zigzag rows),
                // so 2 pads must sink per lateral column.
                this.columns.A.sinkHeads(2, "hundimiento_platform", scale);
                this.columns.C.sinkHeads(2, "hundimiento_platform", scale);
                break;
            case "C":
                this.columns.A.sinkHead("hundimiento_platform", scale);
                break;
        }

        this._sinkDecoHeads(scale, wrongKey === "B" ? 2 : 1);
    }

    // ─── Advance platforms (correct answer) ──────────────────────────

    advancePlatforms(key) {
        const scale = this.scalePlatform;
        const padSpacing = PAD_SPACING * scale;
        const offsetX = OFFSETS.X * scale;

        // Destroy old frogPad
        this._destroyPad(this.frogPad);

        if (key === "A" || key === "C") {
            this._advanceLateral(key, padSpacing, offsetX, scale);
        } else {
            this._advanceStraight(padSpacing, scale);
        }

        // Reposition all columns to correct positions for the new frog location.
        // FIFO shifts heads up by exactly padSpacing, but during lateral jumps
        // columns change their distance from center, so the brick-wall Y offsets
        // no longer match. This call normalises every column.
        this._repositionAllColumns(scale);

        this.updateTextPositions();
    }

    /**
     * Lateral jump (A or C): shift columns, reuse via camera follow.
     * Camera follows frog → old columns naturally appear at new X positions.
     * Y positions are corrected by _repositionAllColumns after this method.
     */
    _advanceLateral(key, padSpacing, offsetX, scale) {
        const dir = key === "A" ? -1 : 1;
        const oldA = this.columns.A;
        const oldB = this.columns.B;
        const oldC = this.columns.C;
        const chosen = key === "A" ? oldA : oldC;
        const opposite = key === "A" ? oldC : oldA;

        // 1. FIFO columns with sunk heads (opposite + opposite-side decos)
        //    Same-side decos also FIFO structurally (head scrolled off screen).
        this._fifoColumn(opposite, padSpacing, scale);
        for (const [, col] of this.decoMap) {
            this._fifoColumn(col, padSpacing, scale);
        }

        // 2. Chosen column head → frogPad, maintain column with new tail
        this.frogPad = chosen.dequeueHead();
        chosen.enqueueTail(padSpacing, scale);

        // 3. Shift center
        const oldCenter = this.centerXMul;
        this.centerXMul += dir;
        const center = this.centerXMul;

        // 4. Opposite column → decoMap (it scrolled to the far side)
        this.decoMap.set(oldCenter - dir, opposite);

        // 5. Pull old deco to become the new edge main column
        const edgeXMul = center + dir;
        const edgeCol = this.decoMap.get(edgeXMul);
        if (edgeCol) this.decoMap.delete(edgeXMul);

        // 6. Assign new column roles
        //    chosen → new B, oldB → opposite side, edgeCol → new edge
        if (key === "A") {
            this.columns = { A: edgeCol, B: chosen, C: oldB };
        } else {
            this.columns = { A: oldB, B: chosen, C: edgeCol };
        }

        // 7. Destroy the deco that scrolled off the far edge
        const farXMul = key === "A" ? center + SIDE_COLUMNS + 2 : center - SIDE_COLUMNS - 2;
        if (this.decoMap.has(farXMul)) {
            this.decoMap.get(farXMul).destroy();
            this.decoMap.delete(farXMul);
        }

        // 8. Near-edge deco: adopt pre-created column if available, else create fresh
        const nearXMul = key === "A" ? center - SIDE_COLUMNS - 1 : center + SIDE_COLUMNS + 1;
        if (this._pendingNearDeco && this._pendingNearDeco.xMul === nearXMul) {
            this.decoMap.set(nearXMul, this._pendingNearDeco.col);
            this._pendingNearDeco = null;
        } else {
            this._destroyPendingNearDeco();
            const nearDist = nearXMul - center;
            const frogX = this.frogPad.sprite.x;
            const frogY = this.frogPad.sprite.y;
            this.decoMap.set(nearXMul, LilyColumn.create(
                this,
                frogX + nearDist * offsetX,
                getColumnBaseY(frogY, nearDist, padSpacing),
                padSpacing, PAD_COUNT, scale,
            ));
        }
    }

    /**
     * Straight jump (B): no shift, all columns FIFO in place.
     */
    _advanceStraight(padSpacing, scale) {
        // ColB head → frogPad
        this.frogPad = this.columns.B.dequeueHead();
        this.columns.B.enqueueTail(padSpacing, scale);

        // ColA and ColC had sunk heads → FIFO
        this._fifoColumn(this.columns.A, padSpacing, scale);
        this._fifoColumn(this.columns.C, padSpacing, scale);

        // All decos: FIFO
        for (const [, col] of this.decoMap) {
            this._fifoColumn(col, padSpacing, scale);
        }
    }

    /**
     * Reposition every column (A, B, C and decorative) to the geometrically
     * correct position derived from the current frog position and the
     * brick-wall stagger pattern.  This is a no-op when positions already
     * match (e.g. after a straight jump) and essential after lateral jumps
     * where FIFO alone leaves columns at wrong Y offsets.
     */
    _repositionAllColumns(scale) {
        const frogX = this.frogPad.sprite.x;
        const frogY = this.frogPad.sprite.y;
        const offsetX = OFFSETS.X * scale;
        const padSpacing = PAD_SPACING * scale;

        this.columns.A.reposition(frogX - offsetX, frogY - padSpacing / 2, padSpacing, scale);
        this.columns.B.reposition(frogX, frogY - padSpacing, padSpacing, scale);
        this.columns.C.reposition(frogX + offsetX, frogY - padSpacing / 2, padSpacing, scale);

        const center = this.centerXMul;
        for (const [xMul, col] of this.decoMap) {
            const dist = xMul - center;
            const cx = frogX + dist * offsetX;
            const cy = getColumnBaseY(frogY, dist, padSpacing);
            col.reposition(cx, cy, padSpacing, scale);
        }

        // Also reposition the pre-created near-edge deco if it exists
        if (this._pendingNearDeco) {
            const dist = this._pendingNearDeco.xMul - center;
            const cx = frogX + dist * offsetX;
            const cy = getColumnBaseY(frogY, dist, padSpacing);
            this._pendingNearDeco.col.reposition(cx, cy, padSpacing, scale);
        }
    }

    // ─── Wrong answer: sinking animation ─────────────────────────────

    animateSinking(key) {
        const col = this.columns[key];

        this.playSound("hundimiento", { volume: 0.3 });
        this.playSound("burbujas", { volume: 0.3, delay: 0.3 });

        // Sink the pad where frog landed (column head) with water animation
        col.head.shadow.setAlpha(0);
        col.headSprite.setScale(this.scalePlatform);
        col.headSprite.anims.play("hundimiento_agua");

        col.headSprite.once("animationcomplete", () => {
            col.headSprite.setAlpha(0);
            this.respawnFrog(key);
        });

        // Fade out frog
        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * this.scalePlatform,
            duration: DURATIONS.SINKING,
        });
    }

    // ─── Respawn after wrong answer ──────────────────────────────────

    /**
     * @param {string|null} wrongKey - The column the frog jumped to (A/B/C),
     *   or null for timeout (frog didn't jump).
     *   - A/C: frog respawns on column B's head (which stayed visible).
     *   - B/null: frog respawns at the old frogPad position.
     */
    respawnFrog(wrongKey) {
        // If game-over was signalled by the framework (lives depleted),
        // skip respawn and play the game-over sequence instead.
        if (this._markedGameOver) {
            this.finish = true;
            this.playSound("gameOver");
            this.setAnswerElementsVisible(false);
            this.shore.destroy();

            const scale = this.scalePlatform;
            // Sink any remaining platforms
            for (const col of Object.values(this.columns)) {
                col.sinkAll("hundimiento_platform", scale);
            }
            for (const col of this.decoMap.values()) {
                col.sinkAll("hundimiento_platform", scale);
            }

            // Resolve the animateExit promise after the sinking plays out
            this.time.delayedCall(DURATIONS.SINKING, () => {
                if (this._onGameOverComplete) {
                    this._onGameOverComplete();
                    this._onGameOverComplete = null;
                }
            });
            return;
        }

        let respawnX, respawnY;

        if ((wrongKey === "A" || wrongKey === "C") && this.columns.B?.headSprite) {
            // Lateral miss → respawn on B's head (the pad that stayed visible)
            respawnX = this.columns.B.headX;
            respawnY = this.columns.B.headY;
        } else {
            // Center miss or timeout → respawn at old frogPad position
            respawnX = this.frogPad?.sprite?.x ?? this.rana.x;
            respawnY = this.frogPad?.sprite?.y ?? this.rana.y;
        }

        this.recreateAllPlatforms(respawnX, respawnY);

        // Fallo lateral en la penúltima pregunta: apartamos y subimos la isla
        // para que no tape el nenúfar donde reaparece la rana. El componente
        // guarda el offset y lo reaplica tras un resize.
        const shoreQuestionIndex = this.questions.length > 1
            ? this.questions.length - 2
            : 0;
        const isLateralMiss = wrongKey === "A" || wrongKey === "C";
        if (this.currentQuestionIndex === shoreQuestionIndex && isLateralMiss && this.shore.exists) {
            this.shore.applyLateralMissOffset({ scale: this.scalePlatform });
        }

        // Kill any active tweens on the frog (e.g., sinking scale tween)
        this.tweens.killTweensOf(this.rana);

        this.rana.setPosition(respawnX, respawnY);
        this.rana.setAlpha(0);
        this.rana.setScale(SCALES.FROG_BASE * this.scalePlatform);

        this.cameras.main.startFollow(
            this.rana,
            false,
            1,
            1,
            0,
            this.getCameraFollowOffsetY(this.scale.width, this.scale.height, this.scalePlatform),
        );

        this.tweens.add({
            targets: this.rana,
            alpha: 1,
            duration: 400,
            onComplete: () => {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= this.questions.length) {
                    // Place shore above frog for the victory animation
                    this.shore.placeAtFrog({ x: respawnX, y: respawnY, scale: this.scalePlatform });
                    this.gameWon();
                } else {
                    this.startQuestion();
                }
            },
        });
    }

    recreateAllPlatforms(frogX, frogY) {
        // Destroy everything
        this._destroyPad(this.frogPad);
        this._destroyPendingNearDeco();
        if (this.columns) {
            Object.values(this.columns).forEach((col) => col.destroy());
        }
        this._destroyDecoColumns();

        // Recreate at specified position
        const scale = this.scalePlatform;
        const padSpacing = PAD_SPACING * scale;
        const offsetX = OFFSETS.X * scale;

        this.frogPad = this._createPad(frogX, frogY, scale);
        this.columns = {
            A: LilyColumn.create(this, frogX - offsetX, frogY - padSpacing / 2, padSpacing, PAD_COUNT, scale),
            B: LilyColumn.create(this, frogX, frogY - padSpacing, padSpacing, PAD_COUNT, scale),
            C: LilyColumn.create(this, frogX + offsetX, frogY - padSpacing / 2, padSpacing, PAD_COUNT, scale),
        };

        this._createDecoColumns(frogX, frogY);
    }

    // ─── Timeout sinking ─────────────────────────────────────────────

    animateSinkingFromCurrent() {
        this.playSound("hundimiento", { volume: 0.3 });
        this.playSound("burbujas", { volume: 0.3, delay: 0.3 });

        const scale = this.scalePlatform;

        // Sink frogPad with water animation
        if (this.frogPad) {
            this.frogPad.shadow.setAlpha(0);
            this.frogPad.sprite.setScale(scale);
            this.frogPad.sprite.anims.play("hundimiento_agua");

            this.frogPad.sprite.once("animationcomplete", () => {
                this.frogPad.sprite.setAlpha(0);
                this.respawnFrog(null);
            });
        }

        // Sink all column heads (frog didn't jump, everything resets)
        this.playSound("hundimiento");
        this.columns.A.sinkHead("hundimiento_platform", scale);
        this.columns.B.sinkHead("hundimiento_platform", scale);
        this.columns.C.sinkHead("hundimiento_platform", scale);

        // Sink deco heads
        this._sinkDecoHeads(scale);

        // Fade out frog
        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * scale,
            duration: DURATIONS.SINKING,
        });
    }

    // ─── Game over ───────────────────────────────────────────────────

    triggerGameOver() {
        this.finish = true;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this.setAnswerElementsVisible(false);
        this.shore.destroy();

        this.playSound("gameOver");
        this.playSound("hundimiento");
        this.playSound("burbujas", { delay: 0.3 });

        this._destroyPendingNearDeco();

        const scale = this.scalePlatform;

        // Sink frogPad
        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        // Sink all columns
        for (const col of Object.values(this.columns)) {
            col.sinkAll("hundimiento_platform", scale);
        }
        for (const col of this.decoMap.values()) {
            col.sinkAll("hundimiento_platform", scale);
        }

        // Fade out frog
        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * scale,
            duration: DURATIONS.SINKING,
        });
    }

    // ─── Multimedia handling ──────────────────────────────────────────

    /**
     * Play audio from source
     */
    playAudio(source) {
        if (!source) return;

        // Check if audio is already loaded in Phaser
        const audioKey = `answer-audio-${source}`;
        if (this.sound.get(audioKey)) {
            this.sound.play(audioKey);
            return;
        }

        // Fallback: use HTML5 audio
        const audio = new Audio(source);
        audio.play().catch((err) => {
            console.error("Error playing audio:", err);
        });
    }

    /**
     * Show multimedia modal for long press on mobile
     */
    showMultimediaModal(multimedia) {
        if (!multimedia) return;

        // Create a simple overlay for mobile
        const isMobile = this.scale.isPortrait || this.scale.width < 768;
        if (!isMobile) return;

        if (multimedia.type === "audio") {
            // Show audio player or toast
            this.playAudio(multimedia.source);
        }
    }

    // ─── Victory ─────────────────────────────────────────────────────

    gameWon() {
        this.finish = true;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this.setAnswerElementsVisible(false);

        this.playSound("gameWin");
        this.playSound("croar");

        this.cameras.main.stopFollow(this.rana);

        const jumpHeight = this.lastHeight + 30;
        this.doVictoryJumps(8, jumpHeight);

        // Finish animating immediately so UI transitions to score screen
        // (victory jumps continue in background)
        this.time.delayedCall(50, () => {
            this.setAnimating(false);
        });

        // Resolve exit callback immediately to show score screen as rana jumps
        if (this._onGameOverComplete) {
            this._onGameOverComplete();
            this._onGameOverComplete = null;
        }
    }

    doVictoryJumps(count, height) {
        if (count <= 0) {
            return;
        }

        this.rana.anims.play("rana_salto");
        this.playSound("croar", { volume: 0.7 });
        this.playSound("salto", { volume: 0.7 });

        this.tweens.add({
            targets: this.rana,
            y: `-=${height}`,
            duration: DURATIONS.VICTORY_JUMP,
            onComplete: () => {
                this.doVictoryJumps(count - 1, height);
            },
        });
    }

    // ─── Public methods for React ────────────────────────────────────

    triggerTimeOut() {
        // En multijugador el servidor dispara el timeout vía React y puede
        // llegar antes de que create() haya construido las columnas (ready=false):
        // animateSinkingFromCurrent accedería a this.columns null y reventaría.
        if (!this.ready || this.moving || this.finish) return;

        this.moving = true;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this.disableInteraction();

        this.animateSinkingFromCurrent();
    }

    // ─── Utilities ───────────────────────────────────────────────────

    playSound(key, config = {}) {
        if (!this.soundEnabled || !this.sounds || !this.sounds[key]) return;
        // En multijugador (player) silenciamos los sonidos que delatan el
        // resultado a jugadores cercanos que todavía no hayan respondido.
        // La animación visual sigue activa.
        if (this.isMultiplayerPlayer && HINT_SOUNDS_MULTIPLAYER.has(key)) return;
        try {
            this.sounds[key].play(config);
        } catch {
            // Sound play failed, ignore
        }
    }

    setAnimating(isAnimating) {
        if (this.onAnimatingChange) {
            this.onAnimatingChange(isAnimating);
        }
    }

    setBankControl({ visible = true, offsetY = BANK.VISIBLE_OFFSET_Y } = {}) {
        if (this.onBankControl) {
            this.onBankControl({ visible, offsetY });
        }
    }

    /**
     * Called by the framework (via React) when lives reach 0.
     * Marks the game for a game-over sequence so respawnFrog can
     * handle it instead of showing the victory animation.
     * @param {Function} [onComplete] - Resolved when the game-over animation finishes.
     */
    setGameOver(onComplete) {
        this._markedGameOver = true;
        this._onGameOverComplete = onComplete || null;
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        // If the game already finished (e.g. won), resolve immediately.
        if (this.finish && onComplete) {
            onComplete();
            this._onGameOverComplete = null;
        }
    }

    // ─── Cleanup ─────────────────────────────────────────────────────

    destroy() {
        if (this._resizeRAF) {
            cancelAnimationFrame(this._resizeRAF);
            this._resizeRAF = null;
        }
        if (this._revalidationRAF) {
            cancelAnimationFrame(this._revalidationRAF);
            this._revalidationRAF = null;
        }

        try {
            this.shore.destroy();
            this.disableInteraction();
            this.setBankControl({ visible: true, offsetY: 0 });
        } catch {
            // Ignore errors during cleanup
        }

        if (this.keys) {
            try {
                for (const k of ["A", "B", "C", "LEFT", "UP", "RIGHT"]) {
                    if (this.keys[k]) this.keys[k].off("up");
                }
            } catch {
                // Ignore errors during cleanup
            }
        }
    }

    // Solo bloqueamos interacción: no pausamos tweens ni time para que las
    // animaciones de entrada de la siguiente pregunta puedan correr aunque el
    // jugador esté pausado a la espera del resto del grupo en multiplayer.
    pause() {
        this._paused = true;
        this.disableInteraction();
    }

    resume() {
        this._paused = false;
        if (!this.moving && !this.finish && this.columns) {
            this.enableInteraction();
        }
    }

    // Bloqueo de input mientras hay overlays React por encima (menú de
    // Settings). Se gestiona aparte de pause/resume porque éstos arrastran
    // semántica de "partida pausada" (clock, sync multijugador) que no
    // queremos disparar al abrir el menú.
    setUIBlocked(blocked) {
        const next = !!blocked;
        if (this._uiBlocked === next) return;
        this._uiBlocked = next;
        if (next) {
            this.disableInteraction();
        } else if (!this.moving && !this.finish && !this._paused && this.columns) {
            this.enableInteraction();
        }
    }
}
