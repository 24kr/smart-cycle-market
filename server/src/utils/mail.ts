import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d9b51f92629ebf",
    pass: "33f1f11c9b4ff9"
  }
});

const sendVerification = async (email: string, link: string) => {
    
        await transport.sendMail({
            from: "verification@myapp.com",
            to: email,
            html:`<h1>Please click on this <a href="${link}">link</a> to Verify the account.</h1>`
        })

}

const mail = {
    sendVerification
}

export default mail;