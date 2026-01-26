
import axios from 'axios';

const API_KEY = 'acf3a0e200200739c3a7a644fed552d6';
const BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

async function debugTopTracks() {
    try {
        console.log('Fetching Top Tracks...');
        const response = await axios.get(BASE_URL, {
            params: {
                method: 'chart.gettoptracks',
                api_key: API_KEY,
                format: 'json',
                limit: 5
            }
        });

        const tracks = response.data.tracks.track;
        if (tracks && tracks.length > 0) {
            console.log(`Checking ${tracks.length} tracks from Chart...`);

            const firstTrack = tracks[0];
            console.log('Keys in Chart Track Item:', Object.keys(firstTrack));
            if (firstTrack.album) {
                console.log('Chart item HAS album data');
            } else {
                console.log('Chart item MISSING album data');
            }

            // Log the comparison for the first track
            // const firstTrack = tracks[1]; // Aperture is #2 in previous log
            console.log(`Checking details for: ${firstTrack.name} by ${firstTrack.artist.name}`);

            try {
                const detailResponse = await axios.get(BASE_URL, {
                    params: {
                        method: 'track.getInfo',
                        api_key: API_KEY,
                        format: 'json',
                        artist: firstTrack.artist.name,
                        track: firstTrack.name
                    }
                });

                // console.log('Full Detail Response:', JSON.stringify(detailResponse.data, null, 2));

                if (detailResponse.data.track && detailResponse.data.track.album && detailResponse.data.track.album.image) {
                    const albumImages = detailResponse.data.track.album.image;
                    const albumLastImage = albumImages[albumImages.length - 1]['#text'];
                    console.log(`Album Image found: ${albumLastImage}`);
                }

                if (detailResponse.data.track && detailResponse.data.track.image) {
                    const detailImages = detailResponse.data.track.image;
                    /*
                    const detailLastImage = detailImages[detailImages.length - 1]['#text'];
                    console.log(`Detail Image for ${firstTrack.name}: ${detailLastImage}`);
                    */
                    console.log('Track images:', JSON.stringify(detailImages, null, 2));
                } else {
                    console.log('No track images found in details.');
                    console.log('Track data keys:', Object.keys(detailResponse.data.track || {}));
                }

            } catch (err) {
                console.error('Error fetching details:', err.message);
                if (err.response) {
                    console.log('Response data:', err.response.data);
                }
            }

        } else {
            console.log('No tracks found.');
        }

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

debugTopTracks();
