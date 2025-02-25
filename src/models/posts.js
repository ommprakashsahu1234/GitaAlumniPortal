const mongoose = require('mongoose');
const getTime = require('./getTime');  

const DateTimeSchema = new mongoose.Schema({
    day: String,
    month: String,
    year: String,
    dateStr: String,
    hours: String,
    mins: String,
    a: String, // AM/PM
});

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    dateandtime: {
        type: DateTimeSchema,
        required: true,
    },
});

const postsSchema = new mongoose.Schema({
    rollno: {
        type: String,
        required: true,
    },
    dateandtime: {
        type: DateTimeSchema,
        required: true,
    },
    head: {
        required:true,
        type: String,
    },
    text: {
        required:true,
        type: String,
    },
    postimage:{
        type:String
    },
    comments: {
        type: [CommentSchema],
    },
});



const Post = new mongoose.model('post', postsSchema);

module.exports = Post;
