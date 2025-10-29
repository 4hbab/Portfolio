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
