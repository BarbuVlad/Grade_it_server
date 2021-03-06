const db = require('../config/db');
const Joi = require('joi'); //returns a class
require('dotenv/config'); 
class Post {
  /*
  This class creates the interface between the posts table and the server app.
  */
  static TABLE_NAME="posts";
  constructor(){
    this.date_time=null;
    this.id_class=null;
    this.author=null;
    this.author_id=null;
    this.title=null;
    this.body=null;
  }

  //-------------------READ-------------------
  async getAllByClassId(classId=null, limit=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - classId=null  => return all data for all classes (with limit)
        - classId=X     => return all data for that class_id (with limit)
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(classId)) || isNaN(Number(limit))){
        return -1;
    }

    let sql = `SELECT date_time, id_class, author, author_id, title, body  FROM ${Post.TABLE_NAME}`;
    //integrate condition
    (classId==null) ? sql += ` WHERE 1` : sql += ` WHERE id_class=${classId}` ; 
    sql += ` ORDER BY date_time DESC`;
    (limit==null) ? ';' : sql += ` LIMIT 0, ${limit};`;
    
    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        return data;
    } catch(err){///< error occurred
        console.log(err);
        return -2;
    }
  }
  async getByAuthorIdAndClassId(authorId=null, date_time=null, classId=null){
    /*Function does NOT modify object attributes
    Will return all data in the following fashion:
        - classId=null  => return all data for all classes (with limit)
        - classId=X     => return all data for that class_id (with limit)
        *if no data exists, false is returned
    
    */
    //verify parameters
    if( isNaN(Number(authorId)) || authorId===null || classId===null){
        return -1;
    }

    let sql = `SELECT date_time, id_class, author, author_id, title, body FROM ${Post.TABLE_NAME}`;
    //integrate condition
    (date_time==null) ? sql += ` WHERE author_id=${authorId} AND id_class=${classId}`
      : sql += ` WHERE author_id=${authorId} AND id_class=${classId} AND date_time='${date_time}'`; 
    sql += ` ORDER BY date_time DESC`;
   // (limit==null) ? ';' : sql += ` LIMIT 0, ${limit};`;
    console.log(sql);
    try{
        const data = await db.query(sql);
        if(!data.length){return false;}
        return data;
    } catch(err){///< error occurred
        console.log(err);
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
      const sql = `INSERT INTO ${Post.TABLE_NAME}(date_time, id_class, author, author_id, title, body)
      VALUES(?, ?, ?, ?, ?, ?);
      `;
      this.date_time===undefined ? this.date_time=null : null;
      this.id_class === undefined ? this.id_class=null : null;
      this.author === undefined ? this.author=null : null;
      this.author_id === undefined ? this.author_id=null : null;
      this.title === undefined ? this.title=null : null;
      this.body === undefined ? this.body=null : null;
      //make query
      try{
          const result = await db.query(sql, [this.date_time, this.id_class, this.author, this.author_id, this.title, this.body]);
          console.log("----->",result);
          if (result.affectedRows) {
          return 0; //successfull
          } else {
              return 1;//un-successfull
          }
      }catch(err){
          if(err.errno==1452){
              return 2; //FK missing
          }
          console.log(err);
          return 3; //other error occured
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
        const sql = `DELETE FROM ${Post.TABLE_NAME} WHERE date_time=? AND id_class=?;`;
        //TODO: pattern match for date_time
        if (this.id_class === undefined || this.date_time === undefined) { return 1;}
        if (this.id_class === null || this.date_time === null) { return 1;}

        //make query
        try{
            const result = await db.query(sql, [this.date_time,this.id_class]);
            //console.log("----->",result, sql, this.date_time, this.id_class);
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
  


}

  module.exports = {
    Post
  }