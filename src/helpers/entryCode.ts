import mailer from 'nodemailer'


const transporter = mailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'arabyamir1384@gmail.com',
    pass: 'A1m3i8r40630476845',
  },
});

// Generate a 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Main function to send the email
export async function sendVerificationCode(toEmail: string): Promise<string> {
  const code = generateCode();

  await transporter.sendMail({
    from: '"My App" <arabyamir1384@gmail.com>',
    to: toEmail,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <b>${code}</b></p>`,
  });

  return code;
}