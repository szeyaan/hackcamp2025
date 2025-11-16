import React, { useState, useRef, useEffect } from 'react';
import './App.css';

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
  
  // Refs to connect the logic to the DOM elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- CAMERA CONTROL FUNCTIONS ---

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setMessage('Camera stopped.');
    }
  };

  const startCamera = async () => {
    // 1. Stop any existing stream before starting a new one
    stopCamera(); 
    setMessage('Requesting camera access...');
    setPhoto(null); // Clear previous photo

    try {
      // Request access to the user's video device
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 320, 
          height: 240,
          facingMode: "environment" // Prefer back camera for "scanning"
        },
      });

      // Assign the stream to the video element and start playing
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setMessage('Camera active. Ready to scan.');
        setStream(mediaStream);
        setCurrentView('camera'); // Switch to camera view on success
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setMessage(`ERROR: Could not access camera. Please check permissions. (${err.name}). Returning to splash.`);
      setCurrentView('splash'); // Return to splash on failure
    }
  };

  // Cleanup: Stop camera when the component is unmounted or view changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  // Capture the current frame from the video feed
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      setMessage("Camera not running or elements not ready.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match the video frame size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    
    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data URL (Base64) from the canvas
    const image = canvas.toDataURL('image/png');
    setPhoto(image);
    setMessage('Photo captured successfully! Ready for scanning logic.');
    
    // Optional: Stop the camera after taking the photo
    stopCamera(); 
  };

const UploadAndDisplayImage = () => {
  // Define a state variable to store the selected image
  const [selectedImage, setSelectedImage] = useState(null);

  // Return the JSX for rendering
  return (
    <div>
      {/* Header */}
      <h1>Upload and Display Image</h1>
      <h3>using React Hooks</h3>

      {/* Conditionally render the selected image if it exists */}
      {selectedImage && (
        <div>
          {/* Display the selected image */}
          <img
            alt="not found"
            width={"250px"}
            src={URL.createObjectURL(selectedImage)}
          />
          <br /> <br />
          {/* Button to remove the selected image */}
          <button onClick={() => setSelectedImage(null)}>Remove</button>
        </div>
      )}

      <br />

      {/* Input element to select an image file */}
      <input
        type="file"
        name="myImage"
        // Event handler to capture file selection and update the state
        onChange={(event) => {
          console.log(event.target.files[0]); // Log the selected file
          setSelectedImage(event.target.files[0]); // Update the state with the selected file
        }}
      />
    </div>
  );
};

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }
    
    stopCamera(); 
    setPhoto(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result); 
      setMessage(`Image uploaded: ${file.name}. Data is ready for scanning.`);
      setCurrentView('camera'); 
    };
    reader.onerror = () => {
      setMessage('Error reading file.');
    };
    reader.readAsDataURL(file); 
  };

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
            onClick={startCamera} 
            className='splashButton'
          >
            Take Photo
          </button>
        <div className='splashButton'>
          <input type="file" accept="image/*" />
        </div>
        </div>
        <p className='message'>{message}</p>
      </div>
    );
  }

  // RENDER CAMERA VIEW
  return (
    <div className='mobileContainer'>
        <div className='cameraView'>
            {/* Camera Video Stream Preview */}
            <div className='videoWrapper'>
                <video ref={videoRef} className='video' autoPlay playsInline muted />
                {/* Back Button positioned over the video/capture area */}
                <button onClick={() => {stopCamera(); setCurrentView('splash');}} className='backButton'>
                    ← Back
                </button>
                {/* The canvas is hidden but used to process the image data */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Status Message */}
            <p className='message'>{message}</p>

            {/* Control Buttons */}
            <div className='buttonGroup'>
                <button onClick={takePhoto} disabled={!stream} className='button'>
                    Take Photo
                </button>
                {/* This button is disabled until you have a photo to process */}
                <button disabled={!photo} className='button'>
                    Scan & Analyze
                </button>
            </div>
            
            {/* Captured Photo Display */}
            {photo && (
                <div className='photoOutput'>
                    <h2 style={{ color: '#333', fontSize: '1.2em', marginBottom: '10px' }}>Last Captured Image:</h2>
                    <img src={photo} alt="Captured" className='photo' />
                </div>
            )}
        </div>
    </div>
  );
}