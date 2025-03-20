document.addEventListener('click', searchResult); 

function searchResult() {
let input = document.getElementById('search-i').value;
input = input.toLowerCase();
let blogName = document.getElementsByClassName('.blog-title');

for (let i = 0; i < blogName.length; i++) {
if (!blogName[i].innerHTML.toLowerCase().includes(input)) {
  document.getElementById('search-results').innerHTML = 'no results';
}
else {
  document.getElementById('search-results').innerHTML.blogName[i] = blogName[i];
}
}
};