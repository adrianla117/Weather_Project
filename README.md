![Logo_SkyCheck](https://github.com/user-attachments/assets/846d990b-3243-486c-a84a-caf18bc317fd)
SkyCheck es una aplicación web dinámica construida con Django que proporciona información meteorológica actual, permite a los usuarios buscar el clima de ciudades, guardar sus ubicaciones favoritas, localizar el tiempo en un mapa interactivo, comparar el clima entre dos ciudades y disfrutar de recomendaciones de canciones basadas en el tiempo.

![SkyCheck Home Page](https://i.imgur.com/7a1f31.jpg) ## ✨ Características Principales

* **Clima Actual:** Muestra el tiempo actual para ciudades buscadas utilizando la API de OpenWeatherMap.

* **Fondos Dinámicos:** Imágenes de fondo en la página de inicio que cambian según la ciudad buscada (vía Google Places API).

* **Sistema de Usuarios:** Registro e inicio de sesión para una experiencia personalizada.

* **Ciudades Favoritas:**
    * Los usuarios autenticados pueden guardar hasta 3 ciudades favoritas.
    * Visualización del clima actual para cada ciudad favorita en un panel desplegable.
    * Límite de guardado con feedback al usuario.
    
* **Localizador Interactivo:**
    * Página "Localizador" con un mapa Leaflet para explorar el clima.
    * Funcionalidad "Usar mi ubicación actual" para obtener el clima local (usando geolocalización del navegador y OpenCage para geocodificación inversa).
    
* **Comparador de Clima:**
    * Página "Comparador" para ver el clima de dos ciudades lado a lado.
    * Presentación animada de los resultados.
    * Destacados de las diferencias clave entre las dos ciudades.
    * Sugerencias de actividades basadas en el clima.
    * Recomendaciones de canciones de Spotify incrustadas según la condición climática de la primera ciudad.
    
* **Diseño Responsivo:** Adaptado para una buena visualización en dispositivos móviles y de escritorio.

* **Menú de Navegación Fijo:** El menú principal permanece visible al hacer scroll.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Python 3.x, Django
* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Base de Datos:** SQLite (para desarrollo local), PostgreSQL (recomendado para producción)
* **APIs Externas:**
  
    ![image](https://github.com/user-attachments/assets/edcb70d0-9b29-479e-a2e0-f48978ad9f1e)
    * [OpenWeatherMap](http://openweathermap.org/api): Para datos meteorológicos.

    ![image](https://github.com/user-attachments/assets/52d17b11-4167-4004-9fd6-8b0ebe7300be)
    * [Google Places API](http://googleusercontent.com/console.cloud.google.com/1): Para imágenes de fondo de ciudades.

    ![image](https://github.com/user-attachments/assets/7d42de63-2ff9-4d31-bfce-82c7e5af1686)
    * [OpenCage Geocoding API](http://opencagedata.com/api): Para geocodificación inversa en el Localizador.

    ![image](https://github.com/user-attachments/assets/dc38697f-67a2-4d0b-926a-63a834995c78)
    * [Spotify Embeds](http://googleusercontent.com/developer.spotify.com/1): Para recomendaciones de música.
  
* **Librerías JavaScript:**
    * [Leaflet.js](http://leafletjs.com/): Para mapas interactivos.

* **Servidor WSGI (Producción):** Gunicorn

* **Servicio de Archivos Estáticos (Producción):** WhiteNoise

* **Plataforma de Despliegue (Prevista):** [Render](http://render.com/)

## 🚀 Configuración e Instalación (Desarrollo Local)

1.  **Prerrequisitos:**
    * Python 3.8 o superior
    * pip (gestor de paquetes de Python)
    * Git

2.  **Clonar el Repositorio:**
    ```bash
    git clone URL_DE_TU_REPOSITORIO_EN_GITHUB
    cd Weather_Project
    ```

3.  **Crear y Activar un Entorno Virtual:**
    ```bash
    python -m venv venv
    # En Windows:
    # venv\Scripts\activate
    # En macOS/Linux:
    source venv/bin/activate
    ```

4.  **Instalar Dependencias:**
    Asegúrate de tener un archivo `requirements.txt` con todas las dependencias (Django, requests, gunicorn, whitenoise, dj-database-url, python-dotenv, googlemaps, etc.).
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configurar Variables de Entorno (API Keys):**
    Es **altamente recomendable** no escribir las API keys directamente en el código. Para desarrollo local, puedes usar un archivo `.env`.
    
    * Crea un archivo llamado `.env` en la raíz del proyecto (`Weather_Project/.env`).
   
    * Añade tus claves (reemplaza `your_..._key` con tus claves reales):
        ```env
        SECRET_KEY='tu_django_secret_key_super_secreta'
        DEBUG=True
        DATABASE_URL='sqlite:///db.sqlite3'
        OPENWEATHERMAP_API_KEY='your_openweathermap_api_key'
        GOOGLE_PLACES_API_KEY='your_google_places_api_key'
        # Para las claves usadas en JavaScript (OpenCage):
        # Es más seguro pasarlas desde Django a la plantilla o tener un endpoint backend.
        # Si las mantienes en JS temporalmente:
        # GEOCODING_API_KEY_JS='your_opencage_api_key'
        ```
        
    * Asegúrate de que tu `settings.py` carga estas variables (por ejemplo, usando `python-dotenv`):
        ```python
        # Al inicio de settings.py
        import os
        from pathlib import Path
        from dotenv import load_dotenv

        BASE_DIR = Path(__file__).resolve().parent.parent
        load_dotenv(os.path.join(BASE_DIR, '.env')) # Carga .env

        SECRET_KEY = os.environ.get('SECRET_KEY')
        DEBUG = os.environ.get('DEBUG', 'False') == 'True'
        OPENWEATHERMAP_API_KEY = os.environ.get('OPENWEATHERMAP_API_KEY')
        GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
        # ...etc.
        ```
        *(Nota: Tu `settings.py` actual tiene las claves directamente. Considera moverlas a variables de entorno para mayor seguridad, especialmente para `SECRET_KEY` y las API keys).*

7.  **Aplicar Migraciones de la Base de Datos:**
    ```bash
    python manage.py migrate
    ```

8.  **Crear un Superusuario (opcional, para acceder al Admin de Django):**
    ```bash
    python manage.py createsuperuser
    ```

9.  **Ejecutar el Servidor de Desarrollo:**
    ```bash
    python manage.py runserver
    ```
    La aplicación estará disponible en `http://127.0.0.1:8000/`.

## 🔧 Configuración de API Keys

Para una funcionalidad completa, necesitarás obtener y configurar las siguientes API keys:

* **OpenWeatherMap API Key:** Para los datos del clima. Consíguela en [OpenWeatherMap](http://openweathermap.org/appid).

* **Google Places API Key:** Para las imágenes de fondo. Necesitas habilitar "Places API" y "Maps JavaScript API" (aunque solo uses Places para fotos) en [Google Cloud Console](http://googleusercontent.com/console.cloud.google.com/1).

* **OpenCage Geocoding API Key:** Para convertir coordenadas a nombres de lugar en el "Localizador". Consíguela en [OpenCage Data](http://opencagedata.com/).

Estas claves se configuran en `weatherproject/settings.py` (o, preferiblemente, como variables de entorno). La clave de OpenCage se usa actualmente en los archivos JavaScript (`localizador_script.js` y `comparador_script.js`).

## ☁️ Despliegue (Render.com)

Esta aplicación está preparada para desplegarse en Render.

* **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
    *(Asegúrate de que las migraciones se ejecuten. Puedes poner `python manage.py migrate` en un "Pre-deploy Command" en Render si lo prefieres o si tu base de datos tarda en estar lista).*
  
* **Start Command:** `gunicorn weatherproject.wsgi --bind 0.0.0.0:$PORT`

* **Variables de Entorno en Render:**
    * `SECRET_KEY`
    * `DEBUG` (establecer a `False`)
    * `DATABASE_URL` (Render la proveerá si usas su servicio de PostgreSQL)
    * `OPENWEATHERMAP_API_KEY`
    * `GOOGLE_PLACES_API_KEY`
    * `PYTHON_VERSION` (ej: `3.10.4`)
    * `WEB_CONCURRENCY` (para Gunicorn, ej: `3`)
  
* `ALLOWED_HOSTS` en `settings.py` debe incluir `os.environ.get('RENDER_EXTERNAL_HOSTNAME')` y tus dominios personalizados.

* WhiteNoise está configurado para servir archivos estáticos.

## 📁 Estructura del Proyecto (Simplificada)
![image](https://github.com/user-attachments/assets/ab63d1e3-22b5-4406-9a5b-ff1786189c3e)

## 🔮 Posibles Futuras Mejoras

* Implementar caché para las llamadas a la API del clima para mejorar el rendimiento y no exceder los límites de las APIs.
* Permitir a los usuarios personalizar más aspectos (ej. unidades de temperatura).
* Mejorar la visualización en dispositivos móviles.
* Mejorar el servidor web para mejorar la rapidez.
