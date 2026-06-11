import { AudioComponent, TextContainer } from '@educaplay/core'
import classes from './AudioContainer.module.scss'


export default function AudioContainer(props) {

    const {source, text, isAnswer, className} = props;

    return (
        <div className={className}>
            <div className={classes.sourceAudio}>
                <AudioComponent source={source} />
            </div>
            {text && (
            <TextContainer  text={text} isAnswer={isAnswer}
            />
            )}
        </div>
    )

}