# -------------------------
    # Import Packages
 # -------------------------

import altair as alt
import streamlit as st
import pandas as pd
import glob
import pickle
import random
import numpy as np
import gzip
import matplotlib.pyplot as plt
import requests
import lxml.html as lh
from lxml.html import fromstring
import json
import string

 # -------------------------
    # Load from Files
 # -------------------------

@st.cache(allow_output_mutation=True)
def load_files():

    # Create dictionaries for models + vectorizers and lists for validation DataFrames
    models = {}
    vectorizers = {}
    X_vals = []
    Y_vals = []

    # Load paths (streamlit doesn't work with relative paths)
    model_paths = glob.glob('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\finalized_model*')
    vectorizer_paths = glob.glob('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\finalized_vectorizer*')
    X_val_paths = glob.glob('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\X_val*')
    y_val_paths = glob.glob('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\y_val*')

    # Load HCC File
    hcc = pd.read_csv('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\2014_payment_year_midyear_final_icd_mapping.csv')

    # Load models
    for path in model_paths:
        nm = path.split('_')[-1].split('.')[0]
        models[nm] = pickle.load(open(path, 'rb'))

    # Load Vectorizers
    for path in vectorizer_paths:
        nm = path.split('_')[-1].split('.')[0]
        vectorizers[nm] = pickle.load(open(path, 'rb'))

    # Load X_Val Paths + Put in DataFrame
    for path in X_val_paths:
        nm = path.split('_')[-1].split('.')[0]
        df = pd.read_csv(path, index_col = 0)
        df['Section'] = nm
        X_vals.append(df)

    # Load Y_Val Paths + Put in DataFrame
    for path in y_val_paths:
        nm = path.split('_')[-1].split('.')[0]
        df = pd.read_csv(path, index_col = 0)
        df['Section'] = nm
        Y_vals.append(df)

    # Combine X_val + Y_val DataFrames
    X_vals_df = pd.concat(X_vals)
    X_vals_df.columns = ['TEXT', 'Section_drop']
    X_vals_df = X_vals_df.reset_index(drop=True)
    Y_vals_df = pd.concat(Y_vals)
    Y_vals_df = Y_vals_df.reset_index(drop=True)
    val_df = pd.concat([X_vals_df, Y_vals_df], axis=1)
    val_df.drop('Section_drop', axis=1, inplace=True)

    # Load ICD Descriptions
    with gzip.open('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\MIMIC Files\\D_ICD_DIAGNOSES.csv.gz', mode='r') as file:
        diagnosis_dsc = pd.read_csv(file)

    # Load Features
    features_df = pd.read_csv('C:\\Users\\amartins\\Documents\\Personal\\School\\1 - SPRING 2021 SEMESTER\\Final Project & Capstone\\Improving-Healthcare-Using-NLP---COMP-5360-Final\\Data\\features_df.csv', index_col = 0)

    return val_df, diagnosis_dsc, features_df, vectorizers, models, hcc

# -------------------------
    # Clean Text 
# -------------------------

def clean_data(text_series):
    
    # Lowercase all letters
    text_series = text_series.lower()

    # Convert to series
    text_series = pd.Series(text_series)
    
    # Replace \n 
    text_series = text_series.str.replace('\\n',' ', regex=True)  
    
    # Replace punctuation
    text_series = text_series.str.replace('[' + string.punctuation + ']', ' ', regex=True)
    
    # Remove all digits
    text_series = text_series.str.replace('\d',' ', regex=True)
    
    return text_series[0]

# -------------------------
    # Make Predictions
# -------------------------

def make_predictions(df, diagnosis_dsc, vectorizers, models, section='icd', other_text=[]):
    
    #Subset the DataFrame
    df = df[df['Section'] == section].reset_index()
    
    # Choose a random row
    # random.seed(30)

    # Preselected Notes
    selec_notes = [78,67,45,94,74,91]
    row = selec_notes[round(random.random() * (len(selec_notes) - 1))]

    # Make list for storing tuples of the code, prediction confidence, and type (CPT or ICD)
    ls = []

    # Load text data
    if len(other_text) > 0:
        input_text_clean = other_text
    else:
        input_text_clean = df.loc[row, 'TEXT']
    
    # Load Vectorizers + transform data
    for key, vectorizer in vectorizers.items():
        vectorizer_txt = vectorizer.transform([input_text_clean])

        # Load corresponding model and make prediction
        prediction = models[key].predict(vectorizer_txt)[0]
#         confidence_prob = str(round(max(models[key].predict_proba(vectorizer_txt)[0]) * 100\
#                                  ,2)
#                              ) + '%'
        confidence_prob = round(max(models[key].predict_proba(vectorizer_txt)[0]),2)
        ls.append((confidence_prob, prediction, key))

    # Create DataFrame
    predict_df = pd.DataFrame(ls)
    predict_df.columns = ['conf_prob', 'code', 'section']
    
    # ICD 9 CODE
    if np.isnan(df.loc[row, 'CPT_CD']):
        predict_df['ICD9_CODE'] = df.loc[row, 'ICD9_CODE']
    
    # CPT CODE
    else:
        predict_df['CPT_CD'] = df.loc[row, 'CPT_CD']

    # Add Additional Columns
    predict_df['OG section'] = df.loc[row, 'Section']
    type_map = {'Evaluation and management':'CPT ', 'icd':'ICD9 ', 'Medicine':'CPT ', 'other':'CPT ','Radiology':'CPT ','Surgery':'CPT '}
    predict_df['TYPE'] = predict_df['section'].map(type_map)
    predict_df['code_updated'] = predict_df['section'] + ': ' + predict_df['TYPE'] + predict_df['code']

    predict_df = predict_df.merge(diagnosis_dsc, on = 'ICD9_CODE')

    return predict_df, input_text_clean


# -------------------------
    # Function to Show ICD Prediction
# -------------------------

def icd_pred(predict_df):
    pred_icd = predict_df[predict_df.section == 'icd']['ICD9_CODE'].values[0]
    pred_icd_prob = predict_df[predict_df.section == 'icd']['conf_prob'].values[0]

    return pred_icd, pred_icd_prob

# -------------------------
    # Connect to UMLS API
# -------------------------

# Taken from: https://github.com/HHS/uts-rest-api
uri="https://utslogin.nlm.nih.gov"
auth_endpoint = "/cas/v1/api-key"

class Authentication:

    def __init__(self, apikey):
        self.apikey=apikey
        self.service="http://umlsks.nlm.nih.gov"

    def gettgt(self):
        params = {'apikey': self.apikey}
        h = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain", "User-Agent":"python" }
        r = requests.post(uri+auth_endpoint,data=params,headers=h)
        response = fromstring(r.text)
        tgt = response.xpath('//form/@action')[0]
        return tgt

    def getst(self,tgt):

        params = {'service': self.service}
        h = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain", "User-Agent":"python" }
        r = requests.post(tgt,data=params,headers=h)
        st = r.text
        return st

# Initialize authentication class
auth = Authentication('ecf1a8f1-da25-492c-8a18-b8c16faf8c72')

# Get a ticket-granting ticket
@st.cache
def get_tgt(auth):
    x = auth.gettgt()
    return x

x = get_tgt(auth)

# Find CPT Code descriptions
def search_code(df, auth):
    
    # Create list for CPT descriptions and crosswalk
    dsc_ls = []
    snomed_ls = []
    
    # Set URI 
    base_uri = 'https://uts-ws.nlm.nih.gov/rest'
    crosswalk = '/crosswalk/current/source/CPT/'
    search = '/search/2008AA'
    
    # Loop through all codes
    for i in list(df['code']):
        code = str(i)
    
        # Run search
        query = {'ticket': auth.getst(x), 'string':code, 'sabs':'CPT', 'inputType':'code', 'searchType':'exact'}
        r = requests.get(base_uri + search, params=query)
        items = json.loads(r.text)
        try:
            dsc = items['result']['results'][0]['name']
            if dsc == 'NO RESULTS':
                dsc = 'No Description Available'
        except:
            dsc = 'No Description Available'
        
        # Append to list
        dsc_ls.append(dsc)
        
        # Run crosswalk search for SNOMED-CT
        query = {'ticket': auth.getst(x), 'targetSource':'SNOMEDCT_US'}
        r = requests.get(base_uri + crosswalk + code, params=query)
        items = json.loads(r.text)
        try:
            snomed_code = items['result'][0]['ui']
        except:
            snomed_code = 'No SNOMED-CT Code Available'
            
        # Append to list
        snomed_ls.append(snomed_code)
    
    # Add to dataframe
    df['Description'] = dsc_ls
    df['SNOMED CT Code'] = snomed_ls
    
    return df

# -------------------------
    # Plot Predictions Function
# -------------------------

def plot_pred(predict_df, auth):
    
    # Remove ICD
    predict_df = predict_df[predict_df.section != 'icd']

    # Add descriptions
    predict_df = search_code(predict_df, auth)
    bars = alt.Chart(predict_df).mark_bar().encode(
        x = alt.X('conf_prob', axis=alt.Axis(format='%', title='Confidence Probability'))
        , y = alt.Y('code_updated', sort='-x', axis=alt.Axis(title=''))
        , tooltip = ['Description', 'SNOMED CT Code']
    )

    text = bars.mark_text(
        align='left',
        baseline='middle',
        dx=3  # Nudges text to right so it doesn't appear on top of the bar
    ).encode(
        text=alt.Text(shorthand='conf_prob', format='.0%')
    )

    fig = (bars + text).configure_axis(labelLimit=1000
    ).properties(width=550, height=300)
    return fig

# -------------------------
    # Plot Features Function
# -------------------------
def plot_features(predict_df, features_df, type):
    df = predict_df.merge(features_df, left_on = ['section', 'code'], right_on = ['Section', 'Class'])\
                   .sort_values(['Class', 'Prob'], ascending=False)

    df_top = df[df.Direction == 'Top']

    if type == 'icd':
        st.write(pd.DataFrame(df_top[df_top.Section == 'icd'].head(10)
                                                             .reset_index(drop=True)
                                                             .loc[:, ['Features', 'Prob']]))
    else:
        for section in set(df_top.Section).difference({'icd'}):
            st.write('### ', section)
            st.write(pd.DataFrame(df_top[df_top.Section == section].head(10)\
                                                                   .reset_index(drop=True)\
                                                                   .loc[:, ['Features', 'Prob']]))

# -------------------------
    # Build App Run Function
# -------------------------

def run_app(val_df, diagnosis_dsc, radio_run_option, vectorizers, models, txt):
    if radio_run_option == 'Generated Text':
        
        # Set txt to empty
        txt = []

        # Call Function to Write DataFrame
        predict_df, input_text_clean = make_predictions(val_df, diagnosis_dsc,  vectorizers, models, 'icd', txt) 
        
        # ICD Prediction
        pred_icd, pred_icd_prob = icd_pred(predict_df)

    else:

        # Call Function
        predict_df, input_text_clean = make_predictions(val_df, diagnosis_dsc,  vectorizers, models, 'icd', txt) 

        # ICD Prediction
        pred_icd, pred_icd_prob = icd_pred(predict_df)

    return input_text_clean, pred_icd, pred_icd_prob, predict_df


# -------------------------
    # Check if HCC
# -------------------------

def check_hcc(hcc, pred_icd):
    
    # Crop any preceding zeros
    if pred_icd[0] == '0':
        pred_icd = pred_icd[1:]
    try:
        response = hcc[hcc['DIAGNOSIS CODE'] == pred_icd]['HCC'].values[0]
    except:  
        response = 'No'
    return response

# -------------------------
    # Build Streamlit App
# -------------------------

# Initial File Load
val_df, diagnosis_dsc, features_df, vectorizers, models, hcc = load_files()

# SIDEBAR.RADIO
radio_run_option = st.sidebar.radio('Pick an option for running the model', ('Generated Text', 'Text Input'))

# Add Title and Instructions
st.title('NLP Billing Code Predictor')
st.write("""
## Instructions
To run this app with some sample clinical notes, select the 'Generated Text' radio button in the sidebar. Otherwise, type your text in the 'Clinical Notes' section 
and then run the model with the 'Text Input' radio button selected
""")

# Show the selected text
st.write('## Clinical Notes')

if radio_run_option == 'Generated Text':

    # Run predictions
    input_text_clean, pred_icd, pred_icd_prob, predict_df = run_app(val_df, diagnosis_dsc, radio_run_option, vectorizers, models, [])
    txt = input_text_clean
else:
    txt = ''
    input_text_clean, pred_icd, pred_icd_prob, predict_df = run_app(val_df, diagnosis_dsc, radio_run_option, vectorizers, models, txt)


txt_response = st.text_area('Type your clinical notes below', txt)

# SIDEBAR.BUTTON
if st.sidebar.button('Run Model'):
    if radio_run_option != 'Generated Text':
        # Only run the app again if it is not generated
        txt_response = clean_data(txt_response)
        input_text_clean, pred_icd, pred_icd_prob, predict_df = run_app(val_df, diagnosis_dsc, radio_run_option, vectorizers, models, txt_response)

# Show the ICD code and its confidence probability
st.write('## ICD-9 Primary Diagnosis Prediction')
st.write('Predicted Code: ' + pred_icd)
st.write('Prediction Confidence: ' + str(round((pred_icd_prob * 100))) + '%')
st.write('Description: ', predict_df.LONG_TITLE[0])
st.write('Is HCC?: ', check_hcc(hcc, pred_icd))

# CPT Predictions
st.write('## CPT Predictions')
st.write(plot_pred(predict_df, auth))

# ICD - Top 10 Features 
st.write('## Top 10 Features - ICD-9')
plot_features(predict_df, features_df, 'icd')

# Print CPT Features
st.write('## Top 10 Features per CPT Section')
plot_features(predict_df, features_df, 'cpt')
