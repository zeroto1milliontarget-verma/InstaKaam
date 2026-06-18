# Security Spec
1. Invariants:
   - User profile can only be updated by the user themself.
   - Job can only be created with the current user as customerId.
   - Jobs can be read by any authenticated user.
   - Job updates:
     - The customer who created it can update it anytime.
     - A worker can accept a job (update status to 'matched', set workerId) if the job is 'posted'.
     - A worker assigned to a job can update its status.
2. Dirty Dozen:
   - Spoofing user profile creation.
   - Creating job with someone else's customerId.
   - Updating someone else's job not as an assigned worker.
   - Appending large data to string fields.
   - Missing required fields on job creation.
   - Setting non-numeric budget.
   - Modifying createdAt.
   - Worker trying to change budget.
