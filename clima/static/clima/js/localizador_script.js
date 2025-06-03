document.addEventListener('DOMContentLoaded', () => {
    const useLocationButton = document.getElementById('use-location-btn');
    const weatherInfoDiv = document.getElementById('weather-info-localizador');
    const cityNameEl = document.getElementById('city-name-localizador');
    const tempEl = document.getElementById('temp-localizador');
    const conditionEl = document.getElementById('condition-localizador');
    const humidityEl = document.getElementById('humidity-localizador');
    const windEl = document.getElementById('wind-localizador');

    //Elementos para la recomendación de canción
    const songRecommendationArea = document.getElementById('song-recommendation-area');
    const songTitleArtistEl = document.getElementById('song-title-artist');
    const spotifyPlayerDiv = document.getElementById('spotify-embed-player');

    //Configuración API del clima
    //Esta llamada se hace al backend de Django, que luego llama a la API externa.
    const API_KEY = 'f1d8b93869fc6876f7753af18dc82ccd';
    const GEOCODING_API_KEY = '95f8845d1401472b9f975967e10433ad'; //API Key para geocodificación inversa (OpenCage)

    //Inicializar el mapa Leaflet
    const map = L.map('map').setView([40.416775, -3.703790], 6); //Centrado en Madrid, España por defecto

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let marker; //Para guardar la referencia al marcador en el mapa

    //Función para obtener y mostrar una recomendación de canción
    const songRecommendations = {
        //Busca IDs reales en Spotify.
        //Ejemplo: vas a Spotify -> Canción -> Compartir -> Copiar URI de Spotify (ej: spotify:track:ID_DE_LA_CANCION)
        //O Compartir -> Incrustar pista -> el ID está en el código del iframe.
        'lluvia': { title: 'Riders on the Storm', artist: 'The Doors', spotifyTrackId: '5Hwsq7LQHzOIttN5hVdPNY' },
        'llovizna': { title: 'Come Away With Me', artist: 'Norah Jones', spotifyTrackId: '0Cv4uNn4A33sQTc6t4gD49' },
        'tormenta': { title: 'Thunderstruck', artist: 'AC/DC', spotifyTrackId: '57bgtoPSgt236HzfBOd8kj' },
        'nieve': { title: 'Let It Snow!', artist: 'Dean Martin', spotifyTrackId: '323t3OHfB13n3EjMvLPiq9' },
        'nuboso': { title: 'Mr. Blue Sky', artist: 'Electric Light Orchestra', spotifyTrackId: '2RlgNHKcydI9sayD2Df2xp' },
        'nubes': { title: 'Cloudbusting', artist: 'Kate Bush', spotifyTrackId: '5VOCuM1D2Ea1H9u2471F7S' },
        'niebla': { title: 'Into the Mystic', artist: 'Van Morrison', spotifyTrackId: '3lh3bMOmGkLnp6K2A2V2A5' },
        'bruma': { title: 'Into the Mystic', artist: 'Van Morrison', spotifyTrackId: '3lh3bMOmGkLnp6K2A2V2A5' },
        'despejado': { title: 'Here Comes The Sun', artist: 'The Beatles', spotifyTrackId: '6dGnYIeXmHdcikdzNNDMm2' },
        'soleado': { title: 'Walking on Sunshine', artist: 'Katrina & The Waves', spotifyTrackId: '05wIrZSwuaVWhcv5FfZNgu' },
        
        //Fallbacks para condiciones principales (weather.main)
        'rain': { title: 'Have You Ever Seen The Rain?', artist: 'Creedence Clearwater Revival', spotifyTrackId: '2LawezPeJhN4AWuSB0GtAU'},
        'drizzle': { title: 'November Rain', artist: 'Guns N\' Roses', spotifyTrackId: '3YRCqOhFifThpSRFJ1VWCM' },
        'thunderstorm': { title: 'Thunder Road', artist: 'Bruce Springsteen', spotifyTrackId: '56lhDZNQ5J47aog6mKeG6'},
        'snow': { title: 'A Hazy Shade of Winter', artist: 'Simon & Garfunkel', spotifyTrackId: '0hDuD2wdLqRCc7Yy28L9T0'},
        'clouds': { title: 'Cloudy', artist: 'Simon & Garfunkel', spotifyTrackId: '6u2vA0r72p0G9S9Q22S561'},
        'clear': { title: 'Good Day Sunshine', artist: 'The Beatles', spotifyTrackId: '1xscoFFp0H1n5XoP5agk0t'},
        'mist': { title: 'Foggy Mountain Breakdown', artist: 'Flatt & Scruggs', spotifyTrackId: '4K2L0N070GjGg8p80YhFcf'},
        'fog': { title: 'The Foggy Dew', artist: 'The Chieftains & Sinead O\'Connor', spotifyTrackId: '1dU32H1L3b2H1HSKx0jGTT'}
    };

    function getSongForWeather(weatherDescription, weatherMain) {
        const descriptionLower = weatherDescription.toLowerCase();
        const mainLower = weatherMain.toLowerCase();

        //Intenta primero con palabras clave en la descripción detallada
        for (const keyword in songRecommendations) {
            if (descriptionLower.includes(keyword)) {
                return songRecommendations[keyword];
            }
        }
        //Si no, intenta con la condición principal (main)
        if (songRecommendations[mainLower]) {
            return songRecommendations[mainLower];
        }
        return null; //No se encontró recomendación
    }


    //Función para obtener y mostrar el clima
    async function fetchAndDisplayWeather(lat, lon) {
        weatherInfoDiv.style.display = 'none'; //Ocultar resultados anteriores
        console.log(`Fetching weather for Lat: ${lat}, Lon: ${lon}`);
        if (songRecommendationArea) songRecommendationArea.style.display = 'none'; //Ocultar panel de canción
        if (spotifyPlayerDiv) spotifyPlayerDiv.innerHTML = ''; //Limpiar reproductor anterior

        //Validar coordenadas
        try {
            //Primero, geocodificación inversa para obtener el nombre de la ciudad
            //Ejemplo usando OpenCage
            let cityName = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`; //Nombre por defecto
            try {
                const geocodingResponse = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${GEOCODING_API_KEY}&language=es`);
                if (geocodingResponse.ok) {
                    const geocodingData = await geocodingResponse.json();
                    if (geocodingData.results && geocodingData.results.length > 0) {
                        const components = geocodingData.results[0].components;
                        cityName = components.city || components.town || components.village || geocodingData.results[0].formatted || cityName;
                    }
                }
            } catch (geoError) {
                console.warn('Geocoding failed or not configured:', geoError);
            }

            //Obtener datos del clima usando las coordenadas
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
            if (!weatherResponse.ok) {
                throw new Error(`HTTP error! status: ${weatherResponse.status}`);
            }
            const weatherData = await weatherResponse.json();

            console.log(weatherData);

            //Actualizar el DOM con la información
            cityNameEl.textContent = weatherData.name || cityName; //Usa el nombre de la API de clima si está, sino el geocodificado
            tempEl.textContent = `${weatherData.main.temp}°C`;
            conditionEl.textContent = weatherData.weather[0].description;
            humidityEl.textContent = weatherData.main.humidity;
            windEl.textContent = weatherData.wind.speed;
            weatherInfoDiv.style.display = 'flex'; //Mostrar resultados

            // Lógica para la recomendación de canción
            const weatherMainForSong = weatherData.weather[0].main;
            const weatherDescForSong = weatherData.weather[0].description;
            const recommendedSong = getSongForWeather(weatherDescForSong, weatherMainForSong);

            if (recommendedSong && songRecommendationArea && songTitleArtistEl && spotifyPlayerDiv) {
                songTitleArtistEl.textContent = `${recommendedSong.title} - ${recommendedSong.artist}`;
                spotifyPlayerDiv.innerHTML = `
                    <iframe style="border-radius:12px; margin-top: 10px;"
                            src="https://open.spotify.com/embed/track/${recommendedSong.spotifyTrackId}?utm_source=generator&theme=0"
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allowfullscreen=""
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy">
                    </iframe>`;
                songRecommendationArea.style.display = 'flex';
            }

            //Actualizar marcador en el mapa
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${weatherData.name || cityName}</b><br>Temp: ${weatherData.main.temp}°C<br>${weatherData.weather[0].description}`)
                .openPopup();
            map.setView([lat, lon], 13); //Centrar mapa en la nueva ubicación

            //Forzar actualización del tamaño del mapa DESPUÉS de mostrar la info y actualizar el mapa
            setTimeout(function() {
                if (map) {
                    map.invalidateSize();
                    console.log('Map size invalidated for side-by-side view');
                }
            }, 100); //100 ms de espera para asegurar que el DOM se haya actualizado

        } catch (error) {
            console.error("Error fetching weather data:", error);
            alert("No se pudo obtener la información del clima. Inténtalo de nuevo.");
            weatherInfoDiv.style.display = 'none';
            if (songRecommendationArea) songRecommendationArea.style.display = 'none';
            if (spotifyPlayerDiv) spotifyPlayerDiv.innerHTML = '';

            //Forzar actualización del tamaño del mapa DESPUÉS de ocultar la info debido a un error
            setTimeout(function() {
                if (map) {
                    map.invalidateSize();
                    console.log('Map size invalidated after error / hiding results');
                }
            }, 100);
        }
    }

    //Evento para el botón "Usar mi ubicación actual"
    useLocationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchAndDisplayWeather(lat, lon);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("No se pudo obtener tu ubicación. Asegúrate de haber concedido los permisos.");
                }
            );
        } else {
            alert("La geolocalización no es soportada por este navegador.");
        }
    });

    //Evento de clic en el mapa
    map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        fetchAndDisplayWeather(lat, lon);
    });
});