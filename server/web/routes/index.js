'use strict';
const Config = require('../../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: {
        mode: 'try',
        strategies: ['session']        
      }      
    },
    handler: function (request, h) {      
      let user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }
      return h.view('index/index', {
        user,
        projectName: Config.get('/projectName'),
        title: 'Home',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });
};

module.exports = {
  name: 'home',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
