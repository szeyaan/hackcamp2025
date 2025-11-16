import os
import json
import sys
from io import BytesIO # To handle file data in memory

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types


API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDVXezAd80w5fRCe67fLU7ydb_IWk4xcU8")


app = Flask(__name__) 

CORS(app)


schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "medication_name": types.Schema(
            type=types.Type.STRING,
            description="The full, unambiguous name of the medication (e.g., Lipitor, Amoxicillin)."
        ),
        "dosage_strength": types.Schema(
            type=types.Type.STRING,
            description="The strength and form of the medication (e.g., 500 MG CAP, 2.5mg Tablet)."
        ),
        "directions": types.Schema(
            type=types.Type.STRING,
            description="The exact, fully capitalized instructions for use from the label, starting with an action verb (e.g., TAKE 1 CAPSULE TWICE DAILY)."
        )
    },
    # Ensure all these keys must be present in the final JSON output
    required=["medication_name", "dosage_strength", "directions"] 
)

@app.route('/api/analyze', methods=['POST'])
def analyze_medication():
    """Receives an image via POST, extracts structured data using Gemini, and returns JSON."""
    
    if not API_KEY:
        return jsonify({"error": "API_KEY is missing. Set GEMINI_API_KEY environment variable."}), 403
        
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        return jsonify({"error": f"Could not initialize Gemini client: {e}"}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image file provided in the request payload."}), 400

    uploaded_file = request.files['image']
    if uploaded_file.filename == '':
        return jsonify({"error": "No selected file name."}), 400

    try:
        file_data = uploaded_file.read()
        
        mime_type = uploaded_file.content_type if uploaded_file.content_type else "image/jpeg"
        
        image_part = types.Part.from_bytes(data=file_data, mime_type=mime_type)
        
        prompt = """
        Analyze the provided image of a medication label. Extract three specific pieces of information.
        1. Medication Name
        2. Medication Dose/Strength
        3. Directions for Use (should be fully capitalized and start with an action verb).
        """

        contents = [prompt, image_part]

        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents, 
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema, 
                max_output_tokens=2048,
                temperature=0.0
            )
        )

        if not response.text or response.text.strip() == "":
            return jsonify({"error": "Gemini API returned an empty response. Check model output or key."}), 500

        data = json.loads(response.text)
        
        return jsonify(data), 200

    except Exception as e:
        print(f"Server-side error during analysis: {e}", file=sys.stderr)
        return jsonify({"error": f"Internal server error during analysis: {str(e)}"}), 500


if __name__ == "__main__":
    print("Starting Flask server for Gemini analysis on http://127.0.0.1:5000/api/analyze...")
    print("Ensure you have set the GEMINI_API_KEY environment variable.")
    # Run server (accessible by the frontend at this address)
    app.run(debug=True, port=5000)