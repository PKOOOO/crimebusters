import { AudioComponent, TextContainer, ImageComponent } from "@educaplay/core";
import classes from "./ResultsBank.module.scss";
import clsx from "clsx";
import { CONTENT_TYPE } from "@educaplay/core/utils";
import { YouTubeComponent } from "@educaplay/core/components";

export function ResultsBank(props) {
  const { media, text, className } = props;

  const hasMedia = media?.type && media?.src;

  if (!hasMedia && !text) return null;

  return (
    <div className={clsx(classes.bankContainer, className)}>
      {media?.type === CONTENT_TYPE.IMAGE && (
        <ImageComponent source={media.src} />
      )}

      {media?.type === CONTENT_TYPE.AUDIO && (
        <div className={classes.sourceAudio}>
          <AudioComponent source={media.src} />
        </div>
      )}

      {media?.type === CONTENT_TYPE.YOUTUBE && (
        <div className={classes.sourceyt}>
          <YouTubeComponent url={media.src} />
        </div>
      )}

      {text && <TextContainer text={text} />}
    </div>
  );
}
