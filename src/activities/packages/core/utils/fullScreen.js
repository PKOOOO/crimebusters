export function openFullScreen() {
    try {
        if (document.body.requestFullscreen || document.body.webkitRequestFullscreen || document.body.msRequestFullscreen) {
            if (document.body.requestFullScreen) {
                document.body.requestFullScreen({ navigationUI: "show" });
            } else if (document.body.webkitRequestFullScreen) {
                document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (document.body.msRequestFullscreen) {
                document.body.msRequestFullscreen();
            } else {
                window.parent.postMessage({ type: 'activity-fullscreenrequest' });
            }
        }
    } catch (error) {
        console.error(error);
    }
}

export function exitFullScreen() {
    try {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else {
                window.parent.postMessage({ type: 'activity-fullscreenexit' });
            }
        }
    } catch (error) {
        console.error(error);
    }
}