from django.db import models
from django.contrib.auth.models import User #Importamos el modelo de usuario de Django para poder relacionar las ciudades favoritas con los usuarios registrados

#Creamos el modelo de ciudades favoritas para guardar las ciudades que le gusten a los usuarios registrados
class CiudadFavorita(models.Model):
    nombre = models.CharField(max_length=100)  #Nombre de la ciudad
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)  #Usuario que ha añadido la ciudad favorita

    def __str__(self):
        return f"{self.nombre} ({self.usuario.username})"  #Devuelve el nombre de la ciudad al imprimir el objeto
