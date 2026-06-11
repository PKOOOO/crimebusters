import { AnimatePresence, motion } from 'framer-motion'
import PropTypes from 'prop-types';


/**
 * @param {String} show - if it is true, its content is shown and if it is false it is hidden
 * @param {String} className - classes that you want to put in the animation div
 * @param {Node} children - content to be displayed within the accordion div.
 * @returns {React.ReactNode} - return a div with the accordion animation. 
 */
export function Accordion(props) {

    const {show, className, children} = props;

    return (

        <AnimatePresence initial={show}>
            {show && (
                <motion.div
                    className={className}
                    key="content"
                    initial={{
                        height: 0,
                        opacity: 0,
                    }}
                    animate={{
                        height: "auto",
                        opacity: 1,
                    }}
                    exit={{
                        height: 0,
                        opacity: 0,
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

Accordion.propTypes = {
    show: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node
}