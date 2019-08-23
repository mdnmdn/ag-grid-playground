
import { getAccessToken, logout } from './auth.js';

const baseUrl = 'https://gitlab.com/api/v4';

const get = async (url) => {
  const token = getAccessToken();
  const separator = url.indexOf('?') >= 0 ? '&' : '?';
  const authUrl = `${url}${separator}access_token=${token}`;
  try {
    const req = await fetch(baseUrl + authUrl, {
      method: 'GET',
      // headers: { 'Authentication': `Bearer ${token}`, },
    });
    console.log({req})
    if (req.status === 401) logout();
    const data = await req.json();
    return data;
  } catch(e) {
    console.error(e);
  }
};

const pagedLoad = async (url) => {
  const separator = url.indexOf('?') >= 0 ? '&' : '?';
  let effectiveUrl = `${url}${separator}per_page=100&page=`;
  
  let completed = false
  const rows = [];

  for(let page = 1; !completed; page++) {
    const pagedRow = await get(`${effectiveUrl}${page}`);
    rows.push(...pagedRow);
    if (!pagedRow.length) completed = true;
  }

  return rows;
}

export const loadIssues = () => {
  return pagedLoad('/groups/2098140/issues');
}

export const loadProjects = () => {
  return pagedLoad('/groups/2098140/projects');;
}
HTMLFormControlsCollection.el