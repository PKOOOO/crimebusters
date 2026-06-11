/**
 * LilyColumn – A vertical FIFO column of lily pads.
 *
 * pad[0] = bottom pad (head, the interactive one)
 * pad[1..N-1] = decorative pads stacked above
 *
 * Each pad = { sprite: Phaser.GameObjects.Sprite, shadow: Phaser.GameObjects.Image, multimedia: ... }
 */

const SHADOW_OFFSET = 10;
const PLATFORM_BASE_SCALE = 0.1953125;

export default class LilyColumn {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} cx - X position of column base (head pad)
     * @param {number} cy - Y position of column base (head pad)
     * @param {number} padSpacing - Vertical distance between pads (scaled)
     * @param {number} count - Number of pads to create
     * @param {number} scale - Current viewport scale factor
     * @param {Object} headMultimedia - Multimedia data for head pad { source, type }
     */
    constructor(scene, cx, cy, padSpacing, count, scale, headMultimedia = null) {
        this.scene = scene;
        this._pads = [];

        const platformScale = PLATFORM_BASE_SCALE * scale;
        const shadowOff = SHADOW_OFFSET * scale;

        for (let i = 0; i < count; i++) {
            const y = cy - i * padSpacing;
            const shadow = scene.add
                .image(cx, y + shadowOff, "platform-shadow")
                .setScale(scale);
            const sprite = scene.add
                .sprite(cx, y, "platform")
                .setScale(platformScale);

            // Add multimedia element to head pad only
            let multimedia = null;
            if (i === 0 && headMultimedia) {
                multimedia = this._createMultimediaElement(
                    cx,
                    y,
                    scale,
                    headMultimedia
                );
            }

            this._pads.push({ sprite, shadow, multimedia });
        }
    }

    /**
     * Create a multimedia element (image/audio) for a pad
     */
    _createMultimediaElement(x, y, scale, { source, type }) {
        if (!source || !type) return null;

        if (type === "image" || type === "image/jpeg" || type === "image/png" || type === "image/gif") {
            // Create a graphics object as placeholder while image loads
            let multimedia = null;
            // Usamos la URL como clave de textura para que la misma imagen no se
            // descargue y se suba a la GPU una y otra vez en cada cambio de
            // pregunta (antes se generaba una clave aleatoria, lo que invalidaba
            // el cache de `textures.exists(source)` y duplicaba la textura en VRAM
            // en cada `updateHeadMultimedia`). Es especialmente importante en
            // multiplayer donde recorremos muchas preguntas por partida.
            const textureKey = source;
            const baseScale = PLATFORM_BASE_SCALE * scale * 0.60;

            // Try to load as Phaser texture first
            if (!this.scene.textures.exists(textureKey)) {
                // Create a simple HTML Image and add it as texture
                multimedia = this.scene.add.image(x, y, textureKey)
                    .setScale(baseScale)
                    .setDepth(5)
                    .setOrigin(0.5)
                    .setAlpha(0);

                // Store the original scale to prevent stacking on repeated hovers
                multimedia.baseScale = baseScale;

                // Load image from source
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    if (this.scene?.textures && multimedia?.scene?.sys) {
                        // Si otro pad cargó la misma URL en paralelo y ya
                        // registró la textura, evitamos volver a añadirla
                        if (!this.scene.textures.exists(textureKey)) {
                            this.scene.textures.addImage(textureKey, img);
                        }
                        multimedia.setTexture(textureKey);
                        if (multimedia.targetFitWidth && img.naturalWidth && img.naturalHeight) {
                            const scaleW = multimedia.targetFitWidth / img.naturalWidth;
                            const scaleH = multimedia.targetFitHeight / img.naturalHeight;
                            const fitScale = Math.min(scaleW, scaleH);
                            multimedia.setScale(fitScale);
                            multimedia.baseScale = fitScale;
                        }
                        multimedia.setAlpha(1);
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${source}`);
                };
                img.src = source;
            } else {
                // Texture already exists, use it directly
                multimedia = this.scene.add.image(x, y, textureKey)
                    .setScale(baseScale)
                    .setDepth(5)
                    .setOrigin(0.5);
            }

            if (multimedia) {
                multimedia.source = source;
                multimedia.type = type;
                multimedia.baseScale = PLATFORM_BASE_SCALE * scale * 0.60;
            }

            return multimedia;
        } else if (type === "audio" || type === "audio/mpeg" || type === "audio/mp3") {
            // Store audio metadata in pad
            return {
                type: "audio",
                source,
                isPlaying: false,
            };
        }

        return null;
    }

    // --- Properties ---

    get head() {
        return this._pads[0] || null;
    }

    get headSprite() {
        return this._pads[0]?.sprite || null;
    }

    get headX() {
        return this._pads[0]?.sprite.x;
    }

    get headY() {
        return this._pads[0]?.sprite.y;
    }

    get padCount() {
        return this._pads.length;
    }

    get headMultimedia() {
        return this._pads[0]?.multimedia || null;
    }

    // --- FIFO operations ---

    /**
     * Remove and return the bottom pad (head).
     * After this, pad[1] becomes the new head.
     */
    dequeueHead() {
        if (this._pads.length === 0) return null;
        return this._pads.shift();
    }

    /**
     * Create a new pad at the top of the column (above the current last pad).
     */
    enqueueTail(padSpacing, scale) {
        if (this._pads.length === 0) return;

        const lastPad = this._pads[this._pads.length - 1];
        const x = lastPad.sprite.x;
        const y = lastPad.sprite.y - padSpacing;
        const shadowOff = SHADOW_OFFSET * scale;
        const platformScale = PLATFORM_BASE_SCALE * scale;

        const shadow = this.scene.add
            .image(x, y + shadowOff, "platform-shadow")
            .setScale(scale);
        const sprite = this.scene.add
            .sprite(x, y, "platform")
            .setScale(platformScale);
        this._pads.push({ sprite, shadow });
    }

    // --- Positioning ---

    /**
     * Reposition all pads in the column to new coordinates and scale.
     */
    reposition(cx, cy, padSpacing, scale) {
        const shadowOff = SHADOW_OFFSET * scale;
        const platformScale = PLATFORM_BASE_SCALE * scale;

        for (let i = 0; i < this._pads.length; i++) {
            const y = cy - i * padSpacing;
            const pad = this._pads[i];
            pad.sprite.setPosition(cx, y);
            pad.sprite.setScale(platformScale);
            pad.shadow.setPosition(cx, y + shadowOff);
            pad.shadow.setScale(scale);
        }
    }

    // --- Animation ---

    /**
     * Sink the head pad with a given animation key.
     * Returns a Promise that resolves when the animation completes.
     */
    sinkHead(animKey = "hundimiento_platform", scale) {
        return this.sinkHeads(1, animKey, scale);
    }

    /**
     * Sink the first `count` pads (from the head upwards).
     * Returns a Promise that resolves when all animations complete.
     */
    sinkHeads(count, animKey = "hundimiento_platform", scale) {
        const promises = [];
        for (let i = 0; i < count && i < this._pads.length; i++) {
            const pad = this._pads[i];
            if (!pad) continue;
            pad.shadow.setAlpha(0);
            promises.push(new Promise((resolve) => {
                if (scale !== undefined) {
                    pad.sprite.setScale(scale);
                }
                pad.sprite.anims.play(animKey);
                pad.sprite.once("animationcomplete", () => {
                    pad.sprite.setAlpha(0);
                    resolve();
                });
            }));
        }
        return Promise.all(promises);
    }

    /**
     * Sink all pads in the column with the given animation.
     */
    sinkAll(animKey = "hundimiento_platform", scale) {
        for (const pad of this._pads) {
            pad.shadow.setAlpha(0);
            if (pad.sprite && pad.sprite.anims && pad.sprite.alpha > 0) {
                if (scale !== undefined) {
                    pad.sprite.setScale(scale);
                }
                pad.sprite.anims.play(animKey);
                pad.sprite.once("animationcomplete", () => {
                    pad.sprite.setAlpha(0);
                });
            }
        }
    }

    // --- Lifecycle ---

    /**
     * Destroy all pads in the column (stops animations, kills tweens).
     */
    destroy() {
        for (const pad of this._pads) {
            if (pad.sprite) {
                this.scene.tweens.killTweensOf(pad.sprite);
                if (pad.sprite.anims && pad.sprite.anims.isPlaying) {
                    // Liberar sprite para que termine su animación
                    const sprite = pad.sprite;
                    sprite.once("animationcomplete", () => sprite.destroy());
                } else {
                    if (pad.sprite.anims) pad.sprite.anims.stop();
                    pad.sprite.destroy();
                }
            }
            if (pad.shadow) {
                this.scene.tweens.killTweensOf(pad.shadow);
                pad.shadow.destroy();
            }
            if (pad.multimedia) {
                if (pad.multimedia.destroy) {
                    // Image object
                    this.scene.tweens.killTweensOf(pad.multimedia);
                    pad.multimedia.destroy();
                }
                // Audio objects don't have destroy, just clear reference
            }
        }
        this._pads = [];
    }

    /**
     * Update multimedia on head pad
     */
    updateHeadMultimedia(headMultimedia) {
        if (this._pads.length === 0) return;

        const headPad = this._pads[0];

        // Destroy existing multimedia if any
        if (headPad.multimedia) {
            if (headPad.multimedia.destroy) {
                this.scene.tweens.killTweensOf(headPad.multimedia);
                headPad.multimedia.destroy();
            }
            headPad.multimedia = null;
        }

        // Create new multimedia
        if (headMultimedia) {
            const scale = this.scene.scalePlatform || 1;
            headPad.multimedia = this._createMultimediaElement(
                headPad.sprite.x,
                headPad.sprite.y,
                scale,
                headMultimedia
            );
        }
    }

    // --- Factory ---

    static create(scene, cx, cy, padSpacing, count, scale, headMultimedia = null) {
        return new LilyColumn(scene, cx, cy, padSpacing, count, scale, headMultimedia);
    }
}
