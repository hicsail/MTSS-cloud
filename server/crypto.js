'use strict';
const Bcrypt = require('bcrypt');
const UUID = require('uuid/v4');

class Crypto {

  static async genSalt(rounds) {

    return await Bcrypt.genSalt(rounds);
  }

  static async hash(key,salt) {

    return await Bcrypt.hash(key,salt);
  }

  static async generateKeyHash() {

    const key = UUID();
    const salt = await  Bcrypt.genSalt(10);
    const hash = await Bcrypt.hash(key,salt);

    return { key, hash };
  }

  static async compare(key,token) {

    return await Bcrypt.compare(key, token);

  }

}

module.exports = Crypto;
