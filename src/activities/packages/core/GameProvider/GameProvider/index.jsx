import React from "react";
import { Provider } from "react-redux";
import { store } from "@educaplay/store";
import { GameProviderView } from "../GameproviderView";
import { FullscreenProvider } from "../FullscreenProvider";
import { CustomHandlersProvider } from "../CustomHandlersProvider";
import { FontFamilyProvider } from "../FontFamilyProvider";
import { GameAnimationsProvider } from "../GameAnimationsProvider";
import { GameSoundsProvider } from "../GameSoundsProvider";
import { TranslateProvider } from "../TranslateProvider";
import { SlotsProvider } from "../../components/SlotsProvider";
import { EmojiAnchorProvider } from "../EmojiReactions/EmojiAnchorContext";

export const GameProvider = (props) => {
    const { Game, texts, gameImage, gameTutorial, sounds, renders = {}, mappers = {}, classes={}, hasCustomLayout = false, preloadDuringCountdown = false } = props
    
    return (
        <Provider store={store}>
            <SlotsProvider>
                <CustomHandlersProvider renders={renders} mappers={mappers}>
                    <FontFamilyProvider>
                        <FullscreenProvider>
                            <GameSoundsProvider sounds={sounds}>
                                <TranslateProvider texts={texts}>
                                    <GameAnimationsProvider>
                                        <EmojiAnchorProvider>
                                            <GameProviderView
                                                gameImage={gameImage}
                                                Game={Game}
                                                hasCustomLayout={hasCustomLayout}
                                                preloadDuringCountdown={preloadDuringCountdown}
                                                classes={classes}
                                                gameTutorial={gameTutorial}
                                            />
                                        </EmojiAnchorProvider>
                                    </GameAnimationsProvider>
                                </TranslateProvider>
                            </GameSoundsProvider>
                        </FullscreenProvider>
                    </FontFamilyProvider>
                </CustomHandlersProvider>
            </SlotsProvider>
        </Provider>
    )
}