// Google Sheet that holds the site content (the long ID in the sheet's URL:
// docs.google.com/spreadsheets/d/<SHEET_ID>/edit). The sheet must be shared as
// "Anyone with the link can view". Leave empty to use the sample data below.
const SHEET_ID = '1f0HjI4xGR5Fzta1V1wR586-URVJX8W0APeBmnUZqkLo';

// Separate sheet with herb buying prices (farmers page). Tab "ราคา": one row per
// herb x plot type x grade, columns in this order: date, item, plot type
// (ทั่วไป / GAP / Organic), grade (A/B/C), unit, price, show, status (TRUE = buying).
// Tab "ปก": key/value rows; the key starting with "อัปเดต" is the update date.
const HERB_SHEET_ID = '1A39S4t1_z1dGhEDE0SGXueMWPJZbL9cqO6CGROCvSwo';

// Sample data, used when SHEET_ID is empty or the sheet cannot be loaded.

const SITE = {
  phone: '093 584 7320',
  line: '@phanaphan',
  lineUrl: '#',
  email: 'contact@example.com',
  address: 'ศูนย์แพทย์แผนไทยพนา โรงพยาบาลพนา อ.พนา จ.อำนาจเจริญ',
  hours: 'จันทร์–ศุกร์ 08:30–16:30 น.',
  staffUrl: '#', // Google Drive folder shared with staff
  mapQuery: '15.690761941948466,104.83965918465745', // place name or coordinates
  // Google Maps > Share > Embed a map > copy the src="..." link
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.141819163234!2d104.8397021!3d15.690622499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31161280b35c8085%3A0xc1a27917679175f9!2z4Lio4Li54LiZ4Lii4LmM4LmB4Lie4LiX4Lii4LmM4LmB4Lic4LiZ4LmE4LiX4Lii4Lie4LiZ4Liy!5e0!3m2!1sth!2sth!4v1790598823602!5m2!1sth!2sth',
  mapUrl: 'https://maps.app.goo.gl/HVPosHJZ9CvTgshn6',
  herbsUpdated: '', // filled from the herb price sheet
  gradeB: 70,       // % of grade A price
  gradeC: 40,
  gapBonus: 10,     // % added for GAP-certified
  organicBonus: 20  // % added for organic
};

let PRODUCTS = [
  { id: "5012", name: "ยาหม่องพญายอ 10 กรัม", cat: "ขี้ผึ้ง", price: 20, unit: "10 g x 1 ขวด", icon: "🫙", color: "#FBF4D9", desc: '', use: '', warn: '' },
  { id: "5010", name: "ยาหม่องไพล 10 กรัม", cat: "ขี้ผึ้ง", price: 20, unit: "10 g x 1 ขวด", icon: "🫙", color: "#FBF4D9", desc: '', use: '', warn: '' },
  { id: "5053", name: "ครีมพญายอ 5 กรัม", cat: "ครีม", price: 25, unit: "5 g x 1 หลอด", icon: "🧴", color: "#EAF3EC", desc: '', use: '', warn: '' },
  { id: "5131", name: "ครีมไพล 30 กรัม", cat: "ครีม", price: 32, unit: "30 g x 1 หลอด", icon: "🧴", color: "#EAF3EC", featured: true, desc: '', use: '', warn: '' },
  { id: "4003", name: "ขมิ้นชัน 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 350, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4028", name: "ผสมเถาวัลย์เปรียง 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 350, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4005", name: "เถาวัลย์เปรียง 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 400, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4028-2", name: "ผสมเพชรสังฆาต 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 350, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4012", name: "ฟ้าทะลายโจร 400 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 350, unit: "400 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4903", name: "ฟ้าทะลายโจร 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 350, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", featured: true, desc: '', use: '', warn: '' },
  { id: "4905", name: "มะขามแขก 400 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 400, unit: "400 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4904", name: "มะขามแขก 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 400, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "6002", name: "ยาแก้ลมแก้เส้น 500 มิลลิกรัม 100 แคปซูล", cat: "แคปซูล", price: 267.50, unit: "500 mg x 100 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "6007", name: "ยาทำลายพระสุเมรุ 500 มิลลิกรัม 100 แคปซูล", cat: "แคปซูล", price: 188, unit: "500 mg x 100 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "6001", name: "ยาศุขไสยาศน์ 500 มิลลิกรัม 100 แคปซูล", cat: "แคปซูล", price: 209.72, unit: "500 mg x 100 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4069", name: "สหัสธารา 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 500, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "5054", name: "เจลพริก 30 กรัม", cat: "เจล", price: 35, unit: "30 g x 1 หลอด", icon: "🧴", color: "#FBEDE6", desc: '', use: '', warn: '' },
  { id: "4095", name: "ชาชงกระเจี๊ยบแดง 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4098", name: "ชาชงขิง 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4094", name: "ชาชงชุมเห็ดเทศ 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4099", name: "ชาชงตรีผลา 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4093", name: "ชาชงบำรุงน้ำนม 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4906", name: "ชาชงมะขามแขก 2 กรัม 5 ซอง", cat: "ชาชง", price: 35, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4092", name: "ชาชงรางจืด 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4096", name: "ชาชงหญ้าดอกขาว 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "4097", name: "ชาชงหญ้าหนวดแมว 2 กรัม 5 ซอง", cat: "ชาชง", price: 30, unit: "2 g x 5 ซอง", icon: "🍵", color: "#F4F1E1", desc: '', use: '', warn: '' },
  { id: "6003", name: "ยาริดสีดวงทวารหนักและโรคผิวหนัง 2 กรัม 15 ซอง", cat: "ผง", price: 350, unit: "2 g x 15 ซอง", icon: "🌿", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4085", name: "ยาหอมเทพจิตร อัดเม็ด 500 มิลลิกรัม 10 กรัม", cat: "เม็ด", price: 35, unit: "500 mg x 10 g", icon: "⚪", color: "#FBF1E1", desc: '', use: '', warn: '' },
  { id: "4084", name: "ยาหอมนวโกฐ อัดเม็ด 500 มิลลิกรัม 10 กรัม", cat: "เม็ด", price: 35, unit: "500 mg x 10 g", icon: "⚪", color: "#FBF1E1", desc: '', use: '', warn: '' },
  { id: "4086", name: "ยาหอมอินทจักร์ อัดเม็ด 500 มิลลิกรัม 10 กรัม", cat: "เม็ด", price: 35, unit: "500 mg x 10 g", icon: "⚪", color: "#FBF1E1", desc: '', use: '', warn: '' },
  { id: "4087", name: "ยาอมประสะมะแว้ง 200 มิลลิกรัม 5 กรัม", cat: "ลูกกลอน", price: 12, unit: "200 mg x 5 g", icon: "🟤", color: "#F3EEE4", desc: '', use: '', warn: '' },
  { id: "5130", name: "ลูกประคบสมุนไพร 200 กรัม 1 ลูก", cat: "ลูกประคบ", price: 60, unit: "200 g x 1 ลูก", icon: "🍃", color: "#F3EEE4", featured: true, desc: '', use: '', warn: '' },
  { id: "5048", name: "คาลาไมน์พญายอ 60 มิลลิลิตร", cat: "สารแขวนตะกอน", price: 25, unit: "60 mL x 1 ขวด", icon: "🧴", color: "#F3EEE4", desc: '', use: '', warn: '' },
  { id: "5049", name: "กลีเซอรีนพญายอ 10 มิลลิลิตร", cat: "สารละลาย", price: 40, unit: "10 mL x 1 ขวด", icon: "🧪", color: "#EEF2E8", desc: '', use: '', warn: '' },
  { id: "4089", name: "แก้ไอมะขามป้อม 120 มิลลิลิตร", cat: "สารละลาย", price: 25, unit: "120 mL x 1 ขวด", icon: "🧪", color: "#EEF2E8", desc: '', use: '', warn: '' },
  { id: "5004", name: "น้ำมันไพล 20 มิลลิลิตร", cat: "สารละลาย", price: 25, unit: "20 mL x 1 ขวด", icon: "🧪", color: "#EEF2E8", desc: '', use: '', warn: '' },
  { id: "5008", name: "พิมเสนน้ำ 5 มิลลิลิตร", cat: "สารละลาย", price: 25, unit: "5 mL x 1 ขวด", icon: "🧪", color: "#EEF2E8", desc: '', use: '', warn: '' },
  { id: "4088", name: "ยาธาตุอบเชย 120 มิลลิลิตร", cat: "สารละลาย", price: 18.50, unit: "120 mL x 1 ขวด", icon: "🧪", color: "#EEF2E8", desc: '', use: '', warn: '' },
  { id: "5001", name: "ชุดอบสมุนไพร 150 กรัม", cat: "แห้ง", price: 80, unit: "150 g x 1 ห่อ", icon: "🌿", color: "#EAF3EC", desc: '', use: '', warn: '' },
  { id: "4026", name: "จันทน์ลีลา 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 500, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4027", name: "ประสะไพล 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 650, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4050", name: "ปราบชมพูทวีป 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 600, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4053", name: "ธาตุบรรจบ 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 700, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' },
  { id: "4062", name: "ริดสีดวงมหากาฬ 500 มิลลิกรัม 500 แคปซูล", cat: "แคปซูล", price: 500, unit: "500 mg x 500 แคปซูล", icon: "💊", color: "#EEF5E6", desc: '', use: '', warn: '' }
];

let NEWS = [
  { id: 'n1', date: '28 ก.ย. 2569', tag: 'ประกาศ', title: 'ปรับราคาผลิตภัณฑ์บางรายการ มีผล 1 ต.ค. 2569',
    summary: 'แจ้งปรับราคาผลิตภัณฑ์บางรายการตามต้นทุนวัตถุดิบ',
    body: ['เนื่องจากต้นทุนวัตถุดิบสมุนไพรปรับตัวสูงขึ้น ทางโรงงานจึงขอปรับราคาผลิตภัณฑ์บางรายการ โดยมีผลตั้งแต่วันที่ 1 ตุลาคม 2569 เป็นต้นไป', 'สามารถตรวจสอบราคาล่าสุดได้ที่หน้าผลิตภัณฑ์ หรือสอบถามทาง LINE'] },
  { id: 'n2', date: '15 ก.ย. 2569', tag: 'ข่าวสาร', title: 'ผ่านการตรวจประเมินมาตรฐาน GMP ประจำปี 2569', image: 'assets/poster-phana.jpg', slide: true,
    summary: 'ยืนยันคุณภาพการผลิตทุกขั้นตอน ตั้งแต่วัตถุดิบถึงบรรจุภัณฑ์',
    body: ['โรงงานผลิตยาสมุนไพร ศูนย์แพทย์แผนไทยพนา ผ่านการตรวจประเมินมาตรฐานหลักเกณฑ์วิธีการที่ดีในการผลิต (GMP) ประจำปี 2569', 'ขอขอบคุณทีมงานทุกฝ่ายที่ร่วมกันรักษามาตรฐานการผลิตให้ปลอดภัยและมีคุณภาพ'] },
  { id: 'n3', date: '8 ก.ย. 2569', tag: 'งานวิจัย', title: 'ทีมผู้เชี่ยวชาญและวิจัยพัฒนา', image: 'assets/poster-team.jpg', imagePos: 'center 85%', slide: true,
    summary: 'ตรวจสอบความปลอดภัยของตำรับยาโบราณด้วยหลักวิทยาศาสตร์',
    body: ['ทีมผู้เชี่ยวชาญและวิจัยพัฒนาของศูนย์ฯ ทำงานร่วมกับหมอพื้นบ้านในชุมชน เพื่อตรวจสอบความปลอดภัยของตำรับยาโบราณก่อนนำมาผลิตจริง'] },
  { id: 'n4', date: '2 ก.ย. 2569', tag: 'ชุมชน', title: 'เปิดรับซื้อสมุนไพรจากเกษตรกรในชุมชน', slide: true,
    summary: 'สร้างรายได้และความยั่งยืนให้ชุมชนพนา ติดต่อได้ที่ศูนย์ฯ',
    body: ['ศูนย์ฯ เปิดรับซื้อสมุนไพรคุณภาพจากเกษตรกรในพื้นที่ อำเภอพนาและใกล้เคียง เช่น ฟ้าทะลายโจร ขมิ้นชัน ไพล', 'เกษตรกรที่สนใจติดต่อสอบถามรายละเอียดได้ที่ศูนย์แพทย์แผนไทยพนา ในวันและเวลาราชการ'] }
];

let ARTICLES = [
  { id: 'k1', tag: 'สมุนไพรใกล้ตัว', title: 'ฟ้าทะลายโจร ใช้อย่างไรให้ปลอดภัย', icon: '🌿', read: 3,
    summary: 'รู้จักขนาดที่เหมาะสม ช่วงเวลาที่ควรใช้ และข้อห้ามที่ควรระวัง',
    body: ['ฟ้าทะลายโจรเป็นสมุนไพรที่ใช้บรรเทาอาการเจ็บคอและไข้หวัด ควรเริ่มใช้เมื่อมีอาการในระยะแรก', 'ข้อควรระวัง: ไม่ควรใช้ในหญิงตั้งครรภ์และให้นมบุตร และหากใช้แล้ว 3 วันอาการไม่ดีขึ้นควรพบแพทย์'] },
  { id: 'k2', tag: 'ภูมิปัญญา', title: 'ตำรับยาโบราณ กับการตรวจสอบความปลอดภัย', icon: '📜', read: 5,
    summary: 'จากใบลานสู่ห้องปฏิบัติการ เส้นทางของตำรับยาพื้นบ้าน',
    body: ['ตำรับยาพื้นบ้านจำนวนมากถูกบันทึกไว้ในใบลาน ก่อนนำมาผลิตจริงต้องผ่านการตรวจสอบความปลอดภัยและการควบคุมคุณภาพ'] },
  { id: 'k3', tag: 'ดูแลสุขภาพ', title: 'ลูกประคบ ใช้แบบไหนได้ผลดีที่สุด', icon: '🍃', read: 4,
    summary: 'วิธีนึ่ง วิธีประคบ และข้อห้ามที่หลายคนไม่รู้',
    body: ['นึ่งลูกประคบประมาณ 15–20 นาที ทดสอบความร้อนที่ท้องแขนก่อนประคบทุกครั้ง', 'ไม่ควรประคบบริเวณที่อักเสบบวมแดงภายใน 24 ชั่วโมงแรก'] },
  { id: 'k4', tag: 'สมุนไพรใกล้ตัว', title: 'ขมิ้นชัน สมุนไพรคู่ครัวไทย', icon: '🫚', read: 3,
    summary: 'ประโยชน์ของขมิ้นชันต่อระบบทางเดินอาหาร',
    body: ['ขมิ้นชันช่วยบรรเทาอาการท้องอืด ท้องเฟ้อ และอาหารไม่ย่อย', 'ผู้ที่มีภาวะท่อน้ำดีอุดตันไม่ควรใช้'] }
];

let HISTORY = [
  { year: '2536', text: 'เริ่มต้นโครงการพนา (PHANA PROJECT) ร่วมกับหมอพื้นบ้านในอำเภอพนา' },
  { year: '25XX', text: 'จัดตั้งศูนย์แพทย์แผนไทยพนา ในโรงพยาบาลพนา' },
  { year: '25XX', text: 'เปิดโรงงานผลิตยาสมุนไพร และได้รับมาตรฐาน GMP' },
  { year: '2569', text: 'ผ่านการตรวจประเมินมาตรฐาน GMP ประจำปี' }
];

// Herb buying prices, filled from HERB_SHEET_ID (no built-in copy, so stale
// prices are never shown).
let HERB_PRICES = [];

