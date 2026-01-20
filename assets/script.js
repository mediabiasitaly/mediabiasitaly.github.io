/**
 * MBI – Media Bias in Italy
 * Survey Script
 * 
 * This script handles:
 * - CSV loading and parsing
 * - Pair generation for comparisons
 * - Survey navigation and state management
 * - Data submission to Google Forms
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Google Form configuration - TO BE FILLED BY PI
  // After creating the Google Form, replace these with actual entry IDs
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScjVf0SQ_BpNd0t0LnKktkcJSQBeqLRQRCaqDg5CzJxeE_Qug/formResponse',
  FORM_FIELDS: {
    respondent_id: 'entry.1734835485',
    timestamp: 'entry.1274077527',
    interview_id: 'entry.1066898704',
    comparison_id: 'entry.109375964',
    outlet_left_codename: 'entry.645477966',
    outlet_right_codename: 'entry.604728793',
    chosen_outlet_codename: 'entry.1931735630',
    section_type: 'entry.103511959',
    email: 'entry.1012204936'
  },
  
  // Survey structure
  SECTIONS: [
    { id: 1, type: 'tg', name: 'Telegiornali' },
    { id: 2, type: 'talk', name: 'Talk show televisivi' },
    { id: 3, type: 'press', name: 'Quotidiani e testate online' },
    { id: 4, type: 'radio', name: 'Programmi radiofonici' },
    { id: 5, type: 'mixed', name: 'Confronti misti' }
  ],
  
  COMPARISONS_PER_SECTION: 6,
  
  // Mainstream outlets for mixed section (codenames)
  MAINSTREAM_OUTLETS: [
    'tg1', 'tg5', 'tgla7', 'corriere', 'repubblica', 
    'portaaporta', 'ottoemezzo', 'radio24'
  ],
  
  CSV_PATH: 'data/outlets.csv'
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  respondentId: null,
  interviewId: null,
  outlets: [],
  pairs: [],
  responses: [],
  currentSection: 0,
  currentComparison: 0,
  consentGiven: false,
  surveyStarted: false,
  email: 'NA'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID (UUID v4)
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate interview ID (sequential, simple)
 */
function generateInterviewId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Parse CSV string into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      data.push(obj);
    }
  }
  
  return data;
}

/**
 * Get outlets by type
 */
function getOutletsByType(type) {
  return state.outlets.filter(outlet => outlet.type === type);
}

/**
 * Check if outlet is mainstream
 */
function isMainstream(codename) {
  return CONFIG.MAINSTREAM_OUTLETS.includes(codename);
}

// ============================================================================
// PAIR GENERATION
// ============================================================================

/**
 * Generate pairs for a single section
 */
function generatePairsForSection(outlets, count) {
  if (outlets.length < 2) return [];
  
  const shuffled = shuffleArray(outlets);
  const pairs = [];
  const used = new Set();
  
  // Try to create pairs without repeating outlets
  for (let i = 0; i < shuffled.length - 1 && pairs.length < count; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push({
        left: shuffled[i],
        right: shuffled[i + 1]
      });
      used.add(shuffled[i].codename);
      used.add(shuffled[i + 1].codename);
    }
  }
  
  // If we need more pairs, allow repeats but avoid same pair
  while (pairs.length < count && outlets.length >= 2) {
    const available = shuffleArray(outlets);
    const left = available[0];
    const right = available.find(o => o.codename !== left.codename);
    
    if (right) {
      // Check if this exact pair already exists
      const pairExists = pairs.some(p => 
        (p.left.codename === left.codename && p.right.codename === right.codename) ||
        (p.left.codename === right.codename && p.right.codename === left.codename)
      );
      
      if (!pairExists) {
        pairs.push({ left, right });
      }
    }
    
    // Prevent infinite loop
    if (pairs.length === count || outlets.length < 2) break;
  }
  
  return pairs.slice(0, count);
}

/**
 * Generate mixed pairs (Section 5)
 */
function generateMixedPairs(count) {
  const allOutlets = state.outlets;
  const mainstream = allOutlets.filter(o => isMainstream(o.codename));
  const others = allOutlets.filter(o => !isMainstream(o.codename));
  
  const pairs = [];
  const shuffledMainstream = shuffleArray(mainstream);
  const shuffledOthers = shuffleArray([...mainstream, ...others]);
  
  for (let i = 0; i < count; i++) {
    const mainOutlet = shuffledMainstream[i % shuffledMainstream.length];
    let otherOutlet = shuffledOthers.find(o => 
      o.codename !== mainOutlet.codename && 
      o.type !== mainOutlet.type
    );
    
    // If no cross-type match, just get a different outlet
    if (!otherOutlet) {
      otherOutlet = shuffledOthers.find(o => o.codename !== mainOutlet.codename);
    }
    
    if (otherOutlet) {
      // Randomly assign left/right
      if (Math.random() > 0.5) {
        pairs.push({ left: mainOutlet, right: otherOutlet });
      } else {
        pairs.push({ left: otherOutlet, right: mainOutlet });
      }
    }
  }
  
  return pairs.slice(0, count);
}

/**
 * Generate all pairs for the survey
 */
function generateAllPairs() {
  const allPairs = [];
  
  CONFIG.SECTIONS.forEach(section => {
    let sectionPairs;
    
    if (section.type === 'mixed') {
      sectionPairs = generateMixedPairs(CONFIG.COMPARISONS_PER_SECTION);
    } else {
      const outlets = getOutletsByType(section.type);
      sectionPairs = generatePairsForSection(outlets, CONFIG.COMPARISONS_PER_SECTION);
    }
    
    // Add section info to each pair
    sectionPairs.forEach((pair, index) => {
      allPairs.push({
        ...pair,
        sectionId: section.id,
        sectionType: section.type,
        sectionName: section.name,
        comparisonIndex: index,
        comparisonId: `${section.id}-${index + 1}`
      });
    });
  });
  
  return allPairs;
}

// ============================================================================
// DATA SUBMISSION
// ============================================================================

/**
 * Submit a single comparison to Google Forms
 */
async function submitComparison(response) {
  const formData = new URLSearchParams();
  
  formData.append(CONFIG.FORM_FIELDS.respondent_id, state.respondentId);
  formData.append(CONFIG.FORM_FIELDS.timestamp, new Date().toISOString());
  formData.append(CONFIG.FORM_FIELDS.interview_id, state.interviewId);
  formData.append(CONFIG.FORM_FIELDS.comparison_id, response.comparisonId);
  formData.append(CONFIG.FORM_FIELDS.outlet_left_codename, response.outletLeft);
  formData.append(CONFIG.FORM_FIELDS.outlet_right_codename, response.outletRight);
  formData.append(CONFIG.FORM_FIELDS.chosen_outlet_codename, response.chosen);
  formData.append(CONFIG.FORM_FIELDS.section_type, response.sectionType);
  formData.append(CONFIG.FORM_FIELDS.email, state.email);
  
  try {
    // Use no-cors mode for Google Forms
    await fetch(CONFIG.GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    console.log('Response submitted:', response.comparisonId);
    return true;
  } catch (error) {
    console.error('Error submitting response:', error);
    return false;
  }
}

/**
 * Submit all responses with updated email
 */
async function submitAllResponsesWithEmail(email) {
  state.email = email || 'NA';
  
  for (const response of state.responses) {
    await submitComparison({ ...response, email: state.email });
  }
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

/**
 * Show/hide screens
 */
function showScreen(screenId) {
  const screens = ['consent-screen', 'loading-screen', 'error-screen', 'survey-screen'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden', id !== screenId);
    }
  });
}

/**
 * Update section indicators
 */
function updateSectionDots() {
  const container = document.getElementById('section-dots');
  if (!container) return;
  
  container.innerHTML = '';
  
  CONFIG.SECTIONS.forEach((section, index) => {
    const dot = document.createElement('div');
    dot.className = 'section-dot';
    
    if (index < state.currentSection) {
      dot.classList.add('completed');
    } else if (index === state.currentSection) {
      dot.classList.add('active');
    }
    
    container.appendChild(dot);
  });
}

/**
 * Update progress bar
 */
function updateProgress() {
  const totalComparisons = CONFIG.SECTIONS.length * CONFIG.COMPARISONS_PER_SECTION;
  const completedComparisons = (state.currentSection * CONFIG.COMPARISONS_PER_SECTION) + state.currentComparison;
  const percentage = (completedComparisons / totalComparisons) * 100;
  
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

/**
 * Render current comparison
 */
function renderComparison() {
  const pairIndex = (state.currentSection * CONFIG.COMPARISONS_PER_SECTION) + state.currentComparison;
  const pair = state.pairs[pairIndex];
  
  if (!pair) {
    console.error('No pair found at index:', pairIndex);
    return;
  }
  
  // Update section title
  const sectionTitle = document.getElementById('section-title');
  if (sectionTitle) {
    sectionTitle.textContent = `Sezione ${state.currentSection + 1}: ${pair.sectionName}`;
  }
  
  // Update comparison counter
  const counter = document.getElementById('comparison-counter');
  if (counter) {
    counter.textContent = `Confronto ${state.currentComparison + 1} di ${CONFIG.COMPARISONS_PER_SECTION}`;
  }
  
  // Render outlet cards
  const container = document.getElementById('comparison-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="outlet-card" tabindex="0" role="button" data-outlet="${pair.left.codename}" aria-label="${pair.left.name}">
      ${pair.left.pic ? `<img src="${pair.left.pic}" alt="${pair.left.name}" class="outlet-image" onerror="this.style.display='none'">` : '<div class="outlet-placeholder">📺</div>'}
      <div class="outlet-name">${pair.left.name}</div>
    </div>
    <div class="outlet-card" tabindex="0" role="button" data-outlet="${pair.right.codename}" aria-label="${pair.right.name}">
      ${pair.right.pic ? `<img src="${pair.right.pic}" alt="${pair.right.name}" class="outlet-image" onerror="this.style.display='none'">` : '<div class="outlet-placeholder">📺</div>'}
      <div class="outlet-name">${pair.right.name}</div>
    </div>
  `;
  
  // Check if there's an existing response for this comparison
  const existingResponse = state.responses.find(r => r.comparisonId === pair.comparisonId);
  
  if (existingResponse) {
    if (existingResponse.chosen === 'dk') {
      // DK was selected
    } else {
      // An outlet was selected
      const selectedCard = container.querySelector(`[data-outlet="${existingResponse.chosen}"]`);
      if (selectedCard) {
        selectedCard.classList.add('selected');
      }
    }
    enableNextButton(true);
  } else {
    enableNextButton(false);
  }
  
  // Add click handlers
  const cards = container.querySelectorAll('.outlet-card');
  cards.forEach(card => {
    card.addEventListener('click', () => selectOutlet(card.dataset.outlet));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectOutlet(card.dataset.outlet);
      }
    });
  });
  
  // Update navigation
  updateSectionDots();
  updateProgress();
  updateNavigationButtons();
}

/**
 * Handle outlet selection
 */
function selectOutlet(codename) {
  const pairIndex = (state.currentSection * CONFIG.COMPARISONS_PER_SECTION) + state.currentComparison;
  const pair = state.pairs[pairIndex];
  
  // Update UI
  const cards = document.querySelectorAll('.outlet-card');
  cards.forEach(card => {
    card.classList.remove('selected');
    if (card.dataset.outlet === codename) {
      card.classList.add('selected');
    }
  });
  
  // Store response
  storeResponse(codename);
  enableNextButton(true);
}

/**
 * Handle "Don't Know" selection
 */
function selectDontKnow() {
  const cards = document.querySelectorAll('.outlet-card');
  cards.forEach(card => card.classList.remove('selected'));
  
  storeResponse('dk');
  enableNextButton(true);
}

/**
 * Store response in state
 */
function storeResponse(chosen) {
  const pairIndex = (state.currentSection * CONFIG.COMPARISONS_PER_SECTION) + state.currentComparison;
  const pair = state.pairs[pairIndex];
  
  const response = {
    comparisonId: pair.comparisonId,
    outletLeft: pair.left.codename,
    outletRight: pair.right.codename,
    chosen: chosen,
    sectionType: pair.sectionType,
    timestamp: new Date().toISOString()
  };
  
  // Update or add response
  const existingIndex = state.responses.findIndex(r => r.comparisonId === pair.comparisonId);
  if (existingIndex >= 0) {
    state.responses[existingIndex] = response;
  } else {
    state.responses.push(response);
  }
  
  // Submit immediately (even if incomplete)
  submitComparison(response);
  
  // Save to sessionStorage for recovery
  saveState();
}

/**
 * Enable/disable next button
 */
function enableNextButton(enabled) {
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.disabled = !enabled;
  }
}

/**
 * Update navigation buttons
 */
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.disabled = state.currentSection === 0 && state.currentComparison === 0;
  }
  
  if (nextBtn) {
    const isLastComparison = state.currentSection === CONFIG.SECTIONS.length - 1 && 
                             state.currentComparison === CONFIG.COMPARISONS_PER_SECTION - 1;
    nextBtn.textContent = isLastComparison ? 'Concludi →' : 'Avanti →';
  }
}

/**
 * Navigate to next comparison
 */
function goNext() {
  if (state.currentComparison < CONFIG.COMPARISONS_PER_SECTION - 1) {
    state.currentComparison++;
  } else if (state.currentSection < CONFIG.SECTIONS.length - 1) {
    state.currentSection++;
    state.currentComparison = 0;
  } else {
    // Survey complete
    completeSurvey();
    return;
  }
  
  saveState();
  renderComparison();
}

/**
 * Navigate to previous comparison
 */
function goPrevious() {
  if (state.currentComparison > 0) {
    state.currentComparison--;
  } else if (state.currentSection > 0) {
    state.currentSection--;
    state.currentComparison = CONFIG.COMPARISONS_PER_SECTION - 1;
  }
  
  saveState();
  renderComparison();
}

/**
 * Complete the survey
 */
function completeSurvey() {
  // Store completion in sessionStorage
  sessionStorage.setItem('mbi_completed', 'true');
  sessionStorage.setItem('mbi_responses', JSON.stringify(state.responses));
  sessionStorage.setItem('mbi_respondent_id', state.respondentId);
  
  // Redirect to thank you page
  window.location.href = 'thankyou.html';
}

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Save state to sessionStorage
 */
function saveState() {
  const stateToSave = {
    respondentId: state.respondentId,
    interviewId: state.interviewId,
    pairs: state.pairs,
    responses: state.responses,
    currentSection: state.currentSection,
    currentComparison: state.currentComparison,
    consentGiven: state.consentGiven
  };
  
  sessionStorage.setItem('mbi_state', JSON.stringify(stateToSave));
}

/**
 * Load state from sessionStorage
 */
function loadState() {
  const saved = sessionStorage.getItem('mbi_state');
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
    return true;
  }
  return false;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Load outlets from CSV
 */
async function loadOutlets() {
  try {
    const response = await fetch(CONFIG.CSV_PATH);
    if (!response.ok) throw new Error('Failed to load CSV');
    
    const text = await response.text();
    state.outlets = parseCSV(text);
    
    if (state.outlets.length === 0) {
      throw new Error('No outlets found in CSV');
    }
    
    console.log(`Loaded ${state.outlets.length} outlets`);
    return true;
  } catch (error) {
    console.error('Error loading outlets:', error);
    return false;
  }
}

/**
 * Initialize survey page
 */
async function initSurvey() {
  // Check for saved state
  const hasState = loadState();
  
  if (hasState && state.consentGiven) {
    // Resume survey
    showScreen('loading-screen');
    
    const loaded = await loadOutlets();
    if (!loaded) {
      showScreen('error-screen');
      return;
    }
    
    // Use saved pairs if available
    if (!state.pairs || state.pairs.length === 0) {
      state.pairs = generateAllPairs();
    }
    
    showScreen('survey-screen');
    renderComparison();
  } else {
    // Show consent screen
    setupConsentHandlers();
  }
}

/**
 * Setup consent screen handlers
 */
function setupConsentHandlers() {
  const checkbox = document.getElementById('consent-check');
  const button = document.getElementById('consent-btn');
  
  if (checkbox && button) {
    checkbox.addEventListener('change', () => {
      button.disabled = !checkbox.checked;
    });
    
    button.addEventListener('click', async () => {
      state.consentGiven = true;
      state.respondentId = generateUUID();
      state.interviewId = generateInterviewId();
      
      showScreen('loading-screen');
      
      const loaded = await loadOutlets();
      if (!loaded) {
        showScreen('error-screen');
        return;
      }
      
      state.pairs = generateAllPairs();
      saveState();
      
      showScreen('survey-screen');
      renderComparison();
    });
  }
}

/**
 * Setup survey navigation handlers
 */
function setupSurveyHandlers() {
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  const dkBtn = document.getElementById('dk-btn');
  
  if (nextBtn) nextBtn.addEventListener('click', goNext);
  if (prevBtn) prevBtn.addEventListener('click', goPrevious);
  if (dkBtn) dkBtn.addEventListener('click', selectDontKnow);
}

/**
 * Initialize thank you page
 */
function initThankYou() {
  const emailInput = document.getElementById('email-input');
  const submitBtn = document.getElementById('submit-email-btn');
  const skipBtn = document.getElementById('skip-btn');
  const emailForm = document.getElementById('email-form');
  const emailSuccess = document.getElementById('email-success');
  const skipSection = document.getElementById('skip-section');
  const finalMessage = document.getElementById('final-message');
  
  // Load saved state
  const savedResponses = sessionStorage.getItem('mbi_responses');
  const savedRespondentId = sessionStorage.getItem('mbi_respondent_id');
  
  if (savedResponses) {
    state.responses = JSON.parse(savedResponses);
    state.respondentId = savedRespondentId;
  }
  
  if (submitBtn && emailInput) {
    submitBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      
      if (email && email.includes('@')) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso...';
        
        // Update email for all responses
        state.email = email;
        
        // Resubmit all responses with email
        await submitAllResponsesWithEmail(email);
        
        // Show success
        if (emailForm) emailForm.classList.add('hidden');
        if (emailSuccess) emailSuccess.classList.remove('hidden');
        if (skipSection) skipSection.classList.add('hidden');
        if (finalMessage) finalMessage.classList.remove('hidden');
        
        // Clear session
        sessionStorage.removeItem('mbi_state');
        sessionStorage.removeItem('mbi_responses');
        sessionStorage.removeItem('mbi_respondent_id');
      } else {
        emailInput.style.borderColor = 'var(--color-red)';
        emailInput.placeholder = 'Inserisci un indirizzo email valido';
      }
    });
  }
  
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (emailForm) emailForm.classList.add('hidden');
      if (skipSection) skipSection.classList.add('hidden');
      if (finalMessage) finalMessage.classList.remove('hidden');
      
      // Clear session
      sessionStorage.removeItem('mbi_state');
      sessionStorage.removeItem('mbi_responses');
      sessionStorage.removeItem('mbi_respondent_id');
    });
  }
}

// ============================================================================
// PAGE DETECTION & BOOTSTRAP
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('survey.html')) {
    setupSurveyHandlers();
    initSurvey();
  } else if (path.includes('thankyou.html')) {
    initThankYou();
  }
});
