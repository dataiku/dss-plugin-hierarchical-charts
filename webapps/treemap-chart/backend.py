import dataiku
from flask import request
import pandas as pd
import numpy as np
import json
import traceback
import logging
logger = logging.getLogger(__name__)

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


@app.route('/reformat_data')
def reformat_data():
    try: 
        dataset_name = request.args.get('dataset_name')
        unit_column = request.args.get('unit_column')
        parent_column = request.args.get('parent_column')
        size_column = request.args.get('size_column')
        color_column = request.args.get('color_column')
        if color_column == '': 
            color_column = None
        columns_list = [x for x in [unit_column, parent_column, size_column, color_column] if x is not None]
        df = dataiku.Dataset(dataset_name).get_dataframe(columns=columns_list)        
        dfx = build_complete_df(df, unit_column, parent_column, size_column, color_column) 
        return json.dumps({'result':[columns_list] + dfx.values.tolist()})
    except:
        logger.error(traceback.format_exc())
        return traceback.format_exc(), 500
