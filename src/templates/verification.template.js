export const verificationTemplate=(FRONTEND_BASE_URL,VERIFICATION_TOKEN)=>`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Verify Your Email</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f2f2f2;
                        padding: 20px;
                    }
                    .container {
                        background-color: white;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .button {
                        background-color: #4CAF50;
                        color: white;
                        padding: 10px 20px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Welcome to our app!</h1>
                    <p>Thank you for registering. Please click the button below to verify your email address:</p>
                    <a href="${FRONTEND_BASE_URL}/verify?token=${VERIFICATION_TOKEN}" class="button">Verify Email</a>
                    <p>If you did not request this verification, please ignore this email.</p>
                </div>
            </body>
            </html>
        `

export default verificationTemplate