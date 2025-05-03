from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    # path('registro/', views.registro, name='registro'),
    path('forzar-migraciones/', views.forzar_migraciones, name='forzar_migraciones'),
    path('generar-estaticos/', views.generar_estaticos, name='generar_estaticos'),
    # path('guardar-ciudad/', views.guardar_ciudad, name='guardar_ciudad'),
    # path('eliminar-ciudad/', views.eliminar_ciudad, name='eliminar_ciudad_ajax'),
]
