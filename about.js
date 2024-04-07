let prevX = 0;

const stack = document.querySelector(".stack");

stack.addEventListener("mousemove", function (e) {
  if (e.clientX > prevX) {
    this.scrollLeft += 30; // Scroll right if moving from left to right
  } else {
    this.scrollLeft -= 30; // Scroll left if moving from right to left
  }

  prevX = e.clientX; // Update previous mouse position
});
