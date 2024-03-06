import os.path

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from hips.models import Survey
from hips import hipster3d


# Create your views here.
def index(request):
    surveys = Survey.objects.all()
    template = loader.get_template('hips/index.html')
    context = {
        'surveys': surveys
    }
    return HttpResponse(template.render(context, request))


def survey(request, survey_id):
    survey = Survey.objects.get(id=survey_id)
    template = loader.get_template('hips/survey.html')
    context = {
        'survey': survey
    }
    return HttpResponse(template.render(context, request))

def create_survey(request):
    survey_name = request.POST['survey-name']
    survey_description = request.POST['survey-descr']
    max_order = int(request.POST['max-order'])
    image_file = request.FILES['cutouts']
    pc_file = request.FILES['clouds']
    catalog = request.FILES['catalog']
    survey = hipster3d.create_survey(survey_name, survey_description, max_order, image_file, pc_file, catalog)
    return survey(request, survey.id)



