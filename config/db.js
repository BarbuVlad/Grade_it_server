//Imports
const mysql = require("mysql2/promise");
require('dotenv/config');        // config file for DB conn

//create a pool for connections (better management)
const pool = mysql.createPool({
    host : process.env.DB_HOST || "localhost",
    user : process.env.DB_USER || "pcuser",
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE || "grade_it"    
});

async function query(sql, params) {
   // try{
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
    // } catch(err){
    //     console.error("Failed DB query execution... \n", err);
    // }
}

module.exports = { 
    query 
};



