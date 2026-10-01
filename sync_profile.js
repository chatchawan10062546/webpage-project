const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8').split('\n');

const profileAssignIdx = c.findIndex(l => l.includes("const profile = profileData.profile;"));
if (profileAssignIdx > -1) {
    const syncLogic = [
        "              // Auto-sync promptpay to localStorage in case it was missing",
        "              const _stored = JSON.parse(localStorage.getItem('user'));",
        "              if (_stored) {",
        "                  localStorage.setItem('user', JSON.stringify({",
        "                      ..._stored,",
        "                      promptpay_number: profile.promptpay_number,",
        "                      promptpay_name: profile.promptpay_name",
        "                  }));",
        "              }"
    ].join('\n');
    c.splice(profileAssignIdx + 1, 0, syncLogic);
    fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
    console.log('Added auto-sync to profile.js');
}
