
import { useCallback, useEffect, useState } from 'react';
import { openFullScreen, exitFullScreen } from '@educaplay/core/utils';

export function useFullScreen() {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const FullScreenListenersMount = () => {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('mozfullscreenchange', handleFullscreenChange);
            document.addEventListener('msfullscreenchange', handleFullscreenChange);
        }
    
        const FullScreenListenersUnMount = () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        }
    
        const handleFullscreenChange = () => {
            if (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            ) {
                setOpenFullScreen(true);
            } else {
                setOpenFullScreen(false);
            }
        };
            FullScreenListenersMount();
    
            return () => { FullScreenListenersUnMount() }
    
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])

    const setOpenFullScreen = useCallback(isOpen => {
        setIsFullScreen(isOpen);
        if (isOpen) {
            openFullScreen()
        } else {
            exitFullScreen()
        }
    }, [])

    return [isFullScreen, setOpenFullScreen]
}
