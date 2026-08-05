import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
 
    // humareh paas req ka acces ka hai toh hum ismai ek naya object add kardengeh 
    req.user = user;
    next()
    
   } catch (error) {

        throw new ApiError(401, error?.message || "Invalid access token")
    
   }
})

// upar jaha req, res , next hai but res hatakar _ likh diya hai kyunki uska koi is .js file mai kaam nahi hora hai and jabh aisa ho toh production level company mai iseh _ kardiya jata hai and aisi cheejeh milti hai vaha 