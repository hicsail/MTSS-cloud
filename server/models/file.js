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
      createdAt: new Date()        
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
}


File.collectionName = 'files';

File.schema = Joi.object({
  _id: Joi.object(),  
  userId: Joi.string().required(),
  name: Joi.string().required(),
  size: Joi.number().required(),
  createdAt: Joi.date().required()   
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