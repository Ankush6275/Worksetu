// ============================================================
// Application Management — WorkSetu
// Handles: submit, fetch, accept, reject  +  email triggers
// ============================================================

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

// -----------------------------------------------------------
// SUBMIT APPLICATION  (worker → employer)
// Saves to Firestore, then emails the employer.
// -----------------------------------------------------------
export async function submitApplication(jobId, workerId, workerData, message) {
    console.log('[Applications] submitApplication() called — jobId:', jobId, '| workerId:', workerId);

    try {
        // ── Validation ─────────────────────────────────────
        if (!workerId) {
            console.error('[Applications] ❌ workerId is missing');
            return { success: false, error: 'Authentication error. Please logout and login again.' };
        }

        const alreadyApplied = await checkExistingApplication(jobId, String(workerId));
        if (alreadyApplied) {
            return { success: false, error: 'You have already applied to this job' };
        }

        // ── Fetch job ───────────────────────────────────────
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        if (!jobDoc.exists()) {
            return { success: false, error: 'Job not found' };
        }
        const jobData = jobDoc.data();
        console.log('[Applications] Job data fetched:', jobData.title);
        console.log('[Applications] Full job data:', JSON.stringify(jobData));  // DEBUG: see all fields

        // ── Status guard: only allow applications on active jobs ────────────
        if (jobData.status && jobData.status !== 'active') {
            const statusMsg = {
                expired  : 'This job has expired and is no longer accepting applications.',
                deleted  : 'This job has been removed by the employer.',
                completed: 'This job has been completed and is no longer accepting applications.'
            };
            return {
                success: false,
                error: statusMsg[jobData.status] || 'This job is no longer available.'
            };
        }

        // ── Expiry guard: double-check jobDate even if status wasn't updated yet ──
        if (jobData.jobDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const jobDate = new Date(jobData.jobDate);
            jobDate.setHours(0, 0, 0, 0);
            if (jobDate < today) {
                // Also update Firestore status so future checks are fast
                updateDoc(doc(db, 'jobs', jobId), { status: 'expired' }).catch(() => {});
                return { success: false, error: 'This job has expired and is no longer accepting applications.' };
            }
        }

        // ── Resolve employer ID ─────────────────────────────
        // FIX: jobs may store employer UID under different field names
        const employerId =
            jobData.employerId   ||
            jobData.userId       ||
            jobData.createdBy    ||
            jobData.uid          ||
            null;

        console.log('[Applications] Resolved employerId:', employerId);

        // ── Fetch employer from Firestore ───────────────────
        let employerData = null;
        if (employerId) {
            const employerDoc = await getDoc(doc(db, 'users', employerId));
            if (employerDoc.exists()) {
                employerData = employerDoc.data();
                console.log('[Applications] Full employerData from Firestore:', JSON.stringify(employerData)); // DEBUG
                console.log('[Applications] employerData.email:', employerData.email);                        // DEBUG
            } else {
                console.warn('[Applications] ⚠️ Employer document not found in users/ for id:', employerId);
            }
        } else {
            console.warn('[Applications] ⚠️ No employerId found on job document. Job fields:', Object.keys(jobData).join(', '));
        }

        // ── FIX: Resolve employer email with multiple fallbacks ──
        // Priority: employerData.email → jobData.employerEmail → jobData.contactEmail
        const resolvedEmployerEmail =
            (employerData && (employerData.email || employerData.emailAddress)) ||
            jobData.employerEmail  ||
            jobData.contactEmail   ||
            null;

        const resolvedEmployerName =
            (employerData && (employerData.fullName || employerData.name || employerData.businessName)) ||
            jobData.employerName   ||
            jobData.businessName   ||
            'Employer';

        console.log('[Applications] Resolved employer email:', resolvedEmployerEmail);
        console.log('[Applications] Resolved employer name:', resolvedEmployerName);

        // ── FIX: Resolve worker email with auth fallback ────
        // workerData (from Firestore) may not have email; fall back to auth.currentUser.email
        const resolvedWorkerEmail =
            workerData.email ||
            (auth.currentUser && auth.currentUser.email) ||
            '';

        console.log('[Applications] Resolved worker email:', resolvedWorkerEmail);

        // ── Build application payload ───────────────────────
        const applicationData = {
            jobId           : jobId,
            workerId        : String(workerId),
            workerName      : workerData.fullName       || '',
            workerSkills    : workerData.skills         || [],
            workerExperience: workerData.experience     || 'Not specified',
            workerLocation  : workerData.location       || '',
            workerEmail     : resolvedWorkerEmail,                          // FIX: use resolved email
            workerTrustScore: workerData.trustScore     || 50,
            employerId      : employerId,
            jobTitle        : jobData.title,
            message         : message                   || '',
            status          : 'pending',
            appliedAt       : new Date().toISOString(),
            respondedAt     : null,
            rejectionReason : null
        };

        // ── Save to Firestore ───────────────────────────────
        const applicationsRef = collection(db, 'applications');
        const docRef = await addDoc(applicationsRef, applicationData);
        console.log('[Applications] ✅ Application saved — id:', docRef.id);

        // ── Increment job application count ─────────────────
        await updateDoc(doc(db, 'jobs', jobId), {
            applicationsCount: increment(1)
        });

        // ── Send email to employer ──────────────────────────
        if (resolvedEmployerEmail) {
            const applicationUrl =
                `${window.location.origin}/pages/view-applications.html?jobId=${jobId}`;

            console.log('[Applications] 📧 Triggering employer notification email to:', resolvedEmployerEmail);

            // Fire-and-forget (non-blocking) — application is already saved
            sendApplicationReceivedEmail(
                resolvedEmployerEmail,
                resolvedEmployerName,
                jobData.title,
                workerData.fullName          || 'A worker',
                workerData.location          || 'Not specified',
                workerData.experience        || 'Not specified',
                message                      || 'No message provided',
                applicationUrl
            ).then(result => {
                if (result.success) {
                    console.log('[Applications] ✅ Employer notification email delivered');
                } else {
                    console.warn('[Applications] ⚠️ Employer email failed (application still saved):', result.error);
                }
            }).catch(err => {
                console.error('[Applications] ❌ Employer email threw an error (non-critical):', err);
            });

        } else {
            // ── Detailed diagnosis when email is missing ────
            console.error('[Applications] ❌ Could not resolve employer email. Diagnosis:');
            console.error('  jobData.employerId      :', jobData.employerId);
            console.error('  jobData.userId          :', jobData.userId);
            console.error('  jobData.employerEmail   :', jobData.employerEmail);
            console.error('  jobData.contactEmail    :', jobData.contactEmail);
            console.error('  employerData            :', JSON.stringify(employerData));
            console.error('  All job fields          :', Object.keys(jobData).join(', '));
            console.warn('[Applications] ⚠️ Application saved, but employer was NOT notified by email.');
        }

        return {
            success      : true,
            applicationId: docRef.id,
            message      : 'Application submitted successfully!'
        };

    } catch (error) {
        console.error('[Applications] ❌ submitApplication error:', error);
        return { success: false, error: 'Failed to submit application. Please try again.' };
    }
}

// -----------------------------------------------------------
// DUPLICATE CHECK
// -----------------------------------------------------------
async function checkExistingApplication(jobId, workerId) {
    try {
        const q = query(
            collection(db, 'applications'),
            where('jobId',    '==', jobId),
            where('workerId', '==', workerId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('[Applications] checkExistingApplication error:', error);
        return false;
    }
}

// -----------------------------------------------------------
// GET WORKER'S OWN APPLICATIONS
// -----------------------------------------------------------
export async function getWorkerApplications(workerId) {
    try {
        const q = query(
            collection(db, 'applications'),
            where('workerId', '==', workerId),
            orderBy('appliedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return { success: true, applications };
    } catch (error) {
        console.error('[Applications] getWorkerApplications error:', error);
        return { success: false, error: 'Failed to load applications', applications: [] };
    }
}

// -----------------------------------------------------------
// GET APPLICATIONS FOR A JOB  (employer view)
// -----------------------------------------------------------
export async function getJobApplications(jobId) {
    try {
        console.log('[Applications] getJobApplications() — jobId:', jobId);
        const q = query(
            collection(db, 'applications'),
            where('jobId', '==', jobId),
            orderBy('appliedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[Applications] Found', applications.length, 'application(s)');
        return { success: true, applications };
    } catch (error) {
        console.error('[Applications] getJobApplications error:', error);
        return { success: false, error: error.message, applications: [] };
    }
}

// -----------------------------------------------------------
// ACCEPT APPLICATION  (employer action)
// Updates Firestore status → emails the worker.
// -----------------------------------------------------------
export async function acceptApplication(applicationId) {
    console.log('[Applications] acceptApplication() — id:', applicationId);
    try {
        // ── Fetch application ───────────────────────────────
        const appDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!appDoc.exists()) {
            return { success: false, error: 'Application not found' };
        }
        const appData = appDoc.data();
        console.log('[Applications] Application data — worker email:', appData.workerEmail);

        // ── Fetch job ───────────────────────────────────────
        let jobData = null;
        if (appData.jobId) {
            const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
            if (jobDoc.exists()) {
                jobData = jobDoc.data();
                console.log('[Applications] Job data fetched for accept:', jobData.title);
            } else {
                console.warn('[Applications] ⚠️ Job document not found for id:', appData.jobId);
            }
        }

        // ── Update status in Firestore ──────────────────────
        await updateDoc(doc(db, 'applications', applicationId), {
            status     : 'accepted',
            respondedAt: new Date().toISOString()
        });
        console.log('[Applications] ✅ Application status set to accepted in Firestore');

        // ── Send email to worker ────────────────────────────
        if (appData.workerEmail && jobData) {
            console.log('[Applications] 📧 Triggering worker acceptance email…');

            sendApplicationAcceptedEmail(
                appData.workerEmail,
                appData.workerName                                || 'Applicant',
                jobData.title,
                jobData.businessName || jobData.employerName      || 'Company',
                jobData.location                                  || 'Not specified',
                jobData.contactPerson                             || 'Employer',
                jobData.contactNumber                             || 'Not provided'
            ).then(result => {
                if (result.success) {
                    console.log('[Applications] ✅ Worker acceptance email delivered');
                } else {
                    console.warn('[Applications] ⚠️ Worker email failed (status still updated):', result.error);
                }
            }).catch(err => {
                console.error('[Applications] ❌ Worker email threw an error (non-critical):', err);
            });

        } else {
            console.warn(
                '[Applications] ⚠️ Skipping worker email —',
                !appData.workerEmail ? 'worker email missing' : 'job data missing'
            );
        }

        return { success: true, message: 'Application accepted!' };

    } catch (error) {
        console.error('[Applications] ❌ acceptApplication error:', error);
        return { success: false, error: 'Failed to accept application' };
    }
}

// -----------------------------------------------------------
// REJECT APPLICATION  (employer action)
// Updates Firestore status only — no email sent.
// Workers see the rejection status in their dashboard.
// -----------------------------------------------------------
export async function rejectApplication(applicationId, reason = '') {
    console.log('[Applications] rejectApplication() — id:', applicationId);
    try {
        await updateDoc(doc(db, 'applications', applicationId), {
            status         : 'rejected',
            respondedAt    : new Date().toISOString(),
            rejectionReason: reason || ''
        });
        console.log('[Applications] ✅ Application rejected in Firestore');
        // No email — only 2 templates available; worker checks dashboard.
        return { success: true, message: 'Application rejected' };
    } catch (error) {
        console.error('[Applications] ❌ rejectApplication error:', error);
        return { success: false, error: 'Failed to reject application' };
    }
}