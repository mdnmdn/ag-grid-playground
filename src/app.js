import React, {useState, useEffect} from 'react';
import ReactDOM, {render} from 'react-dom';

import Grid from './grid.js';
import { goToLogin, checkAccessToken, getAccessToken } from './auth.js';

const l = console.log;

const App = () => {
  
  const [token, setToken] = useState(null);
    
  useEffect(() => {
    checkAccessToken();
    if (!token) {
      const newToken = getAccessToken();
      l({ token, newToken});
      if (newToken) setToken(() => newToken);
      l({ token, newToken});
    } 
  }, [token]);
  l({ token });
  return (<div
    style={{
      height: '95vh',
      //width: '600px',
      width: '100%',
    }}
    >
      {!token ? (
        <div>
          <h1>Login</h1>
          <button onClick={goToLogin}>Login</button>
        </div>
      ) : (
        <Grid />
      )}
    
    
  </div>);
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);