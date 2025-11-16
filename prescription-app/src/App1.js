import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Main Camera Capture Component
export default function App() {
  // State to control the view: 'splash' or 'camera' or 'result'
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
  // Ref for the file input to trigger it programmatically
  const fileInputRef = useRef(null);

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

    // Added safety check for navigator.mediaDevices (browser API)
    if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
        setMessage("ERROR: Camera access not supported by this browser.");
        setCurrentView('splash');
        return;
    }

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

  /**
   * Handles file upload from the file picker input.
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }
    
    // Stop camera if it was running before processing file
    stopCamera(); 
    setPhoto(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result); 
      setMessage(`Image uploaded: ${file.name}. Data is ready for scanning.`);
      setCurrentView('camera'); // Show photo in the camera view layout
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
          {/* NOTE: You need to make sure 'pill-25.png' exists in your /public folder */}
          <img className="logo" src="./pill-25.png" alt="Pill Logo" />
          <h1 className='splashH1'>MediScan</h1>
          <h2 className='splashH2'>Scan. Review. Schedule.</h2>
          <button 
            onClick={startCamera} 
            className='splashButton'
          >
            Take Photo
          </button>
        <div className='splashButton'>
            <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileUpload} // Correctly linked the handler
                style={{display: 'none'}} // Hide the actual input
            />
            <button 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className='button secondary'
            >
                Upload from Gallery
            </button>
        </div>
        </div>
        <p className='message'>{message}</p>
      </div>
    );
  }

  // RENDER CAMERA/PHOTO VIEW
  return (
    <div className='mobileContainer'>
        <div className='cameraView'>
            {/* Video Stream Preview or Photo Display */}
            <div className='videoWrapper'>
                {/* Video is only rendered if stream is active, otherwise the canvas/photo takes over */}
                <video 
                    ref={videoRef} 
                    className='video' 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ display: stream ? 'block' : 'none' }} 
                />
                
                {/* The canvas is hidden but used to process the image data */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Captured Photo Display */}
                {photo && (
                    <img src={photo} alt="Captured" className='photo' />
                )}

                {/* Back Button positioned over the video/capture area */}
                <button onClick={() => {stopCamera(); setCurrentView('splash'); setPhoto(null);}} className='backButton'>
                    ← Back
                </button>
            </div>

            {/* Status Message */}
            <p className='message'>{message}</p>

            {/* Control Buttons */}
            <div className='buttonGroup'>
                {stream && (
                    <button onClick={takePhoto} className='button primary'>
                        Take Photo
                    </button>
                )}
                
                {photo && (
                    <button onClick={() => setMessage('Scanning logic would execute now...')} className='button secondary'>
                        Scan & Analyze
                    </button>
                )}
                {!stream && !photo && (
                    <p className='message'>Ready to use camera or upload.</p>
                )}
            </div>
            
        </div>
    </div>
  );
}