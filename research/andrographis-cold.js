// สรุปงานวิจัย: ฟ้าทะลายโจรกับอาการหวัดและเจ็บคอ
// เปิดดู: research.html?id=andrographis-cold   รูปแบบข้อมูล: research/README.md
window.RESEARCH_PAGES = window.RESEARCH_PAGES || {};
window.RESEARCH_PAGES['andrographis-cold'] = {
  status: 'draft',
  statusNote: 'ฉบับทดลอง อยู่ระหว่างตรวจทาน',
  reviewed: '2026-11-05',
  tag: 'ระบบทางเดินหายใจ',
  herb: 'ฟ้าทะลายโจร',
  scientific: 'Andrographis paniculata',
  scale: 'สรุปจาก 33 การทดลอง 7,175 คน',
  title: 'ฟ้าทะลายโจร ช่วยบรรเทาหวัดและเจ็บคอได้แค่ไหน',
  dek: 'อาจช่วยให้เจ็บคอและอาการหวัดดีขึ้น แต่หลักฐานส่วนใหญ่ยังมีคุณภาพต่ำ',
  dekRefs: [1],

  findings: {
    heading: 'ดีขึ้นกว่ายาหลอกแค่ไหน',
    sub: 'จากการทดลอง 4 ชิ้นในคนเป็นหวัด',
    subRefs: [1],
    // ค่าเป็น SMD กลับเครื่องหมายแล้ว (บวก = อาการลดลงมากกว่ายาหลอก) ต้นฉบับหน้า 18
    axis: [-0.2, 1.6],
    ticks: [0, 0.5, 1, 1.5],
    axisLabels: ['เท่ายาหลอก', 'ดีกว่ามากขึ้น →'],
    bands: [
      { from: 0, word: 'แทบไม่ต่าง' },
      { from: 0.2, word: 'ดีขึ้นเล็กน้อย' },
      { from: 0.5, word: 'ดีขึ้นปานกลาง' },
      { from: 0.8, word: 'ดีขึ้นชัด' }
    ],
    unclearWord: 'ยังไม่ชัด',
    harmWord: 'แย่กว่ายาหลอก',
    // เกณฑ์ I² ตามที่ผู้วิจัยเขียนไว้ หน้า 6
    consistency: [
      { from: 0, word: 'ผลแต่ละงานไปทางเดียวกัน' },
      { from: 30, word: 'ผลแต่ละงานต่างกันบ้าง' },
      { from: 50, word: 'ผลแต่ละงานต่างกันมาก' },
      { from: 75, word: 'ผลแต่ละงานต่างกันสูงมาก' }
    ],
    rows: [
      { label: 'เจ็บคอ', est: 1.13, lo: 0.89, hi: 1.37, i2: 0, people: '314 คน' },
      { label: 'อาการหวัดโดยรวม', est: 0.69, lo: 0.12, hi: 1.26, i2: 86, people: '445 คน' },
      { label: 'ไอ', est: 0.39, lo: 0.10, hi: 0.67, i2: 63, people: '596 คน' }
    ],
    howToRead: 'จุดคือผลเฉลี่ย เส้นคือช่วงที่ผลจริงน่าจะอยู่ ยิ่งไปทางขวายิ่งดีกว่ายาหลอก ตัวเลขคือขนาดผลมาตรฐาน (SMD) ผู้วิจัยถือว่า 0.2 ถึง 0.5 เล็กน้อย 0.5 ถึง 0.8 ปานกลาง เกิน 0.8 ชัด',
    notes: [
      { text: 'ถ้านับเฉพาะการทดลองที่สุ่มและปกปิดการจัดกลุ่มได้ดี ผลยังไปทางเดียวกัน (อาการโดยรวม 1.21 ไอ 0.56)', refs: [1] }
    ]
  },

  safety: {
    frequency: [
      { text: 'ผลข้างเคียงพบราว 10 ใน 100 คน ส่วนใหญ่ไม่รุนแรง เช่น ท้องไส้ปั่นป่วน ผื่น หรืออาการแพ้', refs: [2, 1] }
    ],
    avoidRefs: [3],
    avoid: [
      { text: 'แพ้ฟ้าทะลายโจร' },
      { text: 'ตั้งครรภ์หรือให้นมบุตร' },
      { text: 'เจ็บคอจากเชื้อสเตรปโตคอคคัสกลุ่มเอ เคยเป็นไตอักเสบจากเชื้อนี้ หรือโรคหัวใจรูมาติก' },
      { text: 'เจ็บคอรุนแรง มีหนองในคอ ไข้สูง หนาวสั่น' }
    ],
    cautionRefs: [3],
    caution: [
      { text: 'ใช้ 3 วันไม่ดีขึ้นหรือแย่ลง ให้หยุดและพบแพทย์' },
      { text: 'ใช้ติดต่อกันนาน อาจทำให้แขนขาชาหรืออ่อนแรง' },
      { text: 'กินยาต้านการแข็งตัวของเลือด ยาต้านเกล็ดเลือด ยาลดความดัน หรือยาอื่นเป็นประจำ' }
    ]
  },

  more: [
    { title: 'ทำไมยังบอกว่าหลักฐานไม่แน่น', list: [
      { text: '25 จาก 33 การทดลองทำในจีน จากไทย 1 ชิ้น', refs: [1] },
      { text: 'เกือบทุกชิ้นมีจุดเสี่ยงอคติ และ 73% ไม่ได้ปกปิดว่าใครได้ยาอะไร', refs: [1] },
      { text: 'ผลิตภัณฑ์และขนาดยาต่างกันมาก มีเพียง 3 ชิ้นที่รายงานการผลิต', refs: [1] },
      { text: 'ภายหลังมีการแจ้งว่าผู้วิจัยคนหนึ่งได้ทุนการศึกษาจากบริษัทผลิตภัณฑ์สมุนไพร', refs: [5] }
    ] },
    { title: 'ใช้กับโควิด-19 ได้ไหม', text: 'งานทบทวนปี 2568 (6 การทดลอง ผู้ใหญ่ 660 คน) ยังไม่พบว่าช่วยให้ไข้หรือไอหายเร็วกว่ายาต้านไวรัสหรือการรักษาตามอาการ ผลข้างเคียงที่พบส่วนใหญ่คือค่าเอนไซม์ตับสูงขึ้นเล็กน้อย', refs: [4] },
    { title: 'ช่วยลดการใช้ยาปฏิชีวนะได้ไหม', text: 'ยังตอบไม่ได้ มีเพียง 1 ใน 33 การทดลองที่วัดเรื่องนี้', refs: [1] },
    { title: 'เกี่ยวกับงานวิจัยนี้', text: 'การทบทวนอย่างเป็นระบบและวิเคราะห์อภิมาน (systematic review and meta-analysis) ของมหาวิทยาลัยเซาแทมป์ตันกับมหาวิทยาลัยการแพทย์แผนจีนปักกิ่ง ตีพิมพ์ใน PLOS ONE ปี 2560 ข้อมูลถึงมีนาคม 2559 ลงทะเบียนโครงร่างล่วงหน้า ณ พฤศจิกายน 2569 ผู้เรียบเรียงยังไม่พบงานทบทวนเรื่องหวัดที่ใหม่กว่า', refs: [1] }
  ],

  disclaimer: 'ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำการรักษา อ่านคำเตือนบนฉลากก่อนใช้ ถ้ามีโรคประจำตัว ตั้งครรภ์ หรือใช้ยาอื่นอยู่ ปรึกษาแพทย์หรือเภสัชกร แจ้งอาการไม่พึงประสงค์ที่สายด่วน อย. 1556',

  references: [
    { text: 'Hu XY, Wu RH, Logue M และคณะ. Andrographis paniculata (Chuān Xīn Lián) for symptomatic relief of acute respiratory tract infections in adults and children: a systematic review and meta-analysis. PLoS ONE. 2017;12(8):e0181780.',
      url: 'https://doi.org/10.1371/journal.pone.0181780', urlLabel: 'doi:10.1371/journal.pone.0181780',
      note: 'แปลและเรียบเรียงบางส่วนเป็นภาษาไทย ภายใต้สัญญาอนุญาต CC BY 4.0 (creativecommons.org/licenses/by/4.0) ผู้แต่งไม่ได้เกี่ยวข้องกับหน้านี้' },
    { text: 'Worakunphanich W, Thavorncharoensap M, Youngkong S และคณะ. Safety of Andrographis paniculata: a systematic review and meta-analysis. Pharmacoepidemiol Drug Saf. 2021;30(6):727-739.',
      url: 'https://doi.org/10.1002/pds.5190', urlLabel: 'doi:10.1002/pds.5190', note: 'ตัวเลขมาจากบทคัดย่อ' },
    { text: 'คณะกรรมการพัฒนาระบบยาแห่งชาติ. ประกาศ เรื่อง บัญชียาหลักแห่งชาติ พ.ศ. 2562. ราชกิจจานุเบกษา เล่ม 136 ตอนพิเศษ 95 ง (17 เมษายน 2562) บัญชียาจากสมุนไพร หัวข้อยาฟ้าทะลายโจร หน้า 274.' },
    { text: 'Prabhakornritta P, Waranuch N, Fuangchan A และคณะ. Exploring the clinical effects of Andrographis paniculata-derived compounds, its extract, or derivatives for the treatment of COVID-19: a systematic review and meta-analysis. Front Pharmacol. 2025;16:1598255.',
      url: 'https://doi.org/10.3389/fphar.2025.1598255', urlLabel: 'doi:10.3389/fphar.2025.1598255',
      note: 'มีประกาศแก้ไขปี 2569 (doi:10.3389/fphar.2026.1823854) แก้คำบรรยายการรักษาในตาราง 1' },
    { text: 'Hu XY และคณะ. Correction: Andrographis paniculata (Chuān Xīn Lián) for symptomatic relief of acute respiratory tract infections in adults and children: a systematic review and meta-analysis. PLoS ONE. 2018;13(11):e0207713.',
      url: 'https://doi.org/10.1371/journal.pone.0207713', urlLabel: 'doi:10.1371/journal.pone.0207713' }
  ],

  credit: 'แปลและเรียบเรียงจาก Hu XY และคณะ, PLOS ONE 2560 (CC BY 4.0) โดยศูนย์แพทย์แผนไทยพนา โรงพยาบาลพนา ตรวจทานล่าสุด 5 พฤศจิกายน 2569'
};
