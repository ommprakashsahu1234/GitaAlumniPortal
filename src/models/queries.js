const mongoose = require("mongoose");
const now = new Date();
const replySchema = new mongoose.Schema({
  name: {
    type: String,
    required:true
  },
  rollno: {
    type: String,
    required: true,
  },
  reply: {
    type: String,
  },
});
const querySchema = new mongoose.Schema({
  rollno: {
    type: String,
    required: true,
  },
  name:{
    type:String,
    required:true
  },
  query: {
    type: String,
    required: true,
  },
  replies: [{
    type: replySchema,
  }],
});

const QuerySubmit = new mongoose.model("query", querySchema);

module.exports = QuerySubmit;
  