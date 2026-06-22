import mailgen from 'mailgen';
import nodemailer from 'nodemailer';

const sendMail = async (options) => {
  // Initialize mailgen instance with default theme and brand configuration
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Task Manager',
      link: 'https://taskmanager.app',
    },
  });

  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Mailtrap : SMTP service used to test emails during development
  // Create a nodemailer transporter instance which is responsible to send a mail
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
    from: "mail.taskmanager@example.com", // We can name this anything. The mail will go to your Mailtrap inbox
    to: options.email, // receiver's mail
    subject: options.subject, // mail subject
    text: emailTextual, // mailgen content textual variant
    html: emailHtml, // mailgen content html variant
  };

  // sendMail() : Sends email using Nodemailer
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    // As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
    // So it's better to fail silently rather than breaking the app
    console.error(
      "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file",
    );
    console.error('Email Failed', error);
  }
};

//Creates Email Verification template
const emailVerificationMailGenContent = (username, verification) => {
  return {
    body: {
      name: 'username',
      intro: "Welcome to App! We're very excited to have you on board.",
      action: {
        instructions: 'To get started with our App, please click here:',
        button: {
          color: '#32a4e6ff', // Optional action button color
          text: 'Confirm your account',
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

// Creates Password Reset template
const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: 'username',
      intro: 'We got a request to reset your password',
      action: {
        instructions: 'To change your password, please click here:',
        button: {
          color: '#325fe6ff', // Optional action button color
          text: 'reset Password',
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
