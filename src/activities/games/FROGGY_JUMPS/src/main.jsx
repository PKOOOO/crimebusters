import React from "react";
import Game from "./Game";
import { render, getConfig, CONTENT_TYPE, initErrorMonitoring } from "@educaplay/core";
import { assetsUrl, GameProvider } from "@educaplay/core";
import { initialize } from "@educaplay/store";
import { createCustomization } from "@educaplay/core/utils/customization";
import classes from "./main.module.scss";

const gameImage = assetsUrl("FROGGY_JUMPS/logoActivity.png");
const bgImage = assetsUrl("FROGGY_JUMPS/background.png");
const container = document.getElementById("root");

function setBackgroundImage(imageUrl) {
  document.documentElement.style.setProperty(
    "--froggy-jumps-bg-image",
    `url(${imageUrl})`,
  );
}
setBackgroundImage(bgImage);

const MAX_ANSWERS = 3;

function buildQuestion(question, effectiveCount, resources, questionTime) {
  let answers = question.RESPUESTAS.slice(0, MAX_ANSWERS);

  const answers_structured = answers.map((component, answerIndex) => ({
    answer: component.RESPUESTA,
    source: component.MULTIMEDIA ? `${resources}${component.MULTIMEDIA}` : null,
    type: component.MULTIMEDIA_TIPO ?? null,
    id: answerIndex.toString(),
  }));

  // correctAnswers son IDs estables, no posiciones. Sobreviven a cualquier shuffle posterior
  const correctAnswersArray = answers_structured
    .filter((ans) => answers[parseInt(ans.id)].RESPUESTA_CORRECTA === "si")
    .map((ans) => ans.id);

  return {
    bank:
      question.ENUNCIADO || question.MULTIMEDIA
        ? {
          text: question.ENUNCIADO,
          source: question.MULTIMEDIA
            ? `${resources}${question.MULTIMEDIA}`
            : null,
          type: question.MULTIMEDIA_TIPO ?? CONTENT_TYPE.TEXT,
        }
        : null,
    text: question.ENUNCIADO ?? null,
    media: question.MULTIMEDIA
      ? { src: `${resources}${question.MULTIMEDIA}`, type: question.MULTIMEDIA_TIPO ?? null }
      : null,
    questionType: "unica",
    examMode: false,
    checkAnswer: function (objAnswer) {
      if (!objAnswer || objAnswer.answer == null) return false;
      const position = parseInt(objAnswer.answer);
      const selected = this.answers[position];
      return !!selected && this.correctAnswers.includes(selected.id);
    },
    serializeAnswer: (objAnswer) => ({ answer: objAnswer?.answer ?? null }),
    answers: answers_structured,
    correctAnswers: correctAnswersArray,
    answer: null,
    points: 100 / effectiveCount,
    time: questionTime,
    id: question.id,
  };
}

async function init() {
  const defaultMatch = window.__EDUCAPLAY_MATCH_ID
    ? { pin: window.__EDUCAPLAY_MATCH_ID }
    : null;
  const { data, texts, settings, user, title, description, author, id, url, session, environment, match = defaultMatch } =
    await getConfig().catch((err) =>
      console.error("Error al obtener la configuración: ", err),
    );

  initErrorMonitoring(
    "https://bcd64f5e2e040de7e0c0d5b5bf25a4b1@o4509038211104768.ingest.de.sentry.io/4511099106492496",
    {
      tracesSampleRate: 0.005,
      gameMode: match ? "multiPlayer" : "singlePlayer",
    },
  );

  const { resources } = settings;

  const filteredQuestions = data.PREGUNTAS.map((question, index) => ({
    ...question,
    id: index,
  }))
    .filter((question) => question.RESPUESTAS.length !== 0)
    .map((question) => ({
      ...question,
      RESPUESTAS: question.RESPUESTAS.filter(
        (component) => component.RESPUESTA !== "" || component.MULTIMEDIA,
      ),
    }))
    .filter((question) => question.RESPUESTAS.length !== 0)
    .filter((question) =>
      question.RESPUESTAS.some((r) => r.RESPUESTA_CORRECTA === "si"),
    );

  const numeroPreguntas = Number(data.NUMERO_PREGUNTAS_VISIBLES);
  const hasLimit = !Number.isNaN(numeroPreguntas) && numeroPreguntas > 0;
  const randomActive = data.ALEATORIO === "si";
  const effectiveCount = randomActive && hasLimit
    ? numeroPreguntas
    : filteredQuestions.length;

  const questionTimeNumber = Number(data.TIEMPO);
  const questionTime = Number.isNaN(questionTimeNumber)
    ? 0
    : questionTimeNumber;

  let questions = filteredQuestions.map((question) =>
    buildQuestion(question, effectiveCount, resources, questionTime),
  );

  // Repetir preguntas si numeroPreguntas > preguntas disponibles
  if (randomActive && hasLimit && numeroPreguntas > filteredQuestions.length) {
    let i = 0;
    while (questions.length < numeroPreguntas) {
      questions.push(
        buildQuestion(
          filteredQuestions[i % filteredQuestions.length],
          effectiveCount,
          resources,
          questionTime,
        ),
      );
      i++;
    }
  }

  initialize({
    countFooterSpace: true,
    lives: data.NUMERO_INTENTOS,
    liveActived: data.NUMERO_INTENTOS_INFINITOS !== "si",
    hasCountDown: data.TIEMPO_INFINITO === "no",
    showClock: data.MOSTRAR_TIEMPO !== "no",
    randomized: randomActive,
    showSolutions: data.OCULTAR_RESPUESTAS !== "1",
    showRestart: data.OCULTAR_REINICIAR !== "1",
    showSocialMedia: data.OCULTAR_REDES !== "1",
    showUserAnswer: true,
    finalText: data.TEXTO_FINAL,
    hasBank: false,
    showFeedbackGame: {
      isCorrect: false,
      isError: false,
    },
    questions,
    settings,
    title,
    description,
    author,
    id,
    url,
    user,
    customizations: createCustomization({
      ...data,
      showBackgroundInGame: false,
    }),
    ...(randomActive && hasLimit && { numberOfQuestions: numeroPreguntas }),
    session,
    environment,
    match,
  });

  render(
    container,
    // <React.StrictMode>
    <GameProvider
      classes={{
        screen: classes.gameProviderScreen,
      }}
      gameImage={gameImage}
      texts={texts}
      Game={Game}
      preloadDuringCountdown
      renders={{
        infoLeft: (currentIndex, questions) => {
          return `${texts.common.game.question}: ${Math.min(currentIndex + 1, questions.length)} / ${questions.length}`
        },
      }}
      mappers={{
        report: (question) => {
          const ans = question.answer;
          // Timeout / no contestada: el framework guarda answer === "" cuando
          // se agota el tiempo sin selección. Lo marcamos explícitamente para
          // que en informes aparezca como "no contestada" en lugar de errónea.
          const isUnanswered =
            ans === "" ||
            ans == null ||
            (typeof ans === "object" && (ans.answer === "" || ans.answer == null));

          if (isUnanswered) {
            return { s: 0, i: question.id, a: "" };
          }

          const isCorrect = question.checkAnswer(ans);
          const answerIdx = typeof ans === "object" ? ans.answer : ans;
          // El id de la respuesta es su posición en el orden original del XML.
          // Lo mapeamos a letra para el informe usando la respuesta ELEGIDA, no
          // la columna física (selectedOption): con shuffle la columna A/B/C no
          // coincide con la opción realmente mostrada en esa plataforma.
          const chosenAnswerId = answerIdx != null
            ? question.answers?.[parseInt(answerIdx)]?.id
            : null;
          const letterMap = ["A", "B", "C"];
          const selectedOption = chosenAnswerId != null
            ? letterMap[parseInt(chosenAnswerId)]
            : (typeof ans === "object" ? ans.selectedOption : ans);
          return {
            s: isCorrect ? 1 : 0,
            i: question.id,
            a: selectedOption,
          };
        },
      }}
    />
    // </React.StrictMode>,
  );
}

init();
