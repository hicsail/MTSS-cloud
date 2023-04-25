'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const User = require('./user');
const Hoek = require('hoek');


class File extends AnchorModel {

  static async create(doc) { 
      
    Assert.ok(doc.userId, 'Missing userId argument.');
    Assert.ok(doc.name, 'Missing name argument.');
    Assert.ok(doc.size, 'Missing size argument.');    
    
    let document = {
      userId: doc.userId, //id of user who submitted 
      name: doc.name,
      size: doc.size,
      createdAt: new Date(),
      preValidationSteps: this.initializePreValidationStepsObj()        
    };          

    const files = await this.insertOne(document);
    return files[0];
  }

  static async createMany(docs) { 
    
    for (const doc of docs)  {
      Assert.ok(doc.userId, 'Missing userId argument.');
      Assert.ok(doc.name, 'Missing name argument.');
      Assert.ok(doc.size, 'Missing size argument.'); 

      doc.createdAt = new Date(); 
      doc.preValidationSteps = this.initializePreValidationStepsObj();
    }    
    
    /*let document = {
      userId: doc.userId, //id of user who submitted 
      name: doc.name,
      size: doc.size,
      createdAt: new Date()        
    };*/         

    const files = await this.insertMany(docs);
    return files;
  }

  static initializePreValidationStepsObj() {
    return {
      anonymization: false,
      uniqueIdentifier: false,
      dfShape: false,
      fieldsTypes: false,
      readmeSelection: false,
      variableLevel: false
    };
  }
}


File.collectionName = 'files';

File.schema = Joi.object({
  _id: Joi.object(),  
  userId: Joi.string().required(),
  name: Joi.string().required(),
  size: Joi.number().required(),
  createdAt: Joi.date().required()   
});

File.preValidationStepsPayload = Joi.object({
  anonymization: Joi.boolean().optional(),
  dfShape: Joi.boolean().optional(),
  fieldsTypes: Joi.boolean().optional(),
  readmeSelection: Joi.boolean().optional(),
  variableLevel: Joi.boolean().optional(),
  uniqueIdentifier: Joi.boolean().optional()
});

File.routes = Hoek.applyToDefaults(AnchorModel.routes, {  
  create: {
    payload: Joi.object({      
      name: Joi.string().required(),
      size: Joi.number().required()           
    }),
    scope: []    
  },
  insertMany: {
    payload: Joi.object({      
      name: Joi.string().required(),
      size: Joi.number().required()           
    }), 
    scope: [],
    disabled: false    
  }    
});

File.lookups = [
  {
    from: require('./user'),
    local: 'userId',
    foreign: '_id',
    as: 'user',
    one: true
  }  
];

File.indexes = [
  { key: { userId: 1 } }  
];

module.exports = File;