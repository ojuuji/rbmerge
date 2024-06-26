import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onUpdate(registration) {
      registration.waiting?.addEventListener('statechange', event => {
        if (event.target.state === 'activated') {
          window.location.reload()
        }
      });
      registration.waiting?.postMessage({type: 'SKIP_WAITING'});
    }
  });
}
else {
  serviceWorkerRegistration.unregister();
}
