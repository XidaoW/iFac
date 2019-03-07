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
		_log.info(json_request['reference_matrix'])
		whole_dataset_df = pd.DataFrame({'test': ['yes']})
		iFac = iFacData()
		base = json_request['base']
		domain = json_request['domain']
		randomIdx = json_request['randomIdx']
		lambda_0 = json_request['lambda_0']
		lambda_1 = json_request['lambda_1']
		reference_matrix = []
		for x1 in json_request['reference_matrix']:
			reference_matrix.append(np.asarray(x1).T)
		result = iFac.generateSingleOutput(domain = domain, base = base, 
			random_seed = randomIdx,
			reference_matrix = reference_matrix,
			lambda_0 = lambda_0, lambda_1 = lambda_1)
		return Response(result)
