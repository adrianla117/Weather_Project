import requests
import googlemaps
import base64
from django.shortcuts import render
from django.contrib.auth import login
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings #Para acceder a las API keys desde settings.py
from .forms import RegistroForm
from django.contrib.auth.decorators import login_required
from .models import CiudadFavorita
from django.http import JsonResponse, HttpResponse
from django.core.management import call_command

def forzar_migraciones(request):
    call_command('migrate')
    return HttpResponse("Migraciones aplicadas correctamente.")

def home(request):
    city_query = request.GET.get('city', 'Vigo')
    weather_data = None
    background_image_data_uri = None
    favoritas = []
    processed_city_name = city_query

    # 1. Obtener datos del clima de OpenWeatherMap
    openweathermap_api_key = getattr(settings, 'OPENWEATHERMAP_API_KEY', None)
    if not openweathermap_api_key:
        print("ADVERTENCIA: OPENWEATHERMAP_API_KEY no está configurada en settings.py")

    if city_query and openweathermap_api_key:
        weather_url = f'https://api.openweathermap.org/data/2.5/weather?q={city_query}&appid={openweathermap_api_key}&units=metric&lang=es'
        try:
            response = requests.get(weather_url)
            response.raise_for_status() # Lanza error para 4xx/5xx
            weather_data = response.json()
            if weather_data and 'name' in weather_data:
                processed_city_name = weather_data['name']
        except requests.exceptions.RequestException as e:
            print(f"Error al obtener datos del clima para {city_query}: {e}")
            weather_data = None # Asegura que es None si falla

    # 2. Obtener imagen de la ciudad de Google Places API
    google_places_api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
    # Usamos un placeholder reconocible para la verificación de la clave en settings.py
    placeholder_google_key = 'LA_NUEVA_CLAVE_API_QUE_CREASTE_EN_GOOGLE_CLOUD' 

    if not google_places_api_key or google_places_api_key == placeholder_google_key:
        if not getattr(settings, 'SUPPRESS_GOOGLE_KEY_WARNING', False): # Para evitar spam en logs si es intencional
            print("ADVERTENCIA: GOOGLE_PLACES_API_KEY no está configurada correctamente en settings.py o es el placeholder.")
    
    city_for_image_search = processed_city_name # Usar nombre canónico si está disponible

    if city_for_image_search and google_places_api_key and google_places_api_key != placeholder_google_key:
        gmaps = googlemaps.Client(key=google_places_api_key)
        try:
            places_result = gmaps.places(query=city_for_image_search)
            if places_result and places_result.get('results'):
                place_id = places_result['results'][0]['place_id']
                place_details = gmaps.place(place_id=place_id, fields=['photo', 'name']) # Campo 'photo'
                
                if place_details and place_details.get('result') and place_details.get('result').get('photos'):
                    photo_reference = place_details['result']['photos'][0]['photo_reference']
                    image_bytes_generator = gmaps.places_photo(photo_reference=photo_reference, max_width=1600)
                    image_bytes = b"".join(chunk for chunk in image_bytes_generator if chunk)
                    
                    if image_bytes:
                        base64_encoded_data = base64.b64encode(image_bytes)
                        base64_message = base64_encoded_data.decode('utf-8')
                        background_image_data_uri = f"data:image/jpeg;base64,{base64_message}"
        except googlemaps.exceptions.ApiError as api_err:
            print(f"Error de API de Google Places para {city_for_image_search}: {api_err}")
            background_image_data_uri = None
        except Exception as e:
            print(f"Excepción general al obtener/procesar imagen de Google Places para {city_for_image_search}: {e}")
            background_image_data_uri = None

    # 3. Obtener ciudades favoritas
    if request.user.is_authenticated:
        favoritas = CiudadFavorita.objects.filter(usuario=request.user)

    # 4. Preparar contexto y renderizar
    context_city_name = weather_data.get('name') if weather_data and weather_data.get('name') else city_query

    context = {
        'weather': weather_data,
        'favoritas': favoritas,
        'background_image_url': background_image_data_uri,
        'current_city_name': context_city_name
    }
    
    return render(request, 'clima/home.html', context)

def registro(request):
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  #Inicia sesión automáticamente después del registro
            return redirect('home')  #Redirige a la vista de inicio después del registro exitoso
    else:
        form = RegistroForm()
    return render(request, 'registration/registro.html', {'form': form})

@login_required
def guardar_ciudad(request): #Vista para guardar la ciudad favorita del usuario
    if request.method == 'POST':
        nombre = request.POST.get('nombre_ciudad') #Obtiene el nombre de la ciudad del formulario
        #Si el usuario está autenticado, guarda la ciudad favorita
        if nombre:
            #Evita duplicados
            existe = CiudadFavorita.objects.filter(usuario=request.user, nombre__iexact=nombre).exists()
            if not existe:
                CiudadFavorita.objects.create(usuario=request.user, nombre=nombre) #Crea la ciudad favorita si no existe
    return redirect('home') #Redirige a la vista de inicio después de guardar la ciudad favorita

@login_required
def eliminar_ciudad_ajax(request):
    if request.method == 'POST':
        ciudad_id = request.POST.get('ciudad_id')
        ciudad = get_object_or_404(CiudadFavorita, id=ciudad_id, usuario=request.user)
        ciudad.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)


def generar_estaticos(request): #Vista para generar archivos estáticos
    #Ejecuta el comando collectstatic para recopilar archivos estáticos
    call_command('collectstatic', interactive=False)
    return HttpResponse("Archivos estáticos recopilados.")