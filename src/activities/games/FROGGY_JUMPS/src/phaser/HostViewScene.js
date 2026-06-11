import Phaser from "phaser";
import LilyColumn from "./LilyColumn";
import Shore from "./Shore";
import { shuffle } from "@educaplay/core";

// Constants
const DURATIONS = {
    JUMP: 750,
    ANSWER_CASCADE: 200,
    SINKING: 1500,
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

/**
 * Escena Phaser para la vista del HOST en multijugador.
 * Réplica visual de GameScene pero controlada externamente por el servidor:
 * - No avanza de pregunta por su cuenta (espera goToQuestion)
 * - No despacha onQuestionStart (el servidor ya sincroniza Redux)
 * - nextQuestionIndex siempre undefined en los callbacks
 */
export default class HostViewScene extends Phaser.Scene {
    constructor() {
        super({ key: "HostViewScene" });

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

        // Column-based layout
        this.frogPad = null; // { sprite, shadow }
        this.columns = null; // { A, B, C } shortcut refs
        this.decoMap = new Map(); // absolute xMul → LilyColumn (deco columns)
        this.centerXMul = 0; // absolute xMul where the frog (column B) is
        this._pendingNearDeco = null; // { xMul, col } pre-created before lateral jump

        // Shore / finish line (componente que gestiona la isla final)
        this.shore = null;

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

        // Reset state
        this.ready = false;
        this.moving = false;
        this.finish = false;
        // Arranque posicionado: tras un F5 el padre nos pasa
        // el índice de la pregunta abierta en el servidor para retomar ahí
        this.currentQuestionIndex = Number.isInteger(data.startIndex) ? data.startIndex : 0;
        this.lastHeight = undefined;
        this.shore = Shore.create(this);
        this._markedGameOver = false;
        this._onGameOverComplete = null;
        this.currentCorrectAnswers = [];

        this.answerOrder = {};

        // El primer startQuestion() viene desde create(): no debe ocultar el
        // banco, porque Bank.animateEntry ya lo está mostrando y haría destello.
        this._firstStartQuestion = true;
    }

    create() {
        this.setAnimating(true);

        this.createBackground();
        this.setupAudio();
        // Sincroniza el mute global del SoundManager con el flag inicial. Lo
        // mantiene React actualizado mediante setSoundEnabled() cuando el host
        // pulsa el botón de mute durante la partida
        this.sound.mute = !this.soundEnabled;
        this.createGameElements();
        this.setupResizeHandler();
        this.startQuestion();

        // Mark scene as ready so external callers (React) can safely
        // invoke methods like goToQuestion that depend on columns/state
        this.ready = true;
    }

    // Toggle desde React. Actualiza el flag local (cubre el guard de
    // playSound) y el mute global de Phaser (cubre cualquier sonido que se
    // dispare directamente vía this.sound)
    setSoundEnabled(enabled) {
        this.soundEnabled = !!enabled;
        if (this.sound) {
            this.sound.mute = !this.soundEnabled;
        }
    }

    // ─── Background ──────────────────────────────────────────────────

    createBackground() {
        this.background = null;
    }

    // ─── Audio ───────────────────────────────────────────────────────

    setupAudio() {
        // Siempre instanciamos los sonidos aunque arranquemos en mute: el
        // host puede reactivar el sonido durante la partida y necesitamos que
        // this.sounds esté listo. El silencio lo gestiona this.sound.mute
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

        // Initial resize
        this.resize();
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

    _preCreateNearEdgeDeco(key) {
        const scale = this.scalePlatform;
        const dir = key === "A" ? -1 : 1;
        const futureCenter = this.centerXMul + dir;
        const nearXMul = key === "A"
            ? futureCenter - SIDE_COLUMNS - 1
            : futureCenter + SIDE_COLUMNS + 1;

        if (this._pendingNearDeco?.xMul === nearXMul) return;
        if (this.decoMap.has(nearXMul)) return;

        const offsetX = OFFSETS.X * scale;
        const padSpacing = PAD_SPACING * scale;
        const nearDist = nearXMul - futureCenter;
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
        };

        const labelStyle = {
            fontSize: "20px",
            fontFamily: FONTS.UI,
            color: "#ffffff",
            fontStyle: "bold",
            fontWeight: 800,
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
            this.resize();
        });
    }

    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

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

        this.applyScales(scalePlatform);
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

        // Shore: el componente reancla la isla al nenúfar correcto y reaplica
        // los offsets de avance vigentes, reescalados al nuevo tamaño.
        this.shore.reposition({ scale });

        this.updateTextPositions();
    }

    updateTextPositions() {
        const labelOffset = this.lastHeight * 0.50;
        const fontScale = this.scalePlatform;
        const answerWrapWidth = Math.max(90, 150 * fontScale);
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
            const textYOffset = hasImage ? this.lastHeight * 0.34 : -this.lastHeight * 0.02;

            if (textObj && col) {
                // Align text to top of its container when image is present
                if (hasImage) {
                    textObj.setOrigin(0.5, 0);
                    textObj.setPosition(col.headX, col.headY + this.lastHeight * 0.16);
                    textObj.setLineSpacing(-5); // Reduce line height when image is present
                } else {
                    textObj.setOrigin(0.5, 0.5);
                    textObj.setPosition(col.headX, col.headY + textYOffset);
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
                    mm.setPosition(col.headX, col.headY);
                    mm.targetFitWidth = col.headSprite.displayWidth * 0.88;
                    mm.targetFitHeight = this.lastHeight * 1.0;
                    if (mm.alpha > 0 && mm.texture?.source?.[0]?.image) {
                        const img = mm.texture.source[0].image;
                        const scaleW = mm.targetFitWidth / img.naturalWidth;
                        const scaleH = mm.targetFitHeight / img.naturalHeight;
                        const fitScale = Math.min(scaleW, scaleH);
                        mm.setScale(fitScale);
                        mm.baseScale = fitScale;
                    }
                } else {
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
    }

    adjustAnswerFontSizes() {
        const answerTexts = [this.textA, this.textB, this.textC].filter(Boolean);
        if (answerTexts.length === 0) return;

        const maxTextWidth = Math.max(95, this.lastHeight * 0.9);
        const maxTextHeight = Math.max(44, this.lastHeight * 0.34);

        const fontSizes = answerTexts.map((textObj) => {
            let fontSize = parseInt(textObj.style.fontSize, 10);
            if (!Number.isFinite(fontSize)) {
                fontSize = Math.max(18, Math.round(28 * this.scalePlatform));
            }

            let iterations = 0;
            while (
                iterations < 18
                && (textObj.width > maxTextWidth || textObj.height > maxTextHeight)
                && fontSize > 15
            ) {
                fontSize -= 1;
                textObj.setFontSize(fontSize);
                iterations += 1;
            }

            return parseInt(textObj.style.fontSize, 10);
        });

        const unifiedFontSize = Math.min(...fontSizes);

        for (const textObj of answerTexts) {
            textObj.setFontSize(unifiedFontSize);
        }
    }

    updateColumnsMultimedia() {
        for (const key of ["A", "B", "C"]) {
            const answer = this.currentAnswers[key];
            if (!answer) continue;

            const multimedia = answer.source && answer.type
                ? { source: answer.source, type: answer.type }
                : null;

            this.columns[key].updateHeadMultimedia(multimedia);
        }
    }

    destroyAllMultimedia() {
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

        // El servidor ya sincroniza Redux; no llamamos a onQuestionStart

        const question = this.getCurrentQuestion();
        if (!question) return;

        if (!this._firstStartQuestion) {
            this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        }
        this._firstStartQuestion = false;

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

        // La isla final cae desde arriba en la penúltima pregunta. En la última
        // ya está colocada y, como la rana resetea a la posición canónica entre
        // preguntas (a diferencia de single-player, donde la cámara la sigue),
        // simulamos el avance apartando la isla del lado de la respuesta correcta
        // y subiéndola al instante con los offsets de avance.
        const shoreQuestionIndex = this.questions.length > 1
            ? this.questions.length - 2
            : 0;
        if (this.currentQuestionIndex === shoreQuestionIndex) {
            this.shore.appearInDistance({ scale: this.scalePlatform });
        } else if (this.currentQuestionIndex > shoreQuestionIndex) {
            this.shore.settleAt({
                scale: this.scalePlatform,
                useAdvanceOffsets: true,
                animate: false,
            });
        }

        // El sonido de intro lo dispara React cuando el banco se mueve del centro
        // a su posición en el juego (transición QUESTION_STATEMENT → GAME_VIEW)
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
        const duration = DURATIONS.ANSWER_CASCADE;
        const startOffset = 1000;

        for (const key of ["A", "B", "C"]) {
            const col = this.columns[key];
            const answer = this.currentAnswers[key];
            const hasImage = answer?.source && (answer.type === "image" || answer.type?.startsWith("image/"));
            const textYOffset = hasImage ? this.lastHeight * 0.34 : -this.lastHeight * 0.02;

            if (hasImage) {
                this[`text${key}`].setOrigin(0.5, 0);
                this[`text${key}`].y = col.headY + this.lastHeight * 0.16 - startOffset;
            } else {
                this[`text${key}`].setOrigin(0.5, 0.5);
                this[`text${key}`].y = col.headY + textYOffset - startOffset;
            }
            this[`label${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
            this[`labelBg${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
            this[`labelShadow${key}`].y = col.headY - this.lastHeight * 0.50 - startOffset;
        }

        this.textA.setText(this.formatAnswerText(this.currentAnswers.A?.answer));
        this.textB.setText(this.formatAnswerText(this.currentAnswers.B?.answer));
        this.textC.setText(this.formatAnswerText(this.currentAnswers.C?.answer));

        this.adjustAnswerFontSizes();

        this.setAnswerElementsVisible(true);

        // Cascade A → B → C
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

    // ─── Correct answer: sink wrong platforms ────────────────────────

    sinkWrongPlatforms(correctKey) {
        this.playSound("hundimiento");
        const scale = this.scalePlatform;
        const center = this.centerXMul;

        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        switch (correctKey) {
            case "A":
                this.columns.C.sinkHead("hundimiento_platform", scale);
                for (const [xMul, col] of this.decoMap) {
                    if (xMul > center) col.sinkHead("hundimiento_platform", scale);
                }
                break;
            case "B":
                this.columns.A.sinkHead("hundimiento_platform", scale);
                this.columns.C.sinkHead("hundimiento_platform", scale);
                this._sinkDecoHeads(scale);
                break;
            case "C":
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

        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        switch (wrongKey) {
            case "A":
                this.columns.C.sinkHead("hundimiento_platform", scale);
                break;
            case "B":
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

        this._destroyPad(this.frogPad);

        if (key === "A" || key === "C") {
            this._advanceLateral(key, padSpacing, offsetX, scale);
        } else {
            this._advanceStraight(padSpacing, scale);
        }

        this._repositionAllColumns(scale);
        this.updateTextPositions();
    }

    _advanceLateral(key, padSpacing, offsetX, scale) {
        const dir = key === "A" ? -1 : 1;
        const oldA = this.columns.A;
        const oldB = this.columns.B;
        const oldC = this.columns.C;
        const chosen = key === "A" ? oldA : oldC;
        const opposite = key === "A" ? oldC : oldA;

        this._fifoColumn(opposite, padSpacing, scale);
        for (const [, col] of this.decoMap) {
            this._fifoColumn(col, padSpacing, scale);
        }

        this.frogPad = chosen.dequeueHead();
        chosen.enqueueTail(padSpacing, scale);

        const oldCenter = this.centerXMul;
        this.centerXMul += dir;
        const center = this.centerXMul;

        this.decoMap.set(oldCenter - dir, opposite);

        const edgeXMul = center + dir;
        const edgeCol = this.decoMap.get(edgeXMul);
        if (edgeCol) this.decoMap.delete(edgeXMul);

        if (key === "A") {
            this.columns = { A: edgeCol, B: chosen, C: oldB };
        } else {
            this.columns = { A: oldB, B: chosen, C: edgeCol };
        }

        const farXMul = key === "A" ? center + SIDE_COLUMNS + 2 : center - SIDE_COLUMNS - 2;
        if (this.decoMap.has(farXMul)) {
            this.decoMap.get(farXMul).destroy();
            this.decoMap.delete(farXMul);
        }

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

    _advanceStraight(padSpacing, scale) {
        this.frogPad = this.columns.B.dequeueHead();
        this.columns.B.enqueueTail(padSpacing, scale);

        this._fifoColumn(this.columns.A, padSpacing, scale);
        this._fifoColumn(this.columns.C, padSpacing, scale);

        for (const [, col] of this.decoMap) {
            this._fifoColumn(col, padSpacing, scale);
        }
    }

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

        col.head.shadow.setAlpha(0);
        col.headSprite.setScale(this.scalePlatform);
        col.headSprite.anims.play("hundimiento_agua");

        col.headSprite.once("animationcomplete", () => {
            col.headSprite.setAlpha(0);
            this.respawnFrog(key);
        });

        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * this.scalePlatform,
            duration: DURATIONS.SINKING,
        });
    }

    // ─── Respawn after wrong answer ──────────────────────────────────

    respawnFrog(wrongKey) {
        if (this._markedGameOver) {
            this.finish = true;
            this.playSound("gameOver");
            this.setAnswerElementsVisible(false);
            this.shore.destroy();

            const scale = this.scalePlatform;
            for (const col of Object.values(this.columns)) {
                col.sinkAll("hundimiento_platform", scale);
            }
            for (const col of this.decoMap.values()) {
                col.sinkAll("hundimiento_platform", scale);
            }

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
            respawnX = this.columns.B.headX;
            respawnY = this.columns.B.headY;
        } else {
            respawnX = this.frogPad?.sprite?.x ?? this.rana.x;
            respawnY = this.frogPad?.sprite?.y ?? this.rana.y;
        }

        this.recreateAllPlatforms(respawnX, respawnY);

        const shoreQuestionIndex = this.questions.length > 1
            ? this.questions.length - 2
            : 0;
        const isLateralMiss = wrongKey === "A" || wrongKey === "C";
        if (this.currentQuestionIndex === shoreQuestionIndex && isLateralMiss && this.shore.exists) {
            this.shore.applyLateralMissOffset({ scale: this.scalePlatform });
        }

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
                    this.shore.placeAtFrog({ x: respawnX, y: respawnY, scale: this.scalePlatform });
                    this.gameWon();
                } else {
                    this.startQuestion();
                }
            },
        });
    }

    recreateAllPlatforms(frogX, frogY) {
        this._destroyPad(this.frogPad);
        this._destroyPendingNearDeco();
        if (this.columns) {
            Object.values(this.columns).forEach((col) => col.destroy());
        }
        this._destroyDecoColumns();

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

        if (this.frogPad) {
            this.frogPad.shadow.setAlpha(0);
            this.frogPad.sprite.setScale(scale);
            this.frogPad.sprite.anims.play("hundimiento_agua");

            this.frogPad.sprite.once("animationcomplete", () => {
                this.frogPad.sprite.setAlpha(0);
                this.respawnFrog(null);
            });
        }

        this.playSound("hundimiento");
        this.columns.A.sinkHead("hundimiento_platform", scale);
        this.columns.B.sinkHead("hundimiento_platform", scale);
        this.columns.C.sinkHead("hundimiento_platform", scale);

        this._sinkDecoHeads(scale);

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

        this._sinkPad(this.frogPad, "hundimiento_platform", scale);

        for (const col of Object.values(this.columns)) {
            col.sinkAll("hundimiento_platform", scale);
        }
        for (const col of this.decoMap.values()) {
            col.sinkAll("hundimiento_platform", scale);
        }

        this.tweens.add({
            targets: this.rana,
            alpha: 0,
            scale: 0.8 * SCALES.FROG_BASE * scale,
            duration: DURATIONS.SINKING,
        });
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

        this.time.delayedCall(50, () => {
            this.setAnimating(false);
        });

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

    // Llamado desde React cuando el servidor cierra la pregunta (phase=closed,
    // todos los players han contestado). La rana del host salta hacia la
    // respuesta correcta y se hunden las plataformas erróneas. No avanza de
    // pregunta: eso lo controla el servidor vía goToQuestion.
    playCorrectAnswerAnimation() {
        if (this.finish || this.moving) return;
        if (!this.currentAnswers || !this.currentCorrectAnswers) return;

        const correctKey = Object.keys(this.currentAnswers).find((k) => {
            const answer = this.currentAnswers[k];
            return answer && this.currentCorrectAnswers.includes(answer.id);
        });
        if (!correctKey) return;

        this.moving = true;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });
        this._animateCorrectJump(correctKey);
    }

    _animateCorrectJump(key) {
        const col = this.columns[key];
        if (!col) return;
        const targetX = col.headX;
        const targetY = col.headY;
        const angle = key === "A" ? -45 : key === "C" ? 45 : 0;

        this.playSound("salto", { delay: 0.2 });

        this.setAnswerElementsVisible(false);
        this.destroyAllMultimedia();

        // Pre-crear columna deco del borde lejano para que aparezca cuando la
        // cámara la revele durante el salto lateral
        if (key === "A" || key === "C") {
            this._preCreateNearEdgeDeco(key);
        }

        this.rana.angle = angle;
        this.rana.anims.play("rana_salto");

        this.tweens.add({
            targets: this.rana,
            x: targetX,
            y: targetY,
            duration: DURATIONS.JUMP,
            onComplete: () => {
                this.rana.angle = 0;
                this.playSound("saltoOk");
                this.playSound("coin");
                this.sinkWrongPlatforms(key);
                this.setAnimating(false);
            },
        });
    }

    triggerTimeOut() {
        // En multijugador el servidor dispara el timeout vía React y puede
        // llegar antes de que create() haya construido las columnas (ready=false):
        // animateSinkingFromCurrent accedería a this.columns null y reventaría.
        if (!this.ready || this.moving || this.finish) return;

        this.moving = true;
        this.setAnimating(true);
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        this.animateSinkingFromCurrent();
    }

    // ─── Utilities ───────────────────────────────────────────────────

    playSound(key, config = {}) {
        if (!this.soundEnabled || !this.sounds || !this.sounds[key]) return;
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

    setGameOver(onComplete) {
        this._markedGameOver = true;
        this._onGameOverComplete = onComplete || null;
        this.setBankControl({ visible: false, offsetY: BANK.HIDDEN_OFFSET_Y });

        if (this.finish && onComplete) {
            onComplete();
            this._onGameOverComplete = null;
        }
    }

    // ─── Cleanup ─────────────────────────────────────────────────────

    destroy() {
        try {
            this.shore.destroy();
            this.setBankControl({ visible: true, offsetY: 0 });
        } catch {
            // Ignore errors during cleanup
        }
    }

    // No-op: en la vista del host no queremos congelar tweens ni time para que
    // las animaciones de entrada sigan corriendo durante la pausa.
    pause() {}

    resume() {}
}
