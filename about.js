document.addEventListener("DOMContentLoaded", () => {
  const skillRows = document.querySelectorAll(".skill-row");

  skillRows.forEach((row, index) => {
    let direction = index % 2 === 0 ? 1 : -1; // Alternate direction
    let position = 0;
    const speed = 0.5 * 1000; // Slower speed of movement in pixels per second

    function moveSkills() {
      position += (direction * speed) / 1000; // Convert speed to pixels per millisecond
      row.style.transform = `translateX(${position}px)`;

      const rowRect = row.getBoundingClientRect();
      const containerRect = row.parentElement.getBoundingClientRect();

      // Check if any part of the row is offscreen
      if (
        rowRect.left < containerRect.left ||
        rowRect.right > containerRect.right
      ) {
        direction *= -1; // Reverse direction
      }
    }

    setInterval(moveSkills, 20); // Move every 20 milliseconds
  });
});
