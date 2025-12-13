import nodemailer from 'nodemailer'

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});


const sendMail = async ({to,subject,body}) => {
    
   const response = await transporter.sendMail({
       from:process.env.SENDER_EMAIL,
       to,
       subject,
       body,
     });
     return response
}

export default sendMail