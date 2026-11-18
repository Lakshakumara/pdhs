// src/environments/environment.development.ts
// Active during `ng serve` (and `ng build --configuration development`)
// via the fileReplacement configured in angular.json.

/** Seeded dev/test personas for the Dev Quick Login panel. */
export interface DevPersona {
  username: string;
  fullName: string;
  role: string;
}

export const environment = {
  production: false,
  // LAN address so browsers on other machines reach THIS machine's API
  // (localhost would resolve to the visitor's own computer).
  apiUrl: 'http://localhost:3000/api',
  
  /** Shared password for ALL seeded dev accounts (scripts/seed-data.ts). */
  devPassword: 'pdhs@123',
  devPersonas: [
    { username: 'admin', fullName: 'System Admin', role: 'SUPER_ADMIN_PDHS' },
    {
      username: 'super_admin',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN_PDHS',
    },
    {
      username: 'pdhs_director',
      fullName: 'PDHS Director',
      role: 'ADMIN_PDHS',
    },
    { username: 'rdhs_rat', fullName: 'RDHS Ratnapura', role: 'ADMIN_RDHS' },
    { username: 'rdhs_keg', fullName: 'RDHS Kegalle', role: 'ADMIN_RDHS' },
    { username: 'tech_nuwan', fullName: 'Tech Nuwan', role: 'BIOMEDICAL_TECHNICIAN' },
    { username: 'store_keeper', fullName: 'Store Keeper', role: 'STORE_KEEPER' },
    {
      username: 'proc_sajith',
      fullName: 'Procurement Sajith',
      role: 'PROCUREMENT_OFFICER',
    },
    { username: 'bh_rat_user', fullName: 'BH Ratnapura User', role: 'INSTITUTION_USER' },
    { username: 'dh_bal_user', fullName: 'Balangoda BH User', role: 'INSTITUTION_USER' },
    // ── Base Hospital review accounts (8 BHs × admin + user) ──
    { username: 'balangoda_admin', fullName: 'Balangoda BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'balangoda_user', fullName: 'Balangoda BH User', role: 'INSTITUTION_USER' },
    { username: 'kahawatta_admin', fullName: 'Kahawatta BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'kahawatta_user', fullName: 'Kahawatta BH User', role: 'INSTITUTION_USER' },
    { username: 'kalawana_admin', fullName: 'Kalawana BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'kalawana_user', fullName: 'Kalawana BH User', role: 'INSTITUTION_USER' },
    { username: 'eheliyagoda_admin', fullName: 'Eheliyagoda BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'eheliyagoda_user', fullName: 'Eheliyagoda BH User', role: 'INSTITUTION_USER' },
    { username: 'kolonna_admin', fullName: 'Kolonna BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'kolonna_user', fullName: 'Kolonna BH User', role: 'INSTITUTION_USER' },
    { username: 'mawanalla_admin', fullName: 'Mawanalla BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'mawanalla_user', fullName: 'Mawanalla BH User', role: 'INSTITUTION_USER' },
    { username: 'warakapola_admin', fullName: 'Warakapola BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'warakapola_user', fullName: 'Warakapola BH User', role: 'INSTITUTION_USER' },
    { username: 'karawanella_admin', fullName: 'Karawanella BH Admin', role: 'ADMIN_INSTITUTE' },
    { username: 'karawanella_user', fullName: 'Karawanella BH User', role: 'INSTITUTION_USER' },
  ] satisfies DevPersona[],
};
