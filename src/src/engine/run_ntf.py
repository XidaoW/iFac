import numpy as np
import csv
import scipy.sparse as sps
from random import randrange
import scipy.optimize as opt
# import numpy.linalg as nla
import functions as fn
import time
import json
import sys
import math
import scipy as sp
# import figure_plot as fg

import pandas as pd
from numpy import random
import pdb
# import matplotlib.pyplot as plt
from sktensor import ktensor
from sktensor import dtensor
from sktensor.core import khatrirao
from sktensor.core import teneye
from sktensor import sptensor
from sktensor.sptensor import fromarray

from random import randint
from sktensor import dtensor, cp_als
from pyspark import SparkContext, SparkConf
import os
import logging
from memory_profiler import profile

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('JNTF')


def quiet_logs( sc ):
  logger = sc._jvm.org.apache.log4j
  logger.LogManager.getLogger("org"). setLevel( logger.Level.ERROR )
  logger.LogManager.getLogger("akka").setLevel( logger.Level.ERROR )

class JNTF_SPARSE_SPARK_Base(object):

    """ Base class for JNTF algorithms

    Specific algorithms need to be implemented by deriving from this class.
    """
    default_max_iter = 100
    default_max_time = np.inf

    def __init__(self):
        raise NotImplementedError(
            'JNTF_Base is a base class that cannot be instantiated')

    def set_default(self, default_max_iter, default_max_time):
        self.default_max_iter = default_max_iter
        self.default_max_time = default_max_time

    def compute_tensor_residual(self, X_upper, X_train, epsilon = 1e-05):
        X_estimated = ktensor(X_upper).totensor()
        X_residual = dtensor(X_train.toarray()) - X_estimated
        X_residual[X_residual <= epsilon] = 0
        return X_residual

    def compute_S_clamping(self, X_residual, Y_residual, epsilon = 1e-5):
        S = np.absolute(X_residual - Y_residual)

        S[np.absolute(X_residual - Y_residual) <= epsilon] = 1
        S[np.absolute(X_residual - Y_residual) > epsilon] = 0

        S[np.absolute(X_residual) <= epsilon] = 0
        S[np.absolute(Y_residual) <= epsilon] = 0
        return S

    def compute_Z_clamping(self, X_residual, Y_residual, epsilon = 1e-05):
        Z1 = X_residual - Y_residual
        Z2 = Y_residual - X_residual
        Z1[Z1 <= epsilon] = 0
        Z2[Z2 <= epsilon] = 0
        return Z1, Z2

    def convert_tensor_index(self, X_train):
        return [(x) for x in zip(*X_train.subs)]

    def compute_residul_tensor(self, results, X_train, Y_train, epsilon = 1e-5):
        X_upper = results[0]
        Y_upper = results[1]
        X_residual = self.compute_tensor_residual(X_upper, X_train, epsilon)
        Y_residual = self.compute_tensor_residual(Y_upper, Y_train, epsilon)

        S = self.compute_S_clamping(X_residual, Y_residual, epsilon)
        Z1, Z2 = self.compute_Z_clamping(X_residual, Y_residual, epsilon)

        X_train = fromarray(X_residual)
        Y_train = fromarray(Y_residual)
        ZX_train = fromarray(Z1)
        ZY_train = fromarray(Z2)
        S_train = fromarray(S)

        idx_list_X = self.convert_tensor_index(X_train)
        idx_list_Y = self.convert_tensor_index(Y_train)
        idx_list_ZX = self.convert_tensor_index(ZX_train)
        idx_list_ZY = self.convert_tensor_index(ZY_train)
        idx_list_S = self.convert_tensor_index(S_train)

        idx_list_set = set().union(idx_list_X,idx_list_Y,idx_list_ZX,idx_list_ZY,idx_list_S)
        idx_list_all = list(idx_list_set)
        non_zero_idxs=np.asarray(idx_list_all)
        
        X_train = self.fillTensorEntries(X_train, idx_list_set, idx_list_X)
        Y_train = self.fillTensorEntries(Y_train, idx_list_set, idx_list_Y)
        ZX_train = self.fillTensorEntries(ZX_train, idx_list_set, idx_list_ZX)
        ZY_train = self.fillTensorEntries(ZY_train, idx_list_set, idx_list_ZY)
        S_train = self.fillTensorEntries(S_train, idx_list_set, idx_list_S)

        return X_train, Y_train, ZX_train, ZY_train, S_train, non_zero_idxs

    def fillTensorEntries(self, X, idx_list_set, idx_list_X):
        
        C = list(idx_list_X)
        # print(len(list(idx_list_set)))
        B = idx_list_set.difference(idx_list_X)
        D = C.extend(list(B))
        C_vals = X.vals.tolist()
        D_vals = C_vals.extend([0]*len(B))

        X_subs = sptensor(tuple(np.array(C).T), np.array(C_vals),shape=X.shape, dtype=np.float)
        return X_subs

    def extractTensorEntries(self, X, subs):
        # b = subs
        # a = [(i) for i in  zip(*X.subs)]
        X.accumfun = np.array
        idx_list_X = [(x) for x in zip(*X.subs)]
        subs_ = list(set(subs).intersection(set(idx_list_X)))
        tensor_index = tuple(np.array(subs).T)
        
        
        return tensor_index, np.array(X[tensor_index])


    def assignBlock(self, i, s, X,Y, Z1, Z2, S, tensor_dim_ceiling, subs_idx, num_workers, tensor_dim_size):
        # range1 = lambda start, end: range(start, end+1)
        _dict = {}

        num_ways = len(tensor_dim_ceiling)
        strata_index = [int(math.floor(i + sum([float(s) / num_workers**way_index for way_index in range(way_index+1)]))) % num_workers for way_index in range(num_ways)]
        strata_range = [range(int(math.ceil(strata_index[way_index] * tensor_dim_ceiling[way_index])), int(math.ceil((strata_index[way_index]+1) * tensor_dim_ceiling[way_index]))) for way_index in range(num_ways)]
        strata_range = [[o for o in each_range if o < tensor_dim_size[index]] for index, each_range in enumerate(strata_range)]        
        strata_range = [range(each_range[0], (each_range[-1] + 1)) for each_range in strata_range]
        total_nb_points = len(subs_idx.value)
        subs = [idx for idx in subs_idx.value if all([idx[way_index] in strata_range[way_index] for way_index in range(num_ways)])]
        subs_x = [tuple(idx) for idx in subs_idx.value if all([idx[way_index] in strata_range[way_index] for way_index in range(num_ways)])]

        X_vals = []
        Y_vals = []
        ZX_vals = []
        ZY_vals = []
        S_vals = []
        if len(subs_x) > 0:
            for i in range(len(subs_x)):
                tensor_index = tuple(np.array(subs_x[i]).T)
                X_vals.append(X[tensor_index][0])
                Y_vals.append(Y[tensor_index][0])
                ZX_vals.append(Z1[tensor_index][0])
                ZY_vals.append(Z2[tensor_index][0])
                S_vals.append(S[tensor_index][0])
            X_subs = sptensor(tuple(np.array(subs_x).T), X_vals,shape=tensor_dim_size, dtype=np.float)
            Y_subs = sptensor(tuple(np.array(subs_x).T), Y_vals,shape=tensor_dim_size, dtype=np.float)
            ZX_subs = sptensor(tuple(np.array(subs_x).T), ZX_vals,shape=tensor_dim_size, dtype=np.float)
            ZY_subs = sptensor(tuple(np.array(subs_x).T), ZY_vals,shape=tensor_dim_size, dtype=np.float)
            S_subs = sptensor(tuple(np.array(subs_x).T), S_vals,shape=tensor_dim_size, dtype=np.float)

            _dict['ratio'] = len(subs_x) / float(total_nb_points)
            _dict['X_subs'] = X_subs
            _dict['Y_subs'] = Y_subs
            _dict['ZX_subs'] = ZX_subs
            _dict['ZY_subs'] = ZY_subs
            _dict['S_subs'] = S_subs
            _dict['subs'] = subs        
            return _dict
        else:
            return None


    def assignSecondLayerBlock(self, i, s, X,Y, Z1, Z2, S, 
                        tensor_dim_ceiling,
                        subs_idx, num_workers, tensor_dim_size,
                        X_subs, Y_subs, Z1_subs, Z2_subs, S_subs):
        _dict = {}
        num_ways = len(tensor_dim_ceiling)
        strata_index = [int(math.floor(i + sum([float(s) / num_workers**way_index for way_index in range(way_index+1)]))) % num_workers for way_index in range(num_ways)]
        strata_range = [range(int(math.ceil(strata_index[way_index] * tensor_dim_ceiling[way_index])), int(math.ceil((strata_index[way_index]+1) * tensor_dim_ceiling[way_index]))) for way_index in range(num_ways)]
        strata_range = [[o for o in each_range if o < tensor_dim_size[index]] for index, each_range in enumerate(strata_range)]        
        strata_range = [range(each_range[0], (each_range[-1] + 1)) for each_range in strata_range]
        total_nb_points = len(subs_idx.value)
        subs = [idx for idx in subs_idx.value if all([idx[way_index] in strata_range[way_index] for way_index in range(num_ways)])]

        if len(subs) > 0:

            X_subs = X
            Y_subs = Y
            Z1_subs = Z1
            Z2_subs = Z2
            S_subs = S
            _dict['ratio'] = len(subs) / float(total_nb_points)
            _dict['X_subs'] = X_subs
            _dict['Y_subs'] = Y_subs
            _dict['ZX_subs'] = Z1_subs
            _dict['ZY_subs'] = Z2_subs
            _dict['S_subs'] = S_subs
            # _dict['i_start'] = b_i_start
            # _dict['i_end'] = b_i_end
            # _dict['j_start'] = b_j_start
            # _dict['j_end'] = b_j_end
            # _dict['k_start'] = b_k_start
            # _dict['k_end'] = b_k_end
            _dict['subs'] = subs
            return _dict
        else:
            return None



    def run(self, sc, num_workers, all_blocks, X, Y, Z1, Z2, S, R1, R2, k, \
        Lambda, D_matrix, W_matrix, init=None,reg_par=1e+2, \
        location_reg=0, stop_criteria=1e-6, max_iter=None, \
        max_time=None, verbose=2,noise=0, trial=1,nb_points=10000, \
        non_zero_idxs=[], distance = 1,tree_group=None, \
        X_upper = None, Y_upper = None, level = None,
        R_set = None):

        """ Run an algorithm with random initial values 
            and return the factor matrices

        Parameters
        ----------
        X : original tensor before
        Y : original tensor after
        Z1: discriminative signals before
        Z2: diescriminative signals after
        S : common signals
        R1: rank for before tensor
        R2: rank for after tensor
        k : shared number of rank in the ground truth (not necessary for proposed model)
        ground_truth_k : same as above
        Lambda : set of parameters in the paper ([lambda_1, lambda_2, lambda_3, lambda_4])
        trial : the trial index
        noise : default noise added to the ground truth factor matrices
        distance : the tree distance between the two trees (1, 2, 3)
        nb_points : number of points in the tensor
        non_zero_idx : the indexes of the none zero points

        Optional Parameters
        -------------------
        max_iter : int - maximum number of iterations for each trial.
                    If not provided, default maximum for each algorithm is used.
        max_time : int - maximum amount of time in seconds for each trial.
                    If not provided, default maximum for each algorithm is used.
        verbose : whether to print the resutl
        D_matrix, W_matrix : auxiliary matrix (default None)
        reg_par : regularzation parameter for location (default not used)
        num_workers : number of workers (used for distributed version)

        Returns
        -------
        [U] : Obtained factor matrix for each tensor
        [w] : Obtained weight vector for each tensor
        [cost_log] : the convergence log
        """

        alpha, beta, gamma, delta, train_proportion = Lambda



        info = {'R1': R1,
                'R2': R2,
                'k': k,
                'distance':distance,
                'alg': str(self.__class__),
                'X_type': str(X.__class__),
                'Y_type': str(Y.__class__),
                'alpha': alpha,
                'beta': beta,
                'gamma': gamma,
                'delta': delta,
                'train_proportion': train_proportion,
                'num_workers': num_workers,
                'nb_points': len(non_zero_idxs),
                'noise': noise,
                'location_reg': location_reg,
                'max_iter': max_iter if max_iter is not None else self.default_max_iter,
                'verbose': verbose,
                'max_time': max_time if max_time is not None else self.default_max_time}
        # X_init = []
        for way_index in range(len(X.shape)):
            info['X_dim_{}'.format(way_index)] = X.shape[way_index]
            info['Y_dim_{}'.format(way_index)] = Y.shape[way_index]

        # pdb.set_trace()
        if init != None:
            X_init = init[0:len(X.shape)]
            Y_init = init[len(X.shape):]
            info['init'] = 'user_provided'
        else:
            X_init = []
            Y_init = []
            for way_index in range(len(X.shape)):
                X_init.append(random.rand(X.shape[way_index], R1))
                Y_init.append(random.rand(Y.shape[way_index], R2))
            info['init'] = 'uniform_random'
        # verbose = 1
        if verbose >= 2:
             print('[{}] Running: '.format(self.__class__.__name__))
             print(json.dumps(info, indent=4, sort_keys=True))
        # global D_matrix
        # global W_matrix
        # global L_matrix
        L_matrix = D_matrix - W_matrix
        X_init = [fn.normalize_column(each_init, by_norm='2')[0] for each_init in X_init]
        Y_init = [fn.normalize_column(each_init, by_norm='2')[0] for each_init in Y_init]        
        # fn.plot(X_U0,Y_U0,X_U1, Y_U1,X_U2, Y_U2, R1,R2,X.shape[0],X.shape[1],X.shape[2],'init_test')
        norm_X = X.norm()
        norm_Y = Y.norm()
        tensor_dim_size = X.shape
        num_ways = len(X.shape)
        # I, J, K = tensor_dim_size

        Teneye_X = np.zeros([R1]*len(X.shape))
        # Teneye_X = np.zeros((R1,R1,R1))
        for i in range(R1): Teneye_X[tuple([i]*num_ways)] = float(1.0)/R1
        Teneye_X = dtensor(Teneye_X)
        Teneye_Y = Teneye_X
        Teneye_Z_Y = Teneye_S_Y = Teneye_Y
        Teneye_Z_X = Teneye_S_X = Teneye_X
        previous_cost_all = previous_cost = 1e+10
        total_time = 0

        # if verbose >= 1:
        his = {'iter': [], 'elapsed': [], 'cost': [], 'cost_all': []}
        Y_X = [None] * R1
        Y_Y = [None] * R2
        Z_weights_X = Teneye_X
        Z_weights_Y = Teneye_Y
        PairFac_list = ["PAIRFACR_S_Edit_All","PAIRFACR_S_Hierarchical","PAIRFACR_S_Hierarchical_tree1","PAIRFACR_S_Hierarchical_tree2","PAIRFACR_S_Hierarchical_tree3",
                        "PAIRFACR_S_Hierarchical_tree4","PAIRFACR_S_Hierarchical_tree5","PAIRFACR_S_Hierarchical_tree6","PAIRFACR_S_Hierarchical_tree7",
                        "PAIRFACR_S_Hierarchical_tree8_parallel","PAIRFACR_S_Hierarchical_tree9_parallel","PAIRFACR_S_Hierarchical_tree10_parallel",
                        "PAIRFACR_S_Hierarchical_tree11_parallel","PAIRFACR_S_Hierarchical_tree12_parallel","PAIRFACR_S_Hierarchical_tree13_parallel",
                        "PAIRFACR_S_Hierarchical_tree14_parallel","PAIRFACR_S_Hierarchical_tree15_parallel",
                        "PAIRFACR_S_Hierarchical_Incremental","PAIRFACR_S_Hierarchical_Incremental_Z_S",
                        "PAIRFACR_S_Hierarchical_Incremental_Z_S_X","PAIRFACR_S_Hierarchical_Incremental_MG",
                        "PAIRFACR_S_Edit1","PAIRFACR_S_Edit","PAIRFACR_S","PAIRFACR_S_Location","JNTF_SPARSE_SPARK_PAIRFACR_S_Location",
                        "JNTF_SPARSE_SPARK_PAIRFACR_S","JNTF_SPARSE_SPARK_PAIRFAC","JNTF_BCDR_DAPG_CD_SPARSE","JNTF_BCDR_DAPG_CD_location",
                        "JNTF_BCDR_DAPG_CD_S_B_C","JNTF_BCDR_DAPG","JNTF_BCDR_DAPGC","JNTF_BCDR_DAPG_CD","JNTF_BCDR_DAPG_CD_S","JNTF_BCDR_DAPG_CD_S_NT",
                        "JNTF_BCDR_DAPG_CD_S_B","JNTF_BCDR_DAPG_CD_S_B_C_PW","JNTF_BCDR_DAPG_CD_S_BB","JNTF_BCDR_DAPG_CD_single_location","JNTF_BCDR_DAPG_CD_single"]
        if str(self.__class__.__name__) in PairFac_list:
            Y_X = X_init
            Y_Y = Y_init
            Z_weights_X = Teneye_X
            Z_weights_Y = Teneye_Y
        start = time.time()

        tensor_dim_ceiling = [int(math.ceil(each_dim / float(num_workers))) for each_dim in X.shape]
        # size_i, size_j, size_k = tensor_dim_ceiling
        # size_i = int(math.ceil(I / float(num_workers)))
        # size_j = int(math.ceil(J / float(num_workers)))
        # size_k = int(math.ceil(K / float(num_workers)))

        (X_init, Y_init) = self.initializer(X_init, Y_init)
        # fg.plot(F,G,H, L, R1,R2,F.shape[0],F.shape[1],0)
        weights_X = tuple(Teneye_X[tuple([i]*num_ways)] for i in range(R1))
        weights_X = weights_X/sum(weights_X)
        weights_Y = tuple(Teneye_Y[tuple([i]*num_ways)] for i in range(R2))
        weights_Y = weights_Y/sum(weights_Y)

        E_X = 0
        E_Y = 0
        alpha_k = 1
        # if level > 0:
        # P_all = np.zeros((2,4))
        random.seed(trial)
        try:
            P_all = random.rand(R_set[1], R_set[0])
        except:
            P_all = random.rand(R_set[0],R_set[0])
        P_Z = P_all
        X_factors = X_init
        Y_factors = Y_init
        for i in range(1, info['max_iter'] + 1):
            start_iter = time.time()        
            if str(self.__class__.__name__) in ['PAIRFACR_S_Hierarchical_Incremental_Z_S',"PAIRFACR_S_Hierarchical_Incremental_MG"]:

                (X_factors, Y_factors, Teneye_X, Teneye_Y, E_X, E_Y, Y_X, Y_Y, alpha_k,
                    Teneye_S_X, Teneye_S_Y, P_all, P_Z) = self.iter_solver(sc, 
                    all_blocks, X, Y, Z1,Z2, S, X_factors, Y_factors, R1, R2, k, 
                    norm_X, norm_Y, Lambda, location_reg, D_matrix, 
                    W_matrix,Teneye_X, Teneye_Y,E_X,E_Y, Y_X, Y_Y,alpha_k,previous_cost_all,
                    Z_weights_X,Z_weights_Y,num_workers, distance=distance, 
                    current_iter = i, tree_group = tree_group, 
                    P_new = P_all, P_Z = P_Z, \
                    Teneye_S_X = Teneye_S_X, Teneye_S_Y = Teneye_S_Y, \
                    X_upper = X_upper, Y_upper= Y_upper, level = level, R_set = R_set)

            else:
                (X_factors, Y_factors, Teneye_X, Teneye_Y,E_X, E_Y, Y_X, Y_Y, alpha_k,
                    Z_weights_X,Z_weights_Y, P_all, P_Z) = self.iter_solver(sc, 
                    all_blocks, X, Y, Z1,Z2, S, X_factors, Y_factors, R1, R2, k, 
                    norm_X, norm_Y, Lambda, location_reg, D_matrix, 
                    W_matrix,Teneye_X, Teneye_Y,E_X,E_Y, Y_X, Y_Y,alpha_k,previous_cost_all,
                    Z_weights_X,Z_weights_Y,num_workers, distance=distance, 
                    current_iter = i, tree_group = tree_group, 
                    P_new = P_all, P_Z = P_Z, \
                    Teneye_S_X = Teneye_S_X, Teneye_S_Y = Teneye_S_Y, \
                    X_upper = X_upper, Y_upper= Y_upper, level = level)

            Save_Lambda = Lambda + [tensor_dim_size[0]] + [distance] + [nb_points] 

            # print(X_U0)
            # fn.saveFactorMatricesLambda(X_U0, X_U1, X_U2, \
            #   6,k,Save_Lambda, str(trial), str(self.__class__.__name__)+"_0_" + str(i))
            # fn.saveFactorMatricesLambda(Y_U0, Y_U1, Y_U2, \
            #   6,k,Save_Lambda, str(trial), str(self.__class__.__name__)+"_1_" + str(i))

            elapsed = time.time() - start_iter
            cost,cost_all,cor = fn.jtnorm_fro_err_nways(self,X, Y, Z1, Z2, S, X_factors, Y_factors, R1, R2, k, 
                norm_X, norm_Y, alpha, beta, gamma,location_reg,W_matrix,
                Teneye_X,Teneye_Y, Teneye_S_X = Teneye_S_X, Teneye_S_Y = Teneye_S_Y,
                X_upper = X_upper, Y_upper = Y_upper)
            delta = cost - previous_cost
            # print(cost)
            previous_cost_all = cost

            delta = np.abs(delta)
            if math.isnan(cost):
                break           
            # if math.isnan(cost) or cost > 20 or math.isnan(cost_all) or cost_all > 20:
            #     break           


            his['iter'].append(i)
            his['elapsed'].append(elapsed)
            his['cost'].append(cost)
            his['cost_all'].append(cost_all)
            # verbose = 1
            if verbose >= 2:
                _log.info('[%3d] cost: %0.6f | cost_all: %0.6f | cor: %0.6f | delta: %7.1e | secs: %.5f' % (
                    i, cost, cost_all, cor,delta, elapsed
                ))              
            
            total_time += elapsed
            if total_time > info['max_time'] or delta < stop_criteria:
                break
            previous_cost = cost
        his_dataframe = pd.DataFrame(his)
        his_dataframe = his_dataframe.transpose()
        # fn.saveCSV(his_dataframe, R1, k, k, alpha, beta, gamma, delta,"cost_log_workers_"+str(num_workers)+"_I_"+str(I)+"_trial_"+str(trial)+"_points"+str(nb_points)+'_0_d_'+str(distance)+'_'+str(self.__class__.__name__))
        Save_Lambda = Lambda + [tensor_dim_size[0]] + [distance] + [nb_points] 
        # fn.saveFileLambda(his_dataframe, 6,k,Save_Lambda,"cost_t_" + str(trial) + "_"+str(self.__class__.__name__))

        weights_X = tuple(Teneye_X[tuple([i]*num_ways)] for i in range(R1))
        weights_X = weights_X/sum(weights_X)
        weights_Y = tuple(Teneye_Y[tuple([i]*num_ways)] for i in range(R2))
        weights_Y = weights_Y/sum(weights_Y)
        weights_S_X = tuple(Teneye_S_X[tuple([i]*num_ways)] for i in range(R1))
        weights_S_X = weights_S_X/sum(weights_S_X)
        weights_S_Y = tuple(Teneye_S_Y[tuple([i]*num_ways)] for i in range(R1))
        weights_S_Y = weights_S_Y/sum(weights_S_Y)

        final = {}
        final['norm_X'] = norm_X
        final['norm_Y'] = norm_Y
        final['cost'] = cost
        final['cost_all'] = cost_all
        final['iterations'] = i
        final['elapsed'] = time.time() - start

        rec = {'info': info, 'final': final,'his':his}
        # if verbose >= 1:
        # rec['his'] = his
        # verbose = 1
        if verbose >= 2:
             print('[NTF] Completed: ')
             print(json.dumps(final, indent=4, sort_keys=True))
        return (X_factors,Y_factors,[weights_X,weights_Y],rec,[weights_S_X,weights_S_Y], P_Z)



    def read_init_factor_matrix(self, R, case_study_id):
        hosvd_output = [[],[]]
        for i in [0,1,2]:
            fname = 'output_two_layer/_U{}_R{}_groundtruth_0_k_0_alpha_0_beta_0_gamma_0_noise__iter_0_{}'.format(i, R, case_study_id)
            print("Reading from {}".format(fname))
            if not (os.path.exists(fname)):
                continue
            hosvd_output[0].append(np.asarray(pd.read_csv(fname,header=None)))
            hosvd_output[1].append(np.asarray(pd.read_csv(fname,header=None)))
        return hosvd_output


    def iter_solver(self, X, Y,  X_factors, Y_factors, F, H, G, L, R1, R2, k, norm_X, norm_Y, alpha, beta, gamma):
        raise NotImplementedError

    def initializer(self,  X,Y):
        return ( X, Y)

    def kronecker(self, matrices, tensor):
        K = len(matrices)
        x = tensor

        for k in range(K):
            M = matrices[k]
            x = x.ttm(M, k)
        return x



    def iter_solver(self, X, Y,  X_factors, Y_factors, F, H, G, L, R1, R2, k, norm_X, norm_Y, alpha, beta, gamma):
        raise NotImplementedError

    def initializer(self,  X_factors, Y_factors):
        return ( X_factors, Y_factors)


class JNTF_SDCDT(JNTF_SPARSE_SPARK_Base): #Baseline 3

    """ JNMF algorithm: 
    Baseline 3-Batch processing
    Block Coordinate Descent Framework + column regularization
    KDD model: Block Coordinate Descent Framework + column regularization
    Kim, Choo, Kim, Reddy and Park. Simultaneous Discovery of Common and Discriminative Topics via Joint non-negative Matrix factorization.
    """

    def __init__(self, default_max_iter=100, default_max_time=np.inf):
        self.eps = 1e-16
        self.set_default(default_max_iter, default_max_time)

    def iter_solver(self, sc, X, X_factors, R1):

        by_norm = '2'
        X_itr = X_factors    
        num_ways = len(X_itr)
        n1 = norm_X        
        X_d = [np.sum(each_factor[:,k:],axis=1) for each_factor in X_itr]
        X_new = ktensor(X_itr).totensor()        
        X_FF_iter = []
        XtW_iter = []
        for way_index in range(num_ways):
            ways = list(range(num_ways))
            ways.remove(way_index)
            X_FF = np.ones((R1,R1))
            # pdb.set_trace()           
            for w in ways:
                X_FF = X_FF * X_itr[w].T.dot(X_itr[w])
            X_FF_iter.append(X_FF)
            XtW_iter.append(X.uttkrp(X_itr, way_index))

        for l in range(R1):
            for way_index in range(num_ways):
                similarity_reg = -X_factors[way_index][:,l].dot(S[way_index]) + X_factors[way_index][:,l].dot(X_factors[way_index][:,l].T).dot(X_factors[way_index][:,l])
                reference_reg = (X_factors[way_index][:,l] - Reference_factors[way_index][:,l])
                factor_gradient = -XtW_iter[way_index][:,l] + X_factors[way_index].dot(X_FF_iter[way_index])[:,l]
                X_itr[way_index][:,l] = (
                        X_factors[way_index][:,l] - 
                        (
                            factor_gradient  + 2*lambda_0 * similarity_reg + lambda_1 * reference_reg
                        )
                    ) / (X_FF_iter[way_index][l,l] + self.eps)

                X_itr[way_index][:,l][X_itr[way_index][:,l] < self.eps] = self.eps

        X_itr = [fn.normalize_column(each_factor,by_norm='2')[0] if way_index < (num_ways - 1) else each_factor for way_index, each_factor in enumerate(X_itr)]

        return X_itr        

