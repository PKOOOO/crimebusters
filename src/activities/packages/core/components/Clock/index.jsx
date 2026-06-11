import { Timer } from "../../GameProvider/Timer";
import { CountdownTimer } from "../../GameProvider/CountdownTimer";
import { CountdownTimerPill } from "../../GameProvider/CountdownTimerPill"
import { useSelector } from "react-redux";
import { CountdownTimerGlobal } from "../../GameProvider/CountdownTimerGlobal";
import { useDispatch } from "react-redux";
import { finishGlobalTime, sendExam } from "@educaplay/store/slices/gameSlice";
import { CountdownTimerPillGlobal } from "../../GameProvider/CountdownTimerPillGlobal";
import { useMultiplayer } from "@educaplay/core/hooks";

const noop = () => { };

export function Clock({ onTimeFinish = noop, freezed, silenced }) {
    const dispatch = useDispatch();
    const question = useSelector(state => state.game.initialQuestions[state.game.currentIndex]);
    const hasCountDown = useSelector(state => state.game.hasCountDown);
    const isAnimating = useSelector(state => state.game.isAnimating);
    const globalCountdown = useSelector(state => state.game.globalCountdown);
    const isExamMode = useSelector(state => state.game.examMode);
    const isCompleteEntryAnimation = useSelector(state => state.game.isCompleteEntryAnimation);
    const initialGlobalCountdown = useSelector(state => state.game.initialGlobalCountdown)
    const { isPlayer } = useMultiplayer();
    const playerDeadline = useSelector(state => state.multiplayer.question?.deadline ?? null);

    // En multijugador el host es la fuente de verdad del tiempo por pregunta: si
    // hay deadline para el jugador, forzamos cuenta atrás aunque la actividad
    // se hubiera inicializado con TIEMPO_INFINITO (hasCountDown=false).
    const showCountdown = hasCountDown || (isPlayer && playerDeadline != null);

    const handleFinishGame = () => {
        if (isExamMode) {
            dispatch(sendExam());
            return;
        }
        dispatch(finishGlobalTime());
    }

    if (globalCountdown !== null && hasCountDown) {
        if (initialGlobalCountdown > 60) {
            return (
                <CountdownTimerPillGlobal freezed={isAnimating || !isCompleteEntryAnimation} onFinish={handleFinishGame} silenced={silenced} />
            )
        }

        return (
        <CountdownTimerGlobal freezed={isAnimating || !isCompleteEntryAnimation} onFinish={handleFinishGame} silenced={silenced} />
        )

    }

    return (
        <>
            {showCountdown && question.time > 60 && (
                <CountdownTimerPill freezed={freezed || isAnimating} key={question.id} startTime={question.time} onFinish={onTimeFinish} silenced={silenced} />
            )}
            {showCountdown && question.time <= 60 && (
                <CountdownTimer freezed={freezed || isAnimating} key={question.id} startTime={question.time} onFinish={onTimeFinish} silenced={silenced} />
            )}
            {!showCountdown && (
                <Timer freezed={freezed || isAnimating} />
            )}

        </>
    )
}