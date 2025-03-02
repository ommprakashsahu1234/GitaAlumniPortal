const mongoose = require('mongoose')
mongoose.connect("mongodb+srv://autophile07:OpsOmm@123@cluster0.qnhj4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(() => {
  console.log("Database Connected.");
}).catch((err)=>{
    console.log('No Connection')
})
