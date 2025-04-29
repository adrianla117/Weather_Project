import requests
from django.shortcuts import render
from django.contrib.auth import login
from django.shortcuts import render, redirect
from .forms import RegistroForm
from django.contrib.auth.decorators import login_required
from .models import CiudadFavorita
from django.http import JsonResponse

from django.http import HttpResponse
from django.core.management import call_command

def forzar_migraciones(request):
    call_command('migrate')
    return HttpResponse("Migraciones aplicadas correctamente.")


def home(request):
    city = request.GET.get('city', 'Vigo')  #busca el parámetro 'city' que viene desde el formulario con el "GET". Ponemos Vigo como default
    weather_data = None             #aquí vamos a guardar los datos del clima
    favoritas = []

    if city:
        api_key = 'f1d8b93869fc6876f7753af18dc82ccd'  #aquí ponemos la clave que tenemos de OpenWeatherMap
        url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=es' #q={city} el nombre de la ciudad, appid={api_key} la clave de antes, 
        #units=metric para usar ºC, y lang=es para que las descripciones estén en español

        response = requests.get(url) #hace la petición a la API

        if response.status_code == 200: #respuesta 200 si todo va bien
            weather_data = response.json() #convierte la respuesta en un diccionario de Python con json

    #Si el usuario está autenticado, recuperar su favoritas
    if request.user.is_authenticated:
        favoritas = CiudadFavorita.objects.filter(usuario=request.user) #Filtra las ciudades favoritas del usuario autenticado

    return render(request, 'clima/home.html', {
        'weather': weather_data,
        'favoritas': favoritas, #Pasa las ciudades favoritas al template
    })


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
def eliminar_ciudad(request):
    if request.method == 'POST':
        ciudad_id = request.POST.get('ciudad_id')
        ciudad = get_object_or_404(CiudadFavorita, id=ciudad_id, usuario=request.user)
        ciudad.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=400)