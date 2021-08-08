const db = require('../config/db');
const Joi = require('joi'); //returns a class
const jwt = require('jsonwebtoken');
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
      const sql = `INSERT INTO ${SignUp.TABLE_NAME}(id_user, id_class, role)
      VALUES(?, ?, ?);
      `;
      this.id_user===undefined ? this.id_user=null : null;
      this.id_class===undefined ? this.id_class=null : null;
      this.role===undefined ? this.role=null : null;
      //make query
      try{
          const result = await db.query(sql, [this.id_user,this.id_class, this.role]);
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
            2 = FK constain fail (1452 mysql err code)
            3 = other error
        */
        
        //prepare query
        const sql = `DELETE FROM ${SignUp.TABLE_NAME} WHERE id_user=? AND id_class=?;`;
        this.id_user===undefined ? this.id_user=null : null;
        this.id_class===undefined ? this.id_class=null : null;
        this.role===undefined ? this.role=null : null;
        //make query
        try{
            const result = await db.query(sql, [this.id_user,this.id_class]);
            console.log("----->",result);
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

        /* ! IS JWT auth needed? It is faster than an check-DB every time approch (being an IO op.) */
        generateAuthToken(){
          /** Will generate and return a JWT token based on this instance attributes */
          if(this.id_class!==null && this.id_user!==null && this.role!==null){
            const token = jwt.sign({id_class: this.id_class, id_user: this.id_user, role: this.role }, process.env.JWT_PRIVATE_KEY);
            return token;
          } else {return false;}
        }

}


  module.exports = {
    SignUp
  }