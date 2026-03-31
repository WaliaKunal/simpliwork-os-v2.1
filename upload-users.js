const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

const serviceAccount = require('./serviceAccountKey.json');

const CSV_FILE_PATH = './Employee Details.csv';
const COLLECTION_NAME = 'users';

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const results = [];

console.log(`Reading CSV file from: ${CSV_FILE_PATH}`);

fs.createReadStream(CSV_FILE_PATH)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`CSV processed. Found ${results.length} records.`);

    for (const record of results) {
      const rawEmail = record.email;
      if (!rawEmail) {
        console.warn('[SKIPPED] Missing email:', record);
        continue;
      }

      const email = rawEmail.trim().toLowerCase();
      const displayName = (record.full_name || '').trim();

      const rawRole = (record.role || '').trim().toUpperCase();
      let role = 'sales';
      if (rawRole === 'ADMIN' || rawRole === 'MANAGEMENT') role = 'management';
      else if (rawRole === 'DESIGN') role = 'design';
      else if (rawRole === 'SALES') role = 'sales';

      const rawStatus = (record.active_status || '').trim().toUpperCase();
      const active_status = rawStatus === 'ACTIVE' || rawStatus === 'TRUE';

      try {
        await db.collection(COLLECTION_NAME).doc(email).set({
          email,
          displayName,
          role,
          active_status
        });
        console.log(`[SUCCESS] Uploaded user: ${email} (${role})`);
      } catch (error) {
        console.error(`[FAILURE] Failed to upload user: ${email}`, error);
      }
    }

    console.log('Upload finished.');
    process.exit(0);
  })
  .on('error', (error) => {
    console.error('Error reading CSV file:', error);
    process.exit(1);
  });