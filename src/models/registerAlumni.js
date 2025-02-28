const mongoose = require("mongoose");
const now = new Date();
const addressSchema = new mongoose.Schema({
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
  });
  
const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollno:{
    type:String,
    required:true,
    unique:true
  },
  batch:{
    type:String,
    required:true,
  },
  branch:{
    type:String,
    required:true,
  },
  skill:{
    type:String,
  },
  password: {
    type: String,
    required: true,
  },
  mobno: {
    mobno: { type: String, required: true },
    access: { type: String, enum: ["public", "private"], required: true },
  },
  mailid: {
    type: String,
    required: true,
  },
  address: {
    type: addressSchema,
    required: true,
  },
  servicetype:{
    type:String,
    default:"",
  },
  company:{
    type:String,
    default:"",
  },
  profileimg: {
    type: String,
    required: true,
  },
  postno:{
    type:Number,
  },
  status:{
    type:String,
    required:true
  },
  appby:{
    type:String,
    default:"Auto Approved",
  }
});

const Register = new mongoose.model("Alumni", alumniSchema);

module.exports = Register;
