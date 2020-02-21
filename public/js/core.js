function navbar(){
    var x = document.getElementById("myTopnav");
    if (x.className === "links") {
        x.className += "responsive";
    } else {
        x.className = "links";
  }
}