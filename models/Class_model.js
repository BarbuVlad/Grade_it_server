const db = require('../config/db');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class Class {
  /*
  This class creates the interface between the classes table and the server app.

  */
  static TABLE_NAME="classes";
  constructor(){
    this.id=null;
    this.id_owner=null;///< FK to users.id 
    this.name=null;
    this.description=null;
  }

  //-------------------READ-------------------
  async getById(classId=null){
    /*Function does NOT modify object attributes
    Will return selected data based on classId parameter
    TODO: give possibility to select columns to extract
     (maybe an abstarct class function...)
    */
    //verify parameters
    if( isNaN(Number(classId)) ){
        return 1;
    }

    let sql = `SELECT id, id_owner, name, description FROM ${Class.TABLE_NAME}`;
    //integrate condition
    (classId!=null) ? sql += ` WHERE id=${classId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        this.id=data[0]["id"];
        this.id_owner=data[0]["id_owner"];
        this.name=data[0]["name"];
        this.description=data[0]["description"];

        return 0;
    } catch(err){///< error occurred
        return 2;
    }
  }

    //-------------------CREATE-------------------

    async create(){
        /*Function uses object attributes
            Returned codes:
            0 = success
            1 = rows not affected
            2 = FK constain fail (1452 mysql err code)
            3 = other error
        */
        
        //prepare query
        const sql = `INSERT INTO ${Class.TABLE_NAME}(id_owner, name, description)
        VALUES(?, ?, ?);
        `;
        this.id_owner===undefined ? this.id_owner=null : null;
        this.name===undefined ? this.name=null : null;
        this.description===undefined ? this.description=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.id_owner,this.name, this.description]);
            //console.log("----->",result);
            if (result.affectedRows) {
            return [0, result.insertId]; //successfull
            } else {
                return 1;//un-successfull
            }
        }catch(err){
            if(err.errno==1452){
                return 2; //FK missing
            }
            return 3; //other error occured
        }
        }

    
}

  module.exports = {
    Class
  }