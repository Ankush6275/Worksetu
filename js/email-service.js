// ============================================================
// Email Notification Service — WorkSetu
// Provider: EmailJS  |  Version: 3.x (CDN global)
// ============================================================

const EMAILJS_PUBLIC_KEY  = '5J7XJWd2HXA804eyC';
const EMAILJS_SERVICE_ID  = 'service_zi5z5vh';

const TEMPLATES = {
    APPLICATION_RECEIVED : 'template_wswzwl7',  // Sent to employer when worker applies
    APPLICATION_ACCEPTED : 'template_yoiycsh'   // Sent to worker when employer accepts
};

// -----------------------------------------------------------
// Internal helper — ensures EmailJS is ready before sending.
// Retries up to 20 × 250 ms = 5 seconds if the CDN script
// hasn't finished loading yet (race condition on slow networks).
// -----------------------------------------------------------
function waitForEmailJS(retries = 20) {
    return new Promise((resolve, reject) => {
        const attempt = (remaining) => {
            if (typeof emailjs !== 'undefined') {
                try {
                    // init() is idempotent — safe to call multiple times
                    emailjs.init(EMAILJS_PUBLIC_KEY);
                    console.log('[EmailJS] ✅ Initialized successfully');
                    resolve();
                } catch (err) {
                    reject(new Error('[EmailJS] init() failed: ' + err.message));
                }
            } else if (remaining > 0) {
                console.warn(`[EmailJS] Library not ready yet — retrying (${remaining} attempts left)…`);
                setTimeout(() => attempt(remaining - 1), 250);
            } else {
                reject(new Error(
                    '[EmailJS] Library never loaded. ' +
                    'Ensure the CDN <script> tag appears BEFORE your module script in the HTML <head>.'
                ));
            }
        };
        attempt(retries);
    });
}

// -----------------------------------------------------------
// Public initializer — call this once per page if you want
// eager initialization. The send functions also call it
// internally, so it is optional but recommended.
// -----------------------------------------------------------
export async function initEmailJS() {
    try {
        await waitForEmailJS();
    } catch (err) {
        console.error('[EmailJS] ❌ Initialization error:', err.message);
    }
}

// -----------------------------------------------------------
// TEMPLATE 1 — Notify EMPLOYER when a worker applies
// -----------------------------------------------------------
// EmailJS template variables expected:
//   {{to_email}}            — employer's email address
//   {{employer_name}}       — employer's display name
//   {{job_title}}           — title of the job posting
//   {{worker_name}}         — applicant's full name
//   {{worker_location}}     — applicant's city / area
//   {{worker_experience}}   — applicant's experience level
//   {{application_message}} — cover message from applicant
//   {{application_url}}     — deep-link to view-applications page
// -----------------------------------------------------------
export async function sendApplicationReceivedEmail(
    employerEmail,
    employerName,
    jobTitle,
    workerName,
    workerLocation,
    workerExperience,
    applicationMessage,
    applicationUrl
) {
    console.log('[EmailJS] 📧 Sending APPLICATION RECEIVED email to employer:', employerEmail);

    // Guard — never attempt with a missing address
    if (!employerEmail || !employerEmail.includes('@')) {
        console.error('[EmailJS] ❌ Invalid employer email — skipping send:', employerEmail);
        return { success: false, error: 'Invalid employer email address' };
    }

    try {
        await waitForEmailJS();

        const templateParams = {
            to_email           : employerEmail,
            employer_name      : employerName      || 'Employer',
            job_title          : jobTitle          || 'Your Job',
            worker_name        : workerName        || 'A worker',
            worker_location    : workerLocation    || 'Not specified',
            worker_experience  : workerExperience  || 'Not specified',
            application_message: applicationMessage || 'No message provided',
            application_url    : applicationUrl    || window.location.origin
        };

        console.log('[EmailJS] Template params (APPLICATION_RECEIVED):', templateParams);

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.APPLICATION_RECEIVED,
            templateParams
        );

        console.log('[EmailJS] ✅ APPLICATION RECEIVED email sent. Status:', response.status, response.text);
        return { success: true, response };

    } catch (error) {
        const msg = error?.text || error?.message || String(error);
        console.error('[EmailJS] ❌ Failed to send APPLICATION RECEIVED email:', msg);
        return { success: false, error: msg };
    }
}

// -----------------------------------------------------------
// TEMPLATE 2 — Notify WORKER when employer accepts them
// -----------------------------------------------------------
// EmailJS template variables expected:
//   {{to_email}}       — worker's email address
//   {{worker_name}}    — worker's full name
//   {{job_title}}      — title of the accepted job
//   {{company_name}}   — employer's business / company name
//   {{job_location}}   — location of the job
//   {{employer_name}}  — contact person name at the company
//   {{employer_phone}} — contact number for the worker to reach out
// -----------------------------------------------------------
export async function sendApplicationAcceptedEmail(
    workerEmail,
    workerName,
    jobTitle,
    companyName,
    jobLocation,
    employerName,
    employerPhone
) {
    console.log('[EmailJS] 📧 Sending APPLICATION ACCEPTED email to worker:', workerEmail);

    // Guard — never attempt with a missing address
    if (!workerEmail || !workerEmail.includes('@')) {
        console.error('[EmailJS] ❌ Invalid worker email — skipping send:', workerEmail);
        return { success: false, error: 'Invalid worker email address' };
    }

    try {
        await waitForEmailJS();

        const templateParams = {
            to_email      : workerEmail,
            worker_name   : workerName   || 'Applicant',
            job_title     : jobTitle     || 'Job',
            company_name  : companyName  || 'Company',
            job_location  : jobLocation  || 'Not specified',
            employer_name : employerName || 'Employer',
            employer_phone: employerPhone || 'Not provided'
        };

        console.log('[EmailJS] Template params (APPLICATION_ACCEPTED):', templateParams);

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.APPLICATION_ACCEPTED,
            templateParams
        );

        console.log('[EmailJS] ✅ APPLICATION ACCEPTED email sent. Status:', response.status, response.text);
        return { success: true, response };

    } catch (error) {
        const msg = error?.text || error?.message || String(error);
        console.error('[EmailJS] ❌ Failed to send APPLICATION ACCEPTED email:', msg);
        return { success: false, error: msg };
    }
}