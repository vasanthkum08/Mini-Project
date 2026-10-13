const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = 'C:\\Users\\rpjee\\Downloads\\emergenix_real_screenshots';

(async () => {
  console.log('Launching browser with API interceptors...');
  const browser = await chromium.launch({ headless: true });

  // 1. Login Page Screenshot
  const pageLogin = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await pageLogin.goto('http://127.0.0.1:4173/login', { waitUntil: 'networkidle' });
  await pageLogin.waitForTimeout(1000);
  await pageLogin.screenshot({ path: path.join(outDir, 'real_login.png'), fullPage: true });
  console.log('Saved real_login.png');

  // 2. Patient Dashboard Screenshot
  const pagePatient = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await pagePatient.addInitScript(() => {
    localStorage.setItem('token', 'demo-patient-token');
  });

  await pagePatient.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          name: 'VASANTHKUMAR R P',
          email: 'vasanth@emergency.com',
          mobile: '6381176003',
          role: 'patient'
        }
      })
    });
  });

  await pagePatient.route('**/api/hospitals*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          hospitals: [
            {
              id: 1,
              name: 'Metro Care Hospital',
              city: 'Madurai',
              address: '74 Ring Road, Central District',
              latitude: 9.9252,
              longitude: 78.1198,
              available_doctors: 15,
              available_icu_beds: 12,
              available_general_beds: 38,
              emergency_beds: 50,
              er_wait_minutes: 2,
              rating: 4.9,
              distance_km: 1.8,
              eta_minutes: 4,
              recommendation_score: 98,
              phone: '0452-2531000'
            },
            {
              id: 2,
              name: 'Apex Healthcare Center',
              city: 'Madurai',
              address: '12 North Bypass Road',
              latitude: 9.9320,
              longitude: 78.1250,
              available_doctors: 10,
              available_icu_beds: 8,
              available_general_beds: 24,
              emergency_beds: 30,
              er_wait_minutes: 5,
              rating: 4.7,
              distance_km: 3.2,
              eta_minutes: 8,
              recommendation_score: 92,
              phone: '0452-2542000'
            }
          ],
          recommendation_reason: 'Metro Care Hospital recommended based on 12 available ICU beds and 4 mins ETA.'
        }
      })
    });
  });

  await pagePatient.goto('http://127.0.0.1:4173/patient-dashboard', { waitUntil: 'networkidle' });
  await pagePatient.waitForTimeout(1500);
  await pagePatient.screenshot({ path: path.join(outDir, 'real_patient.png'), fullPage: true });
  console.log('Saved real_patient.png');

  // 3. Responder Dashboard Screenshot
  const pageResponder = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await pageResponder.addInitScript(() => {
    localStorage.setItem('token', 'demo-responder-token');
  });

  await pageResponder.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 2,
          name: 'Driver Ramesh (Ambulance Unit #08)',
          email: 'responder@emergency.com',
          mobile: '9876543210',
          role: 'responder'
        }
      })
    });
  });

  await pageResponder.goto('http://127.0.0.1:4173/responder-dashboard', { waitUntil: 'networkidle' });
  await pageResponder.waitForTimeout(1500);
  await pageResponder.screenshot({ path: path.join(outDir, 'real_responder.png'), fullPage: true });
  console.log('Saved real_responder.png');

  // 4. Admin Dashboard Screenshot
  const pageAdmin = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await pageAdmin.addInitScript(() => {
    localStorage.setItem('token', 'demo-admin-token');
  });

  await pageAdmin.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 3,
          name: 'Dr. A. ASKARUNISA (Admin)',
          email: 'admin1@emergency.com',
          mobile: '910623104107',
          role: 'admin',
          hospital_id: 1
        }
      })
    });
  });

  await pageAdmin.goto('http://127.0.0.1:4173/admin-dashboard', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1500);
  await pageAdmin.screenshot({ path: path.join(outDir, 'real_admin.png'), fullPage: true });
  console.log('Saved real_admin.png');

  await browser.close();
  console.log('ALL REAL RENDERED DASHBOARD SCREENSHOTS CAPTURED SUCCESSFULLY!');
})();
