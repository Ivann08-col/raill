const config = {
  apiBase: 'http://localhost:5000/api',
  paths: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me'
  },
  tokenField: 'access_token',
  usuarioField: 'usuario'
};
export default config;
