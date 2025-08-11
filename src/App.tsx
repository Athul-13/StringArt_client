import { Check, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import api from "./api/axios";
import StringArtVisualizer from "./StringVisualizer";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [artData, setArtData] = useState<{ nails: Point[]; lines: [number, number][] }>({
    nails: [],
    lines: [],
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader?.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  }
  const onCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: CropArea): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg');
    });
  };

  const sendImageToServer = async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'cropped-image.jpg');

    try {
      const response = await api.post('/transform', formData)
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  const handleCropConfirm = async () => {
    if (selectedImage && croppedAreaPixels) {
      try {
        const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
        const result = await sendImageToServer(croppedImageBlob);

        console.log('Server response:', result);

        setProcessedImage(result.base64Image);
        setArtData(result.stringArt)
        setShowCropModal(false);
        setSelectedImage(null);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  console.log('Art Data nails:', artData.nails);
  console.log('Art Data lines:', artData.lines);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex">
      {/* Left Panel - 1/4 of the screen */}
      <div className="w-1/4 p-6 border-r border-green-400 border-opacity-30">
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-400 glow">
              String Art Generator
            </h1>
            <p className="text-sm text-green-400 opacity-80">
              Transform your images into string art patterns
            </p>
          </div>

          {/* Image Display Area */}
          <div className="space-y-4">
            <div className="aspect-square border border-green-400 border-opacity-50 rounded-lg overflow-hidden bg-black bg-opacity-50 flex items-center justify-center relative group hover:border-opacity-80 transition-all duration-300">
              {processedImage ? (
                <img 
                  src={processedImage} 
                  alt="Cropped" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-2 opacity-60">
                  <Upload className="w-12 h-12 mx-auto text-green-400" />
                  <p className="text-xs">No image selected</p>
                </div>
              )}
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            </div>

            {/* File Select Button */}
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-full bg-transparent border border-green-400 border-opacity-60 text-green-400 py-3 px-4 rounded-lg cursor-pointer hover:bg-green-400 hover:bg-opacity-10 hover:border-opacity-100 hover:text-black transition-all duration-300 text-center font-medium">
                Select Image File
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Panel - 3/4 of the screen (empty) */}
      <div className="flex-1 p-6 bg-black bg-opacity-50">
        < StringArtVisualizer nails={artData.nails} lines={artData.lines} />
      </div>

      {/* Crop Modal */}
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-black border border-green-400 border-opacity-50 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-green-400">Crop Image</h2>
                <button
                  onClick={handleCropCancel}
                  className="text-green-400 hover:text-red-400 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="relative h-96 bg-black rounded-lg overflow-hidden">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: {
                      background: '#000000',
                    },
                  }}
                />
              </div>
              
              <div className="space-y-4">
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCropConfirm}
                    className="flex-1 text-black bg-green-400 bg-opacity-20 border border-green-400 py-3 px-4 rounded-lg
                    hover:bg-black hover:text-green-400 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
                  >
                    <Check className="w-5 h-5" />
                    <span >Confirm Crop</span>
                  </button>
                  <button
                    onClick={handleCropCancel}
                    className="flex-1 bg-transparent border border-green-400 border-opacity-50 text-green-400 py-3 px-4 rounded-lg hover:border-opacity-80 hover:bg-green-400 hover:text-black hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
