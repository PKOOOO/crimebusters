import Phaser from "phaser";

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: "PreloadScene" });
    }

    init(data) {
        this.assetsUrl = data.assetsUrl;
        this.onProgress = data.onProgress;
        this.onComplete = data.onComplete;
    }

    preload() {
        // Progress callback
        this.load.on("progress", (value) => {
            if (this.onProgress) {
                this.onProgress(value);
            }
        });

        // Load images
        this.load.image(
            "background",
            this.assetsUrl("FROGGY_JUMPS/background.png"),
        );
        this.load.image(
            "platform-shadow",
            this.assetsUrl("FROGGY_JUMPS/platform-shadow.png"),
        );
        this.load.image("suelo", this.assetsUrl("FROGGY_JUMPS/suelo.png"));

        this.load.image("platform", this.assetsUrl("FROGGY_JUMPS/platform.png"));

        this.load.spritesheet("rana", this.assetsUrl("FROGGY_JUMPS/rana.png"), {
            frameWidth: 299,
            frameHeight: 640,
        });

        this.load.spritesheet(
            "hundimiento",
            this.assetsUrl("FROGGY_JUMPS/hundimiento.png"),
            {
                frameWidth: 260,
                frameHeight: 260,
            },
        );

        this.load.spritesheet(
            "hundimiento-platform",
            this.assetsUrl("FROGGY_JUMPS/hundimiento2.png"),
            {
                frameWidth: 260,
                frameHeight: 260,
            },
        );

        // Load audio
        this.load.audio(
            "saltoAudio",
            this.assetsUrl("FROGGY_JUMPS/salto2.mp3"),
        );
        this.load.audio(
            "croarAudio",
            this.assetsUrl("FROGGY_JUMPS/croar.mp3"),
        );
        this.load.audio(
            "introAudio",
            this.assetsUrl("common/intro.mp3"),
        );
        this.load.audio("overAudio", this.assetsUrl("FROGGY_JUMPS/over.mp3"));
        this.load.audio(
            "pressOkAudio",
            this.assetsUrl("FROGGY_JUMPS/on_press_ok.mp3"),
        );
        this.load.audio(
            "pressWrongAudio",
            this.assetsUrl("FROGGY_JUMPS/on_press_wrong.mp3"),
        );
        this.load.audio(
            "saltoContactOkAudio",
            this.assetsUrl("FROGGY_JUMPS/salto_pisa_ok.mp3"),
        );
        this.load.audio(
            "saltoContactWrongAudio",
            this.assetsUrl("FROGGY_JUMPS/salto_pisa_wrong.mp3"),
        );
        this.load.audio(
            "hundimientoContactAudio",
            this.assetsUrl("FROGGY_JUMPS/hundimiento_impacto-agua.mp3"),
        );
        this.load.audio(
            "burbujasAudio",
            this.assetsUrl("FROGGY_JUMPS/hundimiento_burbujas.mp3"),
        );
        this.load.audio(
            "errorAudio",
            this.assetsUrl("FROGGY_JUMPS/error.mp3"),
        );
        this.load.audio("coin", this.assetsUrl("FROGGY_JUMPS/coin.mp3"));
        this.load.audio(
            "game_Win",
            this.assetsUrl("FROGGY_JUMPS/game_win.mp3"),
        );
        this.load.audio(
            "game_Over",
            this.assetsUrl("FROGGY_JUMPS/game_over.mp3"),
        );
    }

    create() {
        // Create animations
        this.anims.create({
            key: "rana_salto",
            frames: this.anims.generateFrameNumbers("rana", {
                frames: [1, 2, 3, 3, 4, 5, 0],
            }),
            duration: 1000,
        });

        this.anims.create({
            key: "hundimiento_platform",
            frames: this.anims.generateFrameNumbers("hundimiento-platform", {
                frames: [0, 1, 2, 3, 4, 5, 6, 7],
            }),
            duration: 2500,
        });

        this.anims.create({
            key: "hundimiento_agua",
            frames: this.anims.generateFrameNumbers("hundimiento", {
                frames: [0, 1, 2, 3, 4, 5, 6, 7],
            }),
            duration: 2000,
        });

        // Notify PhaserGame.jsx that preload is complete
        // It will stop this scene and start GameScene with the required data
        if (this.onComplete) {
            this.onComplete();
        }
    }
}
