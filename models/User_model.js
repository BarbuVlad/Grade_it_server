const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class User {
  /**/

  constructor(){
    //this.db = require('../config/db');
    this.id=null;
    this.email=null;
    this.password=null;
  }


  //-------------------READ-------------------
  async getAll(){
    /*Function dose NOT modifie object attributes
    returns results - static like function*/

    const data = await db.query('SELECT id, email, password FROM users');
    const meta = {};

    if(!data.length){return false;}
    return {
      data,
      meta
    }
  }

  async getSingle(email){
    /*Function modifies object attributes*/
    //validate data

    //make query
    const sql = 'SELECT id, email, password FROM users WHERE email = ? LIMIT 0,1;';
    const data = await db.query(sql, [email]);
    
    //Pass data to object
    if(!data.length){return false;}

    this.id=data[0]["id"];
    this.email=data[0]["email"];
    this.password=data[0]["password"];

    //return value
    return true;
    /*const meta = {};
    return {
      data,
      meta
    }*/
  }

  //-------------------CREATE-------------------

  async create(){
    /*Function uses object attributes
      Returned codes:
      0 = success
      1 = rows not affected
      2 = duplicate PK (1062 mysql err code)
      3 = other error
    */

    //validate data
    

    //hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    //prepare query
    const sql = `INSERT INTO users(email, password)
    VALUES(?, ?);
    `;
    //make query
    try{
      const result = await db.query(sql, [this.email,this.password]);
      console.log("----->",result);
      if (result.affectedRows) {
        return 0; //successfull
      } else {
          return 1;//un-successfull
        }
    }catch(err){
      if(err.errno==1062){
        return 2; //duplicate PK (user exists)
      }
      return 3; //other error occured
    }

  }


  //-------------------UPDATE-------------------


  //-------------------DELETE-------------------


  /*-------------------Utility Methods-------------------
    Non-CRUD functions that are bound to the User object
    Why? Information Expert Principle                             
  */

  generateAuthToken(){
    /*Returns a JWT token based on user  */
    const token = jwt.sign({id: this.id }, process.env.JWT_PRIVATE_KEY);
    return token;
  }

  static validateUserData(user){
    /*Validates user parameter; in JS object format {...}
      email: string in email format (2 min. domains like: exemple.com)
      password: string between 5 and 60 chars
      
      *The function returns the error message or
      null if no error was found

      For the parameter pass the actual object attributes
      or variabiles that must respect validation 

      */
    const schema = Joi.object({
      email: Joi.string().required().email({minDomainSegments: 2, tlds: {allow: false} }),
      password: Joi.string().min(5).max(60).required(),

    });

    const result = schema.validate(user);
    if(result.error){return result.error.details[0].message}//
    return null;

  }

}

  module.exports = {
    User
  }