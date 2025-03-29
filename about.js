// Initialize Lucide icons
lucide.createIcons();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});

// Sticky header background effect
const header = document.querySelector(".sticky-header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 0) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Skill icons hover effect
const skillIcons = document.querySelectorAll(".skill-icon");
skillIcons.forEach((icon) => {
  icon.addEventListener("mouseenter", () => {
    icon.style.transform = "translateY(-2px)";
  });
  icon.addEventListener("mouseleave", () => {
    icon.style.transform = "translateY(0)";
  });
});

// Project cards hover effect
const projectCards = document.querySelectorAll(".project-card");
projectCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-4px)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
  });
});

// Mobile menu toggle
const mobileMenuButton = document.querySelector(".mobile-menu-button");
const mainNav = document.querySelector(".main-nav");

if (mobileMenuButton && mainNav) {
  mobileMenuButton.addEventListener("click", () => {
    mainNav.classList.toggle("show");
  });
}

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    mainNav &&
    mainNav.classList.contains("show") &&
    !e.target.closest(".main-nav") &&
    !e.target.closest(".mobile-menu-button")
  ) {
    mainNav.classList.remove("show");
  }
});

// Add animation to elements when they come into view
const animateOnScroll = () => {
  const elements = document.querySelectorAll(".animate-on-scroll");
  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const elementBottom = element.getBoundingClientRect().bottom;
    const isVisible = elementTop < window.innerHeight && elementBottom >= 0;

    if (isVisible) {
      element.classList.add("visible");
    }
  });
};

window.addEventListener("scroll", animateOnScroll);
window.addEventListener("load", animateOnScroll);
