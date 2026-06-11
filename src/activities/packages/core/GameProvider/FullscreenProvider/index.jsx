
import { useEffect } from 'react';
import { toggleFullscreen } from '@educaplay/store/slices/settingsSlice';
import { useDispatch } from 'react-redux';

export function FullscreenProvider({ children }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isOpen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
            dispatch(toggleFullscreen(isOpen))
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => { 
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        }
    }, [dispatch])

    return children
}
