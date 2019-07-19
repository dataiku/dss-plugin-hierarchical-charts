import dataiku
from flask import request
import pandas as pd
import numpy as np
import json

def build_complete_df(df, unit_column, parent_column, size_column, color_column=None):
    
    df_copy = df.dropna(how='any').copy()
    unit_set = set(df_copy[unit_column])
    parent_set = set(df_copy[parent_column])
    val = parent_set - unit_set
    if color_column:
        df2 = pd.DataFrame([[x, 'root' , 0, 0] for x in val], columns = [unit_column, parent_column, size_column, color_column])
        df3 = pd.DataFrame([['root', None , 0, 0]], columns = [unit_column, parent_column, size_column, color_column])
    else:
        df2 = pd.DataFrame([[x, 'root' , 0] for x in val], columns = [unit_column, parent_column, size_column])
        df3 = pd.DataFrame([['root', None, 0]], columns = [unit_column, parent_column, size_column])
    dfx = pd.concat([df_copy,df2,df3], axis=0, sort=False).reset_index(drop=True)    
    return dfx

def generate_tree_structure(df, unit_column, parent_column, size_column):
    
    def _create_dict(row):
        return {
            'name': row[unit_column],
            'parent': row[parent_column],
            'size': row[size_column],
            'children': []
        }
    
    raw_nodes = df.apply(_create_dict, axis=1).values.tolist()
    tree = {'name': 'root', 'children': []}
    for raw_node in raw_nodes:
        if raw_node['parent'] is None:
            tree['children'] = raw_node
            continue
        parent_index = next(x for x, val in enumerate(raw_nodes) if val['name']==raw_node['parent'])
        parent_node = raw_nodes[parent_index]
        parent_node['children'].append(raw_node)
        
    return tree


@app.route('/reformat_data')
def reformat_data():
    dataset_name = request.args.get('dataset_name')
    unit_column = request.args.get('unit_column')
    parent_column = request.args.get('parent_column')
    size_column = request.args.get('size_column')
    df = dataiku.Dataset(dataset_name).get_dataframe(columns=[unit_column, parent_column, size_column])        
    dfx = build_complete_df(df, unit_column, parent_column, size_column)
    print(dfx)
    tree = generate_tree_structure(dfx, unit_column, parent_column, size_column)
    return json.dumps(tree)



