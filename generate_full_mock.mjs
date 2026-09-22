import fs from 'fs';
import path from 'path';

const plants = [
  { 
    id: 'plant-1', 
    name: 'PG TECHNOPLAST', 
    code: '2040', 
    location: 'BHIWADI', 
    display_name: 'BHIWADI — PGTL (2040)', 
    is_active: true,
    notification_email: 'canteen.pgtl@pgel.in'
  },
  { 
    id: 'plant-2', 
    name: 'NEXT GENERATION MANUFACTURING', 
    code: '4020', 
    location: 'BHIWADI', 
    display_name: 'BHIWADI — NGM (4020)', 
    is_active: true,
    notification_email: 'canteen.ngm@pgel.in'
  },
  { 
    id: 'plant-3', 
    name: 'PG ELECTROPLAST LTD', 
    code: 'PGEL', 
    location: 'SUPA', 
    display_name: 'SUPA — PGEL (Unit-I)', 
    is_active: true,
    notification_email: 'canteen.supa.pgel@pgel.in'
  },
  { 
    id: 'plant-4', 
    name: 'PG TECHNOPLAST', 
    code: 'PGTL', 
    location: 'SUPA', 
    display_name: 'SUPA — PGTL (Unit-II)', 
    is_active: true,
    notification_email: 'canteen.supa.pgtl@pgel.in'
  },
  { 
    id: 'plant-5', 
    name: 'NEXT GENERATION MANUFACTURING', 
    code: 'NGM', 
    location: 'SUPA', 
    display_name: 'SUPA — NGM (Unit-III)', 
    is_active: true,
    notification_email: 'canteen.supa.ngm@pgel.in'
  },
];

const employeeList = [
  { name: 'Vikas Sharma', id: '10482', plantIdx: 0, lang: 'hi' },
  { name: 'Rahul Yadav', id: '10921', plantIdx: 1, lang: 'en' },
  { name: 'Sachin Patil', id: '30114', plantIdx: 2, lang: 'en' },
  { name: 'Amit Deshmukh', id: '30552', plantIdx: 3, lang: 'hi' },
  { name: 'Ganesh Kadam', id: '30891', plantIdx: 4, lang: 'en' },
  { name: 'Pooja Singh', id: '10766', plantIdx: 0, lang: 'en' },
  { name: 'Deepak Kumar', id: '10634', plantIdx: 1, lang: 'hi' },
  { name: 'Anil Jadhav', id: '30288', plantIdx: 2, lang: 'en' },
  { name: 'Suresh Choudhary', id: '10355', plantIdx: 0, lang: 'hi' },
  { name: 'Manoj Saini', id: '10214', plantIdx: 0, lang: 'hi' },
  { name: 'Pradeep Shinde', id: '30441', plantIdx: 3, lang: 'en' },
  { name: 'Dharmendra Meena', id: '10988', plantIdx: 1, lang: 'hi' },
  { name: 'Kavita Bhosale', id: '30712', plantIdx: 2, lang: 'en' },
  { name: 'Pankaj Kumar', id: '10332', plantIdx: 0, lang: 'en' },
  { name: 'Ramesh More', id: '30955', plantIdx: 4, lang: 'en' },
  { name: 'Rajendra Singh', id: '10190', plantIdx: 1, lang: 'hi' },
  { name: 'Nitin Pawar', id: '30623', plantIdx: 3, lang: 'en' },
  { name: 'Mohit Rawat', id: '10512', plantIdx: 0, lang: 'hi' },
  { name: 'Vijay Thoke', id: '30377', plantIdx: 2, lang: 'en' },
  { name: 'Harish Gurjar', id: '10844', plantIdx: 1, lang: 'hi' },
  { name: 'Sanjay Prajapat', id: '10619', plantIdx: 0, lang: 'hi' },
  { name: 'Sunil Jagtap', id: '30188', plantIdx: 2, lang: 'en' },
  { name: 'Hemant Gupta', id: '10745', plantIdx: 1, lang: 'en' },
  { name: 'Kishor Gaikwad', id: '30599', plantIdx: 3, lang: 'hi' },
  { name: 'Rakesh Verma', id: '10266', plantIdx: 0, lang: 'en' },
  { name: 'Sandip Salunke', id: '30822', plantIdx: 4, lang: 'en' },
  { name: 'Ashok Kumar', id: '10433', plantIdx: 1, lang: 'hi' },
  { name: 'Anurag Mishra', id: '10811', plantIdx: 0, lang: 'hi' },
  { name: 'Mahesh Wagh', id: '30245', plantIdx: 2, lang: 'en' },
  { name: 'Kuldip Singh', id: '10944', plantIdx: 1, lang: 'en' },
  { name: 'Pravin Kale', id: '30677', plantIdx: 3, lang: 'hi' },
  { name: 'Neeraj Chauhan', id: '10167', plantIdx: 0, lang: 'en' },
  { name: 'Tushar Nikam', id: '30912', plantIdx: 4, lang: 'en' },
  { name: 'Satish Yadav', id: '10588', plantIdx: 1, lang: 'hi' },
  { name: 'Rohan Tambe', id: '30319', plantIdx: 2, lang: 'en' },
  { name: 'Sunil Kumar', id: '10419', plantIdx: 0, lang: 'hi' },
  { name: 'Nilesh Ghorpade', id: '30155', plantIdx: 2, lang: 'en' },
  { name: 'Dinesh Gupta', id: '10882', plantIdx: 1, lang: 'en' },
  { name: 'Sambhaji Jagdale', id: '30611', plantIdx: 3, lang: 'hi' },
  { name: 'Rohit Saini', id: '10377', plantIdx: 0, lang: 'en' },
  { name: 'Bharat Shinde', id: '30833', plantIdx: 4, lang: 'en' },
  { name: 'Kiran Thorat', id: '30299', plantIdx: 2, lang: 'en' },
  { name: 'Anand Chauhan', id: '10677', plantIdx: 1, lang: 'en' },
  { name: 'Vinod Mehra', id: '10499', plantIdx: 0, lang: 'hi' },
  { name: 'Santosh Gite', id: '30412', plantIdx: 2, lang: 'en' },
  { name: 'Jitendra Saini', id: '10722', plantIdx: 1, lang: 'en' },
  { name: 'Mukesh Sharma', id: '10388', plantIdx: 0, lang: 'hi' },
  { name: 'Somnath Borude', id: '30533', plantIdx: 3, lang: 'en' },
  { name: 'Pankaj Yadav', id: '10911', plantIdx: 1, lang: 'hi' },
  { name: 'Ashish Deshpande', id: '30211', plantIdx: 2, lang: 'en' },
  { name: 'Ravi Chauhan', id: '10555', plantIdx: 0, lang: 'en' },
  { name: 'Kailash Meena', id: '10688', plantIdx: 1, lang: 'hi' },
  { name: 'Nitin Bhangare', id: '30877', plantIdx: 4, lang: 'en' },
  { name: 'Tarun Saxena', id: '10444', plantIdx: 0, lang: 'en' },
  { name: 'Balasaheb Shinde', id: '30344', plantIdx: 2, lang: 'hi' }
];

const remarksHi = [
  'आज लंच में पनीर की सब्जी और ताज़ा गरम रोटियां बहुत अच्छी थीं।',
  'दाल फ्राई और जीरा राइस का स्वाद बहुत बढ़िया था।',
  'स्टाफ का बर्ताव बहुत अच्छा था और खाना समय पर मिला।',
  'साफ-सफाई और खाना दोनों बहुत अच्छे रहे।',
  'राजमा चावल का स्वाद लाजवाब था।',
  'चपाती एकदम गरम और फ्रेश मिली।',
  'कढ़ी पकौड़ा और चावल बहुत टेस्टी थे।',
  'डिनर टाइम पर मिला और क्वालिटी भी बढ़िया थी।',
  'मिक्स वेज सब्जी और दाल बहुत टेस्टी थी।'
];

const remarksEn = [
  'Lunch food quality was good today. Dal tadka and rice taste great.',
  'Canteen dining hall and water dispenser area were very clean.',
  'Night shift dinner warm meal arranged on time. Good job.',
  'Festive lunch arrangement was excellent at the plant.',
  'Food was served hot on time. Staff is polite.',
  'Hygiene in the canteen was maintained very well.',
  'Quality of dinner is consistently good.',
  'Cleanliness and seating arrangements are top tier.'
];

// Schedule of August 2026 dates (excluding Sundays: 2,9,13,16,23,30 and Holidays: 15,16,27,28,29,30)
const dailyCounts = [
  { day: '01', count: 5 },
  { day: '03', count: 9 },
  { day: '05', count: 11 },
  { day: '07', count: 7 },
  { day: '10', count: 12 },
  { day: '12', count: 8 },
  { day: '14', count: 10 },
  { day: '17', count: 13 },
  { day: '19', count: 9 },
  { day: '21', count: 16 },
  { day: '22', count: 6 },
  { day: '24', count: 15 },
  { day: '25', count: 11 },
  { day: '26', count: 18 },
  { day: '31', count: 14 },
];

const allFeedbacks = [];
let empCursor = 0;

dailyCounts.forEach(({ day, count }) => {
  for (let i = 0; i < count; i++) {
    const emp = employeeList[empCursor % employeeList.length];
    empCursor++;
    const plant = plants[emp.plantIdx];
    const isLunch = i < Math.ceil(count * 0.65);
    const meal_type = isLunch ? 'Lunch' : 'Dinner';
    const shift = isLunch ? 'Day Shift' : 'Night Shift';
    
    // Vary ratings between 3.6 and 5.0
    const ratingVariants = [
      { t: 5, q: 5, h: 5, s: 5, r: 5.0 },
      { t: 5, q: 5, h: 4, s: 5, r: 4.8 },
      { t: 4, q: 5, h: 5, s: 4, r: 4.6 },
      { t: 4, q: 4, h: 5, s: 4, r: 4.4 },
      { t: 4, q: 4, h: 4, s: 4, r: 4.2 },
      { t: 4, q: 4, h: 4, s: 4, r: 4.0 },
      { t: 5, q: 4, h: 4, s: 4, r: 4.2 },
      { t: 3, q: 4, h: 4, s: 4, r: 3.8 },
    ];
    const rv = ratingVariants[(i + parseInt(day)) % ratingVariants.length];

    const hour = isLunch ? (7 + (i % 3)) : (14 + (i % 3));
    const minute = (i * 13) % 60;
    const timeStr = `2026-08-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;

    const remark = emp.lang === 'hi'
      ? remarksHi[(i + parseInt(day)) % remarksHi.length]
      : remarksEn[(i + parseInt(day)) % remarksEn.length];

    allFeedbacks.push({
      id: `fb-202608${day}-${String(i + 1).padStart(2, '0')}`,
      language: emp.lang,
      employee_name: emp.name,
      employee_id: emp.id,
      plant_id: plant.id,
      plant_name: plant.name,
      plant_code: plant.code,
      plant_location: plant.location,
      plant_display_name: plant.display_name,
      meal_type,
      shift,
      food_taste: rv.t,
      food_quality: rv.q,
      hygiene: rv.h,
      staff_behaviour: rv.s,
      overall_rating: rv.r,
      remark,
      created_at: timeStr,
    });
  }
});

console.log(`Generated ${allFeedbacks.length} feedbacks across ${dailyCounts.length} active working days!`);

const mockDataCode = `import { Plant, FeedbackEntry, SystemSettings, AdminProfile } from '../types/database';

export const INITIAL_PLANTS: Plant[] = ${JSON.stringify(plants, null, 2)};

export const INITIAL_SETTINGS: SystemSettings = {
  company_name: 'PG Electroplast Ltd',
  company_logo_url: '/pg-logo.png',
  enable_english: true,
  enable_hindi: true,
  meal_types: ['Lunch', 'Dinner'],
  shifts: [
    'Day Shift (06:00 AM - 06:00 PM)',
    'Night Shift (06:00 PM - 06:00 AM)'
  ],
  theme_mode: 'light',
  notification_email: 'verify.software2040@pgel.in',
  enable_email_alerts: true,
  daily_digest: {
    enabled: true,
    to_emails: ['software.2040@pgel.in'],
    cc_emails: ['verify.software2040@pgel.in'],
    scheduled_time: '20:00',
    unsatisfied_threshold_alert: 20,
  },
};

export const DEMO_ADMINS: AdminProfile[] = [
  {
    id: 'admin-it-1',
    email: 'software.2040@pgel.in',
    full_name: 'IT Admin',
    role: 'super_admin',
  },
];

export const INITIAL_FEEDBACKS: FeedbackEntry[] = ${JSON.stringify(allFeedbacks, null, 2)};
`;

fs.writeFileSync(path.resolve('src/lib/mockData.ts'), mockDataCode);
console.log('Saved src/lib/mockData.ts successfully!');
