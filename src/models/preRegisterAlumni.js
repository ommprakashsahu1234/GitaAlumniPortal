const mongoose = require("mongoose");
  
const preAlumniSchema = new mongoose.Schema({
  rollno: {
    type: String,
    required: true,
  },
  regdno:{
    type:Number,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  batch:{
    type:String,
    required:true
  }
});

const PreRegister = new mongoose.model("AlumniVerify", preAlumniSchema);

module.exports = PreRegister;
