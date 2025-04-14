from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('clima.urls')),  #Aquí conectamos la app "clima"
]
