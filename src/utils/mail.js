import mailgen from "mailgen";
import nodemailer from "nodemailer"

const sendMail = async (options) =>{ 
    const mailGenerator = new Mailgen({
        theme: "default",
        product:{
            name:"Task Manager",
            link:"https://mailgen.js/",
        },
    });

    var emailText= mailGenerator.generatePlaintext(options.mailGenContent);
    var emailHTML= mailGenerator.generate(options.mailGenContent);
    
    const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailText, // plain‑text body
        html: emailHTML, // HTML body
    };

    try{
        await transporter.sendMail(mail);
    }catch(error){
        console.error("Email Failed",error);
    }  
}

const emailVerificationMailGenContent = (username,verification) => {
    return{
        body: {
            name: 'username',
            intro: 'Welcome to App! We\'re very excited to have you on board.',
            action: {
                instructions: 'To get started with our App, please click here:',
                button: {
                    color: '#32a4e6ff', // Optional action button color
                    text: 'Confirm your account',
                    link: verificationUrl,
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        } 
    }
};

const forgotPasswordMailGenContent = (username,passwordResetUrl) => {
    return{
        body: {
            name: 'username',
            intro:"We got a request to reset your password",
            action: {
                instructions: 'To change your password, please click here:',
                button: {
                    color: '#325fe6ff', // Optional action button color
                    text: 'reset Password',
                    link: passwordResetUrl,
                },
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        } 
    }
};
