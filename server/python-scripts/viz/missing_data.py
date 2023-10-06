import argparse
import numpy as np
import pandas as pd
import missingno as msno
import os
import warnings

warnings.filterwarnings("ignore")

def get_parser():
    parser = argparse.ArgumentParser(description='Options')
    parser.add_argument('--csv_path', default=None, type=str, help='Path to CSV file.')
    parser.add_argument('--output_path', default=None, type=str, help='Path to CSV file.')    
    return parser

if __name__ == "__main__":

    parser = get_parser()
    args = parser.parse_args()
    csv_path = args.csv_path
    output_path = args.output_path

    all_data = pd.read_csv(csv_path)
    imageNames = []

    try:
        bar = msno.bar(all_data)
        bar.get_figure().savefig(os.path.join(output_path, 'bar_viz.png'), bbox_inches = 'tight')
        imageNames.append('bar_viz.png')
    except ValueError as err:       
        pass 

    try:
        matrix = msno.matrix(all_data)
        matrix.get_figure().savefig(os.path.join(output_path, 'matrix_viz.png'), bbox_inches = 'tight')
        imageNames.append('matrix_viz.png')
    except ValueError as err:          
        pass 

    try:
        heatmap = msno.heatmap(all_data)    
        heatmap.get_figure().savefig(os.path.join(output_path, 'heatmap_viz.png'), bbox_inches = 'tight')
        imageNames.append('heatmap_viz.png')
    except ValueError as err:           
        pass 

    try:
        dendrogram = msno.dendrogram(all_data)    
        dendrogram.get_figure().savefig(os.path.join(output_path, 'dendrogram_viz.png'), bbox_inches = 'tight')
        imageNames.append('dendrogram_viz.png')
    except ValueError as err:           
        pass 
                 
    print(imageNames)




