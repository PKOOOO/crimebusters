import { useState } from 'react';
import { Dialog, IconButton, TextContainer } from "@educaplay/core";
import classes from './ImageComponent.module.scss'
import { Search } from '@educaplay/core/Icons/Search';
import clsx from 'clsx';

export function ImageComponent(props) {

    const { text, source, isAnswer, className } = props;
    const [open, setOpen] = useState(false);

    const clickImage = (e) => {
        e.stopPropagation();
        setOpen(true);
    }
    return (
        <>
            <Dialog
                open={open}
                onClose={() =>{
                    setOpen(false)
                }} 
                variant="lightbox"
            >
                <img src={source} alt="" />
            </Dialog>
            <div className={className}>
                <div className={clsx(classes.sourceImg, "wrapper-image")}>
                    <img src={source} onClick={clickImage} />
                    <IconButton icon={<Search/>} onClick={clickImage} className={classes.expand} />
                </div>
                {text && (
                    <TextContainer text={text} isAnswer={isAnswer} />
                )}
            </div>
        </>
    )

}