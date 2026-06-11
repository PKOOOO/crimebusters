/* eslint-disable no-unused-vars */
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import Phaser from "phaser";
import PreloadScene from "./phaser/PreloadScene";
import GameScene from "./phaser/GameScene";
import HostViewScene from "./phaser/HostViewScene";

// Module-level state to survive StrictMode unmount/remount cycle
let pendingDestroy = null;
let cachedGame = null;
let cachedGameScene = null;
let cachedInitTimeout = null;
let cachedPreloadDone = false;
let cachedGameSceneStarted = false;

const PhaserGame = forwardRef(function PhaserGame(
  {
    questions,
    onAnswer,
    onAnimatingChange,
    onQuestionStart,
    onBankControl,
    assetsUrl,
    soundEnabled = true,
    randomizeAnswers = true,
    play = false,
    startIndex = 0,
    isHost = false,
    isPlayer = false,
    uiBlocked = false,
  },
  ref,
) {

  const containerRef = useRef(null);
  // Si llega un goToQuestion antes de que la escena haya ejecutado create(),
  // lo guardamos aquí para aplicarlo cuando la escena esté lista
  const pendingGoToQuestionRef = useRef(null);
  // Índice con el que se arrancó la escena. El primer goToQuestion que
  // coincida con él se ignora: es el useEffect[currentIndex] de Game.jsx
  // sincronizando Redux→Phaser sobre un estado ya correcto, y disparar
  // goToQuestion provocaría un destroy/recreate visible (destello del banco).
  const startedAtIndexRef = useRef(null);
  const gameRef = useRef(null);

  // Latest props that tryStartGameScene needs at the moment of starting.
  // Updated on every render to avoid stale closures from the deferred init timeout.
  const latestPropsRef = useRef({
    questions,
    onAnswer,
    onAnimatingChange,
    onQuestionStart,
    onBankControl,
    assetsUrl,
    soundEnabled,
    randomizeAnswers,
    play,
    startIndex,
    isHost,
    isPlayer,
  });
  latestPropsRef.current = {
    questions,
    onAnswer,
    onAnimatingChange,
    onQuestionStart,
    onBankControl,
    assetsUrl,
    soundEnabled,
    randomizeAnswers,
    play,
    startIndex,
    isHost,
    isPlayer,
  };

  // Idempotent: arranca GameScene solo cuando todas las precondiciones se cumplen.
  // Se llama desde varios sitios (fin de preload, cambio de play) y cada uno
  // ignora si todavía falta algo.
  const tryStartGameScene = useCallback(() => {
    if (!cachedPreloadDone) return;          // preload no terminado
    if (cachedGameSceneStarted) return;      // ya arrancada
    if (!cachedGame) return;                 // sin instancia (cleanup en curso)
    const props = latestPropsRef.current;
    if (!props.play) return;                 // el padre aún no dio "play"

    cachedGameSceneStarted = true;
    // Posición inicial: o la encolada por un goToQuestion externo (caso F5 en
    // multijugador, que pide la pregunta en curso antes de que exista la
    // escena), o el startIndex pasado por el padre. Se inyecta en scene.start
    // porque Phaser ejecuta create() de forma síncrona desde aquí, así que
    // cualquier listener registrado después llegaría tarde.
    const initialIndex = pendingGoToQuestionRef.current ?? props.startIndex ?? 0;
    pendingGoToQuestionRef.current = null;
    startedAtIndexRef.current = initialIndex;
    const sceneKey = props.isHost ? "HostViewScene" : "GameScene";
    cachedGame.scene.start(sceneKey, {
      questions: props.questions,
      onAnswer: props.onAnswer,
      onAnimatingChange: props.onAnimatingChange,
      onQuestionStart: props.onQuestionStart,
      onBankControl: props.onBankControl,
      soundEnabled: props.soundEnabled,
      randomizeAnswers: props.randomizeAnswers,
      startIndex: initialIndex,
      isMultiplayerPlayer: props.isPlayer,
    });

  }, []);

  useImperativeHandle(ref, () => ({
    triggerTimeOut: () => {
      cachedGameScene?.triggerTimeOut?.();
    },
    setGameOver: (onComplete) => {
      if (cachedGameScene) {
        cachedGameScene.setGameOver(onComplete);
      } else if (onComplete) {
        onComplete();
      }
    },
    pause: () => {
      cachedGameScene?.pause?.();
    },
    resume: () => {
      cachedGameScene?.resume?.();
    },
    // Salto directo a una pregunta. Lo usa el host para seguir el estado del
    // backend y el player tras un F5 para reanudar. Si la escena aún no
    // está lista (preload o create() en curso), encolamos.
    goToQuestion: (index) => {
      if (!cachedGameSceneStarted || !cachedGameScene?.ready) {
        pendingGoToQuestionRef.current = index;
        return;
      }
      // Ignorar la primera llamada que coincide con el índice de arranque:
      // la escena ya está posicionada ahí, y un goToQuestion redundante
      // destruiría y recrearía todo (causa destello del banco al salir del Lobby).
      if (startedAtIndexRef.current !== null && startedAtIndexRef.current === index) {
        startedAtIndexRef.current = null;
        return;
      }
      startedAtIndexRef.current = null;
      cachedGameScene.goToQuestion?.(index);
    },
    getScene: () => cachedGameScene,
    // En multijugador (player) la animación de la rana se difiere hasta que
    // todos hayan contestado. Esta llamada la ejecuta cuando el servidor cierra
    // la pregunta, usando la respuesta que el jugador eligió y la validación
    // autoritativa del backend.
    playPendingAnswerAnimation: (isCorrect) => {
      cachedGameScene?.playPendingAnswerAnimation?.(isCorrect);
    },
    // En multijugador (host) la rana salta hacia la respuesta correcta cuando
    // el servidor cierra la pregunta (todos han contestado)
    playCorrectAnswerAnimation: () => {
      cachedGameScene?.playCorrectAnswerAnimation?.();
    },
    destroy: () => {
      if (cachedInitTimeout) {
        clearTimeout(cachedInitTimeout);
        cachedInitTimeout = null;
      }
      if (pendingDestroy) {
        clearTimeout(pendingDestroy);
        pendingDestroy = null;
      }
      if (gameRef.current) {
        const listeners = gameRef.current.__resizeListeners;
        if (listeners) {
          try { listeners.runtimeObserver?.disconnect(); } catch { /* ignore */ }
          try {
            window.removeEventListener("orientationchange", listeners.onOrientationChange);
          } catch { /* ignore */ }
          try {
            if (window.visualViewport && listeners.onVisualViewportResize) {
              window.visualViewport.removeEventListener("resize", listeners.onVisualViewportResize);
            }
          } catch { /* ignore */ }
          listeners.cancel?.();
          gameRef.current.__resizeListeners = null;
        }
        gameRef.current.destroy(true);
        gameRef.current = null;
        cachedGame = null;
        cachedGameScene = null;
      }
    },
  }));

  const initializeGame = useCallback(() => {
    if (!containerRef.current) return;

    // StrictMode remount: cancel pending destruction and reuse cached instance
    if (pendingDestroy) {
      clearTimeout(pendingDestroy);
      pendingDestroy = null;
    }

    if (cachedGame) {
      // Reuse existing Phaser instance - re-parent the canvas
      const canvas = cachedGame.canvas;
      if (canvas && containerRef.current && !containerRef.current.contains(canvas)) {
        containerRef.current.appendChild(canvas);
      }
      gameRef.current = cachedGame;
      // Sync flags with actual game state on StrictMode remount
      cachedPreloadDone = true;
      cachedGameSceneStarted = cachedGame.scene.isActive("GameScene") || cachedGame.scene.isActive("HostViewScene");
      return;
    }

    if (gameRef.current) return;

    // Create custom scenes
    const preloadScene = new PreloadScene();
    const isHost = latestPropsRef.current.isHost;
    const gameScene = isHost ? new HostViewScene() : new GameScene();
    cachedGameScene = gameScene;

    const phaserConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "transparent",
      transparent: true,
      pixelArt: false,
      antialias: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        // autoCenter aplica marginLeft/marginTop al canvas según
        // (parentSize - canvasSize) / 2. En desktop con dev-tools en modo
        // mobile, al girar a landscape el parentSize que Phaser cachea queda
        // descalibrado (mide ~1298 × ~−66 en vez de 844 × 388) y le mete al
        // canvas un margin de (227, -227) que lo expulsa fuera del área
        // visible. El canvas ya está fijado a su contenedor vía CSS
        // (`> div { position: absolute; inset: 0 }`), así que no necesitamos
        // que Phaser lo recentre.
        autoCenter: Phaser.Scale.NO_CENTER,
        width: "100%",
        height: "100%",
      },
      // Don't auto-start scenes, we'll add them manually
      scene: [],
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      pipeline: [],
      // No usamos GameObjects de tipo DOM en este juego. Activar
      // dom.createContainer hace que Phaser inyecte un div hermano del
      // canvas dentro del contenedor padre, lo que rompe el flujo CSS y
      // desplaza el canvas hacia arriba (en landscape el canvas acaba con
      // top: -227 fuera del área visible).
      audio: {
        disableWebAudio: false,
      },
    };

    // Create Phaser game
    const game = new Phaser.Game(phaserConfig);
    gameRef.current = game;
    cachedGame = game;

    if (typeof window !== "undefined") {
      window.__froggy = game;
    }

    // HiDPI: en móvil/retina ampliamos el backing store del canvas a píxeles
    // físicos (CSS × DPR) y compensamos con setZoom(dpr) en la cámara para que
    // el mundo siga expresándose en píxeles CSS.
    //
    // El trabajo pesado (canvas.width/height, renderer.resize, camera setZoom+setSize)
    // está centralizado en GameScene.applyHiDPICamera(), que se llama tanto en
    // GameScene.create() como al principio de cada _performResize(). Aquí sólo
    // dejamos el shim de input: el mapeo transformX/Y del ScaleManager debe
    // multiplicarse por DPR para que los touches caigan en las hit-areas
    // físicas de los sprites.
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    game.registry.set("dpr", dpr);

    if (dpr > 1) {
      // Shim de transformX/Y del ScaleManager: el mapeo nativo de Phaser usa
      // `displayScale.x = baseSize.width / canvasBounds.width`. Como nuestro
      // renderer está en píxeles físicos pero `baseSize` y `canvasBounds`
      // siguen ambos en CSS (no llamamos a scale.resize), `displayScale` queda
      // en 1 y `transformX` devuelve coordenadas CSS.
      //
      // Pero la cámara, con zoom = DPR, espera que el puntero llegue en
      // píxeles FÍSICOS (worldX = pointer.x / zoom). Si no multiplicamos por
      // DPR aquí, `worldX = CSS / DPR` y los hit-rects de los nenúfares caen
      // fuera de la zona tocada → "no hay interacción".
      const origTransformX = game.scale.transformX.bind(game.scale);
      const origTransformY = game.scale.transformY.bind(game.scale);
      game.scale.transformX = (pageX) => origTransformX(pageX) * dpr;
      game.scale.transformY = (pageY) => origTransformY(pageY) * dpr;
    }

    // Robustez en rotación móvil: Phaser RESIZE sólo escucha window.resize,
    // pero el navegador puede disparar la secuencia con dimensiones distintas
    // y en momentos distintos a través de orientationchange,
    // visualViewport.resize (cuando la barra de URL colapsa/expande) y
    // ResizeObserver del contenedor (CSS layout settling tras la rotación).
    // El último evento "verdadero" no siempre es un window.resize, así que
    // sin esto Phaser puede quedarse con un layout aplicado a una medida
    // intermedia. Suscribimos todas las fuentes y las coalescemos en un único
    // refresh por frame.
    let refreshRAF = null;
    const requestRefresh = () => {
      if (refreshRAF !== null) return;
      refreshRAF = requestAnimationFrame(() => {
        refreshRAF = null;
        if (cachedGame === game && game.scale) {
          game.scale.refresh();
        }
      });
    };

    const runtimeObserver = new ResizeObserver(() => requestRefresh());
    if (containerRef.current) runtimeObserver.observe(containerRef.current);

    const onOrientationChange = () => requestRefresh();
    window.addEventListener("orientationchange", onOrientationChange);

    const vv = window.visualViewport;
    const onVisualViewportResize = vv ? () => requestRefresh() : null;
    if (vv && onVisualViewportResize) {
      vv.addEventListener("resize", onVisualViewportResize);
    }

    // Guardamos los handles para poder limpiarlos en el cleanup del useEffect.
    game.__resizeListeners = {
      runtimeObserver,
      onOrientationChange,
      onVisualViewportResize,
      cancel: () => {
        if (refreshRAF !== null) {
          cancelAnimationFrame(refreshRAF);
          refreshRAF = null;
        }
      },
    };

    // Guard: si el contenedor no está en el DOM o tiene dimensiones 0
    // (transiciones a score screen, modales, tab en background, display:none
    // en el padre, etc.), el ScaleManager emite resize con 0x0 y WebGL falla
    // al crear el framebuffer ("Framebuffer status: Incomplete Attachment").
    // Interceptamos refresh() para saltar ese frame y reintentar en el siguiente.
    const scaleManager = game.scale;
    const originalRefresh = scaleManager.refresh.bind(scaleManager);
    scaleManager.refresh = function (...args) {
      const parent = containerRef.current;
      if (!parent || !parent.isConnected) return scaleManager;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return scaleManager;
      return originalRefresh(...args);
    };

    // Add scenes manually after a short delay to ensure game is ready
    // Use module-level timeout so it survives StrictMode cleanup
    cachedInitTimeout = setTimeout(() => {
      // Verify this game instance is still the active one
      if (cachedGame !== game) return;

      // Add PreloadScene and start it
      game.scene.add("PreloadScene", preloadScene, false);
      // Add game scene but don't start it yet
      const sceneKey = isHost ? "HostViewScene" : "GameScene";
      game.scene.add(sceneKey, gameScene, false);

      // Start preload
      game.scene.start("PreloadScene", {
        assetsUrl: latestPropsRef.current.assetsUrl,
        onProgress: () => {
          // Loading progress
        },
        onComplete: () => {
          if (cachedGame !== game) return;
          game.scene.stop("PreloadScene");
          cachedPreloadDone = true;
          tryStartGameScene();
        },
      });
    }, 100);
  }, [tryStartGameScene]);

  useEffect(() => {
    initializeGame();

    // Watch for container size changes to retry initialization if dimensions
    // appear (sólo necesario antes de que el juego exista; una vez creado
    // hay un ResizeObserver runtime registrado en initializeGame que dispara
    // game.scale.refresh()).
    let observer;
    if (containerRef.current && !cachedGame) {
      observer = new ResizeObserver(() => {
        initializeGame();
      });
      observer.observe(containerRef.current);
    }

    // Cleanup: defer destruction to allow StrictMode remount to reuse instance
    return () => {
      gameRef.current = null;
      
      pendingDestroy = setTimeout(() => {
        if (cachedInitTimeout) {
          clearTimeout(cachedInitTimeout);
          cachedInitTimeout = null;
        }
        if (cachedGame) {
          const listeners = cachedGame.__resizeListeners;
          if (listeners) {
            try { listeners.runtimeObserver?.disconnect(); } catch { /* ignore */ }
            try {
              window.removeEventListener("orientationchange", listeners.onOrientationChange);
            } catch { /* ignore */ }
            try {
              if (window.visualViewport && listeners.onVisualViewportResize) {
                window.visualViewport.removeEventListener("resize", listeners.onVisualViewportResize);
              }
            } catch { /* ignore */ }
            listeners.cancel?.();
            cachedGame.__resizeListeners = null;
          }
          cachedGame.destroy(true);
          cachedGame = null;
          cachedGameScene = null;
          cachedPreloadDone = false;
          cachedGameSceneStarted = false;
        }
        pendingDestroy = null;
      }, 100);
    };
  }, [initializeGame]);

  // Push updated questions into the live scene (e.g. when shuffled mid-game)
  useEffect(() => {
    if (cachedGameScene && questions) {
      cachedGameScene.questions = questions;
    }
  }, [questions]);

  // Try to start GameScene when the parent signals "play"
  useEffect(() => {
    tryStartGameScene();
  }, [play, tryStartGameScene]);

  // Propaga el toggle de sonido a la escena activa sin recrearla. Usa el
  // SoundManager global de Phaser para silenciar/reactivar todos los efectos
  // del juego (saltos, croar, gameOver, etc.) de una sola vez
  useEffect(() => {
    if (cachedGame?.sound) {
      cachedGame.sound.mute = !soundEnabled;
    }
    if (cachedGameScene?.setSoundEnabled) {
      cachedGameScene.setSoundEnabled(soundEnabled);
    }
  }, [soundEnabled]);

  // Update callbacks when they change.
  // This is the ONLY place where callbacks should be assigned to avoid stale closures.
  useEffect(() => {
    if (cachedGameScene) {
      cachedGameScene.onAnswer = onAnswer;
      cachedGameScene.onAnimatingChange = onAnimatingChange;
      cachedGameScene.onQuestionStart = onQuestionStart;
      cachedGameScene.onBankControl = onBankControl;
    }
  }, [onAnswer, onAnimatingChange, onQuestionStart, onBankControl]);

  // Bloquea/desbloquea la interacción del canvas cuando React monta un
  // overlay encima (menú de Settings). Evita que un clic que el usuario cree
  // dirigir al overlay atraviese y dispare un nenúfar por debajo.
  useEffect(() => {
    cachedGameScene?.setUIBlocked?.(uiBlocked);
  }, [uiBlocked]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

export default PhaserGame;
