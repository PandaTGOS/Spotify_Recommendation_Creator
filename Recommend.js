require('dotenv').config();
const token = process.env.SPOTIFY_TOKEN

async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}


async function getTopTracks(){                                    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

async function getRecommendations(seed){
    return (await fetchWebApi(
      `v1/recommendations?limit=5&seed_tracks=${seed.join(',')}`, 'GET'
    )).tracks;
}

async function getMyPlaylists(){                                   
    return (await fetchWebApi(
      'v1/me/playlists', 'GET'
    )).items;
}

async function addSongs(id, tracksUri){
    return(await fetchWebApi(
        `v1/playlists/${id}/tracks?uris=${tracksUri.join(',')}`,
        'POST'
        )
    )
}


async function createPlaylist(tracksUri){
    const { id: user_id } = await fetchWebApi('v1/me', 'GET')
      
    const playlist = await fetchWebApi(
        `v1/users/${user_id}/playlists`, 'POST', {
        "name": "RECOMMENDED",
        "description": "Playlist with new recommendations",
        "public": false
    })
      
    addSongs(playlist.id, tracksUri)
    
    return playlist;
}



async function main() {
    const topTracks = await getTopTracks();

    console.log(
        topTracks?.map(
            ({name, artists}) =>
            `${name} by ${artists.map(artist => artist.name).join(', ')}`
        )
    );

    const topTracksIds = topTracks.map(items => items.id)

    const recommendedTracks = await getRecommendations(topTracksIds);

    console.log(
        '\nRECOMMENDATIONS:\n',
        recommendedTracks.map(
            ({name, artists}) =>
            `${name} by ${artists.map(artist => artist.name).join(', ')}`
        )
    );

    const tracksUri = recommendedTracks.map(song => song.uri)

    let Playlists = await getMyPlaylists();

    flag = 0;
    for (const plst of Playlists) {
        if (plst.name === 'RECOMMENDED') {
            await addSongs(plst.id, tracksUri); 
            console.log('Tracks added to existing playlist')
            flag = 1;
        } 
    }

    if(flag == 0){
        const Playlist = await createPlaylist(tracksUri);
        console.log(Playlist.name, 'playlist created :', Playlist.id);
    }
}

main()