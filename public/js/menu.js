const button = document.querySelector('.navbar__button');

button.addEventListener('click', function(event) {
    const menu = document.querySelector('.navbar__collapse');
    menu.classList.toggle('navbar__collapse--show');
});

var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

var modal1 = document.getElementById("myGames");

// Get the button that opens the modal
var btm = document.getElementById("myGame");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close1")[0];

// When the user clicks on the button, open the modal
btm.onclick = function() {
  modal1.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal1.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal1) {
    modal1.style.display = "none";
  }
}