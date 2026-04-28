    import nodemailer from 'nodemailer'
    import 'dotenv/config.js'


    export const sendOTPMail = async(otp, email) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });
        const mailConfigurations = {

            // It should be a string of sender/server email
            from: process.env.MAIL_USER,

            to: email,

            // Subject of Email
            subject: 'Password Reset OTP',
            html:`<p>Your OTP For Password Reset Is:<b>${otp}</b> OTP VALID FOR 10 MIN</p>`
        };
        transporter.sendMail(mailConfigurations, function (error, info) {
            if (error) throw Error(error);
            console.log('OTP Sent Successfully');
            console.log(info);
        });

    } 