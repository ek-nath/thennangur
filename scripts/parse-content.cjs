const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'content.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to strip markdown to plain text
function stripMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // link text
    .replace(/[#*`_~]/g, '') // formatting
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .trim();
}

function parsePoojas(markdown) {
  const categories = [];
  const poojas = [];
  
  // Split into categories by "## "
  const categoryBlocks = markdown.split(/\n##\s+/);
  
  // The first block is intro text
  const intro = categoryBlocks[0] || '';
  
  for (let i = 1; i < categoryBlocks.length; i++) {
    const block = categoryBlocks[i];
    const lines = block.split('\n');
    const categoryName = lines[0].trim();
    categories.push(categoryName);
    
    // Split block into individual poojas by "### "
    const poojaBlocks = block.split(/\n###\s+/);
    // Skip the first element which is text under the category heading
    for (let j = 1; j < poojaBlocks.length; j++) {
      const poojaBlock = poojaBlocks[j];
      const pLines = poojaBlock.split('\n').map(l => l.trim()).filter(Boolean);
      if (pLines.length === 0) continue;
      
      const name = pLines[0];
      
      // Parse details
      let price = 0;
      let id = '';
      let schedule = '';
      let descLines = [];
      
      // Check if second line is a day of week/schedule (not a description, price or link)
      let startIndex = 1;
      const firstLine = pLines[1] || '';
      if (
        firstLine && 
        !firstLine.startsWith('₹') && 
        !firstLine.startsWith('[') && 
        firstLine.length < 30 &&
        (firstLine.toLowerCase().includes('day') || 
         firstLine.toLowerCase().includes('week') || 
         firstLine.toLowerCase().includes('tuesday') ||
         firstLine.toLowerCase().includes('friday') ||
         firstLine.toLowerCase().includes('thursday') ||
         firstLine.toLowerCase().includes('month') ||
         firstLine.toLowerCase().includes('daily') ||
         firstLine.toLowerCase().includes('poornima') ||
         firstLine.toLowerCase().includes('pournami') ||
         firstLine.toLowerCase().includes('pradosh') ||
         firstLine.toLowerCase().includes('chaturthi') ||
         firstLine.toLowerCase().includes('chaturti') ||
         firstLine.toLowerCase().includes('star') ||
         firstLine.toLowerCase().includes('new year') ||
         firstLine.toLowerCase().includes('uttarathathi') ||
         firstLine.toLowerCase().includes('krithigai') ||
         firstLine.toLowerCase().includes('krittika'))
      ) {
        schedule = firstLine;
        startIndex = 2;
      }
      
      for (let k = startIndex; k < pLines.length; k++) {
        const line = pLines[k];
        if (line.startsWith('₹')) {
          price = parseInt(line.replace(/[^\d]/g, ''), 10);
        } else if (line.startsWith('[Book Now]')) {
          // Extract product ID from link
          const match = line.match(/\/product\/([a-zA-Z0-9-]+)/);
          if (match) {
            id = match[1];
          }
        } else {
          descLines.push(line);
        }
      }
      
      if (!id) {
        id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      poojas.push({
        id,
        name,
        category: categoryName,
        schedule,
        price,
        description: descLines.join(' ')
      });
    }
  }
  
  return { intro, categories, poojas };
}

function parseEvents(markdown) {
  const events = [];
  
  // Split into lines
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentMonth = '';
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if line specifies a month & year (e.g. "March 2026", "April 2026")
    if (line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/)) {
      currentMonth = line;
      i++;
      continue;
    }
    
    // Check for image
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const image = imgMatch[2];
      i++;
      
      let title = '';
      let date = '';
      let isSpecial = false;
      
      // Parse details following the image
      while (i < lines.length && !lines[i].startsWith('![') && !lines[i].match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/)) {
        const subLine = lines[i];
        if (subLine === '✦') {
          isSpecial = true;
        } else if (subLine.match(/^\d+$/)) {
          // just a day number, skip or keep
        } else if (subLine.includes(' · ') || subLine.match(/\d{4}/) || subLine.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/)) {
          date = subLine;
        } else {
          title = subLine;
        }
        i++;
      }
      
      if (title && date) {
        events.push({
          id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          title,
          date,
          monthGroup: currentMonth,
          image,
          isSpecial
        });
      }
    } else {
      i++;
    }
  }
  
  return events;
}

function parseGeneralMarkdown(markdown, fileName) {
  // Extract title
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : fileName.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Compile to HTML using marked
  const html = marked.parse(markdown);
  
  // Extract all images
  const images = [];
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  while ((match = imgRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1],
      src: match[2]
    });
  }
  
  return {
    title,
    html,
    images,
    raw: markdown
  };
}

function run() {
  const files = fs.readdirSync(CONTENT_DIR);
  const database = {
    pages: {},
    poojas: [],
    poojaCategories: [],
    events: []
  };
  
  files.forEach(file => {
    if (!file.endsWith('.md')) return;
    
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const key = file.replace('.md', '');
    
    if (key === 'online-pooja-booking') {
      const parsed = parsePoojas(content);
      database.poojas = parsed.poojas;
      database.poojaCategories = parsed.categories;
      database.pages[key] = {
        title: 'Online Pooja Booking',
        intro: parsed.intro,
        html: marked.parse(content)
      };
    } else if (key === 'annual-events') {
      const parsed = parseEvents(content);
      database.events = parsed;
      database.pages[key] = {
        title: 'Annual Events',
        html: marked.parse(content)
      };
    } else {
      const parsed = parseGeneralMarkdown(content, file);
      database.pages[key] = parsed;
    }
    console.log(`Parsed ${file}`);
  });
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
  console.log(`Successfully compiled content to ${OUTPUT_FILE}`);
}

run();
