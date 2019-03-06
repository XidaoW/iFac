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
logger = logging.getLogger(__name__)

class LoadFile(APIView):

	# get method
	def get(self, request, format=None):
		whole_dataset_df = pd.DataFrame({'test': ['yes']})
		iFac = iFacData()
		base = 40	
		domain = "purchase"
		iFac.cur_base = base
		iFac.readData(domain = domain)		
		iFac.saveAttributes()		
		logger.info("sdfsdfsfadsf")
		return Response(whole_dataset_df.to_json(orient='index'))