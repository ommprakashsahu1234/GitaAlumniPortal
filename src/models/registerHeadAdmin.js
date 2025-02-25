const mongoose = require("mongoose");
const now = new Date();
const headAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  empId:{
    type:String,
    required:true,
    unique:true
  },
  password: {
    type: String,
    required: true,
  },
  mobno: {
    type: String,
    required: true,
  },
  mailid: {
    type: String,
    required: true,
  },role:{
    type:String,
    required:true
  }
});

const HeadRegister = new mongoose.model("headAdmin", headAdminSchema);

module.exports = HeadRegister;
