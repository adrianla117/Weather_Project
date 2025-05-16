document.addEventListener("DOMContentLoaded", function () {
    //Obtener variables pasadas desde Django a través del script con id="django-script-vars"
    const scriptVarsTag = document.getElementById('django-script-vars');
    const API_KEY = scriptVarsTag ? scriptVarsTag.dataset.apiKey : null;
    let ciudadActual = scriptVarsTag ? scriptVarsTag.dataset.ciudadInicial : 'Vigo'; // Default a Vigo si no se encuentra
    const CSRF_TOKEN = scriptVarsTag ? scriptVarsTag.dataset.csrfToken : null;

    //Elementos del DOM
    const formCiudad = document.getElementById("form-ciudad");
    const inputCiudadNombre = document.getElementById("input-ciudad-nombre"); //Campo de texto para buscar ciudad
    const inputCiudadAGuardar = document.getElementById("input-ciudad-a-guardar"); //Campo oculto para guardar la ciudad actual

    const ciudadNombreDisplay = document.getElementById("ciudad-nombre");
    const temperaturaDisplay = document.getElementById("temperatura");
    const condicionDisplay = document.getElementById("condicion");
    const fondoClima = document.getElementById('fondo-clima'); //Referencia al div del fondo

    //Panel de favoritas y URL para eliminar
    const panelFavoritas = document.querySelector('.panel-favoritas');
    const ELIMINAR_CIUDAD_URL = panelFavoritas ? panelFavoritas.dataset.eliminarUrl : null;

    //No necesitamos el objeto 'backgrounds' aquí si la imagen principal
    //la establece Django a través de la variable CSS '--background-image-url'.
    //Este objeto 'efectos' es para aplicar filtros adicionales basados en la condición climática.
    const efectosVisualesPorCondicion = {
        'Mist': "blur(2px) brightness(0.9)",
        'Snow': "brightness(1.1) saturate(1.2)",
        'Rain': "brightness(0.8) saturate(0.8)",
        'Thunderstorm': "brightness(0.7) contrast(1.1)",
        'Drizzle': "brightness(0.95) saturate(0.9)",
        'Clouds': "brightness(0.9)",
        'Clear': "brightness(1.05)",
        'Fog': "blur(3px) brightness(0.85)",
        'Smoke': "blur(1px) brightness(0.8) grayscale(0.2)",
    };

    //Función para aplicar efectos visuales al fondo según la condición climática
    //Si la condición no está en el objeto, se aplica "none" (sin efecto).
    function aplicarEfectosVisuales(conditionMain) {
        if (fondoClima) {
            const efecto = efectosVisualesPorCondicion[conditionMain] || "none";
            fondoClima.style.filter = efecto;
        }
    }

    //Función para obtener el clima de una ciudad usando la API de OpenWeatherMap
    //y actualizar los elementos del DOM con la información obtenida.
    function obtenerClima(ciudad) {
        if (!API_KEY) {
            console.error("API Key de OpenWeatherMap no definida.");
            if (ciudadNombreDisplay) ciudadNombreDisplay.textContent = "Error de configuración";
            return;
        }
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ciudad)}&units=metric&lang=es&appid=${API_KEY}`;

        fetch(url)
            .then(res => {
                if (!res.ok) {
                    //Si la ciudad no se encuentra (404) u otro error HTTP
                    if (res.status === 404) {
                        throw new Error(`No se encontró el clima para la ciudad: ${ciudad}`);
                    }
                    throw new Error(`Error HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (ciudadNombreDisplay) ciudadNombreDisplay.textContent = `Clima en ${data.name}`;
                
                //Solo actualiza el input de búsqueda si está vacío o es diferente,
                //para no interrumpir si el usuario está escribiendo.
                if (inputCiudadNombre && (inputCiudadNombre.value === "" || inputCiudadNombre.value.toLowerCase() !== data.name.toLowerCase())) {
                    //inputCiudadNombre.value = data.name; // Podrías decidir si quieres rellenar esto
                }
                //Actualiza el campo oculto para guardar la ciudad actual
                //Solo lo actualizamos si el input de búsqueda está vacío o es diferente
                if (inputCiudadAGuardar) inputCiudadAGuardar.value = data.name;

                if (temperaturaDisplay) temperaturaDisplay.textContent = `Temperatura: ${data.main.temp.toFixed(1)} °C`; // toFixed(1) para un decimal
                if (condicionDisplay) condicionDisplay.textContent = `Condición: ${data.weather[0].description}`;

                aplicarEfectosVisuales(data.weather[0].main); //Aplicar filtros visuales
                ciudadActual = data.name; // ctualizar ciudadActual con el nombre validado por la API
            })
            //Manejo de errores
            .catch(err => {
                console.error("Error al obtener el clima: ", err.message);
                if (ciudadNombreDisplay) ciudadNombreDisplay.textContent = err.message; //Mostrar error al usuario
                if (temperaturaDisplay) temperaturaDisplay.textContent = `Temperatura: -- °C`;
                if (condicionDisplay) condicionDisplay.textContent = `Condición: --`;
                if (fondoClima) fondoClima.style.filter = "none"; //Resetear filtros en caso de error
            });
    }

    //Event listener para el formulario de búsqueda de ciudad
    if (formCiudad) {
        formCiudad.addEventListener("submit", function (e) {
            //No prevenimos el comportamiento por defecto (e.preventDefault()).
            //La página se recargará, y Django/views.py obtendrá la nueva imagen de fondo
            //y la nueva data-ciudad-inicial para el script.
            const nuevaCiudadBuscada = inputCiudadNombre.value.trim();
            if (nuevaCiudadBuscada) {
                 
            } else {
                e.preventDefault(); //Prevenir envío si el campo está vacío
                alert("Por favor, introduce una ciudad.");
            }
        });
    }

    //Carga inicial del clima para la ciudad actual (definida por Django o default)
    if (ciudadActual) {
        obtenerClima(ciudadActual);
    }

    //Auto-actualizar clima cada 60 segundos
    setInterval(() => {
        if (ciudadActual) { //Solo actualiza si hay una ciudad válida
            console.log(`Actualizando clima para ${ciudadActual}...`);
            obtenerClima(ciudadActual);
        }
    }, 60000);

    //Event listeners para eliminar ciudades favoritas
    document.querySelectorAll('.eliminar-ciudad').forEach(button => {
        //Añadir un listener a cada botón de eliminar ciudad
        //Usamos 'data-id' para obtener el ID de la ciudad a eliminar
        button.addEventListener('click', function () {
            const ciudadId = this.dataset.id;
            //Validar que la ciudad existe
            if (!ELIMINAR_CIUDAD_URL || !CSRF_TOKEN) {
                console.error("URL para eliminar o CSRF token no definidos.");
                alert("Error de configuración, no se puede eliminar la ciudad.");
                return;
            }

            //Confirmar la acción de eliminación
            if (!confirm(`¿Estás seguro de que quieres eliminar esta ciudad de tus favoritas?`)) {
                return;
            }

            //Realizar la petición para eliminar la ciudad
            //Usamos 'fetch' para enviar una petición POST al servidor
            fetch(ELIMINAR_CIUDAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': CSRF_TOKEN
                },
                body: `ciudad_id=${ciudadId}`
            })
            //Manejo de la respuesta
            //Si la respuesta no es 200 (OK), mostramos un error
            .then(res => {
                if (!res.ok) {
                    return res.json().then(errData => { throw new Error(errData.error || `Error del servidor: ${res.status}`) });
                }
                return res.json();
            })
            //Si la ciudad se eliminó correctamente, actualizamos el DOM
            //Buscamos el elemento de la ciudad en el DOM usando su ID
            .then(data => {
                if (data.success) {
                    const elementoCiudad = document.getElementById(`ciudad-${ciudadId}`);
                    if (elementoCiudad) {
                        elementoCiudad.remove();
                    }
                } else {
                    console.error("Error al eliminar la ciudad desde el servidor:", data.error || "Error desconocido");
                    alert(data.error || "No se pudo eliminar la ciudad.");
                }
            })
            //Manejo de errores
            //Si hay un error en la petición o en el servidor, lo mostramos al usuario
            .catch(error => {
                console.error("Error en la petición fetch para eliminar ciudad:", error);
                alert(`Error al procesar la solicitud: ${error.message}`);
            });
        });
    });

});