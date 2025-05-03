from django.contrib import admin
#from django.contrib.auth import views as auth_views #Importamos las vistas de autenticación de Django
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('clima.urls')),  #Aquí conectamos la app "clima"
    #path('accounts/', include('django.contrib.auth.urls')), #Aquí conectamos las vistas de autenticación de Django
]
