
function simulateRedirect(host, pathname, search) {
    console.log('--- Simulating Redirect ---');
    console.log('Host:', host);
    console.log('Pathname:', pathname);
    console.log('Search:', search);

    if (host.startsWith('www.')) {
        const newHost = host.replace('www.', '');
        const newUrl = 'https://' + newHost + pathname + search;
        console.log('REDIRECTING TO:', newUrl);
        return newUrl;
    }

    const urlParams = new URLSearchParams(search);
    const clientId = urlParams.get('c') || urlParams.get('clientId');
    const pathParts = pathname.split('/').filter(Boolean);
    const slug = pathParts[0];

    console.log('Extracted Slug:', slug);
    console.log('Extracted ClientId:', clientId);

    const finalSlug = slug || 'SAVED_SLUG';
    const finalClientId = clientId || 'SAVED_CLIENT_ID';

    if (finalSlug) {
        const manifestUrl = `https://api.791barber.com/api/public/manifest/${finalSlug}` +
            (finalClientId ? `?c=${finalClientId}` : '');
        console.log('MANIFEST URL:', manifestUrl);
    }

    return 'NO REDIRECT';
}

console.log('Case 1: www with slug and c');
simulateRedirect('www.791barber.com', '/ingleses', '?c=123');

console.log('\nCase 2: non-www with slug and c');
simulateRedirect('791barber.com', '/ingleses', '?c=123');

console.log('\nCase 3: non-www without slug');
simulateRedirect('791barber.com', '/', '?c=123');
