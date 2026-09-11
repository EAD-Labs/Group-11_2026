// Dummy dataset used for the "Create account" school dropdown and the
// "Add student" dropdown. School names are drawn from real Asha-network
// naming conventions (govt/corporation primary & middle schools in Chennai)
// for realism; student names and class levels are invented placeholders.
//
// Shape:
//   SCHOOLS: string[]                      -> options for the signup dropdown
//   STUDENTS_BY_SCHOOL: { [school]: { name: string, classLevel: number }[] }

export const STUDENTS_BY_SCHOOL = {
  "ADW PS Sriramapalayam": [
    { name: "Kavya M.", classLevel: 2 },
    { name: "Arun Prasath", classLevel: 3 },
    { name: "Divya R.", classLevel: 1 },
    { name: "Mohammed Rafi", classLevel: 4 },
    { name: "Sowmiya K.", classLevel: 2 },
    { name: "Vignesh S.", classLevel: 5 },
  ],
  "ADWMS Nandhivaram": [
    { name: "Priya Dharshini", classLevel: 6 },
    { name: "Karthik V.", classLevel: 7 },
    { name: "Lakshmi Narayanan", classLevel: 5 },
    { name: "Fathima Beevi", classLevel: 6 },
    { name: "Suresh Kumar", classLevel: 8 },
    { name: "Anitha S.", classLevel: 7 },
  ],
  "CMS NS Garden": [
    { name: "Bala Murugan", classLevel: 3 },
    { name: "Yazhini P.", classLevel: 2 },
    { name: "Dinesh Kumar", classLevel: 4 },
    { name: "Keerthana R.", classLevel: 3 },
    { name: "Ravi Shankar", classLevel: 5 },
    { name: "Nandhini V.", classLevel: 1 },
    { name: "Ajay S.", classLevel: 4 },
  ],
  "CMS Thiruvalluvarpet": [
    { name: "Saranya M.", classLevel: 4 },
    { name: "Vetri Selvan", classLevel: 5 },
    { name: "Abinaya K.", classLevel: 3 },
    { name: "Naveen Raj", classLevel: 6 },
    { name: "Pooja Sri", classLevel: 2 },
  ],
  "CPS Canal Bank Road": [
    { name: "Iniya R.", classLevel: 1 },
    { name: "Gokul S.", classLevel: 2 },
    { name: "Meena Kumari", classLevel: 3 },
    { name: "Sathish Kumar", classLevel: 1 },
  ],
  "CPS Odaikuppam": [
    { name: "Deepika M.", classLevel: 5 },
    { name: "Yuvaraj T.", classLevel: 6 },
    { name: "Harini S.", classLevel: 4 },
    { name: "Prabhu Deva", classLevel: 5 },
    { name: "Swathi R.", classLevel: 3 },
    { name: "Manoj Kumar", classLevel: 7 },
  ],
  "CPS Shastrinagar": [
    { name: "Kaviya S.", classLevel: 2 },
    { name: "Rahul Dev", classLevel: 3 },
    { name: "Janani K.", classLevel: 4 },
    { name: "Aravind M.", classLevel: 2 },
    { name: "Thenmozhi R.", classLevel: 5 },
  ],
  "Olcott Memorial HSS": [
    { name: "Sneha Priya", classLevel: 6 },
    { name: "Vijay Anand", classLevel: 7 },
    { name: "Roshini K.", classLevel: 8 },
    { name: "Ashwin Raj", classLevel: 6 },
    { name: "Deepa Lakshmi", classLevel: 5 },
    { name: "Karthikeyan S.", classLevel: 8 },
  ],
  "PUMS Ramancheri": [
    { name: "Malathi V.", classLevel: 5 },
    { name: "Senthil Kumar", classLevel: 7 },
    { name: "Uma Maheswari", classLevel: 6 },
    { name: "Baskar R.", classLevel: 8 },
  ],
  "PUPS Ammambakkam": [
    { name: "Charumathi S.", classLevel: 1 },
    { name: "Elango P.", classLevel: 3 },
    { name: "Farzana Begum", classLevel: 2 },
    { name: "Ganesh Moorthy", classLevel: 4 },
    { name: "Hemavathi R.", classLevel: 2 },
  ],
};

export const SCHOOLS = Object.keys(STUDENTS_BY_SCHOOL);
