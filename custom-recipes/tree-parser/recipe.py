# coding: utf-8
import dataiku
from dataiku.customrecipe import *
import pandas as pd, numpy as np
from dataiku import pandasutils as pdu
import json

def generate_rule(node):
    if node.get('values'):
        if node.get('others'):
            middle = ' is not '
        else: 
            middle = ' is '
        if len(node.get('values', '')) > 1:
            middle += "one of "
        return node.get('feature', '') + middle + ', '.join(node.get('values', ''))
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

        

# Recipe inputs
folder_name = get_input_names_for_role('input_folder')[0]
folder = dataiku.Folder(folder_name)
tree_path = os.path.join(folder.get_path(), 'kikou.json')
with open(tree_path) as handle:
    tree = json.loads(handle.read())

rule_dict = {}
for node_index, node in tree['saved_tree'].get('tree').items():
    rule = generate_rule(node)
    rule_dict[node_index] = node
    rule_dict[node_index]['rule'] = rule
    
df_dict = {'child_rule':[], 'parent_rule':[], 'num_observations':[]}
for node_index, node in rule_dict.items():
    df_dict['child_rule'].append(node.get('rule'))
    parent_id = str(node.get('parent_id'))
    if parent_id != '-1':
        df_dict['parent_rule'].append(rule_dict[str(node.get('parent_id'))].get('rule'))
    else:
        df_dict['parent_rule'].append(None)
    df_dict['num_observations'].append(node.get('samples')[0])
    
tree_rules_df = pd.DataFrame(df_dict) # Compute a Pandas dataframe to write into tree_rules


# Write recipe outputs

output_ = get_output_names_for_role('output_dataset')[0]
tree_rules = dataiku.Dataset(output_)
tree_rules.write_with_schema(tree_rules_df)