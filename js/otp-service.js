// OTP Service using Firebase Phone Authentication
import {
    auth,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from './firebase-config.js';

let recaptchaVerifier = null;
let confirmationResult = null;

// Initialize invisible reCAPTCHA
export function initRecaptcha(buttonId) {
    try {
        // Clear existing reCAPTCHA if any
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }

        recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
            size: 'invisible',
            callback: (response) => {
                console.log('✅ reCAPTCHA solved');
            },
            'expired-callback': () => {
                console.warn('⚠️ reCAPTCHA expired, resetting...');
                recaptchaVerifier.clear();
                recaptchaVerifier = null;
            }
        });

        return recaptchaVerifier;
    } catch (error) {
        console.error('reCAPTCHA init error:', error);
        return null;
    }
}

// Send OTP to phone number
export async function sendOTP(phoneNumber) {
    try {
        // Format phone number — add +91 if not present
        let formattedPhone = phoneNumber.trim();
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+91' + formattedPhone;
        }

        // Validate phone number length
        if (formattedPhone.length !== 13) {
            return { success: false, error: 'Please enter a valid 10-digit mobile number' };
        }

        // Initialize reCAPTCHA if not already done
        if (!recaptchaVerifier) {
            return { success: false, error: 'reCAPTCHA not initialized. Please refresh and try again.' };
        }

        console.log('Sending OTP to:', formattedPhone);

        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);

        console.log('✅ OTP sent successfully');
        return { success: true, message: 'OTP sent successfully!' };

    } catch (error) {
        console.error('❌ Error sending OTP:', error);

        // Clear reCAPTCHA on error so user can retry
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }

        let errorMessage = 'Failed to send OTP. Please try again.';

        if (error.code === 'auth/invalid-phone-number') {
            errorMessage = 'Invalid phone number. Please enter a valid 10-digit number.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many attempts. Please try again after some time.';
        } else if (error.code === 'auth/quota-exceeded') {
            errorMessage = 'SMS quota exceeded. Please try again later.';
        } else if (error.code === 'auth/captcha-check-failed') {
            errorMessage = 'Security check failed. Please refresh the page and try again.';
        }

        return { success: false, error: errorMessage };
    }
}

// Verify OTP entered by user
export async function verifyOTP(otpCode) {
    try {
        if (!confirmationResult) {
            return { success: false, error: 'No OTP request found. Please send OTP first.' };
        }

        if (!otpCode || otpCode.length !== 6) {
            return { success: false, error: 'Please enter a valid 6-digit OTP.' };
        }

        const result = await confirmationResult.confirm(otpCode);
        console.log('✅ OTP verified successfully');

        return { success: true, user: result.user };

    } catch (error) {
        console.error('❌ OTP verification error:', error);

        let errorMessage = 'Invalid OTP. Please try again.';

        if (error.code === 'auth/invalid-verification-code') {
            errorMessage = 'Wrong OTP entered. Please check and try again.';
        } else if (error.code === 'auth/code-expired') {
            errorMessage = 'OTP has expired. Please request a new one.';
        }

        return { success: false, error: errorMessage };
    }
}

// Reset OTP state (call this on page load or after success)
export function resetOTPState() {
    confirmationResult = null;
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
}