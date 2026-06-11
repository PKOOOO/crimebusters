import classes from './YouTubeComponent.module.scss'
import { Dialog } from "@educaplay/core/components";
import { useEffect, useState } from 'react';
import { VideoPlay } from '@educaplay/core/Icons/VideoPlay';    

export function YouTubeComponent(props) {

    const { url } = props;
    const source = "https://www.youtube-nocookie.com/embed/";
    const autoplay = (url.includes('?')) ?  "&autoplay=1" : "?autoplay=1";
    const [thumbnail, setThumbnail] = useState(null); 

    const [open, setOpen] = useState(false);
    const openDialog = () => {
        setOpen(true);
    }

    const closeDialog = () => {
        setOpen(false);
    }

    const getYoutubeThumbnail = async (url) => {
        return (`http://img.youtube.com/vi/${url}/maxresdefault.jpg`)
    }

    useEffect(() =>{
        getYoutubeThumbnail(url).then((resultThumbnail) => setThumbnail(resultThumbnail));
    }, [url])   
    
    return (
        <>
            <Dialog open={open} onClose={closeDialog} variant={"explanation"} className={classes.dialogYT}>
                <iframe
                    className={classes.iframedialog}
                    width="auto"
                    height="auto"
                    src={source + url + autoplay}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    >
                </iframe> 
            </Dialog>

            <div onClick={openDialog} className={classes.ytcontainer}>
                <img src={thumbnail} alt="youtube thumbnail" className={classes.ytthumbnail}/>
                <VideoPlay className={classes.playicon}/>
            </div>
        </>
    )
}