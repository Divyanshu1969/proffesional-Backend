import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User} from "../models/user.model.js"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId) 
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false })

       return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went while generating refresh adnn access Token")
    }
}

// Register user mai hum user koh register kara rahe hai 

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists; username, email
    // check for image, check for avatar
    // upload them to cloudionary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, username, password } = req.body
    //console.log("email : ", email);

    if (
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")

    }

    // yeh joh nicheh yaha user liya hai yeh mongo db keh saath bana hai toh yeh database keh saath direct baat kar saktah hai isliyeh hum nicheh User.findone leh rahe hai and $or tkai done koh check kareh user model keh andar check karsakteh ho last line 
                                        

    const existedUser =  await User.findOne({  
        $or: [{ username }, { email }]
    })

    if (existedUser){
        throw new ApiError(409, "user with email or username is already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenghth > 0){
        coverImageLocalPath = req.files.coverImage[0].path 
    }

    if (!avatarLocalPath) {

        throw new ApiError(400, "Avatar file is required")
    }

    // yaha niche humneh uploadoncloudinary peh await lagaya voh isliyeh hi lagaya ki ageh code run mat karo pehleh yeh file upload honeh doh

    console.log(req.files);

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

   const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // yeh niche humnehh user.findById isliyeh liya hai kyunki mongodb jabh database mai entry karta hai toh apneh aap ek _id karkeh field banadeta hai and also hum iskeh saath 'select' method laga saktrh joh kih sari entry yah data koh select kar leta hai toh humeh ismai voh likhna hota hai joh humeh select nahi karna hota 

    // select ka syntax string mai likha jata hai and -password then 1 space dena hota hai and joh next entry ya data remove karna hai voh isami humneh refresh token diya hai 

    // hum yeh user koh nahi dena chahteh password joh encrypted jaegah and refreshtoken ki field isliyeh hum yaha useh hata rahe hai 

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succesfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {

    // req body -> data
    // check username or email
    // find user
    // password check
    //accessa and refresh token 
    // send cookie

    const {email, username, password} = req.body

    if(!username || !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        
       //yeh joh niched $ lagakar option lagaakr option khuleh and humnehh unmeh seh or liya hai in sabh koh mongodb keh operators kahateh hai
        
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user Credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
        httpOnly : true,
        secure : true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,refreshToken
            },
            "User logged in Successfully"
        )
   )

})

const logoutUser = asyncHandler(async(req, res) =>{
     // Humareh paas yaha req.user a acces hai kyunki is point humara middleware execute ho chuka hai and vaha humneh ek req mai  req.user = user matlabh ek naya object bana diya tha req mai toh vahi yaha aara hai 

     await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
     )

      const options = {
        httpOnly : true,
        secure : true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out"))
})

export {
    
    registerUser,
    loginUser,
    logoutUser

}