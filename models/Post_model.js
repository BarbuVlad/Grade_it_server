const db = require('../config/db');

//CRUD functions 

async function getAll(){
    const data = await db.query('SELECT * FROM posts');
    const meta = {};
  
    return {
      data,
      meta
    }
  }
  
  module.exports = {
    getAll
  }