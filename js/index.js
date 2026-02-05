// Navbar

const navElement = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');

// Debounce utility to improve performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.addEventListener('scroll', () => {
    if(hamburger.classList.contains('active')){
        return;
    };
    if(window.scrollY >= 56){
        navElement.classList.add('navbar-scrolled');
        navElement.classList.add('navbar-light');
        navElement.classList.remove('navbar-dark');
        navElement.classList.remove('navbar-gradient');
    }
    else{
        navElement.classList.remove('navbar-scrolled');
        navElement.classList.add('navbar-dark');
        navElement.classList.remove('navbar-light');
        navElement.classList.add('navbar-gradient');
    };       
});

// Handle window resize - close hamburger menu and scroll to top when going from small to big screen
window.addEventListener('resize', debounce(() => {
    // Check if window is now larger than the lg breakpoint (992px)
    if(window.innerWidth >= 992 && hamburger.classList.contains('active')) {
        // Close the hamburger menu
        hamburger.classList.remove('active');
        // Collapse the navbar
        const navbarCollapse = document.getElementById('navbarNav');
        if(navbarCollapse) {
            navbarCollapse.classList.remove('show');
        }
        // Update navbar styling based on current scroll position
        if(window.scrollY >= 56){
            navElement.classList.add('navbar-scrolled');
            navElement.classList.add('navbar-light');
            navElement.classList.remove('navbar-dark');
            navElement.classList.remove('navbar-gradient');
        }
        else{
            navElement.classList.remove('navbar-scrolled');
            navElement.classList.add('navbar-dark');
            navElement.classList.remove('navbar-light');
            navElement.classList.add('navbar-gradient');
        }
        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}, 200));

// Search functionality
const faqSearchInput = document.getElementById('faqSearchInput');
const searchSubmitBtn = document.getElementById('searchSubmitBtn');

if (faqSearchInput) {
  faqSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performFaqSearch();
    }
  });
};

if (searchSubmitBtn) {
  searchSubmitBtn.addEventListener('click', performFaqSearch);
};

function performFaqSearch() {
  const searchTerm = faqSearchInput.value.trim().toLowerCase();
  
  if (!searchTerm) {
    return;
  };

  // FAQ data for matching
  const faqs = [
    {
      id: 'collapseOne',
      title: 'Hvordan oppretter jeg en profil?',
      keywords: ['opprette', 'profil', 'registrere', 'biografi', 'bilde'],
      buttonId: 'headingOne'
    },
    {
      id: 'collapseTwo',
      title: 'Er BadBoyDating trygt å bruke?',
      keywords: ['trygt', 'sikkerhet', 'falske', 'profiler', 'rapportere'],
      buttonId: 'headingTwo'
    },
    {
      id: 'collapseThree',
      title: 'Hvordan fungerer matching?',
      keywords: ['matching', 'algoritme', 'interesser', 'sted', 'meldinger'],
      buttonId: 'headingThree'
    },
    {
      id: 'collapseFour',
      title: 'Hva koster det å bruke tjenesten?',
      keywords: ['koster', 'pris', 'gratis', 'premium', 'abonnement'],
      buttonId: 'headingFour'
    },
    {
      id: 'collapseFive',
      title: 'Hvordan kan jeg slette profilen min?',
      keywords: ['slette', 'profil', 'fjerne', 'konto', 'innstillinger'],
      buttonId: 'headingFive'
    },
    {
      id: 'collapseSix',
      title: 'Hva bør jeg skrive i min første melding?',
      keywords: ['melding', 'skrive', 'første', 'tips', 'kontakt'],
      buttonId: 'headingSix'
    },
    {
      id: 'collapseSeven',
      title: 'Hvordan rapporterer jeg en annen bruker?',
      keywords: ['rapportere', 'bruker', 'mistenkelig', 'plager', 'falsk'],
      buttonId: 'headingSeven'
    }
  ];

  // Find matching FAQ
  let matchedFaq = null;
  
  for (let faq of faqs) {
    const titleMatch = faq.title.toLowerCase().includes(searchTerm);
    const keywordMatch = faq.keywords.some(keyword => keyword.includes(searchTerm));
    
    if (titleMatch || keywordMatch) {
      matchedFaq = faq;
      break;
    };
  }
;
  // Navigate to FAQs and expand the matching accordion
  window.location.href = 'FAQs.html';
  
  // Store search term in sessionStorage to be used after page load
  if (matchedFaq) {
    sessionStorage.setItem('expandFaqId', matchedFaq.id);
  };
};

// On FAQs page, expand the matching accordion if sessionStorage has data
if (window.location.pathname.includes('FAQs.html') || document.title.includes('FAQs')) {
  window.addEventListener('load', () => {
    const expandFaqId = sessionStorage.getItem('expandFaqId');
    if (expandFaqId) {
      const faqElement = document.getElementById(expandFaqId);
      if (faqElement) {
        // Using Bootstrap's collapse API
        const bsCollapse = new bootstrap.Collapse(faqElement, {
          toggle: true
        });
        // Scroll to the accordion
        faqElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      sessionStorage.removeItem('expandFaqId');
    }
  });
};


// Scroll 2 top btn

const scrollBtn = document.getElementById('scrollToTopBtn');

window.addEventListener('scroll', () =>{
    if(window.scrollY >= 56){
        scrollBtn.classList.remove('d-none');
    }
    else{
        scrollBtn.classList.add('d-none');
    }
});

scrollBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
 
// Hamburge menu logic

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    if(window.scrollY <= 56){
        navElement.classList.toggle('navbar-scrolled');
        navElement.classList.toggle('navbar-light');
        navElement.classList.toggle('navbar-dark');
        navElement.classList.toggle('navbar-gradient');
    }        
});

// Close navbar when clicking outside
document.addEventListener('click', (event) => {
    const navbar = document.querySelector('.navbar');
    const navbarCollapse = document.getElementById('navbarNav');
    
    // Check if click is outside the navbar
    if (!navbar.contains(event.target) && hamburger.classList.contains('active')) {
        // Close the hamburger menu
        hamburger.classList.remove('active');
        // Collapse the navbar
        if(navbarCollapse) {
            navbarCollapse.classList.remove('show');
        }
        // Reset navbar color if at top
        if(window.scrollY <= 56){
            navElement.classList.remove('navbar-scrolled');
            navElement.classList.remove('navbar-light');
            navElement.classList.add('navbar-dark');
            navElement.classList.add('navbar-gradient');
        }
    }
});

// Password validation for registration form
const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
    registrationForm.addEventListener('submit', (e) => {
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;
        const passwordError = document.getElementById('password-error');

        if (password !== password2) {
            e.preventDefault();
            passwordError.classList.remove('d-none');
        } else {
            passwordError.classList.add('d-none');
        }
    });
}