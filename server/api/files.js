'use strict';
const Boom = require('boom');
const Joi = require('joi');
const File = require('../models/file');
const FS = require('fs');
const Path = require('path');
const Config = require('../../config');
const Spawn = require('child_process').spawn;
const Exec = require('child_process').exec;
const Promisify = require('util').promisify;

const FILES_DIR_PATH = Config.get('/datasetDirectoryPath');

const register = function (server, options) { 

  server.route({
    method: 'GET',
    path: '/api/files/anonymization/column-check/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      let columns;

      const scriptPath = Path.join(__dirname, '../python-scripts/column_check.py');       
      const dataPath = Path.join(FILES_DIR_PATH, fileName); 

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }

      if (!FS.existsSync(scriptPath)) {
        throw Boom.badRequest("Python script wasn't found!");
      }        

      try {
        columns = await anonymizationColumnCheck(scriptPath, dataPath);       
      }
      catch(error) {
        throw Boom.badRequest('Unable to find HIPAA violating columns!');  
      }    
      
      return ({ message: 'Success', 'columns': JSON.parse(JSON.stringify(columns))});
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/pre-validation/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.preValidationStepsPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      let preValidationSteps = file.preValidationSteps ? 
                                file.preValidationSteps : 
                                File.initializePreValidationStepsObj();

      for (const key in request.payload) {
        preValidationSteps[key] = request.payload[key];
      }    

      const update = {
        $set: {
          preValidationSteps: preValidationSteps          
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/variables-hierarchy/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.variablesHierarchyPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      

      const update = {
        $set: {
          variablesHierarchy: request.payload.variablesHierarchy        
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/readme-selection/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.readmeSelectionPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      

      const update = {
        $set: {
          readmeId: request.payload.readmeId        
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/unique-identifier/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.uniqueIdentifierPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      

      const update = {
        $set: {
          uniqueIdentifier: request.payload.uniqueIdentifier       
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/fields-types/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.fieldsTypesPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      

      const update = {
        $set: {
          fieldsTypes: request.payload        
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/unique-identifier/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      return ({ message: 'Success', 'uniqueIdentifier': file['uniqueIdentifier'] });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/dfType/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.dfTypePayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      

      const update = {
        $set: {
          dfType: request.payload.dfType        
        }
      };
      file = await File.findByIdAndUpdate(id, update);
      return ({ message: 'Success', doc: file });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/dfType/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      return ({ message: 'Success', 'dfType': file['dfType'] });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/columns/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      return ({ message: 'Success', 'columns': file['columns'] });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/fields-types/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      return ({ message: 'Success', 'fieldsTypes': file['fieldsTypes'] });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/variables-hierarchy/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      return ({ message: 'Success', 'hierarchy': file['variablesHierarchy'] });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/readme/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {

      const id = request.params.id;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }      
      return ({ message: 'Success', 'readmeId': file.readmeId });
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/readmes/{userId}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {            

      const userId = request.params.userId;

      let files = await File.find({type: 'readme', userId: userId});      
      return ({files});
    }
  });
};

async function anonymizationColumnCheck(scriptPath, dataPath) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {  
      
      const runCommand = Spawn('python', [scriptPath, '--csv_path', dataPath]);
      runCommand.stdout.on('data', (data) => {
        result += data.toString();        
      });
      runCommand.stdout.on('end', (data) => {               
        resolve(result);                   
      });
      runCommand.stderr.on('data', (data) => {      
        reject(data.toString());        
      });
      runCommand.on('error', err => {        
        throw new Error(err.message);
      });
      runCommand.on('close', code => {        
        resolve(code)
        //throw new Error('Exit with code' + code);
      });
    } catch (e) {      
      reject(e);
    }
  }); 
}

module.exports = {
  name: 'files',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
