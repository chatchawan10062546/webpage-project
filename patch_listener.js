const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

const targetListener = `    const myListingsOpenBtn = document.getElementById('myListingsOpenBtn');
    if (myListingsOpenBtn) {
        myListingsOpenBtn.addEventListener('click', event => {
            event.preventDefault();
            if (typeof openMyListingsModal === 'function') openMyListingsModal();
        });
    }`;

const newListener = `    const myListingsOpenBtn = document.getElementById('myListingsOpenBtn');
    if (myListingsOpenBtn) {
        myListingsOpenBtn.addEventListener('click', event => {
            event.preventDefault();
            if (typeof openMyListingsModal === 'function') openMyListingsModal();
        });
    }

    const myTransactionsOpenBtn = document.getElementById('myTransactionsOpenBtn');
    if (myTransactionsOpenBtn) {
        myTransactionsOpenBtn.addEventListener('click', event => {
            event.preventDefault();
            if (typeof window.openMyTransactionsModal === 'function') window.openMyTransactionsModal();
        });
    }`;

if (c.includes(targetListener)) {
    c = c.replace(targetListener, newListener);
    fs.writeFileSync('js/userProfile.js', c, 'utf8');
    console.log('Added event listener for myTransactionsOpenBtn');
} else {
    // If it doesn't match exactly, just append it before the end of the updateProfileUI function... wait, let's just append it to the end of userProfile.js
    fs.appendFileSync('js/userProfile.js', `\ndocument.addEventListener('click', e => {
    if (e.target.closest('#myTransactionsOpenBtn')) {
        e.preventDefault();
        if (typeof window.openMyTransactionsModal === 'function') window.openMyTransactionsModal();
    }
});\n`);
    console.log('Appended event listener fallback');
}
