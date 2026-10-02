// Google Sheet that holds the site content (the long ID in the sheet's URL:
// docs.google.com/spreadsheets/d/<SHEET_ID>/edit). The sheet must be shared as
// "Anyone with the link can view". Leave empty to use the sample data below.
const SHEET_ID = '1f0HjI4xGR5Fzta1V1wR586-URVJX8W0APeBmnUZqkLo';

// Separate sheet with herb buying prices (farmers page). Tab "ราคา": one row per
// herb x plot type x grade, columns in this order: date, item, plot type
// (ทั่วไป / GAP / Organic), grade (A/B/C), unit, price, show, status (TRUE = buying).
// Tab "ปก": key/value rows; the key starting with "อัปเดต" is the update date.
const HERB_SHEET_ID = '1A39S4t1_z1dGhEDE0SGXueMWPJZbL9cqO6CGROCvSwo';

// Drug list (products page). Tab "ยา": one row per item, columns matched by their
// header names (show, status, unit, featured, ลำดับ, เลข, ... การเก็บ).
// Tab "ปก": key/value rows (update date, fiscal year).
const DRUG_SHEET_ID = '1C8DXaaqIp2hbLfUp7nBe8LyLfGKB-5lA8vRTbaeeKX0';

// Sample data, used when SHEET_ID is empty or the sheet cannot be loaded.

const SITE = {
  phone: '093 584 7320',
  line: '@phanaphan',
  lineUrl: '#',
  email: 'contact@example.com',
  address: 'ศูนย์แพทย์แผนไทยพนา โรงพยาบาลพนา อ.พนา จ.อำนาจเจริญ',
  hours: 'จันทร์–ศุกร์ 08:30–16:30 น.',
  website: 'https://www.panthaiphana.org', // footer link; '-' = hidden
  staffUrl: '#', // Google Drive folder shared with staff
  mapQuery: '15.690761941948466,104.83965918465745', // place name or coordinates
  // Google Maps > Share > Embed a map > copy the src="..." link
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.141819163234!2d104.8397021!3d15.690622499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31161280b35c8085%3A0xc1a27917679175f9!2z4Lio4Li54LiZ4Lii4LmM4LmB4Lie4LiX4Lii4LmM4LmB4Lic4LiZ4LmE4LiX4Lii4Lie4LiZ4Liy!5e0!3m2!1sth!2sth!4v1790598823602!5m2!1sth!2sth',
  mapUrl: 'https://maps.app.goo.gl/HVPosHJZ9CvTgshn6',
  herbsUpdated: '', // filled from the herb price sheet
  herbsYear: '',
  drugsUpdated: '', // filled from the drug sheet
  drugsYear: '',
  gradeB: 70,       // % of grade A price
  gradeC: 40,
  gapBonus: 10,     // % added for GAP-certified
  organicBonus: 20  // % added for organic
};

// Products (products page) come from the drug sheet below; filled at runtime.
let DRUGS = [];

let NEWS = [
  { id: 'n1', date: '28 ก.ย. 2569', tag: 'ประกาศ', title: 'ปรับราคาผลิตภัณฑ์บางรายการ มีผล 1 ต.ค. 2569',
    summary: 'แจ้งปรับราคาผลิตภัณฑ์บางรายการตามต้นทุนวัตถุดิบ',
    body: ['เนื่องจากต้นทุนวัตถุดิบสมุนไพรปรับตัวสูงขึ้น ทางโรงงานจึงขอปรับราคาผลิตภัณฑ์บางรายการ โดยมีผลตั้งแต่วันที่ 1 ตุลาคม 2569 เป็นต้นไป', 'สามารถตรวจสอบราคาล่าสุดได้ที่หน้าผลิตภัณฑ์ หรือสอบถามทาง LINE'] },
  { id: 'n2', date: '15 ก.ย. 2569', tag: 'ข่าวสาร', title: 'ผ่านการตรวจประเมินมาตรฐาน GMP ประจำปี 2569', images: ['assets/poster-phana.jpg', 'assets/poster-team.jpg'], slide: true,
    summary: 'ยืนยันคุณภาพการผลิตทุกขั้นตอน ตั้งแต่วัตถุดิบถึงบรรจุภัณฑ์',
    body: ['โรงงานผลิตยาสมุนไพร ศูนย์แพทย์แผนไทยพนา ผ่านการตรวจประเมินมาตรฐานหลักเกณฑ์วิธีการที่ดีในการผลิต (GMP) ประจำปี 2569', 'ขอขอบคุณทีมงานทุกฝ่ายที่ร่วมกันรักษามาตรฐานการผลิตให้ปลอดภัยและมีคุณภาพ'] },
  { id: 'n3', date: '8 ก.ย. 2569', tag: 'งานวิจัย', title: 'ทีมผู้เชี่ยวชาญและวิจัยพัฒนา', images: ['assets/poster-team.jpg', 'assets/poster-phana.jpg', 'assets/poster-team.jpg'], slide: true,
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
  { year: '2536', text: 'เริ่มต้นโครงการพนา (PHANA PROJECT) ร่วมกับหมอพื้นบ้านในอำเภอพนา', images: ['assets/poster-phana.jpg'] },
  { year: '25XX', text: 'จัดตั้งศูนย์แพทย์แผนไทยพนา ในโรงพยาบาลพนา' },
  { year: '25XX', text: 'เปิดโรงงานผลิตยาสมุนไพร และได้รับมาตรฐาน GMP' },
  { year: '2569', text: 'ผ่านการตรวจประเมินมาตรฐาน GMP ประจำปี' }
];

// Herb buying prices, filled from HERB_SHEET_ID (no built-in copy, so stale
// prices are never shown).
let HERB_PRICES = [];

