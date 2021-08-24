/*Rotes to handle all aspects of email actions:
    - Send invite to teachers as owner of class
    - Join a class as a teacher
    
*/

const express = require('express');
const router = express.Router();
// const moment = require('moment');

const {auth} = require('../middleware/auth');
const {authClass} = require('../middleware/authClass');
const { Class } = require("../models/Class_model");
const { SignUp } = require("../models/Sign_up_model");
const { Post } = require("../models/Post_model");
const { User } = require('../models/User_model');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv/config');


router.post('/sendInvite', [auth, authClass], async (req, res) => {
    //sync tokens
    console.log(req.user, req.class);
    if(req.user.id !== req.class.id_user){
        res.status(400).json({message:"Authorization conflict error", code:1});
        return;
    }
    if(req.class.role !== "owner"){
        res.status(403).json({message:"No authorization for this action", code:2});
        return;
    }
    if(req.body.email==null || req.body.email==undefined){
        return res.status(400).json({message:"Bad email format", code:3});
    }
    //check email format
    const email_regex = /.*@\w+\.\w+/g;
    const email_ok = req.body.email.match(email_regex);
    if(email_ok==null || req.body.email.length>200){
        return res.status(400).json({message:"Bad email format", code:3});
    }
    //get user id based on email 
    const user = new User();
    const res_ = await user.getSingle(email=req.body.email);
    if(res_ === false){
        return res.status(400).json({message:"User with this email does not exist", code:4});
    }

    //create an invite jwt token 
    const token = jwt.sign({id_user:user.id,id_class:req.class.id_class, role:"teacher"}, process.env.JWT_PRIVATE_KEY);

    const user_sender = new User();
    await user_sender.getSingle(email=null,id=req.class.id_user);
    let sender;
    user_sender.email === null ? sender="unknown" : sender=user_sender.email;
    //send email
    const mailOptions = {
        from: process.env.EMAIL,
        to: req.body.email,
        subject: "GradeIt - invitation to class",
        html: html_email_content(sender=sender, link=`${process.env.APP_BASE_LINK}${token}`),
        attachments: [{
            filename: 'gradeit_full_2.svg',
            path: '/var/www/grade_it_server/gradeit_full_2.svg',
            cid: 'grade_it_logo' //same cid value as in the html img src
        }]
    }

    //transport
    const transported = nodemailer.createTransport({
        service:"hotmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }
    });

    transported.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log(error);
            return res.status(500).json({message:"Error at sending invitation email.", code:5});
        } else { 
            console.log("Email sent successfully: " + info.response);
            return res.status(200).json({message:"Invitation email sent successfully.", code:0});
        }
    });
});

router.post('/acceptInvite', [auth], async (req, res) => {
    //get token
    if(!req.body.token){res.status(400).json({message:"Invitation token missing", code:1})};
    let decodedToken;
    try{
        const decodedPayload = jwt.verify(req.body.token, process.env.JWT_PRIVATE_KEY);
        decodedToken = decodedPayload;
    } catch (err){
        res.status(400).json({message:"Invitation failed. Bad token", code:2});
    }

    //sync tokens
    if(req.user.id !== decodedToken.id_user){
        res.status(400).json({message:"Invitation not issued for this account", code:3});
        return;
    }
    //calculate time 
    let token_date = new Date(decodedToken.iat * 1000);
    let today = new Date();
    const diffTime = Math.abs(today - token_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if(diffDays>7){
        res.status(400).json({message:"Invitation has expired (issued more than 7 days ago)", code:4});
        return;
    }

    //accept invitation
    const signUp = new SignUp();
    //is this user registerd as student or teacher?
    const signedUpData = await signUp.getAllById(userId=req.user.id, classId=decodedToken.id_class);
    console.log(signedUpData);
    if (signedUpData !== false){
        console.log("Accepting invite. User is signed in class");
        if(signedUpData[0].role!=="student"){
            return res.status(200).json({message:"User is already teacher member in class", code:0});
        }
        //elevate student to teacher
        signUp.id_class=signedUpData[0].id_class;
        signUp.id_user=signedUpData[0].id_user;
        const elevate = await signUp.changeRole();
        if(elevate === 0){
            return res.status(200).json({message:"User role elevated to teacher. Invitation accepted successfully!", code:0});
        }else{
            return res.status(500).json({message:"User role NOT elevated to teacher. ERROR", code:5});
        }
    }
    //user not signed up in class - create sign up
    signUp.id_class=decodedToken.id_class;
    signUp.id_user=req.user.id;
    signUp.role=decodedToken.role;
    const createSignUp = await signUp.create();

    if(createSignUp===0){
        return res.status(200).json({message:"Invitation accepted. Class sign up created.", code:0});
    }
    else{
        return res.status(500).json({message:"Error at accepting invite. Class sign up fail", code:6});
    }
    
});

const html_email_content = (sender, link) => {
    return `<h4>Dear user,</h4>
    <p>You have been invited by <b>${sender}</b> to be a member <b>teacher</b> in his/her class. To accept this invitation please use the link below. The invitation expires in 7 days.</p>
    <b style="margin-left:20px"><a href=\"${link}\">INVITE LINK HERE</a></b>
    <br />
    <h5>Best regards, <br />
    <b style="color:#ffc107">GradeIt</b> Platform</h5>
    <img width="45" src="cid:grade_it_logo" alt="GradeIt Logo">
    
    <p style="color:grey">Please do not reply to this email, it is automatically generated. If your invitation expired contact the class owner who sent you the link.</p>`
}

module.exports = router;

