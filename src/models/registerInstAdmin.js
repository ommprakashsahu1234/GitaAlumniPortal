const mongoose = require("mongoose");
const now = new Date();
const instAdminSchema = new mongoose.Schema({
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
  },
  remark:{
    type:String
  }
});

const AdmRegister = new mongoose.model("instAdmin", instAdminSchema);

module.exports = AdmRegister;
