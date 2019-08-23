
const oauthParameters = {
  client_id: '9a64648d60a18962364b09d3c290d4bb3742095b6e274e54b5fe68e0aa63d664',
  redirect_uri: location.origin,
  response_type: 'token',
  state: 'xxxxx',
  scope: 'api',
};

const oauthUrl = 'https://gitlab.com/oauth/authorize';

const l = console.log;

export const goToLogin = () => {
  let url = `${oauthUrl}?`;

  Object.keys(oauthParameters).forEach(p => url = `${url}&${p}=${encodeURIComponent(oauthParameters[p])}`);

  location.href = url;
};

export const getAccessToken = () => {
  return localStorage.getItem('gitlabToken');
};

export const logout = () => {
  localStorage.removeItem('gitlabToken');
  location.href = '/';
};

export const checkAccessToken = () => {
    let query = location.hash;
    if (!query) return;
    [,query] = query.split('#');
    if(!query) return;
    const parameters = {};
    query.split('&').forEach(p => {
      const [key, value] = p.split('=');
      parameters[key] = value;
    });
l({parameters})
    if (parameters.access_token) {
      localStorage.setItem('gitlabToken', parameters.access_token);
      location.href = '/';
    }

};

