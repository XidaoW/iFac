import numpy as np
from multiprocessing import Pool
from sktensor import ktensor
from sktensor import dtensor
from sktensor.core import khatrirao
from sktensor.core import teneye
from sktensor import sptensor
from sktensor.sptensor import fromarray
from random import randint
from sktensor import dtensor, cp_als
import pdb
import scipy.sparse as sps

###########################################
EPS = 0.0000001
###########################################


class MulHelper(object):
	def __init__(self, cls, mtd_name):
		self.cls = cls
		self.mtd_name = mtd_name

	def __call__(self, *args, **kwargs):
		return getattr(self.cls, self.mtd_name)(*args, **kwargs)


def column_norm(X, by_norm='2'):
	""" Compute the norms of each column of a given matrix

	Parameters
	----------
	X : numpy.array or scipy.sparse matrix

	Optional Parameters
	-------------------
	by_norm : '2' for l2-norm, '1' for l1-norm.
			  Default is '2'.

	Returns
	-------
	numpy.array
	"""
	if sps.issparse(X):
		if by_norm == '2':
			norm_vec = np.sqrt(X.multiply(X).sum(axis=0))
		elif by_norm == '1':
			norm_vec = X.sum(axis=0)
		return np.asarray(norm_vec)[0]
	else:
		if by_norm == '2':
			norm_vec = np.sqrt(np.sum(X * X, axis=0))
		elif by_norm == '1':
			norm_vec = np.sum(X, axis=0)
		return norm_vec

def getError(X, F_kten, norm_X):
	
	return norm_X ** 2 + F_kten.norm() ** 2 - 2 * F_kten.innerprod(X)


def normalize_column(X, by_norm='2'):
	""" Column normalization

	Scale the columns of X so that they have unit l2-norms.
	The normalizing coefficients are also returned.

	Side Effect
	-----------
	X given as input are changed and returned

	Parameters
	----------
	X : numpy.array or scipy.sparse matrix

	Returns
	-------
	( X, weights )
	X : normalized matrix
	weights : numpy.array, shape k 
	"""
	if sps.issparse(X):
		weights = column_norm(X, by_norm)
		# construct a diagonal matrix
		dia = [1.0 / w if w > 0 else 1.0 for w in weights]
		N = X.shape[1]
		r = np.arange(N)
		c = np.arange(N)
		mat = sps.coo_matrix((dia, (r, c)), shape=(N, N))
		Y = X.dot(mat)
		return (Y, weights)
	else:
		norms = column_norm(X, by_norm)
		toNormalize = norms > 0
		X[:, toNormalize] = X[:, toNormalize] / norms[toNormalize]
		weights = np.ones(norms.shape)
		weights[toNormalize] = norms[toNormalize]
		return (X, weights)

class NTF():
	def __init__(self, bases, x, costFuncType='gkld', parallelCalc=False, ones = True, random_seed = 1):
		self.shape = x.shape
		self.init_factor = self.allocateFactor(bases, ones = ones, random_seed = random_seed)        
		self.factor = self.allocateFactor(bases, ones = ones, random_seed = random_seed)
		# Preset shape to be easy for broadcast.
		dimention = len(self.shape)
		self.weight = None
		self.preshape = np.tile(self.shape, dimention).reshape(dimention, -1)
		for i1 in np.arange(dimention):
			self.preshape[i1, i1] = 1

		if parallelCalc:
			self.pool = Pool()
			self.composeTensor = self.composeTensorParallely
		else:
			self.composeTensor = self.composeTensorSerially

		# Select update rule based on a cost function.
		if 'euclid' == costFuncType:
			self.updater = self.updateBasedOnEuclid
		elif 'gkld' == costFuncType:
			self.updater = self.updateBasedOnGKLD
		elif 'isd' == costFuncType:
			self.updater = self.updateBasedOnISD
		else:
			assert False, "\"" + costFuncType + "\" is invalid."

	def __getstate__(self):
		self_dict = self.__dict__.copy()
		del self_dict['pool']

	def allocateFactor(self, bases, ones = True, random_seed = 1):
		factor = []
		for _ in np.arange(bases):
			tmp = []
			for i2 in self.shape:
				if ones:
					tmp.append(np.ones(i2))
				else:
					np.random.seed(random_seed)
					tmp.append(np.random.rand(i2))
			factor.append(tmp)
		return np.array(factor)

	def sumAlongIndex(self, value, factor, index):
		for _ in np.arange(index):
			value = np.sum(value, axis=0)
		for _ in np.arange(index + 1, len(factor)):
			value = np.sum(value, axis=1)
		return value

	def composeTensorSerially(self, element):
		return list(map(self.kronAll, element))

	def composeTensorParallely(self, element):
		return self.pool.map(MulHelper(self, 'kronAll'), element)

	def kronAll(self, factor):
		element = np.array([1])
		for i1 in factor:
			element = np.kron(element, i1)
		return element

	def kronAlongIndex(self, factor, index):
		element = np.array([1])
		for i1 in factor[:index]:
			element = np.kron(element, i1)
		for i1 in factor[index + 1:]:
			element = np.kron(element, i1)
		return element

	def createTensorFromFactors(self):
		tensor = self.composeTensor(self.factor)
		tensor = np.sum(tensor, axis=0)
		return tensor.reshape(self.shape)

	def updateBasedOnEuclid(self, x, factor, index):
		# Create tensor partly.
		element = self.kronAlongIndex(factor, index)

		# Summation
		element = element.reshape(self.preshape[index])
		numer = self.sumAlongIndex(x*element, factor, index)
		estimation = self.createTensorFromFactors()
		denom = self.sumAlongIndex(estimation*element, factor, index)

		return numer/(denom + EPS)

	def updateBasedOnGKLD(self, x, factor, index):
		# Create tensor partly.
		element = self.kronAlongIndex(factor, index)

		# Summation
		element = element.reshape(self.preshape[index])
		estimation = self.createTensorFromFactors()
		boost = x/(estimation + EPS)
		numer = self.sumAlongIndex(boost*element, factor, index)
		denom = np.sum(element)

		return numer/(denom + EPS)

	def updateBasedOnISD(self, x, factor, index):
		# TODO: implement this.
		assert False, "This cost function is unsupported now."
		return 0

	def updateFactorEachBasis(self, x, factorPerBasis):
		for i1 in np.arange(len(factorPerBasis)):
			factorPerBasis[i1] *= self.updater(x, factorPerBasis, i1)

	def updateAllFactors(self, x, factor):
		for i1 in factor:
			self.updateFactorEachBasis(x, i1)

	def factorize(self, x, iterations=100, showProgress=False, default=True, 
		reference_matrix=[], S_matrix = [], lambda_0 = 0.0, lambda_1 = 0.0):
		if not default:
			x = dtensor(x)
			num_ways = len(self.factor[0])
			X_itr = []
			R = len(self.factor)
			for way_index in range(num_ways):
				X_cur = []
				for r in range(R):
					X_cur.append(self.factor[r][way_index].tolist())
				X_itr.append(np.array(X_cur).T)

		for i1 in np.arange(1, iterations + 1):
			if showProgress and (i1 % 20) == 0:
				# progress = "*" if 0 < (i1 % 20) \
				# 	else "[%d/%d]\n" % (i1, iterations)
				print("[%d/%d]" % (i1, iterations))
			if default:
				self.updateAllFactors(x, self.factor)
			else:				
				# pdb.set_trace()
				X_itr = self.updateAllFactorsGradient(x, X_itr, num_ways, R, 
					reference_matrix = reference_matrix, 
					S_matrix = S_matrix,
					lambda_0 = lambda_0, 
					lambda_1 = lambda_1)
				ktensor_X = ktensor(X_itr)
				import math
				error_X = math.sqrt(getError(x,ktensor_X,x.norm()))/x.norm()
				# print(error_X)
		if not default:
			result_factor = []
			for r in range(R):
				each_factor = []				
				for way_index in range(num_ways):
					each_factor.append(X_itr[way_index].T[r])
				result_factor.append(each_factor)
			self.factor = result_factor		
		
	def updateAllFactorsGradient(self, x, X_itr, num_ways, R, 
		reference_matrix=[], S_matrix = [], lambda_0 = 0.0, lambda_1 = 0.0):
		X_FF_iter = []
		XtW_iter = []				
		for way_index in range(num_ways):
			ways = list(range(num_ways))
			ways.remove(way_index)
			X_FF = np.ones((R,R))
			for w in ways:
				X_FF = X_FF * X_itr[w].T.dot(X_itr[w])
			X_FF_iter.append(X_FF)
			XtW_iter.append(x.uttkrp(X_itr, way_index))
		S_matrix = [np.zeros((x.shape[way_index], x.shape[way_index])) for way_index in range(num_ways)]
		for l in range(R):
			for way_index in range(num_ways):
				
				# similarity_reg = -np.atleast_2d(X_itr[way_index][:,l]).dot(S_matrix[way_index]) + np.atleast_2d(X_itr[way_index][:,l]).dot(np.atleast_2d(X_itr[way_index][:,l]).T).dot(np.atleast_2d(X_itr[way_index][:,l]))
				# reference_reg = (X_itr[way_index][:,l] - reference_matrix[way_index][:,l])
				similarity_reg = 0
				reference_reg = 0
				factor_gradient = -XtW_iter[way_index][:,l] + X_itr[way_index].dot(X_FF_iter[way_index])[:,l]
				X_itr[way_index][:,l] = (
						X_itr[way_index][:,l] * (X_FF_iter[way_index][l,l]) - 
						# X_itr[way_index][:,l] - (
						(
							factor_gradient  + 2*lambda_0 * similarity_reg + lambda_1 * reference_reg
						)
					) / (X_FF_iter[way_index][l,l] + EPS)
					# )

				X_itr[way_index][:,l][X_itr[way_index][:,l] < EPS] = EPS
				# if way_index < (num_ways - 1):
				# 	X_itr[way_index][:,l] = normalize_column(X_itr[way_index][:,l], by_norm='2')[0]
		# print(X_itr[0])
		X_itr = [normalize_column(each_factor, by_norm='2')[0] if way_index < (num_ways - 1) else each_factor for way_index, each_factor in enumerate(X_itr)]
		# print(X_itr[1])
		return X_itr
				


	def reconstruct(self):
		return self.createTensorFromFactors()

	def normalizeFactor(self):
		weight = []
		for i1, fct1 in enumerate(self.factor):
			baseValue = np.array(list(map(np.sum, fct1)))
			weight = np.append(weight, np.prod(baseValue))
			self.factor[i1] = list(map(lambda fct2, base:
								  fct2/base, fct1, baseValue))
		self.weight = weight
		return self.weight

	def setFactor(self, dimention, initialValue):
		assert len(initialValue) == len(self.factor)
		assert dimention < len(self.factor[0])
		assert initialValue.shape[1] == len(self.factor[0][dimention])
		for i1, value in enumerate(initialValue):
			self.factor[i1][dimention] = value + EPS

	def getFactor(self):
		return np.copy(self.factor)

	def getNormalizedFactor(self):
		weight = []
		normalized = []
		for fct in self.factor:
			baseValue = np.empty(len(fct))
			for i1 in np.arange(len(fct)):
				baseValue[i1] = np.sum(fct[i1])
			weight = np.append(weight, np.prod(baseValue))
			tmp = []
			for fct2, base in zip(fct, baseValue):
				tmp.append(fct2/base)
			normalized.append(tmp)
		return weight, np.array(normalized)


# For easy unit test
if __name__ == '__main__':
	# test = np.arange(60).reshape(3, 4, 5)
	test = np.arange(24).reshape(2, 3, 4)
	# test = np.arange(6).reshape(1, 2, 3)
	ntf = NTF(3, test)
	# import pdb
	# pdb.set_trace()
	ntf.factorize(test, default=False)
	# print(ntf.reconstruct())
