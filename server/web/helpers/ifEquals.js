'use strict';

module.exports = (arg1, arg2, options) => {  

console.log("arg1",arg1)
console.log("arg2", arg2)
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
};
