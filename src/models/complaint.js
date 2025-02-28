const mongoose= require('mongoose')
const complaintSchema = new mongoose.Schema({
    rollno: {
        type: String,
        required: true
    },
    title:{
        type:String,
        required:true
    },
    complaint: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        sparse: true 
    },
    respby:{
        type:String,
    },
    issuetype:{
        type:String,
        required:true
    },
    status:{
        type:String,
        sparse:true,
    }
})


const Complaint = new mongoose.model('complaint',complaintSchema)
module.exports = Complaint