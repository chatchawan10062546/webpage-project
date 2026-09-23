const fs = require('fs');
let upjs = fs.readFileSync('js/userProfile.js', 'utf8');

const showNav = `        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.remove('d-none');`;

if (!upjs.includes("myReqNav.classList.remove")) {
    upjs = upjs.replace('authContainer.innerHTML = `', showNav + '\n        authContainer.innerHTML = `');
}

const hideNav = `        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.add('d-none');`;

if (!upjs.includes("myReqNav.classList.add")) {
    upjs = upjs.replace('authContainer.innerHTML = `', hideNav + '\n            authContainer.innerHTML = `'); 
    // Wait, the first one is for login (line 26), the second one is for logged in (line 38)
}

fs.writeFileSync('js/userProfile.js', upjs, 'utf8');
console.log('Fixed js/userProfile.js');
