from django.urls import path
from hips import views

app_name = 'hips'
urlpatterns = [
    path('survey/<int:survey_id>', views.survey, name="survey"),
    path('create_survey', views.create_survey, name="create_survey")
]