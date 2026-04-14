// Email notification service using EmailJS

// 🔥 EmailJS Configuration
const EMAILJS_PUBLIC_KEY = '5J7XJWd2HXA804eyC';
const EMAILJS_SERVICE_ID = 'service_zi5z5vh';

const TEMPLATES = {
    APPLICATION_RECEIVED: 'template_wswzwl7',    // For employer
    APPLICATION_ACCEPTED: 'template_yoiycsh'     // For worker
};

// Initialize EmailJS
export function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        console.log('EmailJS initialized successfully');
    } else {
        console.error('EmailJS library not loaded');
    }
}

// Send email when worker applies to job (EMPLOYER NOTIFICATION)
export async function sendApplicationReceivedEmail(employerEmail, employerName, jobTitle, workerName, workerLocation, workerExperience, applicationMessage, applicationUrl) {
    try {
        console.log('Sending application received email to:', employerEmail);
        
        const templateParams = {
            to_email: employerEmail,
            employer_name: employerName,
            job_title: jobTitle,
            worker_name: workerName,
            worker_location: workerLocation,
            worker_experience: workerExperience,
            application_message: applicationMessage || 'No message provided',
            application_url: applicationUrl
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.APPLICATION_RECEIVED,
            templateParams
        );

        console.log('✅ Application received email sent successfully:', response);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error sending application received email:', error);
        return { success: false, error: error.text || error.message };
    }
}

// Send email when employer accepts application (WORKER NOTIFICATION)
export async function sendApplicationAcceptedEmail(workerEmail, workerName, jobTitle, companyName, jobLocation, employerName, employerPhone) {
    try {
        console.log('Sending application accepted email to:', workerEmail);
        
        const templateParams = {
            to_email: workerEmail,
            worker_name: workerName,
            job_title: jobTitle,
            company_name: companyName,
            job_location: jobLocation,
            employer_name: employerName,
            employer_phone: employerPhone
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.APPLICATION_ACCEPTED,
            templateParams
        );

        console.log('✅ Application accepted email sent successfully:', response);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error sending application accepted email:', error);
        return { success: false, error: error.text || error.message };
    }
}

// Note: Application rejected email not implemented (only 2 templates available)
// Workers can see rejection status in their dashboard