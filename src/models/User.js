import mongoose from "mongoose"


const userSchema = mongoose.Schema({

    
    tgId:{
        type:String,
        required:true,
        unique:true,
    },

    firstName:{
        type:String,
        require:true
    },


    lastName:{
        type:String,
        require:true
    },

    isBot:{
        type:Boolean,
        require:true
    },

    username:{
        type:String,
        required:true,
        unique:true,

    },

    promptTokens:{
        type:Number,
        required:false
    },

    completionTokens:{
        type:Number,
        required:false
    },


},{timestamps:true})


export default mongoose.model("User", userSchema)