import {
    createContext,
    useContext,
    useState,
    Fragment,
    useEffect,
} from 'react';

const SlotsContext = createContext(createEmitter());

export function SlotsProvider({ children }) {
    const [emitter] = useState(createEmitter);

    return (
        <SlotsContext.Provider value={emitter}>
            {children}
        </SlotsContext.Provider>
    );
}

export function useSlot(name) {
    const emitter = useContext(SlotsContext);
    const [node, setNode] = useState();

    useEffect(() => {
        setNode(emitter.get(name));
        return emitter.on(name, setNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    return node !== undefined;
}

export function Slot({name, children}) {
    const emitter = useContext(SlotsContext);
    const [node, setNode] = useState();

    useEffect(() => {
        setNode(emitter.get(name));
        emitter.on(name, setNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    const has = node !== undefined;

    return <Fragment>{has ? node : children}</Fragment>;
}

export function Fill({name, children}) {
    const emitter = useContext(SlotsContext);

    useEffect(() => {
        emitter.emit(name, children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, children]);

    return null;
}

function createEmitter() {
    const cache = {};
    const events = {};

    function update(event, node) {
        const source = events[event];
        if (source) source.forEach((cb) => cb(node));

        cache[event] = node;
    }

    return {
        emit(event, node) {
            update(event, node);
            return () => update(event);
        },
        get(event) {
            return cache[event];
        },
        on(event, cb) {
            const source = (events[event] = events[event] || []);
            source.push(cb);
            return () => {
                const index = source.indexOf(cb);
                if (index > -1) source.splice(index, 1);
            };
        },
    };
}