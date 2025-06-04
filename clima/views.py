import requests
import googlemaps
import base64
from django.contrib.auth import login
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings #Para acceder a las API keys desde settings.py
from .forms import RegistroForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages #Importar messages
from .models import CiudadFavorita
from django.http import JsonResponse, HttpResponse
from django.core.management import call_command

def home(request):
    city_query = request.GET.get('city', 'Vigo')
    main_weather_data = None
    background_image_data_uri = None #Asumiendo que sigues usando esto para el fondo
    processed_city_name = city_query

    openweathermap_api_key = getattr(settings, 'OPENWEATHERMAP_API_KEY', None)
    google_places_api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)

    if not openweathermap_api_key:
        print("ADVERTENCIA: OPENWEATHERMAP_API_KEY no está configurada.")
        messages.error(request, "Error de configuración del servidor: No se puede obtener el clima.")


    #Obtener clima para la ciudad principal buscada
    if city_query and openweathermap_api_key:
        weather_url = f'https://api.openweathermap.org/data/2.5/weather?q={city_query}&appid={openweathermap_api_key}&units=metric&lang=es'
        #Usamos 'metric' para Celsius y 'lang=es' para español
        try:
            response = requests.get(weather_url)
            response.raise_for_status()
            main_weather_data = response.json()
            if main_weather_data and 'name' in main_weather_data:
                processed_city_name = main_weather_data['name']
        except requests.exceptions.RequestException as e:
            print(f"Error al obtener datos del clima para {city_query}: {e}")
            messages.error(request, f"No se pudo obtener el clima para '{city_query}'. Intenta con otra ciudad.")
            main_weather_data = None #Asegura que es None si falla

    #Obtener imagen de la ciudad de Google Places API
    #Obtener imagen de la ciudad de Google Places API
    google_places_api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
    #Usamos un placeholder reconocible para la verificación de la clave en settings.py
    placeholder_google_key = 'LA_NUEVA_CLAVE_API_QUE_CREASTE_EN_GOOGLE_CLOUD'

    #Verifica si la clave está configurada o es el placeholder
    #Si no está configurada, se muestra un mensaje de advertencia
    #Verifica si la clave está configurada o es el placeholder
    #Si no está configurada, se muestra un mensaje de advertencia
    if not google_places_api_key or google_places_api_key == placeholder_google_key:
        if not getattr(settings, 'SUPPRESS_GOOGLE_KEY_WARNING', False): #Para evitar spam en logs si es intencional
        if not getattr(settings, 'SUPPRESS_GOOGLE_KEY_WARNING', False): #Para evitar spam en logs si es intencional
            print("ADVERTENCIA: GOOGLE_PLACES_API_KEY no está configurada correctamente en settings.py o es el placeholder.")
    
    city_for_image_search = processed_city_name #Usar nombre canónico si está disponible
    city_for_image_search = processed_city_name #Usar nombre canónico si está disponible

    #Si la ciudad no existe
    #Si la ciudad no existe
    if city_for_image_search and google_places_api_key and google_places_api_key != placeholder_google_key:
        #Usar Google Places API para obtener una imagen de fondo
        #Usar Google Places API para obtener una imagen de fondo
        gmaps = googlemaps.Client(key=google_places_api_key)
        #Realiza la búsqueda de lugares en Google Places API
        #Realiza la búsqueda de lugares en Google Places API
        try:
            places_result = gmaps.places(query=city_for_image_search)
            #Verifica si hay resultados
            #Verifica si hay resultados
            if places_result and places_result.get('results'):
                #Si hay resultados, toma el primero
                #y obtiene el place_id para obtener detalles
                #Si hay resultados, toma el primero
                #y obtiene el place_id para obtener detalles
                place_id = places_result['results'][0]['place_id']
                #Obtenemos detalles del lugar
                #y solicitamos el campo 'photo' para obtener la imagen
                place_details = gmaps.place(place_id=place_id, fields=['photo', 'name']) #Campo 'photo'
                #Obtenemos detalles del lugar
                #y solicitamos el campo 'photo' para obtener la imagen
                place_details = gmaps.place(place_id=place_id, fields=['photo', 'name']) #Campo 'photo'
                
                #Verifica si hay fotos disponibles y si el campo 'photo' está presente
                #Verifica si hay fotos disponibles y si el campo 'photo' está presente
                if place_details and place_details.get('result') and place_details.get('result').get('photos'):
                    #Si hay fotos, tomamos la primera y obtenemos el 'photo_reference' para descargar la imagen
                    #Si hay fotos, tomamos la primera y obtenemos el 'photo_reference' para descargar la imagen
                    photo_reference = place_details['result']['photos'][0]['photo_reference']
                    #Obtenemos la imagen usando el 'photo_reference' y la convertimos a base64 para usarla como URI de datos
                    #Obtenemos la imagen usando el 'photo_reference' y la convertimos a base64 para usarla como URI de datos
                    image_bytes_generator = gmaps.places_photo(photo_reference=photo_reference, max_width=1600)
                    #Generamos la imagen en bytes y la convertimos a base64
                    #Generamos la imagen en bytes y la convertimos a base64
                    image_bytes = b"".join(chunk for chunk in image_bytes_generator if chunk)
                    
                    #Verifica si la imagen se generó correctamente
                    #Verifica si la imagen se generó correctamente
                    if image_bytes:
                        #Codifica la imagen en base64 y crea un URI de datos para usar en el HTML
                        #Codifica la imagen en base64 y crea un URI de datos para usar en el HTML
                        base64_encoded_data = base64.b64encode(image_bytes)
                        #Decodifica los bytes a UTF-8 para crear el URI de datos y lo formatea como un URI de datos de imagen JPEG
                        #Decodifica los bytes a UTF-8 para crear el URI de datos y lo formatea como un URI de datos de imagen JPEG
                        base64_message = base64_encoded_data.decode('utf-8')
                        background_image_data_uri = f"data:image/jpeg;base64,{base64_message}"
        
        
        except googlemaps.exceptions.ApiError as api_err:
            print(f"Error de API de Google Places para {city_for_image_search}: {api_err}")
            background_image_data_uri = None
        
        
        except Exception as e:
            print(f"Excepción general al obtener/procesar imagen de Google Places para {city_for_image_search}: {e}")
            background_image_data_uri = None

    #Obtener clima para las ciudades favoritas
    favoritas_con_clima = []
    num_favoritas_actuales = 0
    MAX_FAVORITAS = 3 #Límite de ciudades favoritas

    if request.user.is_authenticated:
        lista_favoritas_db = CiudadFavorita.objects.filter(usuario=request.user)
        num_favoritas_actuales = lista_favoritas_db.count() #Contar desde la base de datos

        if openweathermap_api_key:
            for fav_ciudad_obj in lista_favoritas_db:
                ciudad_data_para_template = {'ciudad': fav_ciudad_obj, 'weather': None, 'icon_url': None}
                fav_weather_url = f'https://api.openweathermap.org/data/2.5/weather?q={fav_ciudad_obj.nombre}&appid={openweathermap_api_key}&units=metric&lang=es'
                try:
                    fav_response = requests.get(fav_weather_url, timeout=5) #Timeout para evitar esperas largas
                    fav_response.raise_for_status()
                    weather_json = fav_response.json()
                    if weather_json.get("cod") == 200:
                        ciudad_data_para_template['weather'] = weather_json
                        if weather_json.get('weather') and len(weather_json['weather']) > 0:
                            icon_code = weather_json['weather'][0].get('icon')
                            if icon_code:
                                ciudad_data_para_template['icon_url'] = f"http://openweathermap.org/img/wn/{icon_code}.png"
                except requests.exceptions.RequestException as e:
                    print(f"Error al obtener clima para favorita {fav_ciudad_obj.nombre}: {e}")
                favoritas_con_clima.append(ciudad_data_para_template)
        else: #Si no hay API key, solo pasar los nombres
            for fav_ciudad_obj in lista_favoritas_db:
                favoritas_con_clima.append({'ciudad': fav_ciudad_obj, 'weather': None, 'icon_url': None})
    
    puede_anadir_mas = num_favoritas_actuales < MAX_FAVORITAS

    context_city_name_for_display = main_weather_data.get('name') if main_weather_data and main_weather_data.get('name') else city_query

    context = {
        'weather': main_weather_data,
        'favoritas_con_clima': favoritas_con_clima,
        'background_image_url': background_image_data_uri,
        'current_city_name': context_city_name_for_display,
        'puede_anadir_mas': puede_anadir_mas,
        'MAX_FAVORITAS': MAX_FAVORITAS,
        'num_favoritas_actuales': num_favoritas_actuales
        'current_city_name': context_city_name_for_display,
        'puede_anadir_mas': puede_anadir_mas,
        'MAX_FAVORITAS': MAX_FAVORITAS,
        'num_favoritas_actuales': num_favoritas_actuales
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
def guardar_ciudad(request):
def guardar_ciudad(request):
    if request.method == 'POST':
        nombre_ciudad_a_guardar = request.POST.get('nombre_ciudad')
        
        #Verifica si se ha proporcionado un nombre de ciudad
        #y si el usuario está autenticado
        if nombre_ciudad_a_guardar and request.user.is_authenticated:
            MAX_FAVORITAS = 3
            num_favoritas_actuales = CiudadFavorita.objects.filter(usuario=request.user).count()
            existe = CiudadFavorita.objects.filter(usuario=request.user, nombre__iexact=nombre_ciudad_a_guardar).exists()

            if existe:
                messages.info(request, f"'{nombre_ciudad_a_guardar}' ya está en tus favoritas.")
            elif num_favoritas_actuales >= MAX_FAVORITAS:
                messages.warning(request, f"Has alcanzado el límite de {MAX_FAVORITAS} ciudades favoritas. Elimina una para añadir una nueva.")
            else:
                CiudadFavorita.objects.create(usuario=request.user, nombre=nombre_ciudad_a_guardar)
                messages.success(request, f"'{nombre_ciudad_a_guardar}' ha sido añadida a tus favoritas.")
        elif not nombre_ciudad_a_guardar:
            messages.error(request, "No se proporcionó un nombre de ciudad para guardar.")
            
    return redirect('home') #Siempre redirige a home

@login_required
def eliminar_ciudad_ajax(request):
    if request.method == 'POST':
        ciudad_id = request.POST.get('ciudad_id')
        ciudad = get_object_or_404(CiudadFavorita, id=ciudad_id, usuario=request.user)
        ciudad.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)

#Localizador de ciudades
def localizador_view(request):
    #Contexto para la vista del localizador
    context = {}
    return render(request, 'clima/localizador.html', context)

#Comparador entre ciudades de sus climas
def comparador_view(request):
    return render(request, 'clima/comparador.html')