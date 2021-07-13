const db = require('../config/db');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class SignUp {
  /*
  This class creates the interface between the sign_ups table and the server app.
  Sign_ups table is a bridge table: 
    it maps users to classes and assings a role (relative to class)
  */
  static TABLE_NAME="sign_ups";
  constructor(){
    this.id_user=null;
    this.id_class=null;
    this.role=null;
  }

  //-------------------READ-------------------
  async getAllById( userId=null, classId=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - classId=null, userId=null => return all data
        - classId=null, userId=X    => return all data for that user_id
        - classId=X, userId=null    => return all data fro that class_id
        - classId=X, userId=Y       => return 1 entry if it exists
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(classId)) || isNaN(Number(userId))){
        return -1;
    }

    let sql = `SELECT id_user, id_class, role FROM ${SignUp.TABLE_NAME}`;
    //integrate condition
    (classId==null && userId==null) ? sql += ` WHERE 1;` : null;
    (classId==null && userId!=null) ? sql += ` WHERE id_user=${userId};` : null;
    (classId!=null && userId==null) ? sql += ` WHERE id_class=${classId};` : null;
    (classId!=null && userId!=null) ? sql += ` WHERE id_user=${userId} AND id_class=${classId};` : null;

    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        return data;
    } catch(err){///< error occurred
        return -2;
    }
  }


}

  module.exports = {
    SignUp
  }