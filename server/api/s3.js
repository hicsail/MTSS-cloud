'use strict';
const Boom = require('boom');
const User = require('../models/file');
const ObjectId = require('mongodb').ObjectID;
const AWS = require('aws-sdk');
const Config = require('../../config');

const register = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/S3/saveFilesToBucket',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      },
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 1000000*1024*1024
      }         
    },      
    handler: async function (request, h) {      

      const fileStream = request.payload.file;
      const fileName = fileStream['hapi']['filename'];
      const bucketName = Config.get('/S3/bucketName'); 
      
      try {
        await uploadToS3(fileStream, fileName, bucketName);        
      } 
      catch (err) {        
        throw Boom.badRequest('Unable to upload file because ' + err.message);
      }

      return fileName;
    }
  }); 

  server.route({
    method: 'GET',
    path: '/api/S3/getObject/{fileName}',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      }             
    },      
    handler: async function (request, h) {      

      let fileStream;
      const fileName = request.params.fileName;
      const bucketName = Config.get('/S3/bucketName'); 
      
      try {
        fileStream = await getObjectFromS3(fileName, bucketName);             
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
    path: '/api/S3/deleteFile/{fileName}',
    options: {
      auth: {
        strategies: ['simple', 'session']        
      }           
    },      
    handler: async function (request, h) {
      
      const fileName = request.params.fileName;
      const bucketName = Config.get('/S3/bucketName'); 
      
      try {
        await deleteFromS3(bucketName, fileName);        
      } 
      catch (err) {        
        throw Boom.badRequest('Unable to delete file because ' + err.message);
      }

      return "success";
    }
  });   
};

async function deleteFromS3(bucketName, fileName) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });

  const params = {
    Bucket: bucketName,
    Key: fileName    
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

async function uploadToS3(fileStream, fileName, bucketName) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });
  
  const params = {
    Bucket: bucketName,
    Key: fileName, 
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

async function getObjectFromS3(fileName, bucketName) {

  const s3 = new AWS.S3({
    accessKeyId: Config.get('/S3/accessKeyId'),
    secretAccessKey: Config.get('/S3/secretAccessKey')
  });
  
  const params = {
    Bucket: bucketName,
    Key: fileName,    
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