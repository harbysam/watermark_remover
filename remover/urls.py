from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/process/', views.process, name='process'),
]
