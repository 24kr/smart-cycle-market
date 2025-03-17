import {connect} from "mongoose";

const uri="mongodb://localhost:27017/smart-cycle-market";
// const uri="mongodb://localhost:27017/smart-cycle-market";

connect(uri)
.then(()=>{
    console.log("MongoDB connected successfully!");
})
.catch(err=> {
    console.log("MongoDB connection error: ",err.message)
});
  