
export const IS_DEV = import.meta.env.MODE !== "production";

export const API_URL = window.__EDUCAPLAY_API_URL;
export const WS_URL = window.__EDUCAPLAY_WS_URL;
export const GAME_URL = window.__EDUCAPLAY_GAME_URL;
export const MATCH_URL = window.__EDUCAPLAY_MATCH_URL;

export const NAME_ANIMATION_LIVES = "lives"
export const NAME_ANIMATION_POINTS = "points"

export const NAME_SOUND_INTRO = "intro"
export const NAME_SOUND_ACTIVE_BANK = "activeBank"
export const NAME_SOUND_HOVER = "hover"
export const NAME_SOUND_POINTS = "points"
export const NAME_SOUND_FAILURE = "failure"
export const NAME_SOUND_LIVE = "live"
export const NAME_SOUND_COUNTDOWN = "countdown"
export const NAME_SOUND_WIN = "win"
export const NAME_SOUND_LOSS = "loss"
export const NAME_SOUND_POINTS_COUNT = "pointsCount"
export const NAME_SOUND_FINAL_COUNTDOWN = "finalCountdown"
export const NAME_SOUND_SUCCESS = "success"
export const NAME_SOUND_WRONG = "wrong"
export const NAME_SOUND_ACTIVE = "active"
export const NAME_SOUND_ACTIVATE = "activate"
export const NAME_SOUND_CHARGE = "load"
export const NAME_SOUND_MOVE = "move"

export const CONTENT_TYPE = {
    AUDIO: "audio",
    IMAGE: "image",
    TEXT: "text",
    VIDEO: "video",
    YOUTUBE: "youtube",
    ENHANCETEXT: "enhancetext",
}

export const TYPE_QUESTIONS = {
    Text: "text",
    Selection: "selection",
    Information: "information"  
}
