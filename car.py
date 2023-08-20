import flask
from flask_cors import CORS
import joblib
import pickle

app = flask.Flask(__name__)
CORS(app)

try:
    # Load the trained model
    model_path = r'C:\Users\mahna\Desktop\carbon\cars_model.pkl'
    model = pickle.load(open(model_path, 'rb'))
except Exception as e:
    print("Error loading the model:", str(e))

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Assuming data is in the format: {'mileage': ..., 'fuel_type': ..., 'vehicle_class': ...}
        features = [data['mileage'], data['fuel_type'], data['vehicle_class']]
        prediction = model.predict([features])
        return jsonify({'prediction': prediction.tolist()})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run()
