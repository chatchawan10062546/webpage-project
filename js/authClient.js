// ====================================================
// 🌐 authClient.js : แนบ JWT ให้ทุกคำขอ API อัตโนมัติ
// ====================================================

(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
        const token = localStorage.getItem('authToken');
        const headers = new Headers(init.headers || {});
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return nativeFetch(input, { ...init, headers });
    };
})();
