import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import Mail from "nodemailer/lib/mailer/index.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPMail } from "../emailVerify/sendOTPMail.js";


export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body; // <<< ye missing tha

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: newUser._id }, process.env.SECRATE_KEY, { expiresIn: '10m' });
        verifyEmail(token, email); // send email here 
        newUser.token = token;

        await newUser.save();
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verify = async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({
                success: false,
                message: 'Authorization token is missing or invalid'
            })
        }

        const token = authHeader.split(" ")[1];   // bearer toke hase 
        let decoded
        try {
            decoded = jwt.verify(token, process.env.SECRATE_KEY)

        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({
                    success: false,
                    message: 'The Registration Token Has Expired'
                })
            }
            return res.status(400).json({
                success: false,
                message: 'Token Verification faild'
            })
        }
        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            })
        }
        user.token = null
        user.isVerified = true
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Email Verified Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const reVerify = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }
        const token = jwt.sign({ id: user._id }, process.env.SECRATE_KEY, { expiresIn: '10m' })
        verifyEmail(token, email) // send email here 
        user.token = token
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Email send again successfully",
            token: user.token
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fealds are required"
            })
        }
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User not existing"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password)
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credintials"
            })
        }
        if (existingUser.isVerified === false) {
            return res.status(400).json({
                success: false,
                message: "Verify your accound than login"
            })
        }


        // generate token 

        const accessToken = jwt.sign({ id: existingUser._id }, process.env.SECRATE_KEY, { expiresIn: '10d' })
        const refreshToken = jwt.sign({ id: existingUser._id }, process.env.SECRATE_KEY, { expiresIn: '30d' })

        existingUser.isLoggedIn = true
        await existingUser.save()

        // Check for existing Session and delete it  

        const existingSession = await Session.findOne({ userId: existingUser._id })
        if (existingSession) {
            await Session.deleteOne({ userId: existingUser._id })
        }

        // Create a new Session 
        await Session.create({ userId: existingUser._id })
        return res.status(200).json({
            success: true,
            message: `Welcome back ${existingUser.firstName}`,
            user: existingUser,
            accessToken,
            refreshToken
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
export const logout = async (req, res) => {
  try {

    if(!req.id){
      return res.status(401).json({
        success:false,
        message:"Unauthorized"
      })
    }

    await Session.deleteMany({ userId: req.id })

    await User.findByIdAndUpdate(req.id, { isLoggedIn: false })

    return res.status(200).json({
      success: true,
      message: "User logged out successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// export const logout = async (req, res) => {
//     try {
//         const userId = req.id
//         await Session.deleteMany({ userId: userId })
//         await User.findByIdAndUpdate(userId, { isLoggedIn: false })
//         return res.status(200).json({
//             success: true,
//             message: "Usr logged Out successfully"
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not Found"
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)// 10 minit
        user.otp = otp
        user.otpExpiry = otpExpiry

        await user.save()
        await sendOTPMail(otp, email)

        return res.status(200).json({
            success: true,
            message: "OTP SEND TO EMAIL SUCCESSFULLY "
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const veriyfOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.params.email
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not Found"
            })
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP is Not Generated or already verified"
            })
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired please request new one "
            })
        }

        if (otp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid "
            })
        }

        user.otp = null
        user.otpExpiry = null
        await user.save()
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully "
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { email } = req.params
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not Found"
            })
        }

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are require"
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "password don't match"
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()
        return res.status(200).json({
            success: true,
            message: "Password chainged successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const allUser = async (req, res) => {
    try {
        const users = await User.find()
        return res.status(200).json({
            success: true,
            users
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params; // extract userId from request params
        const user = await User.findById(userId).select("-password -otp -otpExpiry -token")
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not Found"
            })
        }
        res.status(200).json({
            success: true,
            user,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export const updateUser = async (req, res) => {
    try {
        const userIdToUpdate = req.params.id // the Id of the user we want to update
        const loggedInUser = req.user // from is Authenticated middleware 
        const { firstName, lastName, address, city, zipCode, phoneNo, role } = req.body


        if (loggedInUser._id.toString() !== userIdToUpdate &&
            loggedInUser.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this profile"
            })
        }

        let user = await User.findById(userIdToUpdate);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // update fields

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.address = address || user.address;
        user.city = city || user.city;
        user.zipCode = zipCode || user.zipCode;
        user.phoneNo = phoneNo || user.phoneNo;
        user.role = role;

        const updatedUser = await user.save()

        return res.status(200).json({
            success: true,
            message: "Profile Updated Successfully",
            user: updatedUser,
        })



    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



