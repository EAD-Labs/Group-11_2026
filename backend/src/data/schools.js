// Mirrors the SCHOOLS list in ../../../src/schoolsData.js (frontend dropdown
// dataset). Kept as a plain list here (no student data needed server-side)
// so registration can validate the submitted schoolName server-side too,
// not just trust the frontend dropdown.
const SCHOOLS = [
  "ADW PS Sriramapalayam",
  "ADWMS Nandhivaram",
  "CMS NS Garden",
  "CMS Thiruvalluvarpet",
  "CPS Canal Bank Road",
  "CPS Odaikuppam",
  "CPS Shastrinagar",
  "Olcott Memorial HSS",
  "PUMS Ramancheri",
  "PUPS Ammambakkam",
];

module.exports = { SCHOOLS };
