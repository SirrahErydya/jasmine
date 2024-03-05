from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from hips.models import Survey


# Create your views here.
def index(request):
    surveys = Survey.objects.all()
    template = loader.get_template('hips/index.html')
    context = {
        'surveys': surveys
    }
    return HttpResponse(template.render(context, request))


def survey(request, survey_id):
    pass