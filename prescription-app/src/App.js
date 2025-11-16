import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { Upload, Image, Info, FileText, Camera } from 'lucide-react';

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

  // --- CAMERA CONTROL FUNCTIONS ---

  // const stopCamera = () => {
  //   if (stream) {
  //     stream.getTracks().forEach(track => track.stop());
  //     setStream(null);
  //     setMessage('Camera stopped.');
  //   }
  // };

  // const startCamera = async () => {
  //   // 1. Stop any existing stream before starting a new one
  //   stopCamera(); 
  //   setMessage('Requesting camera access...');
  //   setPhoto(null); // Clear previous photo

  //   try {
  //     // Request access to the user's video device
  //     const mediaStream = await navigator.mediaDevices.getUserMedia({
  //       video: { 
  //         width: 320, 
  //         height: 240,
  //         facingMode: "environment" // Prefer back camera for "scanning"
  //       },
  //     });

  //     // Assign the stream to the video element and start playing
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = mediaStream;
  //       videoRef.current.play();
  //       setMessage('Camera active. Ready to scan.');
  //       setStream(mediaStream);
  //       setCurrentView('camera'); // Switch to camera view on success
  //     }
  //   } catch (err) {
  //     console.error("Error accessing camera: ", err);
  //     setMessage(`ERROR: Could not access camera. Please check permissions. (${err.name}). Returning to splash.`);
  //     setCurrentView('splash'); // Return to splash on failure
  //   }
  // };

  // // Cleanup: Stop camera when the component is unmounted or view changes
  // useEffect(() => {
  //   return () => {
  //     stopCamera();
  //   };
  // }, []);


  // // Capture the current frame from the video feed
  // const takePhoto = () => {
  //   if (!videoRef.current || !canvasRef.current || !stream) {
  //     setMessage("Camera not running or elements not ready.");
  //     return;
  //   }

  //   const video = videoRef.current;
  //   const canvas = canvasRef.current;
    
  //   // Set canvas dimensions to match the video frame size
  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;

  //   const context = canvas.getContext('2d');
    
  //   // Draw the current video frame onto the canvas
  //   context.drawImage(video, 0, 0, canvas.width, canvas.height);

  //   // Get the image data URL (Base64) from the canvas
  //   const image = canvas.toDataURL('image/png');
  //   setPhoto(image);
  //   setMessage('Photo captured successfully! Ready for scanning logic.');
    
  //   // Optional: Stop the camera after taking the photo
  //   stopCamera(); 
  // };

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

  // const handleImageUpload = (event) => {
  //   const file = event.target.files[0];
  //   if (file && file.type.startsWith('image/')) {
  //     setImageFile(file);
      
  //     // Create a local URL for image preview
  //     const url = URL.createObjectURL(file);
  //     setImagePreviewUrl(url);
      
  //     // Transition to the main info view upon successful upload
  //     setCurrentView('info');
  //     setMessage('');
      
  //     // In a real application, you would send 'file' to your Python backend here
  //     // and then update the 'imageInfo' state with the response data.
  //     console.log('File selected:', file.name);
      
  //     // Reset mock data to simulate analysis results (optional)
  //     setImageInfo(mockImageData); 

  //   } else {
  //     setImageFile(null);
  //     setImagePreviewUrl(null);
  //     setMessage('Please upload a valid image file.');
  //     console.error("Please upload a valid image file.");
  //   }
  // };

  const InformationRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 px-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center text-sm font-medium text-gray-500">
        <Info className="w-4 h-4 mr-2 text-indigo-500" />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-800 break-words max-w-[60%] text-right">
        {value}
      </div>
    </div>
  );

  const InfoPanel = useMemo(() => {
    if (apiError) {
      return (
        <div className="mt-8 p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center shadow-lg">
          <p className="font-bold">Connection/Analysis Error</p>
          <p className="text-sm mt-1">{apiError}</p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="w-full bg-white shadow-xl rounded-xl mt-8 p-12 text-center text-indigo-600 transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-indigo-500 mx-auto mb-3"></div>
          <p className="font-semibold">Analyzing image with Gemini...</p>
          <p className="text-sm text-gray-500">Sending image to Python server for processing.</p>
        </div>
      );
    }
    
    // Only render the panel if there is information to show
    if (Object.keys(imageInfo).length === 0) {
        return null;
    }

    return (
      <div className="w-full bg-white shadow-xl rounded-xl overflow-hidden mt-8 transition-all duration-300">
        <div className="p-4 bg-indigo-500/10 border-b border-indigo-200">
          <h2 className="flex items-center text-lg font-bold text-indigo-800">
            <FileText className="w-5 h-5 mr-2" />
            MediScan Analysis Results
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Mapping the data using the structured keys from your schema */}
          {Object.entries(imageInfo).map(([key, value]) => (
            <InformationRow 
              key={key} 
              // Use the user-friendly label from the map, or the key itself as a fallback
              label={labelMap[key] || key} 
              value={value} 
            />
          ))}
        </div>
      </div>
    );
  }, [imageInfo, isLoading, apiError]);


  // --- RENDER LOGIC ---

  // RENDER SPLASH SCREEN
  if (currentView === 'splash') {
    return (
      <div className="mobileContainer">
        <div className='splashScreen'>
          <img className="logo" src="./pill-25.png" />
          <h1 className='splashH1'>MediScan</h1>
          <h2 className='splashH2'>Scan. Review. Schedule.</h2>
          <button 
            // onClick={startCamera} 
            className='splashButton'
          >
            Take Photo
          </button>
        <div className='w-full max-w-xs'>
          <label 
            htmlFor="splash-image-upload" 
            className="cursor-pointer inline-block w-full py-4 px-6 text-indigo-200 border-2 border-indigo-200 font-medium text-lg rounded-full hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
          >
            <Upload className="w-5 h-5 mr-3" />
            Select from Gallery
          </label>
          <input 
            id="splash-image-upload"
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

  // RENDER CAMERA VIEW
  return (
    <div className="mobileContainer">
      <div className="w-full max-w-4xl">
        <div className="bg-white p-6 shadow-2xl rounded-xl border border-gray-100">
          <h2 className="splashH2">
            <Image className="w-5 h-5 mr-2 text-pink-500" />
            Image Preview
          </h2>

        <div className='imageInstruction'>
          <h2>
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
              <div className="flex flex-col items-center justify-center h-full text-indigo-600">
                <Upload className="w-10 h-10 mb-2" />
                <span className="text-lg font-medium">Select an image to analyze</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            {/* Reusing handleImageUpload for changing the image */}
            <label 
              htmlFor="image-upload" 
              className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 transform hover:scale-[1.02]"
            >
              <Upload className="w-5 h-5 mr-3" />
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

        {imagePreviewUrl && (
          <div className="pb-8">
            {InfoPanel}
          </div>
        )}

      </div>
    </div>
  );
}