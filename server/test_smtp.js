import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function testSMTP() {
    console.log('--- SMTP Configuration Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? '********' : 'MISSING');
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('ERROR: Missing SMTP credentials in .env file.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,      
        requireTLS: true,   
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    console.log('\nAttempting to verify connection...');
    try {
        await transporter.verify();
        console.log('✅ Success: SMTP connection verified!');
        
        console.log('\nSending test email to', process.env.SMTP_USER, '...');
        const info = await transporter.sendMail({
            from: `"SmartShelfX Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: 'SmartShelfX SMTP Test',
            text: 'If you are reading this, your SMTP configuration is working perfectly!',
            html: '<b>If you are reading this, your SMTP configuration is working perfectly!</b>',
        });
        console.log('✅ Success: Test email sent!', info.messageId);
    } catch (error) {
        console.error('\n❌ ERROR: SMTP failed.');
        console.error('Code:', error.code);
        console.error('Response:', error.response);
        console.error('Message:', error.message);
        
        if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
            console.log('\n💡 DIAGNOSIS: Invalid Credentials (Gmail 535 Error)');
            console.log('For Gmail, you MUST use an "App Password", not your regular account password.');
            console.log('Follow these steps:');
            console.log('1. Go to your Google Account (myaccount.google.com)');
            console.log('2. Search for "App Passwords" (requires 2-Step Verification to be ON)');
            console.log('3. Create a new App Password named "SmartShelfX"');
            console.log('4. Copy the 16-character code and paste it into SMTP_PASS in your .env file.');
        }
    }
}

testSMTP();
