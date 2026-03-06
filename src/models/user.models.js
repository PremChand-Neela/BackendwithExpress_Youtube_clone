import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema(
    {
            username:{
                type:String,
                required:true,
                unique:true,
                trim:true,
                index:true,
                lowercase:true
            },
            email:{
                type:String,
                required:true,
                unique:true,
                trim:true,
                lowercase:true
            },
            fullname:{
                type:String,
                required:true,
                trim:true,
                index:true,
            },
            avatar:{
                type:String, //Cloudinar url  string is uploaded here, the direct image is not uploaded
                required:true
            },
            coverimage:{
                type:String // cloudinary url
            },
            watchHistory:[
                {
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Video"
                }
            ],
            password:{
                type:String,
                required:[true,"Password filed is required"]
            },
            refreshToken:{
                type:String
            }
        },{
            timeseries:true
        }
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()

    this.password =await bcrypt.hash(this.password,10)
    next()
    
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema)