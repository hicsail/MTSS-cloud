'use strict';
const Boom = require('boom');
const Joi = require('joi');
const File = require('../models/file');
const FS = require('fs');
const AWS = require('aws-sdk');
const Path = require('path');
const Config = require('../../config');
const Spawn = require('child_process').spawn;
const Exec = require('child_process').exec;
const Promisify = require('util').promisify;
const { parse } = require("csv-parse");

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
    path: '/api/files/anonymization-on-request/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.anonymizationOnRequestPayload
      }     
    },
    handler: async function (request, h) {

      const id = request.params.id; 
      const anonymizationRequests = request.payload.anonymizationRequests;    
      
      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      let updatedContent;

      const scriptPath = Path.join(__dirname, '../python-scripts/anonymize_on_request.py');       
      const dataPath = Path.join(FILES_DIR_PATH, fileName); 

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }

      if (!FS.existsSync(scriptPath)) {
        throw Boom.badRequest("Python script wasn't found!");
      }        

      try {
        updatedContent = await anonymizationOnRequest(scriptPath, dataPath, JSON.stringify(anonymizationRequests)); 
        FS.writeFileSync(dataPath, updatedContent);        
        await uploadToS3(updatedContent, fileName, file.type);             
      }
      catch(error) {         
        throw Boom.badRequest('Unable to perfom requested anonymization!');  
      }    
      
      return ({ message: 'Success'});
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
    method: 'GET',
    path: '/api/files/anonymization-flags/{id}',
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
      const preValidationSteps = file.preValidationSteps;
      return ({ message: 'Success', 
                columnCheck: preValidationSteps['columnCheck'],
                anonymizationOnReq: preValidationSteps['anonymizationOnReq'],
                uniqueIdentifier: preValidationSteps['uniqueIdentifier']
              });
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

  /*server.route({
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
  });*/

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
    path: '/api/files/anonymization/{id}',
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

      return ({ message: 'Success', 'anonymization': file['preValidationSteps']['anonymization'] });
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
    path: '/api/files/columns/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {            

      const id = request.params.id;
      const  file = await File.findById(id);
      
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      const dataPath = Path.join(FILES_DIR_PATH, fileName);
      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      } 
      const columns = getFileColumns(dataPath);            
      return ({columns});
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/dfShape/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {            

      const id = request.params.id;
      const  file = await File.findById(id);

      if (!file) {
        throw Boom.notFound('File not found!');
      }               
      return ({ message: 'Success', 
                participantId: file.participantId,
                shape: file.shape
              });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/dfShape/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.DFShapePayload
      },           
    },
    handler: async function (request, h) {            

      const id = request.params.id;
      let file = await File.findById(id);
      const participantId = request.payload.participantId;
      let shape = 'wide';
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      const dataPath = Path.join(FILES_DIR_PATH, fileName);
      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      } 
      const multipleRows = await hasMultipleRows(dataPath, participantId); 
      if (multipleRows) {
        shape = 'long';
      }  
      const update = {
        $set: {
          shape: shape,
          participantId: participantId        
        }
      };
      file = await File.findByIdAndUpdate(id, update);     
      return ({shape});
    }
  });

  server.route({
    method: 'GET',
    path: '/api/files/content/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }          
    },
    handler: async function (request, h) {            

      const id = request.params.id;
      const  file = await File.findById(id);

      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      const dataPath = Path.join(FILES_DIR_PATH, fileName); 
      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }
      const content = getFileContent(dataPath);            
      return ({content});
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

  server.route({
    method: 'PUT',
    path: '/api/files/remove-identifying-cols/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: File.removeIdentifyingColsPayload
      },      
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const identifyingCols = request.payload.identifyingCols;      

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;
      let columns;
             
      const dataPath = Path.join(FILES_DIR_PATH, fileName); 

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }            
      
      try {
        const updatedContent = await removeIdentifyingColumns(fileName, dataPath, identifyingCols);     
        FS.writeFileSync(dataPath, updatedContent);        
        await uploadToS3(updatedContent, fileName, file.type); 
      }
      catch (e) {      
        throw Boom.badRequest("Unable to remove columns because " + e.message);
      }                       
      return ({ message: 'Success'});
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/viz/missing_data/{id}',
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
      const scriptPath = Path.join(__dirname, '../python-scripts/viz/missing_data.py');                  
      const dataPath = Path.join(FILES_DIR_PATH, fileName);       
      const outputPath = Path.join(__dirname, '../web/public/viz', id);
      let imageNames;

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }            
      
      try {
        imageNames = await missingDataViz(scriptPath, dataPath, outputPath);     
         
      }
      catch (e) {      
        throw Boom.badRequest("Unable to create missing data visualizationas " + e.message);
      }                       
      return ({ message: 'Success', 
              imageNames: JSON.parse(JSON.stringify(imageNames))
            });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/viz/analytics/{id}',
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
      const scriptPath = Path.join(__dirname, '../python-scripts/viz/analytics_viz.py');                  
      const dataPath = Path.join(FILES_DIR_PATH, fileName);       
      const outputPath = Path.join(__dirname, '../web/public/viz', id);
      let imageNames;

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }            
      
      try {
        imageNames = await analyticsViz(scriptPath, dataPath, outputPath);        
      }
      catch (e) {      
        throw Boom.badRequest("Unable to create missing data visualizationas " + e.message);
      }                       
      return ({ message: 'Success', 
              imageNames: JSON.parse(JSON.stringify(imageNames))
            });
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/files/viz/data_distribution/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }        
    },
    handler: async function (request, h) {

      const id = request.params.id; 
      const column = request.payload.column;          

      let file = await File.findById(id);
      if (!file) {
        throw Boom.notFound('File not found!');
      }

      const fileName = file.name;  
      const scriptPath = Path.join(__dirname, '../python-scripts/viz/data_distribution.py');                  
      const dataPath = Path.join(FILES_DIR_PATH, fileName);       
      const outputPath = Path.join(__dirname, '../web/public/viz', id);
      let imageNames;

      if (!FS.existsSync(dataPath)) {        
        throw Boom.badRequest("Data file wasn't found!");
      }            
      
      try {
        imageNames = await dataDistributionViz(scriptPath, dataPath, outputPath, column);     
         
      }
      catch (e) {      
        throw Boom.badRequest("Unable to create missing data visualizationas " + e.message);
      }                       
      return ({ message: 'Success', 
              imageNames: JSON.parse(JSON.stringify(imageNames))
            });
    }
  });
};

function getFileContent(dataPath) {

  const data = FS.readFileSync(dataPath, {encoding:'utf8', flag:'r'});
  return data;
}

function hasMultipleRows(dataPath, participantId) {

  const data = FS.readFileSync(dataPath, {encoding:'utf8', flag:'r'});
  const rows = data.split('\n');
  const headerCols = rows[0].split(',')
                            .map(str => str.replace(/"/g, '').replace(/'/g, "").trim());
  const participantIdx = headerCols.indexOf(participantId);  
  rows.shift();
  let values = [];
  for (const row of rows){
    if (row) {
      const val = row[participantIdx];
      if (values.indexOf() === -1) {
        values.push(val);
      }
      else {
        return true;
      }       
    }
  }
  return false;
}

function getFileColumns(dataPath) {

  const data = FS.readFileSync(dataPath, {encoding:'utf8', flag:'r'});  
  const rows = data.split('\n');
  const headerCols = rows[0].split(',')
                            .map(str => str.replace(/"/g, '').replace(/'/g, "").trim());
  return headerCols;
}

async function removeIdentifyingColumns(fileName, dataPath, identifyingCols) {

  const data = FS.readFileSync(dataPath, {encoding:'utf8', flag:'r'});    
  const rows = data.split('\n');
  const headerCols = rows[0].split(',')
                            .map(str => str.replace(/"/g, '').replace(/'/g, "").trim());
                                                       
  const headerIndices = identifyingCols.map((col) => headerCols.indexOf(col));
  const headerLength = headerCols.length - headerIndices.length;
  
  let updatedRows = [];
  //let rowIdx = 0;
  //let valuesRegExp = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g;
  
  /*const updatedRows = rows.map((row) => {
                                  let rowElems = row.split(',');
                                  for (let i=0; i<=headerIndices.length; ++i) {
                                    const idx = headerIndices[i];
                                    rowElems.splice(idx-i, 1); 
                                  }
                                  return rowElems.join(',');                                  
                              });*/
  String.prototype.splitCSV = function(sep) {
    var regex = /(\s*'[^']+'|\s*[^,]+)(?=,|$)/g;
    return this.match(regex);    
  }
  return new Promise(async (resolve, reject) => {

    try {  
      /*FS.createReadStream(dataPath)
      .pipe(parse({ delimiter: ",", from_line: 1}))
      .on("data", function (row) {        
        let updatedRow = [];        
        for (let i=0; i<row.length; ++i) {
          const val = row[i];
          if (!headerIndices.includes(i)) {
            updatedRow.push(val);
          }
        }        
        updatedRows.push(updatedRow.join(','));
      })
      .on("end", function () {        
        resolve(updatedRows.join('\n'));
      })
      .on("error", function (error) {        
        reject(error);
      });*/
      for (let row of rows) {
        if (row) {
          //row = row.replace(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g, '###COMMA###');
          let updatedRow = [];
          //const vals = row.split(',').map(str => str.trim());  
          const vals = row.splitCSV();         
          for (let i=0; i<vals.length; ++i) {
            const val = vals[i];
            if (!headerIndices.includes(i)) {
              updatedRow.push(val)
            }
          }
          if (updatedRow.length === headerLength) {
            updatedRows.push(updatedRow.join(','));    
          } 
        }                    
      }
      resolve(updatedRows.join('\n'))      
    } catch (e) {      
      reject(e);
    }
  });        
}

async function anonymizationOnRequest(scriptPath, dataPath, requests) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {        
      const runCommand = Spawn('python3', [scriptPath, '--csv_path', dataPath, '--requests', requests]);
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

async function anonymizationColumnCheck(scriptPath, dataPath) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {        
      const runCommand = Spawn('python3', [scriptPath, '--csv_path', dataPath]);
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

async function analyticsViz(scriptPath, dataPath, outputPath) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {  
      if (!FS.existsSync(outputPath)) { //if directory for data visualziation doesn't exist        
        FS.mkdirSync(outputPath);        
      }            
      const runCommand = Spawn('python3', [scriptPath, '--csv_path', dataPath, '--output_path', outputPath]);      
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
      console.log(e)     
      reject(e);
    }
  }); 
}

async function missingDataViz(scriptPath, dataPath, outputPath) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {  
      if (!FS.existsSync(outputPath)) { //if directory for data visualziation doesn't exist        
        FS.mkdirSync(outputPath);        
      }            
      const runCommand = Spawn('python3', [scriptPath, '--csv_path', dataPath, '--output_path', outputPath]);      
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
      console.log(e)     
      reject(e);
    }
  }); 
}

async function dataDistributionViz(scriptPath, dataPath, outputPath, column) {
  
  let result = '';
  return new Promise(async (resolve, reject) => {

    try {  
      if (!FS.existsSync(outputPath)) { //if directory for data visualziation doesn't exist        
        FS.mkdirSync(outputPath);        
      }            
      const runCommand = Spawn('python3', [scriptPath, '--csv_path', dataPath, '--output_path', outputPath, '--column_name', column]);      
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
      console.log(e)     
      reject(e);
    }
  }); 
}

async function uploadToS3(fileStream, fileName, fileType=null) {
  
  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });
  
  const directory = fileType ? Config.get('/S3/fileTypesToDirectories')[fileType] : null;
  const bucketName = Config.get('/S3/bucketName'); 

  const params = {
    Bucket: bucketName,
    Key: directory ? directory + '/' + fileName : fileName, 
    Body: fileStream
  };

  return new Promise((resolve, reject) => {    
    s3.upload(params, (s3Err, data) => {      
      if (s3Err) {              
        reject(s3Err);      
      }
      else {                      
        resolve(`${data.Location}`);  
      }   
    });  
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
