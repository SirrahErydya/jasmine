from django.db import models
import os


# Create your models here
def survey_path(instance, filename):
    return os.path.join('static/surveys/', instance.name, filename)


def survey_cutout_path(instance, filename):
    return os.path.join('static/surveys/', instance.name, "cutouts", filename)


def survey_model_path(instance, filename):
    return os.path.join('static/surveys/', instance.name, "pointclouds", filename)


class Survey(models.Model):
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=128)
    catalog = models.FileField(upload_to=survey_path)


class DataPoint(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=128)
    cutout = models.ImageField(upload_to=survey_cutout_path)
    model_3d = models.FileField(upload_to=survey_model_path)
    healpix_idx = models.IntegerField()
