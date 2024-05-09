export default function debugLog(message, level=1) {
//  if (process.env.NODE_ENV === 'development')
  if ((process.env.REACT_APP_DEBUG_LEVEL || 0) >= level) {
    console.log(message);
  }
}
