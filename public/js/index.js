// Navbar Elements
const navElement = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const scrollBtn = document.getElementById('scrollToTopBtn');
const navbarCollapse = document.getElementById('navbarNav');

// Debounce utility to improve performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Scroll Handler
let ticking = false;

function updateScrollState() {
    const scrollY = window.scrollY;

    // Navbar logic
    if (navElement && hamburger && !hamburger.classList.contains('active')) {
        if (scrollY >= 56) {
            navElement.classList.add('navbar-scrolled', 'navbar-light');
            navElement.classList.remove('navbar-dark', 'navbar-gradient');
        } else {
            navElement.classList.remove('navbar-scrolled', 'navbar-light');
            navElement.classList.add('navbar-dark', 'navbar-gradient');
        }
    }

    // Scroll to top button logic
    if (scrollBtn) {
        if (scrollY >= 56) {
            scrollBtn.classList.remove('d-none');
        } else {
            scrollBtn.classList.add('d-none');
        }
    }

    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
    }
});

// Scroll to top button click event
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// Hamburger menu logic
if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        // Toggle navbar style immediately when opening menu if at top
        if (window.scrollY <= 56 && navElement) {
            navElement.classList.toggle('navbar-scrolled');
            navElement.classList.toggle('navbar-light');
            navElement.classList.toggle('navbar-dark');
            navElement.classList.toggle('navbar-gradient');
        }
    });
}

// Close navbar when clicking outside
document.addEventListener('click', (event) => {
    if (hamburger && hamburger.classList.contains('active')) {
        // Check if click is outside the navbar
        if (navElement && !navElement.contains(event.target)) {
            // Close the hamburger menu
            hamburger.classList.remove('active');

            // Collapse the navbar
            if (navbarCollapse) {
                // Try to use Bootstrap API if available, otherwise fallback to class manipulation
                if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                     const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                     if (bsCollapse) {
                         bsCollapse.hide();
                     } else {
                        // If instance not found, create one and hide? Or just remove class.
                        // Removing class is safer if we are not sure about the instance.
                        navbarCollapse.classList.remove('show');
                     }
                } else {
                    navbarCollapse.classList.remove('show');
                }
            }

            // Reset navbar color if at top
            if (window.scrollY <= 56 && navElement) {
                navElement.classList.remove('navbar-scrolled', 'navbar-light');
                navElement.classList.add('navbar-dark', 'navbar-gradient');
            }
        }
    }
});

// Handle window resize - close hamburger menu and scroll to top when going from small to big screen
window.addEventListener('resize', debounce(() => {
    // Check if window is now larger than the lg breakpoint (992px)
    if (window.innerWidth >= 992) {
        if (hamburger && hamburger.classList.contains('active')) {
             hamburger.classList.remove('active');
             if (navbarCollapse) {
                 navbarCollapse.classList.remove('show');
             }
        }

        // Update navbar styling based on current scroll position
        if (navElement) {
            if (window.scrollY >= 56) {
                navElement.classList.add('navbar-scrolled', 'navbar-light');
                navElement.classList.remove('navbar-dark', 'navbar-gradient');
            } else {
                navElement.classList.remove('navbar-scrolled', 'navbar-light');
                navElement.classList.add('navbar-dark', 'navbar-gradient');
            }
        }
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
}

if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', performFaqSearch);
}

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

function performFaqSearch() {
  const searchTerm = faqSearchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    return;
  }

  // Find matching FAQ
  let matchedFaq = null;

  for (let faq of faqs) {
    const titleMatch = faq.title.toLowerCase().includes(searchTerm);
    const keywordMatch = faq.keywords.some(keyword => keyword.includes(searchTerm));

    if (titleMatch || keywordMatch) {
      matchedFaq = faq;
      break;
    }
  }

  // Navigate to FAQs and expand the matching accordion
  if (matchedFaq) {
      sessionStorage.setItem('expandFaqId', matchedFaq.id);
  }

  if (!window.location.pathname.includes('FAQs.html')) {
       window.location.href = 'FAQs.html';
  } else {
       window.location.reload();
  }
}

// On FAQs page, expand the matching accordion if sessionStorage has data
if (window.location.pathname.includes('FAQs.html') || document.title.includes('FAQs')) {
  window.addEventListener('load', () => {
    const expandFaqId = sessionStorage.getItem('expandFaqId');
    if (expandFaqId) {
      const faqElement = document.getElementById(expandFaqId);
      if (faqElement) {
        if (typeof bootstrap !== 'undefined') {
             const bsCollapse = new bootstrap.Collapse(faqElement, {
                toggle: true
             });
             faqElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      sessionStorage.removeItem('expandFaqId');
    }
  });
}

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
