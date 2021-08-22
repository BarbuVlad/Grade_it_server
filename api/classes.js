const express = require('express');
const router = express.Router();
const moment = require('moment');

const {auth} = require('../middleware/auth');
const {authClass} = require('../middleware/authClass');
const { Class } = require("../models/Class_model");
const { SignUp } = require("../models/Sign_up_model");
const { Post } = require("../models/Post_model");
const { User } = require('../models/User_model');
/*! Every Class instance will be named _class NOT class, as the latter is a reserved keyword*/

/* GET routes */
router.get('/posts', [auth, authClass], async (req, res) => {
    //res.status(200).json({message:"All auth is in order", code:0});
    const post = new Post();
    let posts = []

    let p_raw = await post.getAllByClassId(req.class.id_class, 20);///< should modify to limit by date not raw number of entries
    if( !(p_raw==false || p_raw==-1 || p_raw==-2) ){///<this event should be logged
    posts = await Promise.all(Object.values(JSON.parse(JSON.stringify(p_raw))));
    } else{}

    if(posts.length==0){
        return res.status(200).json({"message":"No feed!", code:3});
    }
    posts.sort((a, b) => a.date_time < b.date_time ? 1 : -1);
    return res.status(200).json({"message":"User feed extracted successfully!", code:0, posts:posts});

    //console.log(req.user);
    //console.log(req.class);

});

router.get('/members', [auth, authClass], async (req, res) => {
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        return;
    }
    //get all sing-ups
    const singUp = new SignUp();
    let members = await singUp.getAllById(userId=null, classId=req.class.id_class);
    if(members == false || members==-1 || members==-2){
        return res.status(500).json({"message":"Error at extracting. Empty list", code:2})
    }
    const user = new User();
    await Promise.all(members.map( async (member) => {
        let u_res = await user.getSingle(email=null, id=member.id_user);
        if( !(u_res==false || u_res==-1) ){///<this event should be logged
          member["email"]=user.email;
        } else{}
      }));

    if(req.query.sort==="true"){
        members.sort((a, b) => a.email > b.email ? 1 : -1);
    }
    return res.status(200).json({"message":"Class members extracted successfully!", code:0, members:members});

    //console.log(req.user);
    //console.log(req.class);

});

/* POST classes */
router.post('/create', [auth], async (req,res,next) => {
    //vertify body
    if(!req.body.name){
        res.status(400).json({message:"Name of class is missing", code:1});
        return;
    }

    //create class instance
    const _class = new Class();
    _class.id_owner = req.user.id;
    _class.name = req.body.name;
    _class.description = req.body.description;

    //create singUp instance
    const signUp = new SignUp(); 

    if(req.body.invites){
        console.log("Invites send: ",req.body.invites);
    }
    const result = await _class.create();
    if (result[0] === 0){
        signUp.id_user = req.user.id;
        signUp.id_class = result[1];
        signUp.role = "owner";

        const x = await signUp.create();
        if (x===0)  {
        res.status(200).json({message:"Class created successfully!", code:0, classId:result[1]});
        return;     }
    }
    if(result === 2){
        return res.status(400).json({message:"Class not created. User does not exist!", code:2});
    }
    if (result === 1 || result === 3){
        return res.status(500).json({message:"Class not created", code:3});
    }
    return res.status(500).json({message:"ERROR occurred. Check server logs", code:4});

});
router.post('/join', [auth], async (req,res,next) => {
    //vertify body
    if(!req.body.class_id){
        res.status(400).json({message:"Class id is missing", code:1});
        return;
    }

    //create class instance
    const signUp = new SignUp();
    signUp.id_user = req.user.id;
    signUp.id_class = req.body.class_id;
    signUp.role = req.body.role;

    const result = await signUp.create();
    if (result === 0){
        res.status(200).json({message:"Successfull sign up!", code:0});
        return;
    }
    if(result === 2){
        return res.status(400).json({message:"Sign up failed. Bad class id", code:2});
    }
    if(result === 3){
        return res.status(400).json({message:"User already registered to class", code:3});
    }
    if (result === 1 || result === 4){
        return res.status(500).json({message:"Sign up failed. Server error", code:4});
    }
});

router.delete('/leave_class', [auth,authClass], async (req,res) => {
    /* Will delete sign up entry from DB for user id extracted from token*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }

    //create signUp instance
    const signUp = new SignUp();
    signUp.id_user = req.class.id_user;
    signUp.id_class = req.class.id_class;

    const result = await signUp.delete();
    if (result === 0){
        res.status(200).json({message:"Left class successfully!", code:0});
        return;
    }
    if(result === 1){
        return res.status(400).json({message:"Sign up not found. Error", code:2});
    }
    if(result === 2){
        return res.status(400).json({message:"Error occurred", code:3});
    }
});

//Auth for class
router.post('/authorization', [auth], async (req, res, next) =>{
    /** Obtain authorization for class operations
     * PAYLOAD OF REQUEST:
     *  - bodyJSON {"class_id": "99"}
     *  - req.user.id (from auth middleware)
     * 
     * PAYLOAD OF RESPONSE:
     *  - bodyJSON {"class_token": "***"}
     * 
     * Frontend UC: user is logged in and requests to enter a class
     *      The system must determine if the user is signed in that class
     *      ->If the user is signed in, an authorization token is returned
    */
    //create singUp Object
    const signUp = new SignUp();
  
  //check request body 
  if(!req.body.class_id ){
    return res.status(400).json({message:'Class id not provided.', code:1});
  }
  //call method to query db
  try {
      const response = await signUp.getAllById(userId=req.user.id, classId=req.body.class_id); ///< will return 1 entry (composite PK)
      // response false - no data retured by query
      if(!response){return res.status(200).json({message:'Class dose not exist or you are not signed in', code:2})}
  
      //response is an array => data was retured
      if(typeof(response) === "object"){ //also send jwt token
        signUp.id_class = response[0].id_class;
        signUp.id_user = response[0].id_user;
        signUp.role = response[0].role;
        const token = signUp.generateAuthToken();
        return res.status(200).json({message:'Class auth successfull!', code:0, token:token, data_signUp:response[0]});
      }
      if(response === -1 || response === -2){///< known error returned
        //(TODO log event)
        return res.status(200).json({message:'Server error (check logs)', code:3});
      }
      //else unknown event occurred (TODO: log event)
      return res.status(500).json({message:'Server error (unknown)', code:4});
    } catch (err) {
      console.error(`ENDPOINT_CALL_ERROR: at class auth ${err}`);
      res.status(503).json({message:'Server error (catched in logs)', code:5});
      next(err);
    }
  });

  router.post('/create_post', [auth,authClass], async (req,res) => {
    /* Will add a new post based on id(s) extacted from tokens*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(!req.body.title){
        res.status(400).json({message:"Post title cannot be empty!", code:2});
        return;
    }
    //extarct author name
    let author = null;
    if(req.query.anonymity==="false"){
        const user = new User();
        const find_user = await user.getSingle(email=null, id=req.user.id);
        if(find_user === true){
            author = user.email;
        }
    }

    //create signUp instance
    const post = new Post();
    post.date_time = moment().format('YYYY-MM-DD HH:mm:SS');
    post.id_class = req.class.id_class;
    post.author = author;
    post.author_id = req.class.id_user;
    post.title = req.body.title;
    post.body = req.body.body;

    const result = await post.create();
    if (result === 0){
        res.status(200).json({message:"Post created successfully!", code:0});
        return;
    }
    if(result === 1){
        return res.status(500).json({message:"ERROR. Post not created", code:3});
    }
    if(result === 2){
        return res.status(400).json({message:"Error occurred. Class not found", code:4});
    }
    if(result === 3){
        return res.status(500).json({message:"Error occurred", code:5});
    }
});

router.delete('/delete_post', [auth,authClass], async (req,res) => {
    /* Will add a new post based on id(s) extacted from tokens*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(!req.body.date_time){
        res.status(400).json({message:"Post date_time cannot be empty!", code:2});
        return;
    }

    //create post instance
    const post = new Post();
    post.date_time = req.body.date_time;
    post.id_class = req.class.id_class;

    //verify role
    if(req.class.role==="student"){//can only delete own posts

        const posts_list = await post.getByAuthorIdAndClassId(author_id=req.class.id_user, 
                                                        date_time= req.body.date_time,
                                                        classId=req.class.id_class);
        if(posts_list === false || posts_list === -1 || posts_list === -2){
            return res.status(500).json({message:"Server error occurred", code:3});
        }
        if(posts_list.length !== 1){
            return res.status(400).json({message:"Error at selecting post of user...", code:4});
        }
    }


    const result = await post.delete();
    if (result === 0){
        res.status(200).json({message:"Post deleted successfully!", code:0});
        return;
    }
    if(result === 1){
        return res.status(400).json({message:"ERROR. Post not deleted", code:5});
    }
    if(result === 2){
        return res.status(500).json({message:"Error occurred", code:6});
    }
});

router.patch('/revoke_access', [auth,authClass], async (req,res) => {
    //sync tokens
    console.log(req.class);
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to modify this data", code:2});
        return;
    }
    if(!req.body.user_id){
        res.status(400).json({message:"User id cannot be empty!", code:3});
        return;
    }
    //create signUp instance
    const singUp = new SignUp();
    singUp.id_user=req.body.user_id;
    singUp.id_class=req.class.id_class;
    //read signUp from DB
    const to_kick =  await singUp.getAllById(userId=req.body.user_id, classId=req.class.id_class);
    if(to_kick ===-1 || to_kick===-2 || to_kick===false){
       return res.status(500).json({message:"Error at extracting user sing up", code:4});
    }

    //owner cannot be blocked; teacher cannot block other teachers
    if(to_kick[0]["role"] === "owner" || (req.class.role === "teacher" && to_kick[0]["role"] === "teacher") ){
        res.status(403).json({message:"No authority to modify this data", code:5});
        return;
    }

    let action = false;
    req.query.action === "block" ? action = true : action = false;
    const result = await singUp.block(action);

    if (result === 0){
        res.status(200).json({message:"User block action successfull!", code:0});
        return;
    }
    if(result === 1){
        return res.status(500).json({message:"ERROR. Block action not created", code:6});
    }
    if(result === 2){
        return res.status(500).json({message:"Error occurred", code:7});
    }
});

module.exports = router;

/*
const nodemailer = require("nodemailer");

*/