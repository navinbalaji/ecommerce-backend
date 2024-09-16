import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import nodemailer from 'nodemailer';
import AWS from 'aws-sdk';

// Configure AWS credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey:  process.env.AWS_SECRET_KEY,
    region:  process.env.AWS_REGION_NAME,
});

const s3 = new AWS.S3();

export const successResponse = (message, data) => ({
    message,
    data,
});

export const failureResponse = (message, data) => ({
    message,
    data,
});

export const signJwtToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });
};

export const verifyJwtToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body, { abortEarly: false });
        next();
    } catch (err) {
        return res.status(400).json(
            failureResponse(err.message || 'Something went wrong', {
                err: err.errors,
            })
        );
    }
};

export const generateOrderNumber = () => customAlphabet('1234567890', 10);

export const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    // nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       type: 'OAuth2',
    //       user: process.env.MAIL_USERNAME,
    //       pass: process.env.MAIL_PASSWORD,
    //       clientId: process.env.OAUTH_CLIENTID,
    //       clientSecret: process.env.OAUTH_CLIENT_SECRET,
    //       refreshToken: process.env.OAUTH_REFRESH_TOKEN
    //     }
    //   });

    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: to,
        subject: subject,
        html: html,
    });

    console.log('Message sent: %s', info.messageId);
};

export const uploadImage = async (fileName, base64Content) => {
    try {
        const buff = Buffer.from(base64Content, 'base64');

        const params = {
          Bucket:  process.env.AWS_BUCKET_NAME,
          Key: fileName,
          Body: buff,
          ContentEncoding: 'base64',
          ContentType: 'application/octet-stream'
        };
    
        const { Location } = await s3.upload(params).promise();
        return Location;
    } catch (err) {
        console.log(`Error uploading file: ${err}`);
    }
};

export const generateVerificationToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};
