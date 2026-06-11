import { useEffect, useState } from 'react'

const breakpoints = {
    xs: 0,
    sm: 544,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1400,
    xxxl: 1920,
}

const getMediaQuery = (query) => {
    if (query in breakpoints) {
        return `(min-width: ${breakpoints[query]}px)`
    }

    return query
}

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        const queryFormatted = getMediaQuery(query)
        return window.matchMedia(queryFormatted).matches
    })

    useEffect(() => {
        const queryFormatted = getMediaQuery(query)
        const matchMedia = window.matchMedia(queryFormatted)

        const handleChange = () => {
            setMatches(window.matchMedia(queryFormatted).matches)
        }

        // Safari older than 14.1
        if (matchMedia.addListener) {
            matchMedia.addListener(handleChange)
        } else {
            matchMedia.addEventListener('change', handleChange)
        }

        return () => {
            if (matchMedia.removeListener) {
                matchMedia.removeListener(handleChange)
            } else {
                matchMedia.removeEventListener('change', handleChange)
            }
        }
    }, [query])

    return matches
}