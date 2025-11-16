import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { Upload, FileText, CheckCircle } from 'lucide-react';

const initialImageInfo = {}; 

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [currentView, setCurrentView] = useState('splash'); 
  const [message, setMessage] = useState('');
  
  // New state variables for API communication
  const [imageInfo, setImageInfo] = useState(initialImageInfo); 
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const labelMap = {
    'medication_name': 'Medication Name',
    'dosage_strength': 'Dosage / Strength',
    'directions': 'Directions for Use',
  };

  const navigateToSplash = () => {
    setCurrentView('splash');
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageInfo({});
    setApiError(null);
    setMessage('');
  };

  const handleConfirm = () => {
    setCurrentView('confirm');
  };

    const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setImageFile(null);
      setImagePreviewUrl(null);
      setMessage('Please upload a valid image file.');
      console.error("Please upload a valid image file.");
      return;
    }

    // 1. Reset/Prepare UI state for new analysis
    setApiError(null);
    setIsLoading(true);
    setCurrentView('info');
    setImageInfo({});
    setMessage('');

    // Setup file preview
    setImageFile(file);
    // Use URL.createObjectURL for local preview
    const url = URL.createObjectURL(file); 
    setImagePreviewUrl(url);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const API_ENDPOINT = 'http://127.0.0.1:5000/api/analyze'; 
      
      const response = await fetch(API_ENDPOINT, { 
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // If the server responded with an error status (e.g., 400, 500, 403)
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status} ${response.statusText}. Check if Python server is running.`);
      }
      
      const analysisData = await response.json(); 
      
      setImageInfo(analysisData);

    } catch (error) {
      console.error('API Error:', error);
      // Display the error message from the Python server or the generic connection error
      setApiError(error.message || 'Could not connect to Python server at http://127.0.0.1:5000.');
      setImageInfo({}); // Clear info on error
    } finally {
      setIsLoading(false);
      // Clean up the object URL
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  const InformationRow = ({ label, value }) => (
    <div className="mb-4">
      <div className="informationLabel">
        {label}
      </div>
      <div className="informationValue">
        {value}
      </div>
    </div>
  );

  const InfoPanel = useMemo(() => {
    if (apiError) {
      return (
        <div>
          <p>Connection/Analysis Error</p>
          <p>{apiError}</p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div>
          <p>Analyzing image...</p>
          <p>Sending image to server for processing.</p>
        </div>
      );
    }
    
    // Only render the panel if there is information to show
    if (Object.keys(imageInfo).length === 0) {
        return null;
    }

    return (
      <div>
        <div>
          <h2>
            <FileText/>
            Pillender Analysis Results
          </h2>
        </div>
        <div>
          {Object.entries(imageInfo).map(([key, value]) => (
            <InformationRow 
              key={key} 
              label={labelMap[key] || key} 
              value={value} 
            />
          ))}
        </div>
      </div>
    );
  }, [imageInfo, isLoading, apiError, labelMap]);


  // --- RENDER LOGIC ---

  // RENDER SPLASH SCREEN
  if (currentView === 'splash') {
    return (
      <div className="mobileContainer">
        <div className='splashScreen'>
          <img className="logo" src="./pill-25.png" />
          <h1 className='splashH1'>Pillender</h1>
          <h2 className='splashH2'>Scan. Review. Schedule.</h2>
          <button 
            // onClick={startCamera} 
            className='splashButton'
          >
            Take Photo
          </button>
          <button className="splashButton" onClick={() => document.getElementById('image-upload').click()}>Upload an Image</button>
        <div className="hidden">
          <label 
            htmlFor="image-upload" 
          >
            <Upload />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </div>
        </div>
        <p className='message'>{message}</p>
      </div>
    );
  }

  if (currentView === 'confirm') {
    return (
      <div className="mobileContainer">
        <div className="confirmScreen">
          <CheckCircle className="checkIcon" width={150} height={150} />
          <h2 className="confirmTitle">
            Your medication has been added to your calendar!
          </h2>
          <button 
            onClick={navigateToSplash} 
            className="splashButton"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobileContainer">
      <div className="imageScreen">
        <div>
        <div className='imageInstruction'>
          <h2 className='imageTitle'>
            All photos analyzed. Edit by clicking on box if needed.
          </h2>
        </div> 
          <div className={`aspect-video w-full rounded-lg overflow-hidden border-2 border-dashed transition-all duration-300 ${imagePreviewUrl ? 'border-gray-200' : 'border-indigo-300 bg-indigo-50 hover:border-indigo-500'}`}>
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Uploaded Preview"
                className="uploadedImage"
                // Clean up the object URL after image loads
                onLoad={() => URL.revokeObjectURL(imagePreviewUrl)}
              />
            ) : (
              // Placeholder for upload
              <div>
                <Upload />
                <span>Select an image to analyze</span>
              </div>
            )}
          </div>
        </div>

        {imagePreviewUrl && (
          <div className="pb-8">
            {InfoPanel}
          </div>
        )}

        <div className="buttonRow">
          <button className="splashButton" onClick={() => document.getElementById('image-upload').click()}>Retake</button>
          <button className="splashButton" onClick={handleConfirm}>Confirm</button>
        </div>

        <div className="hidden">
          <label 
            htmlFor="image-upload" 
          >
            <Upload />
            {imageFile ? 'Change Image' : 'Upload Image'}
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </div>

      </div>
    </div>
  );
}