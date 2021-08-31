const db = require('../config/db');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class Test {
  /*
  This class creates the interface between the classes table and the server app.

  */
  static TABLE_NAME="tests";
  constructor(){
    this.id=null;
    this.name=null;
    this.description=null;
    //this.max_points=null;
    this.questions=null;
  }

  //-------------------READ-------------------
  async getById(testId=null){
    /*Function does modify object attributes
    Will return selected data based on testId parameter
    TODO: give possibility to select columns to extract
     (maybe an abstarct class function...)
    */
    //verify parameters
    if( isNaN(Number(testId)) ){
        return 1;
    }

    let sql = `SELECT id, name, description, questions FROM ${Test.TABLE_NAME}`;
    //integrate condition
    (testId!=null) ? sql += ` WHERE id=${testId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        this.id=data[0]["id"];
        this.name=data[0]["name"];
        this.description=data[0]["description"];
        this.questions=data[0]["questions"];

        return 0;
    } catch(err){///< error occurred
        return 2;
    }
  }

  async getByIdNoQuestions(testId=null){
    /* Like getById but does not include questions info
    Function does modify object attributes
    Will return selected data based on testId parameter
    TODO: give possibility to select columns to extract
     (maybe an abstarct class function...)
    */
    //verify parameters
    if( isNaN(Number(testId)) ){
        return 1;
    }

    let sql = `SELECT id, name, description FROM ${Test.TABLE_NAME}`;
    //integrate condition
    (testId!=null) ? sql += ` WHERE id=${testId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        this.id=data[0]["id"];
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
            2 = other error
        */
        
        //prepare query
        const sql = `INSERT INTO ${Test.TABLE_NAME}(name, description, questions)
        VALUES(?, ?, ?);
        `;
        this.name===undefined ? this.name=null : null;
        this.description===undefined ? this.description=null : null;
        this.questions===undefined ? this.questions=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.name, this.description, this.questions]);
            //console.log("----->",result);
            if (result.affectedRows) {
            return [0, result.insertId]; //successfull
            } else {
                return 1;//un-successfull
            }
        }catch(err){
            // if(err.errno==1452){
            //     return 2; //FK missing
            // }
            return 2; //other error occured
        }
    }

    async modifyQuestions(){
        /*Function uses object attributes
            Returned codes:
           -1 = test id cannot be null
            0 = success
            1 = rows not affected
            2 = other error
        */
        //prepare query
        const sql = `UPDATE ${Test.TABLE_NAME} SET questions = ? WHERE id = ?;`;
        if(this.id===undefined || this.id===null){return -1;}
        this.questions===undefined ? this.questions=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.questions, this.id]);
            //console.log("----->",result);
            if (result.affectedRows) {
            return 0; //successfull
            } else {
                return 1;//un-successfull
            }
        }catch(err){
            return 2; //other error occured
        }
    }
}

  module.exports = {
    Test
  }