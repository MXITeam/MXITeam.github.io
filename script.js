"use strict";

document.documentElement.classList.add("js");

const menuToggle = document.querySelector("#menu-toggle");
const navigation = document.querySelector("#main-nav");

function closeMenu(restoreFocus = false) {
  navigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  if (restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  navigation.classList.toggle("is-open", isOpen);
  if (isOpen) navigation.querySelector("a").focus();
});

navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => closeMenu()));

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") closeMenu(true);
});

document.addEventListener("click", event => {
  if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

window.matchMedia("(min-width: 701px)").addEventListener("change", event => { if (event.matches) closeMenu(); });

if ("IntersectionObserver" in window) {
  const navLinks = [...navigation.querySelectorAll("a")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-20% 0px -45% 0px", threshold: 0 });
  document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
}

document.querySelector("#year").textContent = String(new Date().getFullYear());
