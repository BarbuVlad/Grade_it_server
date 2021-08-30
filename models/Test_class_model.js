const db = require('../config/db');
const Joi = require('joi'); //returns a class
const jwt = require('jsonwebtoken');
require('dotenv/config');

class TestClass {
  /*
  This class creates the interface between the test_class table and the server app.
  Test_class table is a bridge table: 
    it maps a test to a class
  */
  static TABLE_NAME="test_class";
  constructor(){
    this.id_test=null;
    this.id_class=null;
  }

  //-------------------READ-------------------
  async getAllById( classId=null, testId=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - testId=null, classId=null => return all data
        - testId=null, classId=X    => return all data for that class_id
        - testId=X, classId=null    => return all data fro that test_id
        - testId=X, classId=Y       => return 1 entry if it exists
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(testId)) || isNaN(Number(classId))){
        return -1;
    }

    let sql = `SELECT id_class, id_test FROM ${TestClass.TABLE_NAME}`;
    //integrate condition
    (testId==null && classId==null) ? sql += ` WHERE 1;` : null;
    (testId==null && classId!=null) ? sql += ` WHERE id_class=${classId};` : null;
    (testId!=null && classId==null) ? sql += ` WHERE id_test=${testId};` : null;
    (testId!=null && classId!=null) ? sql += ` WHERE id_class=${classId} AND id_test=${testId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        return data;
    } catch(err){///< error occurred
      console.log(err)
        return -2;
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
      const sql = `INSERT INTO ${TestClass.TABLE_NAME}(id_test, id_class)
      VALUES(?, ?);
      `;
      this.id_class===undefined ? this.id_class=null : null;
      this.id_test===undefined ? this.id_test=null : null;
      //make query
      try{
          const result = await db.query(sql, [this.id_test,this.id_class]);
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
          if(err.errno==1062){
            return 3; //PK duplicated
          }
          return 4; //other error occured
      }

      }


      async delete(){
        /*Function uses object attributes
            Returned codes:
            0 = success
            1 = rows not affected
            2 = other error
        */
        
        //prepare query
        const sql = `DELETE FROM ${TestClass.TABLE_NAME} WHERE id_test=? AND id_class=?;`;
        this.id_test===undefined ? this.id_test=null : null;
        this.id_class===undefined ? this.id_class=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.id_test, this.id_class]);
            //console.log("----->",result);
            if (result.affectedRows) {
            return 0; //successfull
            } else {
                return 1;//un-successfull
            }
        }catch(err){
          console.log(err);
            return 2; //other error occured
        }
  
        }

        /* generateAuthToken */

}


  module.exports = {
    TestClass
  }