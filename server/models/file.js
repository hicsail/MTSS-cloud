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
    Assert.ok(doc.type, 'Missing type argument.');    
    
    let document = {
      userId: doc.userId, //id of user who submitted 
      name: doc.name,
      size: doc.size,
      type: doc.type,
      createdAt: new Date(),
      variablesHierarchy: null,
      readmeId: null,
      fieldsTypes: null, 
      uniqueIdentifier: null, 
      dfType: null, 
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
      Assert.ok(doc.type, 'Missing type argument.'); 

      doc.createdAt = new Date(); 
      doc.preValidationSteps = this.initializePreValidationStepsObj();
      doc.variablesHierarchy = null; 
      doc.fieldsTypes = null;
      doc.readmeId = null;  
      doc.uniqueIdentifier = null; 
      doc.dfType = null;
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
      dfType: false,
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
  createdAt: Joi.date().required(),
  type: Joi.string().required().valid('csv', 'readme', 'video', 'image')   
});

File.preValidationStepsPayload = Joi.object({
  anonymization: Joi.boolean().optional(),
  dfType: Joi.boolean().optional(),
  fieldsTypes: Joi.boolean().optional(),
  readmeSelection: Joi.boolean().optional(),
  variablesHierarchy: Joi.boolean().optional(),
  uniqueIdentifier: Joi.boolean().optional()
});

File.variablesHierarchyPayload = Joi.object({
  variablesHierarchy: Joi.object().required()
});

File.readmeSelectionPayload = Joi.object({
  readmeId: Joi.string().required()
});

File.fieldsTypesPayload = Joi.array().items(
  Joi.object({
    fieldType: Joi.string().required(),
    cols: Joi.array().required()
  })
);

File.uniqueIdentifierPayload = Joi.object({
  uniqueIdentifier: Joi.string().required()
});

File.dfTypePayload = Joi.object({
  dfType: Joi.string().required().valid('screening', 'intervention')
});

File.routes = Hoek.applyToDefaults(AnchorModel.routes, {  
  create: {
    payload: Joi.object({      
      name: Joi.string().required(),
      size: Joi.number().required(),
      type: Joi.string().required().valid('csv', 'readme', 'video', 'image')           
    }),
    scope: []    
  },
  insertMany: {
    payload: Joi.object({      
      name: Joi.string().required(),
      size: Joi.number().required(),
      type: Joi.string().required().valid('csv', 'readme', 'video', 'image')            
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