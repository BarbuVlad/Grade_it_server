const db = require('../config/db');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class Answer {
  /*
  This class creates the interface between the answers table and the server app.

  */
  static TABLE_NAME="answers";
  constructor(){
    this.id_user=null;
    this.id_test=null;
    this.date_time=null;
    this.answers=null;
  }

  //-------------------READ-------------------
  async getAllById( userId=null, testId=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - testId=null, userId=null => return all data
        - testId=null, userId=X    => return all data for that user_id
        - testId=X, userId=null    => return all data fro that testId
        - testId=X, userId=Y       => return 1 entry if it exists
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(testId)) || isNaN(Number(userId))){
        return -1;
    }

    let sql = `SELECT id_user, id_test, date_time, answers FROM ${Answer.TABLE_NAME}`;
    //integrate condition
    (testId==null && userId==null) ? sql += ` WHERE 1;` : null;
    (testId==null && userId!=null) ? sql += ` WHERE id_user=${userId};` : null;
    (testId!=null && userId==null) ? sql += ` WHERE id_test=${testId};` : null;
    (testId!=null && userId!=null) ? sql += ` WHERE id_user=${userId} AND id_test=${testId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        return data;
    } catch(err){///< error occurred
        return -2;
    }
  }

    //-------------------CREATE-------------------

    async create(){
        /*Function uses object attributes
            Returned codes:
            0 = success
            1 = rows not affected
            2 = FK missing (either user or test do not exist)
            3 = other error
        */
        
        //prepare query
        const sql = `INSERT INTO ${Answer.TABLE_NAME}(id_user, id_test, date_time, answers)
        VALUES(?, ?, ?, ?);
        `;
        this.id_user===undefined ? this.id_user=null : null;
        this.id_test===undefined ? this.id_test=null : null;
        this.date_time===undefined ? this.date_time=null : null;
        this.answers===undefined ? this.answers=null : null;

        //make query
        try{
            const result = await db.query(sql, [this.id_user, this.id_test, this.date_time, this.answers]);
            //console.log("----->",result);
            if (result.affectedRows) {
            return 0; //successfull
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
    Answer
  }