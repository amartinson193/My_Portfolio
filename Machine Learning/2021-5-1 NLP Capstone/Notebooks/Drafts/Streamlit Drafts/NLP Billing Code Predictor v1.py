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

 # -------------------------
    # Load from Files
 # -------------------------
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
# -------------------------
    # Clean Text -- NEED TO ADD TO SECTION
# -------------------------

# -------------------------
    # Make Predictions
# -------------------------

def make_predictions(df, diagnosis_dsc, section='icd', other_text=[]):
    
    #Subset the DataFrame
    df = df[df['Section'] == section].reset_index()
    
    # Choose a random row
    # random.seed(30)
    row = round(random.random() * (len(df) - 1))

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
    # Plot Predictions Function
# -------------------------

def plot_pred(predict_df):
    df = predict_df[predict_df.section != 'icd']
    df = df.sort_values('conf_prob')
    fig, ax = plt.subplots()
    my_bar_plot = ax.barh(df.code_updated, df.conf_prob)
    # Taken from here: https://stackoverflow.com/questions/30228069/how-to-display-the-value-of-the-bar-on-each-bar-with-pyplot-barh
    for i, v in enumerate(df.conf_prob):
        ax.text(v + .01, i, str(round((v * 100))) + '%')
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
    # Build Streamlit App
# -------------------------

# Add Title and Instructions
st.title('NLP Billing Code Predictor')
st.write("""
## Instructions
To run this app with some sample clinical notes, select the 'Generated Text' radio button in the sidebar. Otherwise, type your text in the 'Clinical Notes' section 
and then run the model with the 'Text Input' radio button selected
""")

# TXTBOX1 - Create a text box
st.write('## Clinical Notes')
txt = st.text_area('Type your clinical notes below', '')

# SIDEBAR.RADIO
radio_run_option = st.sidebar.radio('Pick an option for running the model', ('Generated Text', 'Text Input'))

# BUTTON
if st.sidebar.button('Run Model'):
    if radio_run_option == 'Generated Text':

        # Call Function to Write DataFrame
        predict_df, input_text_clean = make_predictions(val_df, diagnosis_dsc, 'icd')

        # Show the selected text
        st.write('## Selected Text')
        st.text_area('', input_text_clean)

        # ICD Prediction
        pred_icd, pred_icd_prob = icd_pred(predict_df)

        # Show the ICD code and it's confidence probability
        st.write('## ICD-9 Primary Diagnosis Prediction')
        st.write('Predicted Code: ' + pred_icd)
        st.write('Prediction Confidence: ' + str(round((pred_icd_prob * 100))) + '%')
        st.write('Description: ', predict_df.LONG_TITLE[0])

        # CPT Predictions
        st.write('## CPT Predictions')
        st.write(plot_pred(predict_df))

        # ICD - Top 10 Features 
        st.write('## Top 10 Features - ICD-9')
        plot_features(predict_df, features_df, 'icd')

        # Print CPT Features
        st.write('## Top 10 Features per CPT Section')
        plot_features(predict_df, features_df, 'cpt')

    else:
        # Show the selected text
        st.write('## Selected Text')
        st.text_area('',txt) # Different from the 'Generated Text' option

        # Call Function
        predict_df, input_text_clean = make_predictions(val_df, diagnosis_dsc, 'icd', txt) # Different from the 'Generated Text' option

        # ICD Prediction
        pred_icd, pred_icd_prob = icd_pred(predict_df)

        # Show the ICD code and it's confidence probability
        st.write('## ICD-9 Primary Diagnosis Prediction')       
        st.write('Predicted Code: ' + pred_icd)
        st.write('Prediction Confidence: ' + str(round((pred_icd_prob * 100),1)) + '%')
        st.write('Description: ', predict_df.LONG_TITLE[0])

        # CPT Predictions
        st.write('## CPT Predictions')
        st.write(plot_pred(predict_df))

        # ICD - Top 10 Features 
        st.write('## Top 10 Features - ICD-9')
        plot_features(predict_df, features_df, 'icd')

        # Print CPT Features
        st.write('## Top 10 Features per CPT Section')
        plot_features(predict_df, features_df, 'cpt')



