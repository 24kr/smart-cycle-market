import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_PASS,
  }
});

const sendVerification = async (email: string, link: string) => {
    
        await transport.sendMail({
            from: "verification@myapp.com",
            to: email,
            html:`<h1>Please click on this <a href="${link}">link</a> to Verify the account.</h1>`
        })

}
const sendPasswordResetLink = async (email: string, link: string) => {

  await transport.sendMail({
    from: "security@myapp.com",
    to: email,
    html: `<h1>Please follow this <a href="${link}">Link</a> to updated your password</h1>`
  })

}

const mail = {
    sendVerification,
  sendPasswordResetLink
}

export default mail;