import dataiku
from flask import request
import pandas as pd
import numpy as np
import json
import json

def generate_rule(node):
    if node.get('values'):
        if node.get('others'):
            middle = ' is not '
        else: 
            middle = ' is '
        if len(node.get('values', '')) > 1:
            middle += "one of "
            
        val_list = [str(x) for x in node.get('values', [])]
        return "{0}{1}{2}".format(node.get('feature', ''), middle, ', '.join(val_list))
    else:
        if node.get('beginning'):
            begin = '{} <= '.format(node.get('beginning'))
        else:
            begin = ''
        
        if node.get('end'):
            end =  ' < {}'.format(node.get('end'))
        else:
            end = ''
        
        if node.get('feature') is None: 
            return 'whole population'
        else:
            return '{0}{1}{2}'.format(begin, node.get('feature'), end)

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

##########################

@app.route('/parse_json')
def parse_json():
    folder_name = request.args.get('folder_name')
    path_to_the_file = request.args.get('path_to_the_file')
        
    folder = dataiku.Folder(folder_name)
    tree_path = folder.get_path() + path_to_the_file
    with open(tree_path) as handle:
        tree = json.loads(handle.read())

    rule_dict = {}
    for node_index, node in tree['saved_tree'].get('tree').items():
        rule = generate_rule(node)
        rule_dict[node_index] = node
        rule_dict[node_index]['rule'] = rule

    df_dict = {'child_rule':[], 'parent_rule':[], 'num_observations':[]}
    for node_index, node in rule_dict.items():
        parent_id = str(node.get('parent_id'))
        if parent_id != '-1':
            try:
                df_dict['parent_rule'].append(rule_dict[str(node.get('parent_id'))].get('rule'))
            except:
                continue
        else:
            df_dict['parent_rule'].append(None)
        
        df_dict['child_rule'].append(node.get('rule'))
        df_dict['num_observations'].append(node.get('samples')[0])

    tree_rules_df = pd.DataFrame(df_dict) # Compute a Pandas dataframe to write into tree_rules
    unit_column = 'child_rule' 
    parent_column = 'parent_rule'
    size_column = 'num_observations'
    dfx = build_complete_df(tree_rules_df, unit_column, parent_column, size_column)
    tree = generate_tree_structure(dfx, unit_column, parent_column, size_column)
    return json.dumps(tree)


