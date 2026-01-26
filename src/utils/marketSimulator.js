/**
 * Generates fake financial market data for music tracks.
 */

export const enrichTrackData = (track) => {
    let imageUrl = '';
    const defaultImage = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

    // Попытка 1: Прямой массив image (как в логах)
    if (Array.isArray(track.image) && track.image.length > 0) {
        // Берем последний элемент (самый большой)
        const imgObj = track.image[track.image.length - 1];
        if (imgObj && imgObj['#text']) {
            imageUrl = imgObj['#text'];
        }
    }

    // Попытка 2: Вложенный альбом (иногда бывает в поиске)
    if (!imageUrl && track.album && Array.isArray(track.album.image)) {
        const imgObj = track.album.image[track.album.image.length - 1];
        if (imgObj && imgObj['#text']) {
            imageUrl = imgObj['#text'];
        }
    }

    // Check if it is the placeholder
    if (imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
        // console.log('Placeholder detected for:', track.name);
        imageUrl = ''; // Reset to force fallback or empty
    }

    // Фоллбэк
    if (!imageUrl || imageUrl === '') {
        // console.warn('No image found for:', track.name);
        imageUrl = defaultImage;
    } else {
        // console.log('Valid image found for:', track.name, imageUrl);
    }

    return {
        ...track,
        name: track.name,
        artist: track.artist?.name || track.artist || 'Unknown Artist', // Artist бывает объектом или строкой
        price: parseInt(track.playcount || track.listeners || 0), // В поиске playcount может не быть, берем listeners
        volume: parseInt(track.listeners || 0),
        change24h: (Math.random() * 10 - 5).toFixed(2),
        image: imageUrl,
        isPositive: Math.random() > 0.5
    };
};
