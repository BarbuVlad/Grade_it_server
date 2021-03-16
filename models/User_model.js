const db = require('../config/db');

//CRUD functions 

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
  
  module.exports = {
    getAll,
    getSingle,

  }