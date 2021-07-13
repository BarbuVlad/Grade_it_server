const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const {auth} = require('../middleware/auth');
const {User} = require("../models/User_model");
const {SignUp} = require("../models/Sign_up_model");
const {Post} = require("../models/Post_model");

/*-----------------GET requests-----------------*/

//READ SINGLE USER BY EMAIL
// router.get('/:email', async (req,res,next) => {
//   //create user object
//   const user = new User();

//   //call method to query db
//   try {
//     const response = await user.getSingle(req.params.email);
//     if(!response){res.status(400).json("User not found")}
    
//     console.log("Email seach...", response);
//     res.status(200).json({id:user.id, email:user.email, password:user.password});
//   } catch (err) {
//     console.error(`Error while getting user `, err.message);
//     next(err);
//   }

// });

//READ A USER FEDD (MOST RECENT POSTS)
router.get('/feed', [auth],async (req,res,next) => {
  /*1. What classes is this user in? 
    2. What are the most recent posts in those classes*/
  //create user object
  const user = new User();
  const signUp = new SignUp();

  //get user classes sign ups
  const sign_ups_list = await signUp.getAllById(userId=req.user.id);//2
  //---return cases---
  if(sign_ups_list == false){
    return res.status(200).json({"message":"User is not registered in any classes. Empty list", code:1})
  }
  if(sign_ups_list==-1 || sign_ups_list==-2){
    return res.status(500).json({"message":"Error at database extraction.", code:2})
  }
  //-----------------
  //for every class, extract most recent posts
  const post = new Post();
  let posts = [];
  await Promise.all(sign_ups_list.map( async (sign_up_item) => {
    let p_raw = await post.getAllByClassId(sign_up_item.id_class, 10);///< should modify to limit by date not raw number of entries
    if( !(p_raw==false || p_raw==-1 || p_raw==-2) ){///<this event should be logged
      const p_list = await Promise.all(Object.values(JSON.parse(JSON.stringify(p_raw))));
      posts.push(...p_list);
    } else{}
  }));
  if(posts.length==0){
    return res.status(200).json({"message":"No feed!", code:3});
  }
  posts.sort((a, b) => a.date_time < b.date_time ? 1 : -1);
  return res.status(200).json({"message":"User feed extracted successfully!", code:0, feed:posts});


});

//READ ALL USERS
  router.get('/', async (req,res,next) => {
    //create user object
    const user = new User();

    //call method to query db
    try {
      const response = await user.getAll();
      if(!response){res.status(404).json("Users not found")}

      console.log("All users seach...");
      res.status(200).json(response);
    } catch (err) {
      console.error(`Error while getting quotes `, err.message);
      next(err);
    }
  
  });

/*-----------------POST requests-----------------*/

//CREATE
router.post('/', async (req, res, next) =>{
    //create user object
    const user = new User();
  
  //check request body 
  const validateError = User.validateUserData({email: req.body.email, password: req.body.password})
  if(validateError){
    console.log(` NOT Create user with ${req.body}`);
    return res.status(400).json({message:validateError, code:1});
  }
  

  //pass data to object 
  user.email = req.body.email;
  user.password = req.body.password;

  //call method to query db
  try {
      const response = await user.create();
      //give adequate response (see method def.)
      if(response==1){console.log(` NOT Create user with ${req.body}`);res.status(400).json({message:"User not created (0 rows affected)", code:2})}
      if(response==2){console.log(` NOT Create user with ${req.body}`);res.status(400).json({message:"User not created (already exists)",code:3})}
      if(response==3){console.log(` NOT Create user with ${req.body}`);res.status(400).json({message:"User not created (unknown error occurred)", code:4})}
      //else response = 0
      res.status(200).json({message:"User created!", code:0});
      console.log(`Create user with ${req.body}`);
    } catch (err) {
      console.error(`ENDPOINT_CALL_ERROR: at create user `);
      res.status(503).json({message:"Server error", code:-1});
      next(err);
    }
});


//LOGIN
router.post('/login', async (req, res, next) =>{
  //create user object
  const user = new User();

//check request body 
if(!req.body.email || !req.body.password){
  return res.status(400).json({message:'Password or email not provided.', code:1});
}

//call method to query db
try {
    const response = await user.getSingle(req.body.email);
    // response false - no data retured by query
    if(!response){return res.status(200).json({message:'Wrong credentials!', code:2})}

    //else -> data retured by query; user email exists -> check password
    const valid = await bcrypt.compare(req.body.password, user.password);

    if(!valid){return res.status(200).json({message:'Wrong credentials!', code:3})}

    //else -> user exists and password matched = login successfull
    if(valid){ //also send jwt token

      const token = user.generateAuthToken();
      return res.status(200).json({message:'Login successfull!', code:0, token:token, id:user.id});
    
    }

    console.log(`Login with not retured. Payload: ${req.body}`);
  } catch (err) {
    console.error(`ENDPOINT_CALL_ERROR: at login user `);
    res.status(503).json({message:'Server error'});
    next(err);
  }
});



/*-----------------PUT/PATCH requests-----------------*/


/*-----------------DELETE requests-----------------*/


/*-----------------other requests-----------------*/

//router.post('/',auth, async (req, res, next) =>{
module.exports = router;