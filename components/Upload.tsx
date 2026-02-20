import { CheckCircle, CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useState, useRef } from 'react'
import { useOutletContext } from 'react-router';
import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS
} from '../lib/constants';

interface UploadProps {
    onComplete?: (base64: string) => void;
}

const Upload: React.FC<UploadProps> = ({ onComplete }) => {
    const [file , setFile]=useState<File | null>(null);
    const [isDragging,setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { isSignedIn}=useOutletContext<AuthContext>();

    const processFile = (selectedFile: File, onComplete: (base64: string) => void) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            const base64 = reader.result as string;
            
            // Start progress simulation
            intervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        // Clear interval when complete
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        
                        // Call onComplete after delay
                        setTimeout(() => {
                            onComplete(base64);
                        }, REDIRECT_DELAY_MS);
                        
                        return 100;
                    }
                    
                    return prev + PROGRESS_STEP;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        
        reader.readAsDataURL(selectedFile);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile || !isSignedIn) return;
        
        setFile(selectedFile);
        setProgress(0);
        
        processFile(selectedFile, (base64) => {
            console.log('Upload complete:', base64.substring(0, 50) + '...');
            onComplete?.(base64);
        });
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(false);
        
        const droppedFile = event.dataTransfer.files[0];
        if (!droppedFile) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(droppedFile.type)) return;
        
        setFile(droppedFile);
        setProgress(0);
        
        processFile(droppedFile, (base64) => {
            console.log('Upload complete:', base64.substring(0, 50) + '...');
            onComplete?.(base64);
        });
    };
  return (
    <div className='upload'>
      {!file ?(
        <div 
            className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                className='drop-input' 
                accept='.jpg,.jpeg,.png' 
                disabled={!isSignedIn}
                onChange={handleFileChange}
            />

            <div className='drop-content'>
                <div className='drop-icon'>
                    <UploadIcon size={20}/>
                </div>
                <p>{isSignedIn ? ("Click to upload or just drag and drop"):("Sign in or Sign up with Puter to upload")}</p>
                <p className='help'> Maximum file size 50 MB.</p>
            </div>
        </div>
      ):(
        <div className='upload-status'>
            <div className='status-content'>
                <div className='status-icon'>
                    {progress === 100 ? (
                        <CheckCircle2 className='check'/>
                    ):(
                        <ImageIcon className="image"/>
                    )}
                </div>
                <h3>{file.name}</h3>
                <div className='progress'>
                    <div className='bar' style={{width: `${progress}`}}/>

                    <p className='status-text'>
                        {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default Upload
