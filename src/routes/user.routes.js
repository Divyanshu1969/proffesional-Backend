import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser

)

router.route("/login").post(loginUser)

//secured routes

// YEH NICHE HUMneh verifyjWt liya hai yeh chalegha , yeh humneh ilkha tha aut.middleware mai vaha humneh last mai next() isliyeh diya hai taki yeh toh chaleh hi par joh koh ageh ka method hai logoutUser ya agar or bhi hai toh voh bhi chal jaeh

router.route("/logout").post(verifyJWT, logoutUser)


export default router; 