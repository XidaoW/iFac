#!/usr/bins/python
# -*- coding:utf-8 -*-
'''
Created on 2015/06/14

@author: drumichiro
'''

import numpy as np
import json

json_translations = r'''
{
  "\u540d\u53e4\u5c4b\u5e02": "Nagoya city", 
  "\u5b85\u914d": "Delivery service", 
  "\u6771\u4eac\u90fd": "Tokyo", 
  "\u5c90\u961c\u5e02": "Gifu", 
  "\u5317\u6d77\u9053": "Hokkaido", 
  "\u8328\u57ce\u770c": "Ibaraki Prefecture", 
  "\u30d8\u30a2\u30b5\u30ed\u30f3": "Hair Salon", 
  "\u5175\u5eab\u770c": "Hyogo Prefecture", 
  "\u9e7f\u5150\u5cf6\u5e02": "Kagoshima", 
  "\u5bcc\u5c71": "Toyama", 
  "\u9759\u5ca1\u770c": "Shizuoka Prefecture", 
  "\u798f\u5cf6": "Fukushima", 
  "\u798f\u5cf6\u770c": "Fukushima Prefecture", 
  "\u9e7f\u5150\u5cf6": "Kagoshima", 
  "\u6771\u5317": "Northeast", 
  "\u30d3\u30e5\u30fc\u30c6\u30a3\u30fc": "Beauty", 
  "\u4eac\u90fd\u5e02": "Kyoto City", 
  "\u8328\u57ce": "Ibaraki", 
  "\u8cb8\u5225\u8358": "Vacation rental", 
  "\u5e83\u5cf6": "Hiroshima", 
  "\u5ddd\u5d0e\u30fb\u6e58\u5357\u30fb\u7bb1\u6839\u4ed6": "Kawasaki ShonanHakone other", 
  "\u5343\u8449": "Chiba", 
  "\u77f3\u5ddd\u770c": "Ishikawa Prefecture", 
  "\u6c96\u7e04": "Okinawa", 
  "\u5bae\u57ce": "Miyagi", 
  "\u30a4\u30d9\u30f3\u30c8": "Event", 
  "\u795e\u5948\u5ddd\u770c": "Kanagawa Prefecture", 
  "\u65b0\u6f5f": "Niigata", 
  "\u798f\u5ca1": "Fukuoka", 
  "\u65b0\u5bbf\u30fb\u9ad8\u7530\u99ac\u5834\u30fb\u4e2d\u91ce\u30fb\u5409\u7965\u5bfa": "Shinjuku Takadanobaba Nakano Kichijoji", 
  "\u57fc\u7389\u770c": "Saitama Prefecture", 
  "\u6ecb\u8cc0": "Shiga", 
  "\u6c60\u888b\u30fb\u795e\u697d\u5742\u30fb\u8d64\u7fbd": "Ikebukuro KagurazakaAkabane", 
  "\u677e\u5c71\u5e02": "Matsuyama", 
  "\u7fa4\u99ac": "Gunma", 
  "\u6771\u6d77": "East Sea", 
  "\u6a2a\u6d5c\u5e02": "Yokohama", 
  "\u9759\u5ca1": "Shizuoka", 
  "\u9577\u91ce": "Nagano", 
  "\u9ce5\u53d6\u5e02": "Tottori", 
  "\u795e\u6238\u5e02": "Kobe", 
  "\u30db\u30c6\u30eb\u30fb\u65c5\u9928": "Hotel and Japanese hotel", 
  "\u5bcc\u5c71\u770c": "Toyama Prefecture", 
  "\u6075\u6bd4\u5bff\u30fb\u76ee\u9ed2\u30fb\u54c1\u5ddd": "Ebisu Meguro Shinagawa", 
  "\u611b\u77e5": "Aichi", 
  "\u30ed\u30c3\u30b8": "Lodge", 
  "\u30ad\u30bf": "Northern", 
  "\u5e83\u5cf6\u5e02": "Hiroshima", 
  "\u30ec\u30b8\u30e3\u30fc": "Leisure", 
  "\u95a2\u6771": "Kanto", 
  "\u77f3\u5ddd": "Ishikawa", 
  "\u9577\u5d0e\u5e02": "Nagasaki", 
  "\u5bae\u5d0e": "Miyazaki", 
  "\u9ad8\u77e5\u770c": "Kochi Prefecture", 
  "\u6ecb\u8cc0\u770c": "Shiga Prefecture", 
  "\u718a\u672c\u5e02": "Kumamoto", 
  "\u5bae\u5d0e\u5e02": "Miyazaki", 
  "\u611b\u5a9b\u770c": "Ehime Prefecture", 
  "\u5c71\u5f62\u5e02": "Yamagata", 
  "\u548c\u6b4c\u5c71\u770c": "Wakayama Prefecture", 
  "\u3055\u3044\u305f\u307e\u5e02": "Saitama", 
  "\u4f50\u8cc0\u770c": "Saga Prefecture", 
  "\u6a2a\u6d5c": "Yokohama", 
  "\u9e7f\u5150\u5cf6\u770c": "Kagoshima prefecture", 
  "\u5317\u4fe1\u8d8a": "Hokushinetsu", 
  "\u9577\u5d0e": "Nagasaki", 
  "\u65b0\u6f5f\u5e02": "Niigata", 
  "\u5fb3\u5cf6": "Tokushima", 
  "\u5927\u5206": "Much", 
  "\u30ec\u30c3\u30b9\u30f3": "Lesson", 
  "\u4eac\u90fd\u5e9c": "Kyoto", 
  "\u5175\u5eab": "Hyogo", 
  "\u4e2d\u56fd": "China", 
  "\u5c71\u68a8": "Yamanashi", 
  "\u9ce5\u53d6": "Tottori", 
  "\u305d\u306e\u4ed6": "Other", 
  "\u6e0b\u8c37\u30fb\u9752\u5c71\u30fb\u81ea\u7531\u304c\u4e18": "Shibuya Aoyama Jiyugaoka", 
  "\u5343\u8449\u5e02": "Chiba", 
  "\u5fb3\u5cf6\u770c": "Tokushima Prefecture", 
  "\u5bae\u57ce\u770c": "Miyagi Prefecture", 
  "\u30a8\u30b9\u30c6": "Spa", 
  "\u901a\u4fe1\u8b1b\u5ea7": "Correspondence course", 
  "\u9752\u68ee\u5e02": "Aomori", 
  "\u30b2\u30b9\u30c8\u30cf\u30a6\u30b9": "Guest house", 
  "\u5927\u5206\u5e02": "Oita", 
  "\u7fa4\u99ac\u770c": "Gunma Prefecture", 
  "\u798f\u4e95": "Fukui", 
  "\u5ca9\u624b\u770c": "Iwate Prefecture", 
  "\u4e5d\u5dde\u30fb\u6c96\u7e04": "Kyushu Okinawa", 
  "\u5948\u826f\u5e02": "Nara", 
  "\u516c\u5171\u306e\u5bbf": "Public hotel", 
  "\u798f\u5ca1\u770c": "Fukuoka Prefecture", 
  "\u79cb\u7530\u5e02": "Akita", 
  "\u65b0\u5bbf\u533a": "Shinjuku", 
  "\u5ca1\u5c71\u770c": "Okayama Prefecture", 
  "\u30ea\u30e9\u30af\u30bc\u30fc\u30b7\u30e7\u30f3": "Relaxation", 
  "\u5927\u962a\u5e9c": "Osaka prefecture", 
  "\u30da\u30f3\u30b7\u30e7\u30f3": "Resort inn", 
  "\u5b87\u90fd\u5bae\u5e02": "Utsunomiya", 
  "\u611b\u5a9b": "Ehime", 
  "\u5c90\u961c\u770c": "Gifu Prefecture", 
  "\u9577\u91ce\u770c": "Nagano Prefecture", 
  "\u798f\u5cf6\u5e02": "Fukushima", 
  "\u4e09\u91cd": "Triple", 
  "\u677e\u6c5f\u5e02": "Matsue", 
  "\u8d64\u5742\u30fb\u516d\u672c\u6728\u30fb\u9ebb\u5e03": "Akasaka Roppongi Azabu", 
  "\u718a\u672c\u770c": "Kumamoto Prefecture", 
  "\u95a2\u897f": "Kansai", 
  "\u7532\u5e9c\u5e02": "Kofu", 
  "\u5065\u5eb7\u30fb\u533b\u7642": "Health Medical", 
  "\u65c5\u9928": "Japanese hotel", 
  "\u5927\u6d25\u5e02": "Otsu", 
  "\u56db\u56fd": "Shikoku", 
  "\u6d25\u5e02": "Tsu", 
  "\u718a\u672c": "Kumamoto", 
  "\u4f50\u8cc0": "Saga", 
  "\u5c71\u53e3\u770c": "Yamaguchi Prefecture", 
  "\u9999\u5ddd\u770c": "Kagawa Prefecture", 
  "\u6c11\u5bbf": "Japanse guest house", 
  "\u30ae\u30d5\u30c8\u30ab\u30fc\u30c9": "Gift card", 
  "\u30b0\u30eb\u30e1": "Food", 
  "\u9999\u5ddd": "Kagawa", 
  "\u5cf6\u6839": "Shimane", 
  "\u30d3\u30e5\u30fc\u30c6\u30a3": "Beauty", 
  "\u6c96\u7e04\u770c": "Okinawa", 
  "\u6803\u6728": "Tochigi", 
  "\u9ce5\u53d6\u770c": "Tottori Prefecture", 
  "\u798f\u4e95\u5e02": "Fukui", 
  "\u6803\u6728\u770c": "Tochigi Prefecture", 
  "\u9ad8\u77e5": "Kochi", 
  "\u5e83\u5cf6\u770c": "Hiroshima Prefecture", 
  "\u5c71\u5f62": "Yamagata", 
  "\u305d\u306e\u4ed6\u306e\u30af\u30fc\u30dd\u30f3": "Other Coupon", 
  "\u5bcc\u5c71\u5e02": "Toyama", 
  "\u57fc\u7389": "Saitama", 
  "\u5bae\u5d0e\u770c": "Miyazaki Prefecture", 
  "\u9ad8\u77e5\u5e02": "Kochi", 
  "WEB\u30b5\u30fc\u30d3\u30b9": "Web service", 
  "\u90a3\u8987\u5e02": "Naha", 
  "\u7acb\u5ddd\u30fb\u753a\u7530\u30fb\u516b\u738b\u5b50\u4ed6": "Tachikawa Machida Hachioji other", 
  "\u6c34\u6238\u5e02": "Mito", 
  "\u4f50\u8cc0\u5e02": "Saga", 
  "\u79cb\u7530": "Akita", 
  "\u9752\u68ee": "Aomori", 
  "\u5927\u962a\u5e02": "Osaka", 
  "\u548c\u6b4c\u5c71\u5e02": "Wakayama", 
  "\u65b0\u6f5f\u770c": "Niigata Prefecture", 
  "\u5c71\u5f62\u770c": "Yamagata Prefecture", 
  "\u5c71\u53e3": "Yamaguchi", 
  "\u5c90\u961c": "Gifu", 
  "\u5948\u826f": "Nara", 
  "\u9577\u91ce\u5e02": "Nagano", 
  "\u9759\u5ca1\u5e02": "Shizuoka", 
  "\u524d\u6a4b\u5e02": "Maebashi", 
  "\u9752\u68ee\u770c": "Aomori Prefecture", 
  "\u548c\u6b4c\u5c71": "Wakayama", 
  "\u9ad8\u677e\u5e02": "Takamatsu", 
  "\u5fb3\u5cf6\u5e02": "Tokushima", 
  "\u4e09\u91cd\u770c": "Mie", 
  "\u9577\u5d0e\u770c": "Nagasaki Prefecture", 
  "\u5343\u8449\u770c": "Chiba Prefecture", 
  "\u5ca1\u5c71": "Okayama", 
  "\u5c71\u53e3\u5e02": "Yamaguchi", 
  "\u5927\u5206\u770c": "Oita Prefecture", 
  "\u91d1\u6ca2\u5e02": "Kanazawa", 
  "\u798f\u4e95\u770c": "Fukui Prefecture", 
  "\u30df\u30ca\u30df\u4ed6": "Minami other", 
  "\u5cf6\u6839\u770c": "Shimane Prefecture", 
  "\u672d\u5e4c\u5e02": "Sapporo", 
  "\u798f\u5ca1\u5e02": "Fukuoka", 
  "\u76db\u5ca1\u5e02": "Morioka", 
  "\u9280\u5ea7\u30fb\u65b0\u6a4b\u30fb\u6771\u4eac\u30fb\u4e0a\u91ce": "Ginza Shinbashi Tokyo Ueno", 
  "\u5948\u826f\u770c": "Nara Prefecture", 
  "\u30db\u30c6\u30eb": "Hotel", 
  "\u4ed9\u53f0\u5e02": "Sendai", 
  "無登録": "Unregistered",
  "\u5ca9\u624b": "Iwate", 
  "\u611b\u77e5\u770c": "Aichi Prefecture", 
  "\u5ca1\u5c71\u5e02": "Okayama", 
  "\u901a\u5b66\u30ec\u30c3\u30b9\u30f3": "Class", 
  "\u4eac\u90fd": "Kyoto", 
  "\u79cb\u7530\u770c": "Akita", 
  "\u30cd\u30a4\u30eb\u30fb\u30a2\u30a4": "Nail and eye salon", 
  "\u5c71\u68a8\u770c": "Yamanashi Prefecture"
}
'''

translations = json.loads(json_translations)

def generateFeatureLabelIf(label, bins):
    if label is None:
        labelBins = list(map(str, bins))
        labelBins.insert(0, "\"under\"")
        labelBins[-1] += " \"over\""
        label = ["%02d %s" % (i1, lb) for i1, lb in enumerate(labelBins)]
    return np.array(label)


def translateLabel(label):
    if label in translations:
        return translations[label]
    return label

def digitizeFeatureValue(feature, column, bins, label=None):
    value = feature[column].values
    label = generateFeatureLabelIf(label, bins)
    assert (len(bins) + 1) == len(label)
    feature[column] = label[np.digitize(value, np.array(bins))]
    return feature


def extractBinAndLabel(levels):
    bins = []
    label = []
    for i1 in levels:
        bins.append(np.arange(len(i1)))
        label.append(list(map(lambda x: str(x), i1.values)))
    return np.array(bins), np.array(label)


def createHistogram(dataFrame, extractColumn):
    group = dataFrame.groupby(extractColumn).size()
    index = group.index
    hist = np.zeros(list(map(len, index.levels)))
    for i1, pos in enumerate(zip(*index.labels)):
        hist[pos] = group.values[i1]
    bins, label = extractBinAndLabel(index.levels)
    return hist, bins, label
