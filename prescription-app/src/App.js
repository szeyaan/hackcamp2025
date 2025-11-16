import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';
import { Upload, Image, Info, FileText, Camera } from 'lucide-react';

const mockImageData = {
  'Object Detected': 'Blue Jay (Cyanocitta cristata)',
  'Confidence Score': '98.5%',
  'Dominant Color': 'Sky Blue',
  'Location Tag': 'Forest Canopy',
  'Resolution': '1920 x 1080',
  'File Size': '3.2 MB',
  'Exif Data Present': 'Yes',
};

// Main Camera Capture Component
export default function App() {
  // State to control the view: 'splash' or 'camera'
  const [currentView, setCurrentView] = useState('splash'); 
  // State to hold the captured image's data URL (Base64 string)
  const [photo, setPhoto] = useState(null);
  // State for status messages (e.g., "Camera Active," "Error")
  const [message, setMessage] = useState('');
  // State to hold the actual MediaStream object
  const [stream, setStream] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const [imageInfo, setImageInfo] = useState(mockImageData); 
  
  // Refs to connect the logic to the DOM elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      
      // Create a local URL for image preview
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      
      // Transition to the main info view upon successful upload
      setCurrentView('info');
      setMessage('');
      
      // In a real application, you would send 'file' to your Python backend here
      // and then update the 'imageInfo' state with the response data.
      console.log('File selected:', file.name);
      
      // Reset mock data to simulate analysis results (optional)
      setImageInfo(mockImageData); 

    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
      setMessage('Please upload a valid image file.');
      console.error("Please upload a valid image file.");
    }
  };

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

  const InfoPanel = useMemo(() => (
    <div className="w-full bg-white shadow-xl rounded-xl overflow-hidden mt-8 transition-all duration-300">
      <div className="p-4 bg-indigo-500/10 border-b border-indigo-200">
        <h2 className="flex items-center text-lg font-bold text-indigo-800">
          <FileText className="w-5 h-5 mr-2" />
          Analysis Results
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {Object.entries(imageInfo).map(([key, value]) => (
          <InformationRow key={key} label={key} value={value} />
        ))}
      </div>
    </div>
  ), [imageInfo]);


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

        {/* 2. Rows of Information */}
        {imagePreviewUrl && (
          <div className="pb-8">
            {InfoPanel}
          </div>
        )}

      </div>
    </div>
  );
}