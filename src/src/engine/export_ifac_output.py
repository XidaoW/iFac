#!/usr/bin/python
# -*- coding:utf-8 -*-
'''
Created on 2019/01/02

@author: xidaowen
'''

import ntf
from myutil.histogram import createHistogram, translateLabel
from myutil.plotter import showFactorValue, showHistDistribution
from myutil.ponpare.reader import readPonpareData
from myutil.ponpare.converter import     digitizeHistoryFeatureValue, transformForHistogram
from multiview import mvmds, cpcmv, mvtsne, mvsc

from sklearn.utils.testing import assert_raises


import scipy
import numpy as np
import pandas as pd
from scipy import stats
# from scipy.special import entr
from scipy import spatial

import sys
import json
from pyspark import SparkConf, SparkContext
import itertools

import logging
logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('iTnFac')


def showLabel(label):
	for i1, lbl1 in enumerate(label):
		print("label:[%d] ->" % i1)
		for lbl2 in lbl1:
			print(lbl2 + ",")
		print("")


class iFacData():
	def __init__(self):
		self.domain = ""
		self.labels = []
		self.base = 0
		self.cur_base = 0
		self.hist = None
		

	def createDataHistogram(self, dataFrame, extractColumn):
		group = dataFrame.groupby(extractColumn).size()
		index = group.index
		hist = np.zeros(list(map(len, index.levels)))
		for i1, pos in enumerate(zip(*index.labels)):
			hist[pos] = group.values[i1]
			labels = [list(i) for i in index.levels]
		return hist, labels

        		
	def readData(self, domain = "nba", columns = []):
		"""
		read in the data and create labels
		"""
		self.domain = domain
		if self.domain == "nba":
			shots = pd.read_csv("data/NBA_shots_201415.csv")
			shots = shots[['PLAYER_ID','PLAYER_NAME','TEAM_ID','TEAM_NAME','ZoneName','PERIOD','SHOT_ATTEMPTED_FLAG','SHOT_MADE_FLAG']]
			shots.PERIOD[shots.PERIOD > 4] = 5
			self.column = ['PERIOD','TEAM_NAME','ZoneName']
			shots_group_data_attempted = shots.groupby(self.column)['SHOT_ATTEMPTED_FLAG'].sum()
			shots_group_data_attempted1 = shots_group_data_attempted.unstack(fill_value=0).to_panel()
			self.hist = shots_group_data_attempted1.fillna(0).values
			for i in range(len(self.column)):
				each_label = shots_group_data_attempted1.fillna(0).axes[i].tolist()
				each_label = [str(each_one).replace('!', '').replace('(','').replace(')','').replace(' ','') for each_one in each_label]
				self.labels.append(each_label)
			
		if self.domain == "nbaplayer":
			top_cnt = 15
			shots = pd.read_csv("data/NBA_shots_201415.csv")
			shots = shots[['PLAYER_ID','PLAYER_NAME','TEAM_ID','TEAM_NAME','ZoneName','PERIOD','SHOT_ATTEMPTED_FLAG','SHOT_MADE_FLAG']]
			shots.PERIOD[shots.PERIOD > 4] = 5

			self.column = ['PERIOD','PLAYER_NAME','ZoneName']

			shots_total = shots.groupby(['PLAYER_NAME'])['SHOT_ATTEMPTED_FLAG'].sum()
			top_players = list(shots_total.sort_values(ascending=False).iloc[:top_cnt].index)

			shots = shots[shots.PLAYER_NAME.isin(top_players)]
			shots_group_data_attempted = shots.groupby(self.column)['SHOT_ATTEMPTED_FLAG'].sum()
			shots_group_data_made = shots.groupby(self.column)['SHOT_MADE_FLAG'].sum()
			shots_group_data_attempted = shots_group_data_made.div(shots_group_data_attempted, level=0)
			shots_group_data_attempted1 = shots_group_data_attempted.unstack(fill_value=0).to_panel()
			self.hist = shots_group_data_attempted1.fillna(0).values

			for i in range(len(self.column)):
				each_label = shots_group_data_attempted1.fillna(0).axes[i].tolist()
				each_label = [str(each_one).replace('!', '').replace('(','').replace(')','').replace(' ','') for each_one in each_label]
				self.labels.append(each_label)

		elif self.domain == "policy":
			policy = pd.read_csv("data/policy_adoption.csv")
			policy['adoption'] = 1
			policy = policy[policy.adopted_year >= 1970]
			policy = policy[policy.subject_name != "Unknown"]            
			self.column = ['subject_name', 'adopted_year', 'state_id']
			policy_group = policy.groupby(self.column)['adoption'].sum()
			policy_group1 = policy_group.unstack(fill_value=0).to_panel()
			self.hist = policy_group1.fillna(0).values
			for i in range(len(self.column)):
				each_label = policy_group1.fillna(0).axes[i].tolist()
				each_label = [str(each_one).replace('!', '').replace('(','').replace(')','').replace(' ','') for each_one in each_label]
				self.labels.append(each_label)            

		elif self.domain == "harvard":
			harvard = pd.read_csv("/home/xidao/project/hipairfac/output/harvard_data_tensor_students.csv")
			columns = ['id', 'country', 'student', 'education','days','certified','grade','daysq']
			harvard.columns = columns
			self.column = ['country', 'education', 'daysq', 'certified']
			harvard = harvard[self.column]
			self.hist, self.labels = self.createDataHistogram(harvard_new, self.column)

		elif self.domain == "picso":
			policy = pd.read_csv("data/picso.csv", header=None)
			columns = ['member', 'year', 'keyword', 'value']
			policy.columns = columns
			self.column = columns[:3]
			policy_group = policy.groupby(self.column)['value'].sum()
			policy_group1 = policy_group.unstack(fill_value=0).to_panel()
			self.hist = policy_group1.fillna(0).values
			for i in range(len(self.column)):
				each_label = policy_group1.fillna(0).axes[i].tolist()
				each_label = [str(each_one) for each_one in each_label]
				self.labels.append(each_label)  
				
		elif self.domain == "purchase":
			couponAreaTest, couponAreaTrain, couponDetailTrain,                 couponListTest, couponListTrain,                 couponVisitTrain, userList = readPonpareData(valuePrefixed=True)

			# Convert to one-hot expression.
			userList, couponListTrain, couponListTest =                 digitizeHistoryFeatureValue(userList,
											couponListTrain,
											couponListTest)
			# Convert to histogram.
			distribution = transformForHistogram(userList,
												 couponDetailTrain,
												 couponVisitTrain,
												 couponListTrain,
												 couponListTest,
												 couponAreaTrain,
												 couponAreaTest)
			self.column = ["SEX_ID", "GENRE_NAME", "LIST_PREF_NAME","AGE"]
			self.column = ["GENRE_NAME", "SEX_ID", "LIST_PREF_NAME",
                         "AGE", "DISCOUNT_PRICE", "USER_PREF_NAME",
                         "VALIDPERIOD"]                         
			self.hist, bins, label = createHistogram(distribution, self.column) 
			import pdb
			pdb.set_trace()


			self.labels = [['00Male', '01Female'],
						   ['00Gourmet', '01Este', '02Beauty', '03NailEye', '04HairSalon', 
							'05HealthMedicalCare', '06Relaxation', '07Leisure', '08HotelInn',
							'09Lesson','10HomeDelivery','11GiftCard','12OtherCoupons'],
					  ['00北海道', '01青森県', '02岩手県', '03宮城県', '04秋田県', '05山形県', '06福島県', '07茨城県', '08栃木県', '09群馬県', '10埼玉県', '11千葉県', 
					  '12東京都', '13神奈川県', '14新潟県', '15富山県', '16石川県', '17福井県', '18山梨県', '19長野県', '20岐阜県', '21静岡県', '22愛知県', '23三重県', 
					  '24滋賀県', '25京都府', '26大阪府', '27兵庫県', '28奈良県', '29和歌山県', '30鳥取県', '31島根県', '32岡山県', '33広島県', '34山口県', '35徳島県', 
					  '36香川県', '37愛媛県', '38高知県', '39福岡県', '40佐賀県', '41長崎県', '42熊本県', '43大分県', '44宮崎県', '45鹿児島県', '46沖縄県'],
					  ['00under', '01-20', '02-25', '03-30', '04-35', '05-40', '06-45', '07-50', '08-55', '09-60', '10-65', '11-70', '12-75over'],
					  ['00under', '01-100', '02-1000', '03-2000', '04-3000', '05-5000', '06-10000', '07-20000', '08-30000', '09-50000over"']
	
					 ]            

	def computeReconstructionError(self, ntfInstance, hist):    
		"""
		compute the reconstruction error
		type ntfInstance: NTF:
		type hist: np.array: tensor data
		rtype error: float
		"""
		dstHist = ntfInstance.reconstruct()
		srcHist = hist
		diffHist = srcHist - dstHist
		diffHistSum = np.sum(diffHist*diffHist)
		srcHistSum = np.sum(srcHist*srcHist)
		return diffHistSum/srcHistSum

	def computeFit(self, ntfInstance, hist):
		dstHist = ntfInstance.reconstruct()
		mean_hist = np.full(hist.shape, np.mean(hist))
		mean_hist_diff = (mean_hist - hist)
		residual_hist = dstHist - hist
		ss_total = np.sum(mean_hist_diff*mean_hist_diff)		
		ss_res = np.sum(residual_hist*residual_hist)		
		return 1 - ss_res*1. / ss_total


	def saveItemMDS(self):

		from sklearn.manifold import MDS
		self.loadFactors()
		MDS_embeddings = MDS(n_components=1)
		SC_embeddings = MDS(n_components=1)
		
		self.data = [np.array([self.factors[i][j].tolist() for i in range(len(self.factors))]) for j in range(self.column_cnt)]
		self.item_mds = {}
		self.item_mds['mds'] = {}
		self.item_mds['sc'] = {}
		for item_index in range(len(self.data)):
			self.item_mds['mds'][item_index] = MDS_embeddings.fit_transform(self.data[item_index].T).tolist()
			self.item_mds['sc'][item_index] = SC_embeddings.fit_transform(self.data[item_index].T).tolist()
		with open('/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(self.column_cnt)+'_'+str(self.cur_base)+'_sample_item_embedding.json', 'w') as fp:
			json.dump(self.item_mds, fp)

	def savePatternEmbedding(self):
		self.loadFactors()

		self.data = [np.array([self.factors[i][j].tolist() for i in range(len(self.factors))]) for j in range(self.column_cnt)]
		is_distance = [False] * len(self.data)
		mvmds_est = mvmds.MVMDS(k=2)
		self.factor_embeddings = {}
		mvmds_est.fit(self.data, is_distance)
		self.factor_embeddings['mds'] = mvmds_est.components_.tolist()

		self.rd_state = 5
		is_distance = [False] * len(self.data)
		mvtsne_est = mvtsne.MvtSNE(k=2, perplexity = 10,random_state = self.rd_state, epoch = 3000)
		mvtsne_est.fit(self.data, is_distance)
		self.factor_embeddings['tsne'] = np.asarray(mvtsne_est.embedding_).tolist()		

		mvsc_est = mvsc.MVSC(k=2)
		mvsc_est.fit(self.data, is_distance)
		self.factor_embeddings['sc'] = np.asarray(mvsc_est.evectors_).tolist()

		# cpc_est = cpcmv.MVCPC(k=2)
		# self.factor_embeddings['sc'] = cpc_est.fit(self.data)[1].tolist()


		with open('/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(self.column_cnt)+'_'+str(self.cur_base)+'_sample_pattern_embedding.json', 'w') as fp:
			json.dump(self.factor_embeddings, fp)


	def getFitForRanks(self, bases, trials = 5):
		"""
		compute the factors given different ranks and different random initializations
		type bases: int: max number of components
		type trials: int: number of independent trials
		"""

		def pctnonzero(arr, gamma = 1e-03):
			return sum([1 if x > gamma else 0 for x in arr])*1./len(arr)

		def gini(arr):
			# (Warning: This is a concise implementation, but it is O(n**2)
			# in time and memory, where n = len(x).  *Don't* pass in huge
			# samples!)
			# Mean absolute difference
			mad = np.abs(np.subtract.outer(arr, arr)).mean()
			# Relative mean absolute difference
			rmad = mad/np.mean(arr)
			# Gini coefficient
			g = 0.5 * rmad
			return g		

		def normalized_entropy(arr):			
			return stats.entropy(arr) *1. / np.log(len(arr))

		def theil(arr): 
			# natural logarithm is default
			redundancy = np.log(len(arr)) - stats.entropy(arr)
			# inequality = 1 - exp(-redundancy)
			return redundancy



		self.base = bases
		self.trials = trials
		self.all_trials = []
		self.metrics = {"error":[None]*self.base, 
						"fit":[None]*self.base, 
						"stability": [None]*self.base, 
						"entropy": [None]*self.base, 
						"normalized_entropy": [None]*self.base, 
						"pctnonzeros": [None]*self.base, 
						"gini": [None]*self.base, 
						"theil": [None]*self.base, 
						"min_error_index": [None]*self.base}
		
		self.weights_all = [None]*self.base
		self.factors_all = [None]*self.base

		conf = SparkConf().set("spark.driver.maxResultSize", "220g").setAppName("DSGD_NTF")
		self.sc = SparkContext(conf=conf)
		# def getNTF(random_seed, base_cnt, hist):
		# 	ntfInstance = ntf.NTF(base_cnt, hist, parallelCalc=True, ones = False, random_seed = random_seed)
		# 	ntfInstance.factorize(hist, showProgress=True)
		# 	# print(ntfInstance.factor)
		# 	return ntfInstance

		# self.start_index = 2
		for self.base_cnt in range(self.start_index, self.base+1):
			try:
				_log.info("Current Rank: {}".format(self.base_cnt))
				each_rank_trials = []
				for random_seed in range(self.trials):
					_log.info("Current Trial: {}".format(random_seed))
					ntfInstance = ntf.NTF(self.base_cnt, self.hist, parallelCalc=True, ones = False, random_seed = random_seed)
					ntfInstance.factorize(self.hist, showProgress=True)
					each_rank_trials.append(ntfInstance)

				self.all_trials.append(each_rank_trials)
				_log.info("Getting Metric for rank: {}".format(self.base_cnt))
				self.metrics["error"][self.base_cnt-self.start_index] = []
				self.metrics["fit"][self.base_cnt-self.start_index] = []
				self.metrics["stability"][self.base_cnt-self.start_index] = []
				self.metrics["entropy"][self.base_cnt-self.start_index] = []            
				self.metrics["normalized_entropy"][self.base_cnt-self.start_index] = []
				self.metrics["gini"][self.base_cnt-self.start_index] = []            
				self.metrics["theil"][self.base_cnt-self.start_index] = []            
				self.metrics["pctnonzeros"][self.base_cnt-self.start_index] = []
				self.weights_all[self.base_cnt-self.start_index] = []
				self.factors_all[self.base_cnt-self.start_index] = []            
				for random_seed in range(self.trials):
					_log.info("Getting Metric for Trial: {}".format(random_seed))				
					ntfInstance = self.all_trials[self.base_cnt-self.start_index][random_seed]            
					self.metrics["error"][self.base_cnt-self.start_index].append(self.computeReconstructionError(ntfInstance,self.hist))
					self.metrics["fit"][self.base_cnt-self.start_index].append(self.computeFit(ntfInstance,self.hist))
					weights, factors = ntfInstance.getNormalizedFactor()
					self.weights_all[self.base_cnt-self.start_index].append(weights)
					self.factors_all[self.base_cnt-self.start_index].append(factors)
					self.metrics["entropy"][self.base_cnt-self.start_index].append(np.mean([stats.entropy(factors[i][j]) for i in range(len(factors)) for j in range(len(factors[0]))]))
					self.metrics["normalized_entropy"][self.base_cnt-self.start_index].append(np.mean([normalized_entropy(factors[i][j]) for i in range(len(factors)) for j in range(len(factors[0]))]))				
					self.metrics["pctnonzeros"][self.base_cnt-self.start_index].append(np.mean([pctnonzero(factors[i][j]) for i in range(len(factors)) for j in range(len(factors[0]))]))
					self.metrics["theil"][self.base_cnt-self.start_index].append(np.mean([theil(factors[i][j]) for i in range(len(factors)) for j in range(len(factors[0]))]))
					self.metrics["gini"][self.base_cnt-self.start_index].append(np.mean([gini(factors[i][j]) for i in range(len(factors)) for j in range(len(factors[0]))]))
					

				best_fit_index = np.argmin(self.metrics["error"][self.base_cnt-self.start_index])
				self.metrics["min_error_index"][self.base_cnt-self.start_index] = int(best_fit_index)
				self.best_factors = self.factors_all[self.base_cnt-self.start_index][best_fit_index]
				self.best_weights = self.weights_all[self.base_cnt-self.start_index][best_fit_index]
				for random_seed in range(self.trials):
					_log.info("Getting Similarity for Trial: {}".format(random_seed))				
					self.cur_factors = self.factors_all[self.base_cnt-self.start_index][random_seed]
					self.cur_weights = self.weights_all[self.base_cnt-self.start_index][random_seed]
					self.metrics["stability"][self.base_cnt-self.start_index].append(self.maxFactorSimilarity(self.cur_factors, self.cur_weights, self.best_factors, self.best_weights, self.base_cnt))   
				self.cur_base = self.base_cnt                 
				self.saveAttributes()
			except:
				# raise
				continue
					

	def maxFactorSimilarity(self, cur_factors, cur_weights, best_factors, best_weights, base_cnt):
		"""
		compute the max similarity to a given set of factors by permutations
		based on equ.12 https://www.biorxiv.org/content/biorxiv/early/2017/10/30/211128.full.pdf
		type cur_factors: array: the factors resulted from different runs
		type cur_weights: array: the weights resulted from different runs
		type best_factors: array: the factors with best fit
		type best_weights: array: the weights with best fit
		type base_cnt: int: the rank
		rtype similarity: float: best similarity
		"""
		# from pprint import pprint
		# import itertools
		num_sample = 1000
		# permuts = self.sc.parallelize(list(itertools.permutations(range(base_cnt)))).takeSample(False, num_sample, seed = 1)
		random_seed = self.sc.parallelize(list(range(num_sample)))
		


		def computeEachSimilarity(each_seed, cur_factors, cur_weights, best_factors, best_weights):
			each_permutation = list(np.random.RandomState(seed=each_seed).permutation(len(best_factors)))
			# return np.mean([stats.spearmanr(cur_factors[list(each_permutation)[i]][j], best_factors[i][j])[0] for i in range(len(best_factors)) for j in range(len(best_factors[0]))])
			similarity = 0.
			for component_index in range(len(best_factors)):
				rst = 1. - (abs(best_weights[component_index] - cur_weights[each_permutation[component_index]])) / max(best_weights[component_index], cur_weights[each_permutation[component_index]])
				for factor_index in range(len(best_factors[0])):
					rst *= spatial.distance.cosine(cur_factors[each_permutation[component_index]][factor_index], best_factors[component_index][factor_index])
				similarity += rst
			similarity /= len(best_factors)

			return similarity
		
		all_permutation_similarity = random_seed.map(lambda each_seed: computeEachSimilarity(each_seed, cur_factors, cur_weights, best_factors, best_weights)).collect()
		similarity = max(all_permutation_similarity)
		return similarity
		
			
	def factorizeTensor(self, ones = True, random_seed = 1):
		"""
		factorize the tensor
		type ones: boolean: whether use all ones as initialization
		type random_seed: int: the random seed if not using ones
		"""
		
		print("Start factorization...")
		self.ntfInstance = ntf.NTF(self.cur_base, self.hist, parallelCalc=True, ones = ones, random_seed = random_seed)
		self.ntfInstance.factorize(self.hist, showProgress=True)
		self.ntfInstance.normalizeFactor()        

		
	def saveFactors(self):
		fName = '/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(len(self.column))+'_'+str(self.cur_base)+'.npy'
		np.save(fName, self.factors)

	def loadFactors(self):
		fName = '/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(self.column_cnt)+'_'+str(self.cur_base)+'.npy'
		self.factors = np.load(fName)


	def normalizeFactor(self):
		"""
		normalize the weights
		"""        
		self.ntfInstance.normalizedWeight = self.ntfInstance.weight / np.sum(self.ntfInstance.weight)            
	
	def getFactors(self):
		"""
		obtain the factors
		"""        
		
		self.factors = self.ntfInstance.factor
		self.saveFactors()
#         self.column = ['ZONE','PERIOD', 'TEAM']
		self.data = [np.array([self.factors[i][j].tolist() for i in range(len(self.factors))]) for j in range(len(self.column))]
		

	def computeItemSimilarity(self):
		"""
		compute the pairwise item similarity
		"""
		import math
		self.itemSimilarity = {}
		for k in range(len(self.data)):
			self.itemSimilarity[k] = {}
			for i in range(len(self.data[k].T)):
				self.itemSimilarity[k][self.labels[k][i]] = {}
				for j in range(len(self.data[k].T)):
					if i == j:
						continue
					dataSetI = self.data[k].T[i]
					dataSetII = self.data[k].T[j]
					# import pdb
					# pdb.set_trace()
					result = scipy.stats.spearmanr(dataSetI.T, dataSetII.T)
					# print(result)
					if not math.isnan(result.correlation):
						self.itemSimilarity[k][self.labels[k][i]][self.labels[k][j]] = result.correlation
					else:
						self.itemSimilarity[k][self.labels[k][i]][self.labels[k][j]] = 0

				max_item = self.itemSimilarity[k][self.labels[k][i]][max(self.itemSimilarity[k][self.labels[k][i]], 
																		 key=self.itemSimilarity[k][self.labels[k][i]].get)]
				min_item = self.itemSimilarity[k][self.labels[k][i]][min(self.itemSimilarity[k][self.labels[k][i]], 
																		 key=self.itemSimilarity[k][self.labels[k][i]].get)]
				# normalize
				if max_item != min_item:
					for j in self.itemSimilarity[k][self.labels[k][i]]:
						self.itemSimilarity[k][self.labels[k][i]][j] = (self.itemSimilarity[k][self.labels[k][i]][j] - min_item) / (max_item - min_item)

	def computeEntropy(self):
		"""
		compute the entropy of each descriptor
		"""
		self.entropies = []
		for j in range(len(self.factors[0])):
			self.entropies.append([stats.entropy(self.factors[i][j]) for i in range(len(self.factors))])
		self.max_entropy = np.max(self.entropies, axis = 1).tolist()
		self.min_entropy = np.min(self.entropies, axis = 1).tolist()

	def getMaxPatternForItem(self):
		"""
		compute the most relevant pattern for each item
		"""
		## Get max pattern of each item
		self.item_max_pattern = {}
		for i in range(len(self.factors[0])):
			self.item_max_pattern[i] = {}
			for j in range(len(self.labels[i])):        
				item_list_label = [self.factors[m][i][j] for m in range(len(self.factors))]        
				self.item_max_pattern[i][self.labels[i][j]] = max(enumerate(item_list_label),key=lambda x: x[1])[0]
		
	def getMeanDistribution(self):
		"""
		compute the mean distribution of each descriptor
		"""
		data_mean = [np.mean([self.factors[i][j].tolist() for i in range(len(self.factors))],axis=0).tolist() for j in range(len(self.column))]
		self.data_mean_descriptor = []
		for m in range(len(data_mean)):
			each_dict_descriptor = dict(zip(self.labels[m], data_mean[m]))
			each_dict_descriptor['id'] = self.cur_base
			self.data_mean_descriptor.append(each_dict_descriptor)
		
	def getEmbedding(self, rd_state = 3):
		"""
		use multiview tsne to embed the components to 2d plane
		type rd_state: int: random state
		"""
		self.rd_state = rd_state
		is_distance = [False] * len(self.data)
		mvtsne_est = mvtsne.MvtSNE(k=2, perplexity = 10,random_state = self.rd_state, epoch = 3000)
		mvtsne_est.fit(self.data, is_distance)
		self.X_embedded = np.asarray(mvtsne_est.embedding_)        
			
			
	def formatOutput(self):
		self.data_output = {"descriptors": dict(zip(self.column, self.labels)),
							"average":self.data_mean_descriptor, 
							"itemSimilarity":self.itemSimilarity,
							# "metrics":self.metrics,
							# "item_max_pattern": self.item_max_pattern,
							"item_max_pattern": '',
							"start_index":str(self.start_index),
							"modes": self.column}                
		output = []
		for i in range(len(self.factors)):
			output_each = {}
			output_each['id'] = i
			output_each['factors'] = {}
			output_each['dims'] = len(self.factors[i])
			output_each['tsne_coord'] = {'x': self.X_embedded[i][0],'y':self.X_embedded[i][1]}
			output_each['weight'] = self.ntfInstance.normalizedWeight[i]
			output_each['max_tsne'] = np.max(self.X_embedded, axis = 0).tolist()
			output_each['min_tsne'] = np.min(self.X_embedded, axis = 0).tolist()
			for j in range(len(self.factors[i])):
				a = self.factors[i][j]
				output_each['factors'][j] = {}
				output_each_factor = {}
				output_each_factor['mode_id'] = j        
				_dict = dict((self.labels[j][m], a[m]) for m in range(len(a)))
				output_each_factor['max_item'] = max(_dict, key=_dict.get)
				output_each_factor['min_item'] = min(_dict, key=_dict.get)
				_dict['id'] = i
				output_each_factor['values'] = _dict
				output_each_factor['entropy'] = (self.entropies[j][i] - self.min_entropy[j]) / (self.max_entropy[j] - self.min_entropy[j])
				output_each_factor['similarity'] = {}
				for k in range(len(self.factors)):        
					if k == i:
						continue
					dataSetII = self.factors[k][j]
					dataSetI = self.factors[i][j]
					result = scipy.stats.spearmanr(dataSetI, dataSetII)[0]
					output_each_factor['similarity'][k] = result
				dict_ = output_each_factor['similarity']
				max_item = dict_[max(dict_, key=dict_.get)]
				min_item = dict_[min(dict_, key=dict_.get)]
				if max_item != min_item:
					for k in dict_:
						dict_[k] = (dict_[k] - min_item) / (max_item - min_item)
				output_each_factor['similarity'] = dict_
				output_each_factor['similarity']['average'] = sum(dict_.values())/len(dict_.values())  
				output_each_factor['similarity']['max_idx'] = max(dict_, key=dict_.get)
				output_each_factor['similarity']['min_idx'] = min(dict_, key=dict_.get)
				output_each_factor['similarity'][i] = 1.0
				output_each['factors'][j] = output_each_factor
			output.append(output_each)

		self.data_output["data"] = output        
			
	def saveOutput(self):
		
		with open('/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(len(self.column))+'_'+str(self.cur_base)+'_sample_fit.json', 'w') as fp:
			json.dump(self.data_output, fp)

		with open('/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'/factors_'+str(len(self.column))+'_'+str(self.cur_base)+'_sample_fit_metrics.json', 'w') as fp:
			json.dump(self.metrics, fp)			

	def saveAttributes(self):
		_log.info("Factorize Tensor")   
		self.factorizeTensor(ones = False, random_seed = iFac.metrics["min_error_index"][self.cur_base-self.start_index])
		_log.info("Get Factors")          
		self.normalizeFactor()
		self.getFactors()
		_log.info("Compute Item Similarity")                    
		self.computeItemSimilarity()
		self.computeEntropy()
		self.getMaxPatternForItem()
		self.getMeanDistribution()
		try:
			self.getEmbedding()
		except:
			_log.info("running embedding again...")
			self.rd_state += 1
			self.getEmbedding(rd_state = self.rd_state)
		_log.info("Saving Output")                              
		self.formatOutput()
		self.saveOutput()

	def readJSON(self, base_cnt=10, domain = ""):
		self.base_cnt = base_cnt
		self.domain = domain
		file = "{}_factors_3_{}_sample.json".format(self.domain, self.base_cnt)
		with open(file) as f:
			self.data_output = json.load(f)

	def reEmbed(self, rd_state = 4):
		self.getEmbedding(rd_state = rd_state)

		for i in range(component_cnt):			
			self.data_output['data'][i]['tsne_coord'] = {'x': self.X_embedded[i][0],'y':self.X_embedded[i][1]}
			self.data_output['data'][i]['max_tsne'] = np.max(self.X_embedded, axis = 0).tolist()
			self.data_output['data'][i]['min_tsne'] = np.min(self.X_embedded, axis = 0).tolist()

		self.cur_base = component_cnt
		self.column = self.data_output['modes']
		self.saveOutput()


def generateItemEmbedding():
	iFac = iFacData()
	domain = "nbaplayer"
	# iFac.cur_base = int(sys.argv[1])
	max_base = int(sys.argv[1])
	iFac.column_cnt = int(sys.argv[2])
	iFac.domain = str(sys.argv[3])
	for cur_base in range(2+1, max_base+1):
		iFac.cur_base = cur_base
		iFac.saveItemMDS()

def generatePatternEmbedding():
	iFac = iFacData()
	domain = "nbaplayer"
	# iFac.cur_base = int(sys.argv[1])
	max_base = int(sys.argv[1])
	iFac.column_cnt = int(sys.argv[2])
	iFac.domain = str(sys.argv[3])
	for cur_base in range(2+1, max_base+1):
		iFac.cur_base = cur_base
		iFac.savePatternEmbedding()


def generateData():
	iFac = iFacData()
	base = 30
	iFac.start_index = 2
	domain = "policy"	
	nb_trials = 5

	base = int(sys.argv[1])
	iFac.start_index = int(sys.argv[2])
	domain = str(sys.argv[3])

	iFac.readData(domain = domain)
	_log.info("Fitting Different Ranks up to {}".format(base))
	iFac.getFitForRanks(base, trials = nb_trials)
if __name__ == '__main__':
	generateData()
	# generateItemEmbedding()
	# generatePatternEmbedding()


