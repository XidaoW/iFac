#!/usr/bin/python
# -*- coding:utf-8 -*-
'''
Created on 2019/01/02

@author: xidaowen
'''

import ntf
from myutil.histogram import createHistogram
from myutil.plotter import showFactorValue, showHistDistribution
from myutil.ponpare.reader import readPonpareData
from myutil.ponpare.converter import     digitizeHistoryFeatureValue, transformForHistogram
import multiview.mvtsne as mvtsne
from sklearn.utils.testing import assert_raises


import scipy
import numpy as np
import pandas as pd
from scipy import stats
from scipy.special import entr
from scipy import spatial

import sys
import json
from pyspark import SparkConf, SparkContext
import itertools



import logging
logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('JNTF')


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
			self.hist, bins, label = createHistogram(distribution, self.column) 
			self.labels = [['00 Male', '01 Female'],
						   ['00 Gourmet', '01 este', '02 beauty', '03 nail&eye', '04 hair salon', 
							'05 health&medical care', '06 relaxation', '07 leisure', '08 hotel&inn',
							'09 Lesson','10 Home Delivery','11 Gift Card','12 Other Coupons'],
					  ['00 北海道', '01 青森県', '02 岩手県', '03 宮城県', '04 秋田県', '05 山形県', '06 福島県', '07 茨城県', '08 栃木県', '09 群馬県', '10 埼玉県', '11 千葉県', '12 東京都', '13 神奈川県', '14 新潟県', '15 富山県', '16 石川県', '17 福井県', '18 山梨県', '19 長野県', '20 岐阜県', '21 静岡県', '22 愛知県', '23 三重県', '24 滋賀県', '25 京都府', '26 大阪府', '27 兵庫県', '28 奈良県', '29 和歌山県', '30 鳥取県', '31 島根県', '32 岡山県', '33 広島県', '34 山口県', '35 徳島県', '36 香川県', '37 愛媛県', '38 高知県', '39 福岡県', '40 佐賀県', '41 長崎県', '42 熊本県', '43 大分県', '44 宮崎県', '45 鹿児島県', '46 沖縄県'],
					  ['00 "under"', '01 20', '02 25', '03 30', '04 35', '05 40', '06 45', '07 50', '08 55', '09 60', '10 65', '11 70', '12 75 "over"'],
					  ['00 "under"', '01 100', '02 1000', '03 2000', '04 3000', '05 5000', '06 10000', '07 20000', '08 30000', '09 50000 "over"']
	
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


	def getFitForRanks(self, bases, trials = 5):
		"""
		compute the factors given different ranks and different random initializations
		type bases: int: max number of components
		type trials: int: number of independent trials
		"""
		self.base = bases
		self.trials = trials
		self.all_trials = []
		self.metrics = {"error":[None]*self.base, 
						"stability": [None]*self.base, 
						"interpretability": [None]*self.base, 
						"min_error_index": [None]*self.base}
		
		self.weights_all = [None]*self.base
		self.factors_all = [None]*self.base

		conf = SparkConf().set("spark.driver.maxResultSize", "220g").setAppName("DSGD_NTF")
		self.sc = SparkContext(conf=conf)

		# self.start_index = 2
		for self.base_cnt in range(self.start_index, self.base+1):
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
			self.metrics["stability"][self.base_cnt-self.start_index] = []
			self.metrics["interpretability"][self.base_cnt-self.start_index] = []            
			self.weights_all[self.base_cnt-self.start_index] = []
			self.factors_all[self.base_cnt-self.start_index] = []            
			for random_seed in range(self.trials):
				_log.info("Getting Metric for Trial: {}".format(random_seed))				
				ntfInstance = self.all_trials[self.base_cnt-self.start_index][random_seed]            
				self.metrics["error"][self.base_cnt-self.start_index].append(self.computeReconstructionError(ntfInstance,self.hist))
				weights, factors = ntfInstance.getNormalizedFactor()
				self.weights_all[self.base_cnt-self.start_index].append(weights)
				self.factors_all[self.base_cnt-self.start_index].append(factors)
				self.metrics["interpretability"][self.base_cnt-self.start_index].append(np.mean([entr(factors[i][j]).sum(axis = 0) for i in range(len(factors)) for j in range(len(factors[0]))]))
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

					

	def maxFactorSimilarity(self, cur_factors, best_factors, base_cnt):
		"""
		compute the max similarity to a given set of factors by permutations
		type cur_factors: array: the factors resulted from different runs
		type best_factors: array: the factors with best fit
		type base_cnt: int: the rank
		rtype similarity: float: best similarity
		"""
		# from pprint import pprint
		# import itertools
		permuts = self.sc.parallelize(list(itertools.permutations(range(base_cnt))))
		# reduce(lambda x, y: x*y, [1,2,3,4])
		def computeEachSimilarity(each_permutation, cur_factors, best_factors):
			# return np.mean([stats.spearmanr(cur_factors[list(each_permutation)[i]][j], best_factors[i][j])[0] for i in range(len(best_factors)) for j in range(len(best_factors[0]))])
			similarity = 0.
			for component_index in range(len(best_factors)):
				rst = 1. - (abs(best_weights[component_index] - cur_weights[list(each_permutation)[component_index]])) / max(best_weights[component_index], cur_weights[list(each_permutation)[component_index]])
				for factor_index in range(len(best_factors[0])):
					rst *= spatial.distance.cosine(cur_factors[list(each_permutation)[component_index]][factor_index], best_factors[component_index][factor_index])
				similarity += rst
			similarity /= len(best_factors)

			return similarity

		all_permutation_similarity = permuts.map(lambda each_permutation: computeEachSimilarity(each_permutation, cur_factors, best_factors)).collect()
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
#         self.column = ['ZONE','PERIOD', 'TEAM']
		self.data = [np.array([self.factors[i][j].tolist() for i in range(len(self.factors))]) for j in range(len(self.column))]
		

	def computeItemSimilarity(self):
		"""
		compute the pairwise item similarity
		"""
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
					result = scipy.stats.spearmanr(dataSetI.T, dataSetII.T)
					self.itemSimilarity[k][self.labels[k][i]][self.labels[k][j]] = result.correlation

				max_item = self.itemSimilarity[k][self.labels[k][i]][max(self.itemSimilarity[k][self.labels[k][i]], 
																		 key=self.itemSimilarity[k][self.labels[k][i]].get)]
				min_item = self.itemSimilarity[k][self.labels[k][i]][min(self.itemSimilarity[k][self.labels[k][i]], 
																		 key=self.itemSimilarity[k][self.labels[k][i]].get)]
				for j in self.itemSimilarity[k][self.labels[k][i]]:
					self.itemSimilarity[k][self.labels[k][i]][j] = (self.itemSimilarity[k][self.labels[k][i]][j] - min_item) / (max_item - min_item)

	def computeEntropy(self):
		"""
		compute the entropy of each descriptor
		"""
		self.entropies = []
		for j in range(len(self.factors[0])):
			self.entropies.append([entr(self.factors[i][j]).sum(axis = 0) for i in range(len(self.factors))])
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
							"metrics":self.metrics,
							"modes": self.column,
							"item_max_pattern": self.item_max_pattern}                
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
		
		with open('/home/xidao/project/thesis/iFac/src/src/data/'+self.domain+'_factors_'+str(len(self.column))+'_'+str(self.cur_base)+'.json', 'w') as fp:
			json.dump(self.data_output, fp)

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
		self.getEmbedding()
		_log.info("Saving Output")                              
		self.formatOutput()
		self.saveOutput()

if __name__ == '__main__':
	
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
