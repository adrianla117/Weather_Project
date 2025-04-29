from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('registro/', views.registro, name='registro'),
    #path('forzar-migraciones/', views.forzar_migraciones, name='forzar_migraciones'),
]
