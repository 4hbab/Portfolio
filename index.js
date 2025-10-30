// Theme Toggle Functionality
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle i');
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        body.removeAttribute('data-theme');
        themeToggle.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggle.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.className = 'fas fa-sun';
    }
}

// Counter animation
function animateCounter() {
    const counter = document.querySelector('.project-counter');
    const target = 10;
    let current = 0;
    const increment = target / 60; // 60 frames for smooth animation
    
    const timer = setInterval(() => {
        current += increment;
        counter.textContent = Math.floor(current) + '+';
        
        if (current >= target) {
            counter.textContent = target + '+';
            clearInterval(timer);
        }
    }, 33); // ~30fps
}

// Intersection Observer for animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('projects')) {
                    animateCounter();
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.bento-card').forEach(card => {
        observer.observe(card);
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    observeElements();
    
    // Remove loading class after a short delay
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);
});

// Add some interactive effects
document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// ========= EXPERIENCE DETAILS DATA =========
const EXPERIENCE_DETAILS = {
    welldev: {
        title: "WellDev — Junior Software Engineer",
        subtitle: "Oct 2024 – Present",
        points: [
        "Designed and implemented RESTful endpoints for the travel-management platform used by internal operations teams.",
        "Optimized MariaDB queries (reduced p95 by ~30%) via proper indexing, pagination, and N+1 query elimination.",
        "Built secure auth/role middleware and input validation pipelines; reduced production errors from invalid payloads.",
        "Containerized services with Docker and wrote CI workflows to automate tests and image publishing.",
        "Authored monitoring checks/dashboards for critical endpoints; added structured logging and correlation IDs.",
        "Collaborated with frontend (VueJS) to define API contracts and improve DX with mock servers and OpenAPI."
        ]
    },
    zolo: {
        title: "Zolo Inc — Software Engineer Intern",
        subtitle: "Mar 2024 – Apr 2024",
        points: [
        "Implemented responsive top-nav and sidebar with keyboard navigation and ARIA semantics.",
        "Built auth screens (login/reset) with form validation and API integration; added optimistic UI for feedback.",
        "Set up reusable React components with a light design system approach and story-like examples.",
        "Collaborated in Git flow, wrote small unit tests, and iterated quickly from design feedback."
        ]
    }
};

// ========= MODAL LOGIC =========
const modal = document.getElementById('xpModal');
const modalList = document.getElementById('xpModalList');
const modalTitle = document.getElementById('xpModalTitle');
const modalSubtitle = document.getElementById('xpModalSubtitle');

let lastFocusedEl = null;

function openModalFor(key) {
    const data = EXPERIENCE_DETAILS[key];
    if (!data) return;

    // Fill content
    modalTitle.textContent = data.title;
    modalSubtitle.textContent = data.subtitle;

    modalList.innerHTML = "";
    data.points.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        modalList.appendChild(li);
    });

    // Open + accessibility
    lastFocusedEl = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // focus first interactive: close button
    const closeBtn = modal.querySelector('.xp-modal__close');
    closeBtn.focus();

    // Lock scroll
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        lastFocusedEl.focus();
    }
}

// Backdrop / close buttons
modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeModal();
});

// Escape to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

// Basic focus trap inside modal
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active') || e.key !== 'Tab') return;

    const focusables = modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
    }
});

// Attach handlers to experience cards
document.querySelectorAll('.experience-card[data-key]').forEach(card => {
    card.addEventListener('click', () => openModalFor(card.dataset.key));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModalFor(card.dataset.key);
        }
    });
});

