import router from "../routes/user.routes.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false});

        return{accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while genrating refresh and access tokens")
        
    }
}

const registerUser = asyncHandler( async(req,res) =>{
    
    const{fullname,username,email,password} = req.body
    
    if(
        [fullname,username,email,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")

    }

    const existedUser =await User.findOne({
        $or:[{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with eamil or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImage = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(409,"Avatar field is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    if(!avatar){
        throw new ApiError(409,"Avatar field is required")
    } 
    

    const user =await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        username:username.toLowerCase(),
        password,
        email
    })

    const createdUser =await User.findById(user._id).select(
        "-password  -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res) =>{
    const{email,username,password} = req.body

    if(!username || !email){
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({$or: [{username},{email}]})
    

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentails")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpoOnly: true,
        secure: true 
    }

    return res
    .status(200)
    .cookie("accessToke",accessToken,options)
    .cookie("refreshToke",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:refreshToken,accessToken,loggedInUser
            },
            "User loggedIn successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    const options = {
        httpoOnly: true,
        secure: true 
    }

    return res
    .clearCookies("accessToken",options)
    .clearCookies("refeshToken",options)
    .json(
        200,
        new ApiResponse(200,{},"user logged out")
    )

})


export {registerUser,loginUser,logoutUser}