from django.contrib import admin
from django.urls import path
from hips import views


urlpatterns = [
    path('survey/<int:survey_id>', views.survey, name="survey"),
]