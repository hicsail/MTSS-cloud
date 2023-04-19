'use strict';
const Config = require('../../../config');
const File = require('../../models/file');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/dashboard',
    options : {
      auth: {
        strategies: ['session']        
      }
    },
    handler: async function (request, h) {

      const user = request.auth.credentials.user;
      let files = await File.lookup({}, File.lookups);
      files = files.map((file) => {
              file['size'] = formatFileSize(file['size']);              
              for (const key in file.preValidationSteps) {                
                if (!file.preValidationSteps[key]) {
                  file['preValidationNotCompleted'] = true;
                  break;
                } 
              }             
              return file;
            }); 
                 
      return h.view('dashboard/index', {
        user,
        projectName: Config.get('/projectName'),
        title: 'Dashboard',
        baseUrl: Config.get('/baseUrl'),
        files        
      });
    }
  });
};

function formatFileSize(size) {

  if (size === 0) {
    return 0;
  }
  let i = Math.floor( Math.log(size) / Math.log(1024) );
  return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + '' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};


module.exports = {
  name: 'dashboard',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
