import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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


    if (
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")

    }

    // yeh joh nicheh yaha user liya hai yeh mongo db keh saath bana hai toh yeh database keh saath direct baat kar saktah hai isliyeh hum nicheh User.findone leh rahe hai and $or tkai done koh check kareh user model keh andar check karsakteh ho last line 
                                        

    const existedUser = User.findOne({  
        $or: [{ username }, { email }]
    })

    if (existedUser){
        throw new ApiError(409, "user with email or username is already existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {

        throw new ApiError(400, "Avatar file is required")
    }

    // yaha niche humneh uploadoncloudinary peh await lagaya voh isliyeh hi lagaya ki ageh code run mat karo pehleh yeh file upload honeh doh

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

export {registerUser}