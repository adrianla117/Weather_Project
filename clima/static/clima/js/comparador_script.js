document.addEventListener('DOMContentLoaded', () => {
    const city1Input = document.getElementById('city1-input');
    const city2Input = document.getElementById('city2-input');
    const compareBtn = document.getElementById('compare-weather-btn');
    const resultsArea = document.getElementById('comparison-results-area');
    const city1WeatherCard = document.getElementById('city1-weather');
    const city2WeatherCard = document.getElementById('city2-weather');
    const highlightsDiv = document.getElementById('comparison-highlights');
    const mainPageContainer = document.querySelector('main.container');

    const API_KEY = 'f1d8b93869fc6876f7753af18dc82ccd';

    const weatherIconsArray = ['☀️', '☁️', '🌧️', '❄️', '⛈️', '🌫️', '💨', '🌬️', '🌥️', '🌦️', '🌤️', '🌪️'];

    //Función para Crear y Quitar Iconos Animados
    function removeAnimatedIcons() {
        if (!mainPageContainer) return;
        const existingIcons = mainPageContainer.querySelectorAll('.animated-weather-icon');
        existingIcons.forEach(icon => icon.remove());
    }

    function createAnimatedIcons() {
        if (!mainPageContainer) return;
        removeAnimatedIcons(); //Limpiar cualquier icono anterior

        const numberOfIcons = 25;

        for (let i = 0; i < numberOfIcons; i++) {
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('animated-weather-icon');
            iconSpan.textContent = weatherIconsArray[Math.floor(Math.random() * weatherIconsArray.length)];

            iconSpan.style.top = `${Math.random() * 90 + 5}%`; //Se distribuyen en la altura de main.container
            iconSpan.style.left = `${Math.random() * 90 + 5}%`;//Se distribuyen en el ancho de main.container
            iconSpan.style.fontSize = `${Math.random() * 2 + 1.8}em`;
            
            iconSpan.style.animationName = 'floatDrift';
            iconSpan.style.animationDuration = `${Math.random() * 15 + 12}s`;
            iconSpan.style.animationDelay = `-${Math.random() * 25}s`; 
            iconSpan.style.animationIterationCount = 'infinite';
            iconSpan.style.animationTimingFunction = 'ease-in-out';
            
            //Añadir los iconos a main.container
            //Para que estén "detrás" de los inputs y resultados, el z-index en CSS es 0
            mainPageContainer.appendChild(iconSpan); 
        }
    }

    //Mostrar la animación de iconos al cargar la página si no hay resultados
    if (resultsArea.style.display === 'none' || !resultsArea.style.display) {
        createAnimatedIcons();
    }

    compareBtn.addEventListener('click', async () => {
        const city1 = city1Input.value.trim();
        const city2 = city2Input.value.trim();

        if (!city1 || !city2) {
            alert("Por favor, introduce los nombres de dos ciudades.");
            return;
        }

        //Quitamos animación de iconos
        removeAnimatedIcons();

        resultsArea.style.display = 'block'; //Mostrar área de resultados
        
        city1WeatherCard.innerHTML = '<p>Cargando datos para ' + city1 + '...</p>';
        city2WeatherCard.innerHTML = '<p>Cargando datos para ' + city2 + '...</p>';
        city1WeatherCard.classList.remove('visible'); //Quitar clase por si ya estaba
        city2WeatherCard.classList.remove('visible'); //Quitar clase por si ya estaba
        
        highlightsDiv.style.display = 'none';
        highlightsDiv.innerHTML = '<h3>Destacados de la Comparación</h3>'; //Resetear
        highlightsDiv.classList.remove('visible');

        try {
            //Usamos el fetchWeatherData modificado para que devuelva un objeto de error en lugar de lanzar una excepción
            const [weather1, weather2] = await Promise.all([
                fetchWeatherData(city1),
                fetchWeatherData(city2)
            ]);

            displayWeather(weather1, city1WeatherCard, city1); //Añade el contenido de la tarjeta 1
            displayWeather(weather2, city2WeatherCard, city2); //Añade el contenido de la tarjeta 2

            //Forzar un reflujo del navegador para que reconozca el estado inicial ANTES de añadir la clase .visible
            //Importante para que la transición ocurra
            void city1WeatherCard.offsetWidth;
            void city2WeatherCard.offsetWidth;

            //Activar animación para las tarjetas
            city1WeatherCard.classList.add('visible');
            city2WeatherCard.classList.add('visible');

            if (weather1 && weather2) {
                compareAndHighlight(weather1, weather2); //Añade el contenido de los destacados

                //Activar animación para los destacados con un retraso
                setTimeout(() => {
                    highlightsDiv.style.display = 'flex'; //Primero hacerlo visible (ya que el CSS tiene display:flex)
                    void highlightsDiv.offsetWidth; //Forzar reflujo
                    highlightsDiv.classList.add('visible');
                }, 900); //Esperar a que las tarjetas se animen antes de mostrar los destacados
            } else {
                //Si no hay datos para comparar, oculta los destacados
                highlightsDiv.style.display = 'none';
                highlightsDiv.classList.remove('visible');
            }

        } catch (error) {
            console.error("Error en la comparación:", error);
            resultsArea.innerHTML = '<p>No se pudieron obtener los datos para la comparación. Inténtalo de nuevo.</p>';
            //Asegurarse de que todo está reseteado en caso de error
            city1WeatherCard.classList.remove('visible');
            city2WeatherCard.classList.remove('visible');
            highlightsDiv.style.display = 'none';
            highlightsDiv.classList.remove('visible');
        
            //Volvemos a mostrar la animación si hay un error grave
            createAnimatedIcons();
        }
    });

    //Función para obtener datos del clima de OpenWeatherMap
    async function fetchWeatherData(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`No se encontró la ciudad: ${city} (Error ${response.status})`);
        }
        return await response.json();
    }

    //Función para mostrar los datos del clima en el HTML
    function displayWeather(data, element, cityNameForError) {
        if (!data || data.cod !== 200) { //OpenWeatherMap usa 'cod: 200' para éxito
            element.innerHTML = `<h2>${cityNameForError}</h2><p>No se pudieron obtener los datos.</p>`;
            return;
        }
        
        //Iconos para el clima
        let icon = '❓'; 
        const mainCondition = data.weather[0].main.toLowerCase();
        if (mainCondition.includes('clear')) icon = '☀️';
        else if (mainCondition.includes('clouds')) icon = '☁️';
        else if (mainCondition.includes('rain') || mainCondition.includes('drizzle')) icon = '🌧️';
        else if (mainCondition.includes('thunderstorm')) icon = '⛈️';
        else if (mainCondition.includes('snow')) icon = '❄️';
        else if (mainCondition.includes('mist') || mainCondition.includes('fog')) icon = '🌫️';


        element.innerHTML = `
            <h2>${data.name} <span class="weather-icon">${icon}</span></h2>
            <p><strong>Temperatura:</strong> ${data.main.temp}°C (Sensación: ${data.main.feels_like}°C)</p>
            <p><strong>Condición:</strong> ${data.weather[0].description}</p>
            <p><strong>Humedad:</strong> ${data.main.humidity}%</p>
            <p><strong>Viento:</strong> ${data.wind.speed} km/h</p>
            <p><strong>Presión:</strong> ${data.main.pressure} hPa</p>
            <p class="activity-suggestion">${getActivitySuggestion(data)}</p>
        `;
    }

    //Función para comparar y resaltar diferencias entre climas
    function compareAndHighlight(data1, data2) {
        let comparisonText = "";

        //Temperatura
        if (data1.main.temp > data2.main.temp) {
            comparisonText += `<p>${data1.name} está ${Math.round(data1.main.temp - data2.main.temp)}°C más cálido que ${data2.name}.</p>`;
        } else if (data2.main.temp > data1.main.temp) {
            comparisonText += `<p>${data2.name} está ${Math.round(data2.main.temp - data1.main.temp)}°C más cálido que ${data1.name}.</p>`;
        } else {
            comparisonText += `<p>Ambas ciudades tienen una temperatura similar.</p>`;
        }

        //Sensación térmica (feels_like)
        const feelsDiff = Math.abs(data1.main.feels_like - data2.main.feels_like);
        if (feelsDiff > 2) { //Si la diferencia es notable
             if (data1.main.feels_like > data2.main.feels_like) {
                comparisonText += `<p>La sensación térmica es más alta en ${data1.name}.</p>`;
            } else {
                comparisonText += `<p>La sensación térmica es más alta en ${data2.name}.</p>`;
            }
        }

        //Humedad
        if (data1.main.humidity > data2.main.humidity) {
            comparisonText += `<p>${data1.name} tiene mayor humedad.</p>`;
        } else if (data2.main.humidity > data1.main.humidity) {
            comparisonText += `<p>${data2.name} tiene mayor humedad.</p>`;
        }
        
        //Viento
        if (data1.wind.speed > data2.wind.speed) {
            comparisonText += `<p>El viento es más fuerte en ${data1.name}.</p>`;
        } else if (data2.wind.speed > data1.wind.speed) {
            comparisonText += `<p>El viento es más fuerte en ${data2.name}.</p>`;
        }

        //¿Cuál es mejor para una actividad al aire libre?
        const score1 = calculateWeatherScore(data1);
        const score2 = calculateWeatherScore(data2);

        if (score1 > score2) {
            comparisonText += `<p><strong>Sugerencia:</strong> ${data1.name} parece tener un clima general más agradable hoy.</p>`;
        } else if (score2 > score1) {
            comparisonText += `<p><strong>Sugerencia:</strong> ${data2.name} parece tener un clima general más agradable hoy.</p>`;
        } else {
            comparisonText += `<p>Ambas ciudades ofrecen condiciones climáticas similares en general.</p>`;
        }

        highlightsDiv.innerHTML += comparisonText;
    }

    function calculateWeatherScore(data) {
        let score = 0;
        //Ideal: 20-25°C, sin lluvia, poco viento
        if (data.main.temp >= 20 && data.main.temp <= 25) score += 30;
        else if (data.main.temp > 15 && data.main.temp < 30) score += 15;

        if (!data.weather[0].main.toLowerCase().includes('rain') && !data.weather[0].main.toLowerCase().includes('snow')) score += 40;
        if (data.wind.speed < 15) score += 20; //Viento suave
        else if (data.wind.speed < 25) score += 10; //Viento moderado
        
        if (data.weather[0].main.toLowerCase().includes('clear')) score += 10; //Extra por cielo despejado
        return score;
    }

    function getActivitySuggestion(data) {
        const temp = data.main.temp;
        const condition = data.weather[0].main.toLowerCase();

        if (condition.includes('rain') || condition.includes('drizzle')) {
            return "Ideal para una maratón de series o visitar un museo.";
        } else if (condition.includes('thunderstorm')) {
            return "Mejor quedarse en casa y disfrutar de la tormenta desde la ventana.";
        } else if (condition.includes('snow')) {
            return "¡Perfecto para hacer un muñeco de nieve si hay suficiente!";
        } else if (temp > 28) {
            return "Mucho calor... ¡Busca la sombra o una piscina!";
        } else if (temp > 20 && (condition.includes('clear') || condition.includes('clouds'))) {
            return "¡Excelente día para un paseo o tomar algo en una terraza!";
        } else if (temp > 10) {
            return "Buen tiempo pero acuérdate de llevar con una chaqueta ligera.";
        } else {
            return "Abrígate bien si sales, ¡ten cuidado!";
        }
    }

});
