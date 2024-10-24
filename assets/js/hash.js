// Fonction pour hacher une chaîne de caractères
async function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
}

// Fonction pour comparer une chaîne de caractères avec un hash
async function compareHash(string, hashString) {
    return hashString === await hash(string);
}

export { hash, compareHash };
