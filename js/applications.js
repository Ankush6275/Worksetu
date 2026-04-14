// Application management functions with EMAIL NOTIFICATIONS

import { 
    db, 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    increment,
    query,
    where,
    getDocs,
    auth,
    orderBy
} from './firebase-config.js';

import { 
    sendApplicationReceivedEmail,
    sendApplicationAcceptedEmail
} from './email-service.js';

// Submit a job application (WITH EMAIL NOTIFICATION TO EMPLOYER)
export async function submitApplication(jobId, workerId, workerData, message) {
    try {
        if (!workerId) {
            console.error('workerId is missing or undefined');
            return { success: false, error: 'Authentication error. Please logout and login again.' };
        }

        const existingApplication = await checkExistingApplication(jobId, workerId);
        if (existingApplication) {
            return { success: false, error: 'You have already applied to this job' };
        }
        
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (!jobDoc.exists()) {
            return { success: false, error: 'Job not found' };
        }
        
        const jobData = jobDoc.data();
        
        // Get employer details for email
        const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
        const employerData = employerDoc.exists() ? employerDoc.data() : null;
        
        const applicationData = {
            jobId: jobId,
            workerId: String(workerId),
            workerName: workerData.fullName,
            workerSkills: workerData.skills || [],
            workerExperience: workerData.experience || 'Not specified',
            workerLocation: workerData.location || '',
            workerEmail: workerData.email || '',
            workerTrustScore: workerData.trustScore || 50,
            employerId: jobData.employerId,
            jobTitle: jobData.title,
            message: message || '',
            status: 'pending',
            appliedAt: new Date().toISOString(),
            respondedAt: null,
            rejectionReason: null
        };
        
        const applicationsRef = collection(db, 'applications');
        const docRef = await addDoc(applicationsRef, applicationData);
        
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, {
            applicationsCount: increment(1)
        });
        
        // 🔥 SEND EMAIL TO EMPLOYER (async, don't wait)
        if (employerData && employerData.email) {
            const applicationUrl = `${window.location.origin}/pages/view-applications.html?jobId=${jobId}`;
            
            sendApplicationReceivedEmail(
                employerData.email,
                employerData.fullName,
                jobData.title,
                workerData.fullName,
                workerData.location || 'Not specified',
                workerData.experience || 'Not specified',
                message || 'No message provided',
                applicationUrl
            ).then(result => {
                if (result.success) {
                    console.log('✅ Employer notification email sent');
                } else {
                    console.log('⚠️ Email failed but application saved');
                }
            }).catch(err => {
                console.error('Email error (non-critical):', err);
            });
        }
        
        return {
            success: true,
            applicationId: docRef.id,
            message: 'Application submitted successfully!'
        };
        
    } catch (error) {
        console.error('Error submitting application:', error);
        return {
            success: false,
            error: 'Failed to submit application. Please try again.'
        };
    }
}

// Check if worker already applied
async function checkExistingApplication(jobId, workerId) {
    try {
        const applicationsRef = collection(db, 'applications');
        const q = query(
            applicationsRef,
            where('jobId', '==', jobId),
            where('workerId', '==', workerId)
        );
        
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
        
    } catch (error) {
        console.error('Error checking existing application:', error);
        return false;
    }
}

// Get worker's applications
export async function getWorkerApplications(workerId) {
    try {
        const applicationsRef = collection(db, 'applications');
        const q = query(
            applicationsRef,
            where('workerId', '==', workerId),
            orderBy('appliedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const applications = [];
        
        querySnapshot.forEach((docSnap) => {
            applications.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        return { success: true, applications: applications };
        
    } catch (error) {
        console.error('Error getting applications:', error);
        return { success: false, error: 'Failed to load applications', applications: [] };
    }
}

// Get applications for specific job (employer view)
export async function getJobApplications(jobId) {
    try {
        console.log('Fetching applications for jobId:', jobId);
        
        const applicationsRef = collection(db, 'applications');
        const q = query(
            applicationsRef,
            where('jobId', '==', jobId),
            orderBy('appliedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const applications = [];
        
        querySnapshot.forEach((docSnap) => {
            applications.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        
        console.log('Found applications:', applications.length);
        
        return { success: true, applications: applications };
        
    } catch (error) {
        console.error('Error getting job applications:', error);
        return { success: false, error: error.message, applications: [] };
    }
}

// Accept application (WITH EMAIL NOTIFICATION TO WORKER)
export async function acceptApplication(applicationId) {
    try {
        // Get application details
        const appDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!appDoc.exists()) {
            return { success: false, error: 'Application not found' };
        }
        
        const appData = appDoc.data();
        
        // Get job details
        const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
        const jobData = jobDoc.exists() ? jobDoc.data() : null;
        
        // Update application status
        const applicationRef = doc(db, 'applications', applicationId);
        await updateDoc(applicationRef, {
            status: 'accepted',
            respondedAt: new Date().toISOString()
        });
        
        // 🔥 SEND EMAIL TO WORKER (async, don't wait)
        if (appData.workerEmail && jobData) {
            sendApplicationAcceptedEmail(
                appData.workerEmail,
                appData.workerName,
                jobData.title,
                jobData.businessName || jobData.employerName || 'Company',
                jobData.location,
                jobData.contactPerson || 'Employer',
                jobData.contactNumber || 'Not provided'
            ).then(result => {
                if (result.success) {
                    console.log('✅ Worker notification email sent');
                } else {
                    console.log('⚠️ Email failed but application accepted');
                }
            }).catch(err => {
                console.error('Email error (non-critical):', err);
            });
        }
        
        return { success: true, message: 'Application accepted!' };
        
    } catch (error) {
        console.error('Error accepting application:', error);
        return { success: false, error: 'Failed to accept application' };
    }
}

// Reject application (NO EMAIL - worker sees status in dashboard)
export async function rejectApplication(applicationId, reason = '') {
    try {
        const applicationRef = doc(db, 'applications', applicationId);
        await updateDoc(applicationRef, {
            status: 'rejected',
            respondedAt: new Date().toISOString(),
            rejectionReason: reason
        });
        
        // Note: No email sent for rejection (only 2 templates available)
        // Worker can check status in their dashboard
        
        return { success: true, message: 'Application rejected' };
        
    } catch (error) {
        console.error('Error rejecting application:', error);
        return { success: false, error: 'Failed to reject application' };
    }
}