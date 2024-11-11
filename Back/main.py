from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///points.db'
db = SQLAlchemy(app)

class Point(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer)
    num_point = db.Column(db.Integer)
    lng = db.Column(db.Float)
    lat = db.Column(db.Float)
    alt = db.Column(db.Float)

@app.route('/api/save_point', methods=['POST'])
def save_point():
    try:
        data = request.json
        point = Point(
            route_id=data['routeId'],
            num_point=data['numPoint'],
            lng=data['lng'],
            lat=data['lat'],
            alt=data['alt']
        )
        db.session.add(point)
        db.session.commit()
        return jsonify({"status": "success"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
