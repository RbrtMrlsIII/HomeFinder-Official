/* Homepage typewriter — disabled on the calm hero redesign.
   Kept as a no-op so index.html script tag does not 404. */
const typingText = document.getElementById("typing-text");
if (typingText && getComputedStyle(typingText).display !== "none") {
    // Legacy path if someone re-enables the node visually
    const words = ["call home", "work nearby", "feel safe", "grow into"];
    let wordIndex = 0, charIndex = 0, deleting = false;
    (function typeEffect() {
        const currentWord = words[wordIndex];
        if (!deleting) {
            typingText.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === currentWord.length) {
                deleting = true;
                setTimeout(typeEffect, 1500);
                return;
            }
        } else {
            typingText.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                deleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }
        }
        setTimeout(typeEffect, deleting ? 60 : 120);
    })();
}
