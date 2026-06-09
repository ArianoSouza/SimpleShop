import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendRecoveryEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: `"SimpleShop" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Recuperação de Senha - SimpleShop',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5D4D5D;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação de senha para sua conta no <strong>SimpleShop</strong>.</p>
        <p>Use o código abaixo para prosseguir com a redefinição:</p>
        <div style="background-color: #fce4ec; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #b96565; letter-spacing: 5px;">${code}</span>
        </div>
        <p>Este código é válido por 15 minutos.</p>
        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #887e88;">Equipe SimpleShop</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
