const mongoose= require('mongoose')
const InstcomplaintSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true
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
    status:{
        type:String,
        sparse:true,
    }
})


const InstComplaint = new mongoose.model('Instcomplaint',InstcomplaintSchema)
module.exports = InstComplaint