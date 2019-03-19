from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from . import models
from django.http import HttpResponse
from django.core.files import File
import os
from config.settings.base import STATIC_ROOT, ROOT_DIR, STATICFILES_DIRS

import csv
import pandas as pd
import numpy as np
import json
from ..static.lib.iFacData import iFacData
import scipy
from scipy.spatial.distance import pdist, squareform

import logging
logging.basicConfig(level=logging.INFO)
_log = logging.getLogger(__name__)

class LoadFile(APIView):

	# get method
	def get(self, request, format=None):
		whole_dataset_df = pd.DataFrame({'test': ['yes']})
		iFac = iFacData()
		base = 50	
		domain = "purchase"
		# iFac.generateSingleOutput(domain = domain, base = base)
		logger.info("done")
		return Response(whole_dataset_df.to_json(orient='index'))

class RunRegNTF(APIView):

	def get(self, request, format=None):
		pass

	def post(self, request, format=None):
		json_request = json.loads(request.body.decode(encoding='UTF-8'))		
		iFac = iFacData()
		result = iFac.generateSingleOutput(domain = json_request['domain'], base = json_request['base'], 
			random_seed = json_request['randomIdx'], itemEmbeddings_2d=json_request['itemEmbeddings_2d'],
			reference_matrix = json_request['reference_matrix'])
		return Response(result)
