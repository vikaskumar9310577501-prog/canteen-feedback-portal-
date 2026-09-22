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

const empBhiwadi = [
  { name: 'Vikas Sharma', id: '10482', lang: 'hi' },
  { name: 'Rahul Yadav', id: '10921', lang: 'en' },
  { name: 'Pooja Singh', id: '10766', lang: 'en' },
  { name: 'Deepak Kumar', id: '10634', lang: 'hi' },
  { name: 'Suresh Choudhary', id: '10355', lang: 'hi' },
  { name: 'Manoj Saini', id: '10214', lang: 'hi' },
  { name: 'Dharmendra Meena', id: '10988', lang: 'hi' },
  { name: 'Pankaj Kumar', id: '10332', lang: 'en' },
  { name: 'Rajendra Singh', id: '10190', lang: 'hi' },
  { name: 'Mohit Rawat', id: '10512', lang: 'hi' },
  { name: 'Harish Gurjar', id: '10844', lang: 'hi' },
  { name: 'Sanjay Prajapat', id: '10619', lang: 'hi' },
  { name: 'Hemant Gupta', id: '10745', lang: 'en' },
  { name: 'Rakesh Verma', id: '10266', lang: 'en' },
  { name: 'Ashok Kumar', id: '10433', lang: 'hi' },
  { name: 'Anurag Mishra', id: '10811', lang: 'hi' },
  { name: 'Kuldip Singh', id: '10944', lang: 'en' },
  { name: 'Neeraj Chauhan', id: '10167', lang: 'en' },
  { name: 'Satish Yadav', id: '10588', lang: 'hi' },
  { name: 'Sunil Kumar', id: '10419', lang: 'hi' },
  { name: 'Dinesh Gupta', id: '10882', lang: 'en' },
  { name: 'Rohit Saini', id: '10377', lang: 'en' },
  { name: 'Anand Chauhan', id: '10677', lang: 'en' },
  { name: 'Vinod Mehra', id: '10499', lang: 'hi' },
  { name: 'Jitendra Saini', id: '10722', lang: 'en' },
  { name: 'Mukesh Sharma', id: '10388', lang: 'hi' },
  { name: 'Pankaj Yadav', id: '10911', lang: 'hi' },
  { name: 'Ravi Chauhan', id: '10555', lang: 'en' },
  { name: 'Kailash Meena', id: '10688', lang: 'hi' },
  { name: 'Tarun Saxena', id: '10444', lang: 'en' },
];

const empSupa = [
  { name: 'Sachin Patil', id: '30114', lang: 'en' },
  { name: 'Amit Deshmukh', id: '30552', lang: 'hi' },
  { name: 'Ganesh Kadam', id: '30891', lang: 'en' },
  { name: 'Anil Jadhav', id: '30288', lang: 'en' },
  { name: 'Pradeep Shinde', id: '30441', lang: 'en' },
  { name: 'Kavita Bhosale', id: '30712', lang: 'en' },
  { name: 'Ramesh More', id: '30955', lang: 'en' },
  { name: 'Nitin Pawar', id: '30623', lang: 'en' },
  { name: 'Vijay Thoke', id: '30377', lang: 'en' },
  { name: 'Sunil Jagtap', id: '30188', lang: 'en' },
  { name: 'Kishor Gaikwad', id: '30599', lang: 'hi' },
  { name: 'Sandip Salunke', id: '30822', lang: 'en' },
  { name: 'Mahesh Wagh', id: '30245', lang: 'en' },
  { name: 'Pravin Kale', id: '30677', lang: 'hi' },
  { name: 'Tushar Nikam', id: '30912', lang: 'en' },
  { name: 'Rohan Tambe', id: '30319', lang: 'en' },
  { name: 'Nilesh Ghorpade', id: '30155', lang: 'en' },
  { name: 'Sambhaji Jagdale', id: '30611', lang: 'hi' },
  { name: 'Bharat Shinde', id: '30833', lang: 'en' },
  { name: 'Kiran Thorat', id: '30299', lang: 'en' },
  { name: 'Santosh Gite', id: '30412', lang: 'en' },
  { name: 'Somnath Borude', id: '30533', lang: 'en' },
  { name: 'Ashish Deshpande', id: '30211', lang: 'en' },
  { name: 'Nitin Bhangare', id: '30877', lang: 'en' },
  { name: 'Balasaheb Shinde', id: '30344', lang: 'hi' },
  { name: 'Avinash Raut', id: '30755', lang: 'en' },
  { name: 'Vikas Shelar', id: '30491', lang: 'en' },
];

const satisfiedRemarksHi = [
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

const satisfiedRemarksEn = [
  'Lunch food quality was good today. Dal tadka and rice taste great.',
  'Canteen dining hall and water dispenser area were very clean.',
  'Night shift dinner warm meal arranged on time. Good job.',
  'Festive lunch arrangement was excellent at the plant.',
  'Food was served hot on time. Staff is polite.',
  'Hygiene in the canteen was maintained very well.',
  'Quality of dinner is consistently good.',
  'Cleanliness and seating arrangements are top tier.'
];

const unsatisfiedRemarksHi = [
  'सब्जी में नमक बहुत ज्यादा था और रोटियां ठंडी थीं।',
  'दाल बहुत पतली थी और चावल ठीक से पके नहीं थे।',
  'स्टाफ का बर्ताव ठीक नहीं था, एक्स्ट्रा सब्जी मांगने पर मना किया।',
  'पानी का डिस्पेंसर गंदा था, सफाई पर ध्यान दें।',
  'खाने की क्वालिटी आज बिल्कुल अच्छी नहीं थी, तेल बहुत ज्यादा था।'
];

const unsatisfiedRemarksEn = [
  'Food quality was poor today. Chapatis were hard and cold.',
  'Dal was too watery and cold. Needs immediate improvement.',
  'Staff behavior was rude when asked for hot chapatis.',
  'Hygiene in food serving counter was unacceptable today.',
  'Dinner meal quantity was insufficient for night shift.'
];

// Working dates in August (excluding Sundays: 2,9,13,16,23,30 and Holidays: 15,16,27,28,29,30)
const activeDates = ['01', '03', '05', '07', '10', '12', '14', '17', '19', '21', '22', '24', '25', '26', '31'];

// Generate varied counts per plant per day (never flat, each plant gets 2 to 5 entries/day -> total 12 to 24 per day)
const allFeedbacks = [];
let serial = 1;

activeDates.forEach((day, dayIndex) => {
  plants.forEach((plant, plantIdx) => {
    // Dynamic count per plant per day between 2 and 5
    const baseCount = 2 + ((dayIndex * 3 + plantIdx * 7) % 4); // 2, 3, 4, 5
    const isSupa = plant.location === 'SUPA';
    const empPool = isSupa ? empSupa : empBhiwadi;

    for (let i = 0; i < baseCount; i++) {
      const emp = empPool[(serial + i * 3) % empPool.length];
      const isLunch = (i + dayIndex) % 2 === 0;
      const meal_type = isLunch ? 'Lunch' : 'Dinner';
      const shift = isLunch ? 'Day Shift' : 'Night Shift';

      // 18% chance of Unsatisfied feedback across both Supa and Bhiwadi plants
      const isUnsatisfied = (serial % 6 === 0) || (plantIdx === 2 && i === 0 && dayIndex % 2 === 0) || (plantIdx === 3 && i === 1 && dayIndex % 3 === 0);

      let food_taste, food_quality, hygiene, staff_behaviour, overall_rating, remark;

      if (isUnsatisfied) {
        food_taste = 2;
        food_quality = 2;
        hygiene = 2;
        staff_behaviour = (serial % 2 === 0) ? 2 : 3;
        overall_rating = Number(((food_taste + food_quality + hygiene + staff_behaviour) / 4).toFixed(1)); // <= 2.5
        remark = emp.lang === 'hi'
          ? unsatisfiedRemarksHi[(serial) % unsatisfiedRemarksHi.length]
          : unsatisfiedRemarksEn[(serial) % unsatisfiedRemarksEn.length];
      } else {
        const highRatings = [
          { t: 5, q: 5, h: 5, s: 5, r: 5.0 },
          { t: 5, q: 5, h: 4, s: 5, r: 4.8 },
          { t: 4, q: 5, h: 5, s: 4, r: 4.6 },
          { t: 4, q: 4, h: 5, s: 4, r: 4.4 },
          { t: 4, q: 4, h: 4, s: 4, r: 4.0 },
          { t: 5, q: 4, h: 4, s: 5, r: 4.5 },
          { t: 4, q: 4, h: 4, s: 3, r: 3.8 },
        ];
        const hr = highRatings[(serial + dayIndex) % highRatings.length];
        food_taste = hr.t;
        food_quality = hr.q;
        hygiene = hr.h;
        staff_behaviour = hr.s;
        overall_rating = hr.r;
        remark = emp.lang === 'hi'
          ? satisfiedRemarksHi[(serial) % satisfiedRemarksHi.length]
          : satisfiedRemarksEn[(serial) % satisfiedRemarksEn.length];
      }

      const hour = isLunch ? (7 + (i % 3)) : (14 + (i % 3));
      const minute = (serial * 17) % 60;
      const timeStr = `2026-08-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;

      allFeedbacks.push({
        id: `fb-202608${day}-${plant.code.toLowerCase()}-${String(serial).padStart(3, '0')}`,
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
        food_taste,
        food_quality,
        hygiene,
        staff_behaviour,
        overall_rating,
        remark,
        created_at: timeStr,
      });

      serial++;
    }
  });
});

console.log(`Generated ${allFeedbacks.length} feedbacks across all 5 plants!`);
const unsatisfiedCount = allFeedbacks.filter(f => f.overall_rating <= 2.5).length;
console.log(`Unsatisfied feedbacks count: ${unsatisfiedCount}`);

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
