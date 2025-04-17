import requests
from django.shortcuts import render

def home(request):
    city = request.GET.get('city', 'Vigo')  #busca el parámetro 'city' que viene desde el formulario con el "GET". Ponemos Vigo como default
    weather_data = None             #aquí vamos a guardar los datos del clima

    if city:
        api_key = 'f1d8b93869fc6876f7753af18dc82ccd'  #aquí ponemos la clave que tenemos de OpenWeatherMap
        url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=es' #q={city} el nombre de la ciudad, appid={api_key} la clave de antes, 
        #units=metric para usar ºC, y lang=es para que las descripciones estén en español

        response = requests.get(url) #hace la petición a la API

        if response.status_code == 200: #respuesta 200 si todo va bien
            weather_data = response.json() #convierte la respuesta en un diccionario de Python con json

    return render(request, 'clima/home.html', {'weather': weather_data})
