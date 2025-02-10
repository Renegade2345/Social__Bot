import mongoose from "mongoose";

const eventSchema = mongoose.Schema({
    text:{
        type:String,
        required:true,
    },

    tg_Id:{
        type:String,
        required:true,
  

    },

    
},

{timestamps:true}
)


export default mongoose.model("Events",eventSchema)