import * as Sentry from "@sentry/react";

const REPLAY_CAPTURED_ERRORS = [
    "Event `Event` (type=error) captured as promise rejection"
];

export function initErrorMonitoring(sentryDsn, { tracesSampleRate = 0.1,  gameMode = "singlePlayer"  } = {}) {
    Sentry.init({
        dsn: sentryDsn,
        integrations: [
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
                beforeErrorSampling: (event) => {
                    if(REPLAY_CAPTURED_ERRORS.length === 0) {
                        return true; // Record all errors if no specific errors are defined
                    }
                    // Only record replays for specific errors
                    const errorMessage = event.exception?.values?.[0]?.value || '';
                    return REPLAY_CAPTURED_ERRORS.some(error => errorMessage.includes(error));
                }
            }),
            Sentry.replayCanvasIntegration()
        ],
        // Session Replay
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1, // 100% of filtered errors will be recorded
        // Tracing
        tracesSampleRate: tracesSampleRate, // 10% of traces will be sent
        ignoreErrors: [
            'No slot size for availableWidth=0',
            /adsbygoogle.*push/i,
            /AbortError/i,
            'Non-Error promise rejection captured',
            "Failed to execute 'animate' on 'Element': Partial keyframes are not supported.",
            "Failed to start the audio device"
        ],
        denyUrls: [
            /r1\/jsobfuscated\/h5-i\.js$/, // ignore errors from h5-i.js (video ads)
            /s\.clickiocdn\.com\/.*\.js$/i, // ignore errors from clickio https://s.clickiocdn.com/ 
        ]
    });

    Sentry.setTag("gameMode", gameMode);
}

export function trackError(error) {
    Sentry.captureException(error);
}