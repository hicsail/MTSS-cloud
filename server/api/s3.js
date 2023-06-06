'use strict';
const Boom = require('boom');
const File = require('../models/file');
const AWS = require('aws-sdk');
const Config = require('../../config');

const register = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/S3/saveFilesToBucket/{fileType?}',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      },
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 1000000*1024*1024
      },
      pre: [
        {
          assign: 'fileNameIsUnique',
          method: async function (request, h) {

            const fileName = request.payload.file['hapi']['filename'];
            const files = await File.find({name: fileName});
            
            if (files.length > 0) {              
              return false; //since this api is supposed to be followed by another ajax api call, we return any way
            }
            else {
              return true;;
            }      
          }
        }
      ]         
    },      
    handler: async function (request, h) { 

      if (!request.pre.fileNameIsUnique) {
        return {'success': false, 'fileName': ''};
      }  

      const fileStream = request.payload.file;
      const fileName = fileStream['hapi']['filename'];
      const bucketName = Config.get('/S3/bucketName'); 
      const fileType = request.params.fileType;
      
      try {
        await uploadToS3(fileStream, fileName, bucketName, fileType);        
      } 
      catch (err) {        
        //throw Boom.badRequest('Unable to upload file because ' + err.message);
        return {'success': false, 'fileName': ''};
      }
      return {'success': true, 'fileName': fileName};
    }
  }); 

  server.route({
    method: 'GET',
    path: '/api/S3/getObject/{fileName}/{fileType?}',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      }             
    },      
    handler: async function (request, h) {      

      let fileStream;
      const fileName = request.params.fileName;
      const bucketName = Config.get('/S3/bucketName');
      const fileType = request.params.fileType; 
      
      try {
        fileStream = await getObjectFromS3(fileName, bucketName, fileType);             
      } 
      catch (err) {        
        throw Boom.badRequest('Unable to download file because ' + err.message);
      }
      
      return h.response(fileStream)
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', 'attachment;');   
    }
  }); 

  server.route({
    method: 'DELETE',
    path: '/api/S3/deleteFile/{fileName}/{fileType?}',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      }           
    },      
    handler: async function (request, h) {
      
      const fileName = request.params.fileName;
      const bucketName = Config.get('/S3/bucketName');
      const fileType = request.params.fileType;  
      
      try {
        await deleteFromS3(bucketName, fileName, fileType);        
      } 
      catch (err) {        
        throw Boom.badRequest('Unable to delete file because ' + err.message);
      }

      return "success";
    }
  });   
};

async function deleteFromS3(bucketName, fileName, fileType=null) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });

  const directory = fileType ? Config.get('/S3/fileTypesToDirectories')[fileType] : null;

  const params = {
    Bucket: bucketName,
    Key: directory ? directory + '/' + fileName : fileName   
  };

  return new Promise((resolve, reject) => {    
    s3.deleteObject(params, (s3Err, data) => {      
      if (s3Err) {        
        reject(s3Err);      
      }
      else {         
        console.log(data)
        resolve(`${data}`);  
      }   
    });  
  }); 
}

async function uploadToS3(fileStream, fileName, bucketName, fileType=null) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });
  
  const directory = fileType ? Config.get('/S3/fileTypesToDirectories')[fileType] : null;

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
        //console.log(`File uploaded successfully at ${data.Location}`);
        resolve(`${data.Location}`);  
      }   
    });  
  });  
}

async function getObjectFromS3(fileName, bucketName, fileType=null) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });

  const directory = fileType ? Config.get('/S3/fileTypesToDirectories')[fileType] : null;
  
  const params = {
    Bucket: bucketName,
    Key: directory ? directory + '/' + fileName : fileName,    
  };

  return new Promise((resolve, reject) => {    
    s3.getObject(params, (s3Err, data) => {          
      if (s3Err) {        
        reject(s3Err);      
      }
      else {        
        resolve(data.Body);  
      }   
    });  
  });  
}

module.exports = {
  name: 'fileUpload',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};