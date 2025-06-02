document.addEventListener('DOMContentLoaded', () => {
    const useLocationButton = document.getElementById('use-location-btn');
    const weatherInfoDiv = document.getElementById('weather-info-localizador');
    const cityNameEl = document.getElementById('city-name-localizador');
    const tempEl = document.getElementById('temp-localizador');
    const conditionEl = document.getElementById('condition-localizador');
    const humidityEl = document.getElementById('humidity-localizador');
    const windEl = document.getElementById('wind-localizador');

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

    //Función para obtener y mostrar el clima
    async function fetchAndDisplayWeather(lat, lon) {
        weatherInfoDiv.style.display = 'none'; //Ocultar resultados anteriores
        console.log(`Fetching weather for Lat: ${lat}, Lon: ${lon}`);

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
                        cityName = components.city || components.town || components.village || geocodingData.results[0].formatted;
                    }
                }
            } catch (geoError) {
                console.warn('Geocoding failed or not configured:', geoError);
            }


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
            weatherInfoDiv.style.display = 'block'; //Mostrar resultados

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