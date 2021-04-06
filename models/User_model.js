const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {

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



}


//CRUD functions 

//-------------------READ-------------------
async function getAll(){
    const data = await db.query('SELECT * FROM users');
    const meta = {};

    return {
      data,
      meta
    }
  }

  async function getSingle(email){
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 0,1;';
    const data = await db.query(sql, [email]);
    const meta = {};
    
    return {
      data,
      meta
    }
  }

  //-------------------CREATE-------------------

  async function create(email, password){
    const sql = `INSERT INTO users(email, password)
    VALUES(?, ?);
    `;
    const result = await db.query(sql, [email,password]);

    let message = 'Error in creating user...';
    if (result.affectedRows) {
        message = 'User created successfully';
      }
   // const meta = {};
    
    return {
      message
    }
  }


  //-------------------UPDATE-------------------


  //-------------------DELETE-------------------
  
  module.exports = {
    getAll,
    getSingle,
    create,
    User
  }