const db = require('../config/db');
const Joi = require('joi'); //returns a class
const jwt = require('jsonwebtoken');
require('dotenv/config');

class TestOwner {
  /*
  This class creates the interface between the test_onwer table and the server app.
  Test_owner table is a bridge table: 
    it maps users to tests
  */
  static TABLE_NAME="test_owner";
  constructor(){
    this.id_user=null;
    this.id_test=null;
  }

  //-------------------READ-------------------
  async getAllById( userId=null, testId=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - testId=null, userId=null => return all data
        - testId=null, userId=X    => return all data for that user_id
        - testId=X, userId=null    => return all data fro that test_id
        - testId=X, userId=Y       => return 1 entry if it exists
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(testId)) || isNaN(Number(userId))){
        return -1;
    }

    let sql = `SELECT id_user, id_test FROM ${TestOwner.TABLE_NAME}`;
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
          2 = FK constain fail (1452 mysql err code)
          3 = other error
      */
      
      //prepare query
      const sql = `INSERT INTO ${TestOwner.TABLE_NAME}(id_user, id_test)
      VALUES(?, ?);
      `;
      this.id_user===undefined ? this.id_user=null : null;
      this.id_test===undefined ? this.id_test=null : null;
      //make query
      try{
          const result = await db.query(sql, [this.id_user,this.id_test]);
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
        const sql = `DELETE FROM ${TestOwner.TABLE_NAME} WHERE id_user=? AND id_test=?;`;
        this.id_user===undefined ? this.id_user=null : null;
        this.id_test===undefined ? this.id_test=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.id_user,this.id_test]);
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
    TestOwner
  }