from flask import Flask, request, render_template, send_from_directory
import numpy 
import pandas
import pickle
import os

app = Flask(__name__)

# Load the model
model = pickle.load(open(r'fetal_health3.pkl', 'rb'))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict')
def predict():
    return render_template('predict.html')

@app.route('/inspect')
def inspect():
    return render_template('predict.html')

# Add routes for PWA files
@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

@app.route('/sw.js')
def service_worker():
    response = send_from_directory('static', 'sw.js')
    # Add Service-Worker-Allowed header
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/offline.html')
def offline():
    return render_template('offline.html')

@app.route('/output', methods=['POST', 'GET'])
def output():
    try:
        # Extract form data
        baseline_value = float(request.form['baseline_value'])
        accelerations = float(request.form['accelerations'])
        fetal_movement = float(request.form['fetal_movement'])
        uterine_contractions = float(request.form['uterine_contractions'])
        light_decelerations = float(request.form['light_decelerations'])
        severe_decelerations = float(request.form['severe_decelerations'])
        prolongued_decelerations = float(request.form['prolongued_decelerations'])
        abnormal_short_term_variability = float(request.form['abnormal_short_term_variability'])
        mean_value_of_short_term_variability = float(request.form['mean_value_of_short_term_variability'])
        percentage_of_time_with_abnormal_long_term_variability = float(request.form['percentage_of_time_with_abnormal_long_term_variability'])
        mean_value_of_long_term_variability = float(request.form['mean_value_of_long_term_variability'])
        histogram_width = float(request.form['histogram_width'])
        histogram_min = float(request.form['histogram_min'])
        histogram_max = float(request.form['histogram_max'])
        histogram_number_of_peaks = float(request.form['histogram_number_of_peaks'])
        histogram_number_of_zeroes = float(request.form['histogram_number_of_zeroes'])
        histogram_mode = float(request.form['histogram_mode'])
        histogram_mean = float(request.form['histogram_mean'])
        histogram_median = float(request.form['histogram_median'])
        histogram_variance = float(request.form['histogram_variance'])
        histogram_tendency = float(request.form['histogram_tendency'])

        # Create the input array for the model
        x = [[
            baseline_value,
            accelerations,
            fetal_movement,
            uterine_contractions,
            light_decelerations,
            severe_decelerations,
            prolongued_decelerations,
            abnormal_short_term_variability,
            mean_value_of_short_term_variability,
            percentage_of_time_with_abnormal_long_term_variability,
            mean_value_of_long_term_variability,
            histogram_width,
            histogram_min,
            histogram_max,
            histogram_number_of_peaks,
            histogram_number_of_zeroes,
            histogram_mode,
            histogram_mean,
            histogram_median,
            histogram_variance,
            histogram_tendency
        ]]
        print(x)
        # Make the prediction
        output = model.predict(x)
        result = ['NORMAL', 'PATHOLOGICAL', 'SUSPECT'][int(output[0])]

        return render_template('output.html', dt=result)

    except Exception as e:
        return str(e)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
