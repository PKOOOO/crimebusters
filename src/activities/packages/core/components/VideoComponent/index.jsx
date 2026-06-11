import classes from './VideoComponent.module.scss'
import { Dialog } from "@educaplay/core/components";
import { useRef, useState } from 'react';
import { VideoPlay } from '@educaplay/core/Icons/VideoPlay';    

const YOUTUBE_EMBED_QUERY = 'autoplay=1&rel=0&modestbranding=1&playsinline=1';
const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com']);

function getYoutubeEmbedUrl(videoUrl) {
    if (!videoUrl) return null;

    let parsedUrl;

    try {
        parsedUrl = new URL(videoUrl);
    } catch {
        return null;
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const pathname = parsedUrl.pathname.replace(/\/+$/, '');

    const rawVideoId = [
        hostname === 'youtu.be' ? pathname.slice(1) : null,
        YOUTUBE_HOSTS.has(hostname) && pathname === '/watch' ? parsedUrl.searchParams.get('v') : null,
        YOUTUBE_HOSTS.has(hostname) && pathname.startsWith('/embed/') ? pathname.slice('/embed/'.length) : null,
        YOUTUBE_HOSTS.has(hostname) && pathname.startsWith('/shorts/') ? pathname.slice('/shorts/'.length) : null,
    ].find(Boolean);

    const videoId = rawVideoId?.split('/')[0]?.trim();
    if (!videoId) return null;

    return `https://www.youtube.com/embed/${videoId}?${YOUTUBE_EMBED_QUERY}`;
}

export function VideoComponent(props) {

    const { url, thumbnail } = props;
    const videoRef = useRef(null);
    const youtubeEmbedUrl = getYoutubeEmbedUrl(url);

    const [open, setOpen] = useState(false);
    const openDialog = () => {
        setOpen(true);
    }

    const closeDialog = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setOpen(false);
    }
        
    return (
        <>
            <Dialog open={open} onClose={closeDialog} variant={"explanation"} className={classes.dialogvideo}>
                {youtubeEmbedUrl ? (
                    open && (
                        <iframe
                            className={classes.iframedialog}
                            src={youtubeEmbedUrl}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    )
                ) : (
                    <video
                        ref={videoRef}
                        src={url}
                        autoPlay
                        controls
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            </Dialog>

            <div onClick={openDialog} className={classes.videocontainer}>
                <img src={thumbnail} className={classes.videothumbnail}/>
                <VideoPlay className={classes.playicon}/>
            </div>
        </>
    )
}