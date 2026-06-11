import { useState } from "react";
import classes from "./AudioComponentControl.module.scss";
import Dropdown from "./Dropdown";
import DropdownItem from "./Dropdown/DropdownItem";
import DropdownToggle from "./Dropdown/DropdownToggle";
import { useSelector } from "react-redux";
import { AudioComponent } from "../AudioComponent";
import clsx from "clsx";

const VELOCITY = [0.5, 0.75, 1, 1.25, 1.5]

const audioVelocityChangeEvent = new Event("audioVelocityChange", { bubbles: true });
export function AudioComponentControl(props) {
    const { source, color, ...audioProps } = props;
    const { showAudioControls, allowPause } = useSelector(state => state.game.audioSettings);
    const [audioVelocity, setAudioVelocity] = useState(1);
    const [index, setIndex] = useState(0);
    const [refreshAudio, setrefreshAudio] = useState(0);

    const handleOnEnded = () => {
        if (Array.isArray(source)) {
            const nextIndex = index + 1 >= source.length ? 0 : index + 1
            setIndex(nextIndex);
            if (index + 1 < source.length) setrefreshAudio(refreshAudio + 1);
        }
    }

    const current = Array.isArray(source) ? source[index] : source;

    return (
        <div className={clsx(classes.root, props.className)}>
            <AudioComponent
                key={refreshAudio}
                {...audioProps}
                source={current}
                color={color}
                velocity={audioVelocity}
                allowPause={allowPause}
                onEnded={handleOnEnded}
            />

            {showAudioControls &&
                (<div className={classes.velocityselectorposition}>
                    <Dropdown toggle={
                        <DropdownToggle >
                            {`${audioVelocity}x`}
                        </DropdownToggle>
                    }>
                        <>
                            {VELOCITY.map((velocity) => (
                                <DropdownItem
                                    key={velocity}
                                    onClick={() => {
                                        window.dispatchEvent(audioVelocityChangeEvent);
                                        setAudioVelocity(velocity)
                                    }}
                                >{`${velocity}x `}</DropdownItem>
                            ))}
                        </>
                    </Dropdown>
                </div>
                )}
        </div>
    )

}