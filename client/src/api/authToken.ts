let token: string | null = localStorage.getItem("jwt");

export function setAuthToken(t: string | null) {
    token = t;
    if (t) localStorage.setItem("jwt", t);
    else localStorage.removeItem("jwt");
}

export function getAuthToken() {
    return token;
}

export function clearAuthToken() {
    token = null;
    localStorage.removeItem("jwt");
}