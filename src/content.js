// Single source of facts for the portfolio. Identical on every concept branch.
const base = import.meta.env?.BASE_URL ?? './'
export const asset = (path) => base + path

export const me = {
  name: 'Krishna Raju S',
  role: 'Electrical engineer who ships software',
  field: 'Electrical and Electronics Engineering',
  city: 'Chennai, India',
  email: 'krishnarajus2004@gmail.com',
  linkedin: 'https://linkedin.com/in/krishnarajus2004',
  github: 'https://github.com/KRISH-exe-29',
  resume: asset('Krishna_Raju_S_Resume.pdf'),
  portrait: asset('img/portrait.jpg'),
  lines: [
    'Nine apps. One factory. Zero spreadsheets left behind.',
    'Your next quick manual step is my next app.',
    "Send it over. I'll turn it into a button.",
    'Results over resumes.',
  ],
}

export const numbers = [
  { value: 9, unit: 'apps', label: 'in production at Indo Tech Transformers' },
  { value: 128, unit: 'tests', label: 'guarding dispatch' },
  { value: 30, unit: 'seconds', label: 'for a job that took 30 minutes' },
  { value: 7, unit: 'rank', label: 'of 1500+ colleges at IIT Bombay NEC' },
  { value: 1, unit: 'patent', label: 'published, intelligent street lighting' },
]

// Oldest first: this is the order the story is told in.
export const experience = [
  {
    id: 'railway',
    year: '2023',
    role: 'Electrical Engineer Intern',
    company: 'Southern Railway',
    place: 'Tambaram, Tamil Nadu',
    short: '110 V battery study for LHB AC coaches',
    text: 'Evaluated 110 V lead-acid batteries and analysed what a full move to Li-ion would take for LHB AC railway coaches.',
    photo: asset('img/railway.jpg'),
    photoAlt: 'Diesel locomotives lined up on a Southern Railway track',
  },
  {
    id: 'mettur',
    year: '2024',
    role: 'Electrical Engineer Intern',
    company: 'Mettur Thermal Power Plant',
    place: 'Mettur, Tamil Nadu',
    short: 'High-voltage systems at a 4 x 210 MW station',
    text: 'Inspected and documented high-voltage electrical systems at the 4 x 210 MW thermal power station: boiler, turbine and generator.',
  },
  {
    id: 'inovate',
    year: '2024',
    role: 'Full Stack Developer Intern',
    company: 'Inovate Technologies',
    place: 'Remote',
    short: 'Project: Phantom, front to back',
    text: 'Built UI components and backend systems for Project: Phantom, then made it load faster.',
  },
  {
    id: 'buhler',
    year: '2025',
    role: 'Automation Engineering Intern',
    company: 'Bühler India Pvt. Ltd.',
    place: 'Bangalore, Karnataka',
    short: 'MCC panels and a tool that removed 90% of calculation errors',
    text: 'Classified feeders, calculated loads and selected switchgear for MCC panels. Co-developed a GUI automation tool for hardware documentation that removed 90% of manual calculation errors.',
    photo: asset('img/buhler.jpg'),
    photoAlt: 'Krishna at his desk at Bühler India',
  },
  {
    id: 'indotech',
    year: '2026',
    role: 'Engineer Intern',
    company: 'Indo Tech Transformers Limited',
    place: 'Chennai, Tamil Nadu',
    short: '161 kV test bay by day, nine shipped apps by night',
    text: 'Tested transformers to IEC 60076 and IS 2026 in the 161 kV test bay. Built Python and PyQt5 desktop automation for hardware-list standardisation, and ran a fastener standardisation study across 60+ specifications for the CEO.',
    photo: asset('img/indotech.jpg'),
    photoAlt: 'Krishna at Indo Tech Transformers',
  },
]

export const apps = [
  { name: 'Dispatch Management', pitch: 'Work order to gate pass, zero phone calls.', url: 'https://github.com/KRISH-exe-29/Dispatch-ITTL' },
  { name: 'EPMS', pitch: 'Project HQ with an interactive Gantt.', url: 'https://github.com/KRISH-exe-29/PMS' },
  { name: 'Fasteners Automation', pitch: 'A 30-minute job, now 30 seconds.', url: 'https://github.com/KRISH-exe-29/Fasteners-Project' },
  { name: 'Industrial Data System', pitch: 'QR-tagged test data with a 3D model.', url: 'https://github.com/KRISH-exe-29/indotech-transformers' },
  { name: 'Job Lens', pitch: '100 resumes in. A ranked shortlist out.', url: 'https://krishna-ittl.github.io/Candidate-Screener/' },
  { name: 'KioskSentinel', pitch: 'Attendance that survives power cuts.' },
  { name: 'RTCC & M.Box Tracker', pitch: 'Chases pending points so nobody has to.', url: 'https://github.com/KRISH-exe-29/Pannel-Box-Transformers-' },
  { name: 'Shop Floor Job Status', pitch: 'Live job status for every bay.' },
  { name: 'Transformer Test Planner', pitch: 'Every IEC 60076 test, planned per unit.', url: 'https://transformer-test-planner.vercel.app' },
]

export const sideProjects = [
  { name: 'dMAT Practice', pitch: 'A full exam simulator in one HTML file.', url: 'https://krishna-ittl.github.io/dmat-practice/' },
  { name: 'GUI Automation Tool', pitch: 'Hardware documentation in Python, PyQt and Pandas.' },
  { name: 'Flood Alerting System', pitch: 'Arduino and sensors that raise the alarm early.' },
]

export const ai = {
  agent: {
    name: 'Agent-Builder',
    pitch: 'One AI agent, grown in twelve versions from a plain chatbot into an autonomous system. Python, running on local models with Ollama.',
    versions: [
      'Chat', 'Read files', 'Write files', 'Plan',
      'Tool registry', 'Persistent memory', 'Safety and human approval', 'Reflection and validation', 'Knowledge retrieval',
      'Intelligent routing', 'Multi-agent coordination', 'Workflow automation',
    ],
  },
  rag: {
    name: 'Work-instruction assistant',
    pitch: "A retrieval-augmented assistant that answers shop-floor questions from the company's own work instructions, and shows where each answer came from.",
    steps: ['Ingest', 'Chunk', 'Embed', 'Retrieve', 'Cite'],
  },
  browser: {
    name: 'AI in the browser',
    pitch: 'Job Lens ranks resumes and reads scans on the device with Transformers.js and Tesseract, so sensitive files never leave it.',
  },
  stack: ['Claude', 'OpenAI', 'LangChain', 'LangGraph', 'Ollama', 'Transformers.js', 'Tesseract'],
}

export const awards = [
  { year: '2024', title: 'National finalist', detail: 'Technical symposium' },
  { year: '2025', title: 'Patent published', detail: 'Intelligent street lighting with fault detection: ESP8266, IR sensing and GPS' },
  { year: '2025', title: 'Rank 7 of 1500+ colleges', detail: 'National Entrepreneurship Challenge, IIT Bombay', photo: asset('img/iitb.jpg'), photoAlt: 'Krishna in front of the IIT Bombay sign' },
  { year: '2025', title: 'Runner-up, Fish Tank', detail: 'IIT Bombay E-Summit' },
  { year: '2026', title: 'Nine apps shipped', detail: 'Indo Tech Transformers' },
]

export const leadership = {
  title: 'E-Cell Vice President',
  text: 'Built the E-Cell team from scratch and spoke on entrepreneurship to 500+ students.',
  photos: [
    { src: asset('img/ecell.jpg'), alt: 'The E-Cell team on campus' },
    { src: asset('img/speaking.jpg'), alt: 'Krishna speaking to a hall of students' },
    { src: asset('img/nec-top7.jpg'), alt: 'National Entrepreneurship Challenge finalist poster' },
  ],
}

export const certifications = [
  'Arduino and Raspberry Pi with Python, UC Irvine',
  'Internet of Things, NPTEL',
  'Digital Circuits, NPTEL',
  'Logistics and Supply Chain Management, CII',
]

export const skills = {
  'Factory floor': ['IEC 60076 testing', 'MCC panels', 'Protection relays', 'OLTC', 'ESP8266', 'Proteus'],
  Code: ['TypeScript', 'React', 'Next.js', 'Python', 'Java', 'Node', 'Supabase', 'PostgreSQL', 'Three.js'],
  AI: ai.stack,
  Habits: ['Row-level security', 'Role-based access', 'Offline-first for sensitive data'],
}
