const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
require('dotenv/config');

const {auth} = require('../middleware/auth');
const {authClass} = require('../middleware/authClass');
const { Class } = require("../models/Class_model");
const { SignUp } = require("../models/Sign_up_model");
const { Post } = require("../models/Post_model");
const { User } = require('../models/User_model');
const { Test } = require('../models/Test_model');
const { TestOwner } = require('../models/Test_owner_model');
const { TestClass } = require('../models/Test_class_model');
const { Schedule } = require('../models/Schedule_model');
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

/* GET routes */
router.get('/general_info', [auth, authClass], async (req, res) => {
    /*To return: 
    - name of class
    - class id
    - class description
    - number of members and number of types
    - owner email */
    const class_ = new Class();
    let _get = await class_.getById(classId=req.class.id_class);
    if(_get!==0){
        return res.status(500).json({"message":"Error at getting class information", code:1});
    }

    //get owner email 
    const user = new User();
    _get = await user.getSingle(email=null, id=class_.id_owner);
    if(_get===false){
        return res.status(500).json({"message":"Error at getting class information", code:2});
    }

    //get number of members
    const signUp = new SignUp();
    const members = await signUp.getAllById(userId=null, classId=class_.id);
    if(typeof(members)!=="object"){
        return res.status(500).json({"message":"Error at getting class information", code:3});
    }

    let students = 0;
    let teachers = 1;
    for(let i = 0; i<members.length; i++){
        if(members[i].role === "student"){
            students++;
        } else if(members[i].role === "teacher"){
            teachers++;
        }
    }

    let info = {"name":class_.name, "description":class_.description, "head_teacher":user.email, "members":members.length,
    "students":students, "teachers":teachers}
    return res.status(200).json({"message":"Class info extracted successfully!", code:0, info:info});

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
        console.log(response[0]);
        if(response[0].blocked == 1) {
            console.log(response[0].blocked);
            return res.status(400).json({message:'User has been blocked', code:5})
        }
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
//TESTS:
router.post('/create_test', [auth,authClass], async (req,res) => {
    /* Will create a new test, will generate 2 aditional entries in bridge tables:
        test_owner - to assign ownership of test
        test_class - to assign a test to a class*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to create this data", code:2});
        return;
    }
    if(!req.body.questions){
        res.status(400).json({message:"Question list cannot be empty!", code:3});
        return;
    }

    //create a test 
    const test = new Test();
    req.body.title != undefined ? test.name=req.body.title : null;
    req.body.description != undefined ? test.description=req.body.description : null;
    test.questions = req.body.questions;

    const test_result = await test.create();
    if(test_result == 1 || test_result == 2){
        return res.status(500).json({message:"Error at creating test!", code:4});
    }
    //create ownership
    const testOwner = new TestOwner();
    testOwner.id_user = req.class.id_user;
    testOwner.id_test = test_result[1];

    const testOwner_result = await testOwner.create();
    if (testOwner_result !== 0){
        return res.status(500).json({message:"Error at creating test (ownership)!", code:5});
    }
    //create class assignment (ownership to class)
    const testClass = new TestClass();
    testClass.id_test = test_result[1];
    testClass.id_class = req.class.id_class;

    const testClass_result = await testClass.create();
    if(testClass_result !== 0){
        return res.status(500).json({message:"Error at creating test (class assign)!", code:6});
    }

    return res.status(200).json({message:"Test created successfully!", code:0});
});
router.patch('/edit_test', [auth,authClass], async (req,res) => {
    /* Will edit existing test*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to create this data", code:2});
        return;
    }
    if(!req.body.questions || !req.body.test_id){
        res.status(400).json({message:"Missing question list or testId!", code:3});
        return;
    }

    //is this test assigned to this class? 
    const testClass = new TestClass();
    const testClassOwn = await testClass.getAllById(classId=req.class.id_class, testId=req.body.test_id);
    if(testClassOwn===false || testClassOwn===-1 || testClassOwn===-2){
        res.status(400).json({message:"Test does not exist or is not assigned to class", code:4});
        return;
    }
    //edit test questions
    const test = new Test();
    test.questions = req.body.questions;
    test.id = req.body.test_id;

    const test_modify = await test.modifyQuestions();
    if(test_modify === 1 || test_modify === 2 || test_modify === -1){
        return res.status(500).json({message:"Error at modify test!", code:5});
    }

    return res.status(200).json({message:"Test modified successfully!", code:0});
});

router.get('/view_tests', [auth,authClass], async (req,res) => {
    /* Used to view all tests that are part of this class*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to view this data", code:2});
        return;
    }

    //read all tests (non-questions info) from DB for this class
    const testClass = new TestClass();

    let testsAvailable = await testClass.getAllById(classId=req.class.id_class, testId=null);
    if(testsAvailable === false){
        return res.status(200).json({message:"This class has no tests available...", code:3});
    }
    //extract more information
    const test = new Test();
    await Promise.all(testsAvailable.map( async (test_entry) => {
        let t_res = await test.getByIdNoQuestions(testId=test_entry.id_test)
        if( !(t_res===false || t_res==2) ){///<this event should be logged
            test_entry["name"]=test.name;
            test_entry["description"]=test.description;
            //TODO: extaract name of creator/owner
        } else{}
      }));

    return res.status(200).json({message:"List of available test extarcted!", code:0, tests:testsAvailable});
});

router.post('/set_test_schedule', [auth,authClass], async (req,res) => {
    /* Will set a date for a test to take place
    Expect date in format: 2021-09-24T12:13 */
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to modify this data", code:2});
        return;
    }
    if(!req.body.startDate || !req.body.endDate || !req.body.testId){
       return res.status(400).json({message:"Data missing (start-end dates or test id)", code:3});
    }
    //verify if dates are in order
    let startDate = new Date(req.body.startDate);
    let endDate = new Date(req.body.endDate);
    if(startDate>=endDate){
        return res.status(400).json({message:"Start date cannot be before end date!", code:4});
    }
    //TODO: !SECURITY - is test part of this class? (read from test_class table)
    //create the schedule
    const schedule = new Schedule();
    schedule.id_class = req.class.id_class;
    schedule.id_test = req.body.testId;
    schedule.date_time_start = req.body.startDate;
    schedule.date_time_end = req.body.endDate;

    let createSchedule = await schedule.create();
    if(createSchedule === 3){
        return res.status(200).json({message:"This test is already scheduled for class.", code:5});
    }
    if(createSchedule === 0){
        return res.status(200).json({message:"Test schedule created!", code:0});
    }
    return res.status(500).json({message:"Error occurred!", code:6});
});

router.get('/view_test', [auth,authClass], async (req,res) => {
    /* Will return all data regarding test*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "owner" && req.class.role !== "teacher"){
        res.status(403).json({message:"No authority to view this data", code:2});
        return;
    }
    if(isNaN(Number(req.query.test_id))){
        res.status(400).json({message:"Bad test id", code:3});
        return;
    }
    //extarct information
    const test = new Test();
    const getTest = await test.getById(testId=req.query.test_id);
    if(getTest === 1 || getTest===false || getTest===2){
        return res.status(500).json({message:"Some error occurred", code:4});
    }

    //extract owner name and id
    const test_owner = new TestOwner();
    const user = new User();
    const owner = await test_owner.getAllById(userId=null, testId=test.id);
    if(typeof(owner)==="object"){
        await user.getSingle(email=null, id=owner[0].id_user);
    }
    console.log(user.email,owner[0].id_user, "test id:",test.id);
    let email_owner;
    user.email !==null ? email_owner=user.email : email_owner="not found";
    if(getTest === 0){
        return res.status(200).json({message:"Test extarcted", code:0, questions:test.questions, owner:email_owner});
    }

    return res.status(500).json({message:"Error occurred!", code:5});
});

router.get('/scheduled_tests', [auth,authClass], async (req,res) => {
    /* Will return all schedules and for every schedule will extarct test name and description*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }

    //extarct schedules
    const schedule = new Schedule();
    const schedule_list = await schedule.getAllById(classId=req.class.id_class, testId=null);
    if(schedule_list===false || schedule_list===-1 || schedule_list===-2){
        return res.status(200).json({message:"No scheduled tests for this class", code:2});
    }

    //for this list extact test information (name and description)
    const test = new Test();

    await Promise.all(schedule_list.map( async (schedule_entry) => {
        let s_res = await test.getByIdNoQuestions(testId=schedule_entry.id_test);
        if( !(s_res===1 || s_res===2) ){///<this event should be logged
            schedule_entry["name"]=test.name;
            schedule_entry["description"]=test.description;
        } else{}
      }));
      
    return res.status(200).json({message:"Test schedules extarcted", code:0, schedules:schedule_list});

});

router.get('/get_test_to_solve', [auth,authClass], async (req,res) => {
    /* Will return all data regarding test*/
    //sync tokens
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        //console.log(req.user, req.class);
        return;
    }
    if(req.class.role !== "student"){
        res.status(403).json({message:"No authority to view this data", code:2});
        return;
    }
    if(isNaN(Number(req.query.test_id))){
        res.status(400).json({message:"Bad test id", code:3});
        return;
    }
    //is this request in schedule? 
    const schedule = new Schedule();
    const schedule_info = await schedule.getAllById(classId=req.class.id_class, testId=req.query.test_id);
    if(schedule_info===-1||schedule_info===-2||schedule_info===false){
        console.log("Test schedule not found");
        return res.status(400).json({message:"Test schedule not found", code:3});
        
    }
    const startDate = new Date(schedule_info[0].date_time_start);
    const today = new Date();
    if(startDate > today){
       return res.status(400).json({message:"Test out of schedule!", code:4});
    }

    //extarct information
    const test = new Test();
    const getTest = await test.getById(testId=req.query.test_id);
    if(getTest === 1 || getTest===false || getTest===2){
        return res.status(500).json({message:"Some error occurred", code:5});
    }

    let questions;
    try{
        questions = JSON.parse(test.questions);
        //console.log(questions[0].answersList);
        questions.map((question) => {
            question["answersList"].map((answer) => {
                answer["corect"]=undefined;
            })
        });
    } catch(err){return res.status(500).json({message:"Error occurred!", code:6});}

    //create a JWT for test solve
    const token = jwt.sign({id_test:req.query.test_id }, process.env.JWT_PRIVATE_KEY);

    return res.status(200).json({message:"Test extarcted", code:0, questions:questions, token:token});
 
});

module.exports = router;

/*
const nodemailer = require("nodemailer");

*/