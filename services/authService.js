


export function login(username, password) {
    if (username === 'demo' && password === 'Demo123') {
        return { username: 'demo'};
    } else {
        return null;
    }
}