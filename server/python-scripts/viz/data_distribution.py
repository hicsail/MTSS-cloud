import argparse
import numpy as np
import pandas as pd
import os
import warnings
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")

def piechart(ax, data, col_name, title, labels=None):
    c = data[col_name].unique()
    counts = []
    for cc in c:
        counts.append((data[col_name] == cc).sum())
    
    if labels:
        ax.pie(counts, labels=labels)
        return 
    
    ax.pie(counts, labels=c)
    ax.set_title(title)
    return


def historgram(ax, data, col_name, title=None, labels=None, nbins=20, legend=None):
    _, _, hist = ax.hist(data[col_name],bins=nbins, alpha=0.5)
    ax.axvline(data[col_name].mean(), color='k', linestyle='dashed', linewidth=1)
    
    if title:
        ax.set_title(title)
    
    if labels:
        hist.set_label(labels)
        ax.legend()
    return

def get_parser():
    parser = argparse.ArgumentParser(description='Options')
    parser.add_argument('--csv_path', default=None, type=str, help='Path to CSV file.')
    parser.add_argument('--output_path', default=None, type=str, help='Path to output file.')
    parser.add_argument('--column_name', default=None, type=str, help='Column name')    
    return parser

if __name__ == "__main__":

    parser = get_parser()
    args = parser.parse_args()
    csv_path = args.csv_path
    output_path = args.output_path
    column_name = args.column_name

    all_data = pd.read_csv(csv_path)
    imageNames = []

    try:
        fig, ax = plt.subplots(1,1, figsize=(10, 10))
        piechart(ax, all_data, column_name, column_name + 'Distribution Pie Chart')
        plt.savefig(os.path.join(output_path, column_name + '_pie.png'), bbox_inches='tight')        
        imageNames.append(column_name + '_pie.png')
    except ValueError as err:       
        pass 

    try:
        fig, ax = plt.subplots(1,1, figsize=(10, 15))
        historgram(ax, all_data, column_name, column_name + 'Distribution Historgram Chart')
        plt.savefig(os.path.join(output_path, column_name + '_historgram.png'), bbox_inches='tight')
        imageNames.append(column_name + '_historgram.png')
    except ValueError as err:          
        pass    
                    
    print(imageNames)
