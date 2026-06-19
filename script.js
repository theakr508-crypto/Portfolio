const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const year = document.querySelector("#year");
const pageLoader = document.querySelector("[data-page-loader]");

document.body.classList.add("is-loading");

const hidePageLoader = () => {
  document.body.classList.remove("is-loading");

  if (pageLoader) {
    pageLoader.classList.add("is-hidden");
  }
};

window.addEventListener("load", () => {
  setTimeout(hidePageLoader, 450);
});

setTimeout(hidePageLoader, 2600);

if (year) {
  year.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation",
    );
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      navLinks.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

// Intersection Observer for premium scroll reveal animations
const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.15,
};

const scrollObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target); // Stop observing to keep the animation one-way
    }
  });
}, observerOptions);

document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
  scrollObserver.observe(el);
});

// Premium Magnetic Hover Effect for buttons/links
const magneticElements = document.querySelectorAll(".magnetic");

magneticElements.forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const position = el.getBoundingClientRect();
    // Calculate mouse position relative to the center of the element
    const x = e.clientX - position.left - position.width / 2;
    const y = e.clientY - position.top - position.height / 2;

    el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    el.style.transition = "transform 0s"; // Instant follow when hovering
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "translate(0px, 0px)";
    el.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)"; // Smooth snap-back
  });
});

// Subtle Parallax Animation on Scroll
window.addEventListener("scroll", () => {
  document.querySelectorAll(".parallax").forEach((el) => {
    const speed = el.getAttribute("data-speed") || 0.15; // Lower = more subtle/premium
    const yPos = window.scrollY * speed;
    el.style.transform = `translateY(${yPos}px)`;
  });
});

// =========================================
//   Contact Form Submission
// =========================================
const contactForm = document.getElementById("contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    // Get form data
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    submitButton.textContent = "Sending...";
    submitButton.disabled = true;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        submitButton.textContent = "Message Sent!";
        contactForm.reset(); // Clear the form
      } else {
        throw new Error(result.message || "An error occurred.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      submitButton.textContent = "Sending Failed";
      alert(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }, 3000);
    }
  });
}

// =========================================
//   Fetch and Render Dynamic Projects
// =========================================
async function loadProjects() {
  const projectsContainer = document.getElementById("projects-container");
  if (!projectsContainer) return;

  const renderSkeletonProjects = () => {
    const skeletonCard = `
      <div class="project-card is-skeleton reveal-on-scroll">
        <div class="skeleton-block"></div>
        <div class="project-content">
          <div class="skeleton-line is-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line is-short"></div>
          <div class="skeleton-tags">
            <div class="skeleton-pill"></div>
            <div class="skeleton-pill"></div>
            <div class="skeleton-pill"></div>
          </div>
        </div>
      </div>
    `;

    projectsContainer.innerHTML = skeletonCard.repeat(3);

    document
      .querySelectorAll("#projects-container .reveal-on-scroll")
      .forEach((el) => {
        scrollObserver.observe(el);
      });
  };

  const fallbackProjects = [
    {
      id: 1,
      title: "Durgesh Security Services",
      description:
        "A live project preview hosted on GitHub Pages with a clickable homepage snapshot.",
      tags: ["GitHub Pages", "Frontend", "Live Site"],
      link: "https://theakr508-crypto.github.io/Test/index.html",
      preview: "https://theakr508-crypto.github.io/Test/index.html",
    },
    {
      id: 2,
      title: "Mahima Packers and Movers",
      description:
        "A live website preview for a packers and movers business homepage.",
      tags: ["GitHub Pages", "Website", "Frontend"],
      link: "https://theakr508-crypto.github.io/test-saket-ji/",
      preview: "https://theakr508-crypto.github.io/test-saket-ji/",
    },
  ];

  const renderProjects = (projects) => {
    projectsContainer.innerHTML = "";

    projects.forEach((project, index) => {
      const delayClass = `delay-${(index % 3) + 1}`; // Staggered animation
      const tagsHtml = project.tags
        .map((tag) => `<span class="project-tag">${tag}</span>`)
        .join("");
      const previewUrl = project.preview || project.link;

      const projectHTML = `
        <a href="${project.link}" class="project-card reveal-on-scroll ${delayClass}" aria-label="Open ${project.title}">
          <div class="project-preview" aria-hidden="true">
            <div class="project-preview-bar">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <iframe
              src="${previewUrl}"
              title="${project.title} homepage preview"
              loading="lazy"
              tabindex="-1"
            ></iframe>
          </div>
          <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-tags">${tagsHtml}</div>
          </div>
        </a>
      `;
      projectsContainer.insertAdjacentHTML("beforeend", projectHTML);
    });

    // Attach the intersection observer to the newly added elements
    document
      .querySelectorAll("#projects-container .reveal-on-scroll")
      .forEach((el) => {
        scrollObserver.observe(el);
      });
  };

  renderSkeletonProjects();

  try {
    const response = await fetch("http://127.0.0.1:5000/api/projects");
    const data = await response.json();

    if (data.success && data.projects) {
      renderProjects(data.projects);
    }
  } catch (error) {
    console.error("Failed to load projects:", error);
    renderProjects(fallbackProjects);
  }
}

document.addEventListener("DOMContentLoaded", loadProjects);
