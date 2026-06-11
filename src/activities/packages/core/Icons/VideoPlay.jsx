
export function VideoPlay(props) {

    const {className} = props;  
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}> 
            <path d="M0.5 8C0.5 3.85786 3.85786 0.5 8 0.5H24C28.1421 0.5 31.5 3.85786 31.5 8V24C31.5 28.1421 28.1421 31.5 24 31.5H8C3.85786 31.5 0.5 28.1421 0.5 24V8Z" stroke="CurrentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M9.44202 6.83138C9.44202 6.04028 10.3171 5.56242 10.9827 5.99013L25.249 15.1588C25.8615 15.5524 25.8615 16.4476 25.249 16.8412L10.9827 26.0099C10.3171 26.4376 9.44202 25.9597 9.44202 25.1686V6.83138Z" fill="CurrentColor" />
        </svg>
    )
}