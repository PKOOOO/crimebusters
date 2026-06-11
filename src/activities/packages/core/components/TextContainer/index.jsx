import clsx from 'clsx'
import classes from './TextContainer.module.scss' 

export function TextContainer(props) {
    
    const { text, isAnswer, className} = props;

    return (
        <div className={clsx(classes.text, isAnswer && classes.userAnswer, className)}>
            <p>{text}</p>
        </div>
    )
}