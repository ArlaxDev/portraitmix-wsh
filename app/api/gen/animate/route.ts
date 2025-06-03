import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Add to your .env.local file
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const text = formData.get('text') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Animation text is required' },
        { status: 400 }
      );
    }

    // Log received data
    console.log('Received animation text:', text);
    console.log('Received image:', image.name, image.type, image.size);

    try {
      // Convert image to base64
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${image.type};base64,${base64Image}`;
      
      // The dataUrl is already in the correct format for Replicate
      console.log('Starting Replicate prediction...');
      
      // Start the prediction with Replicate
      const prediction = await replicate.predictions.create({
        // Using minimax/video-01 model
        version: "minimax/video-01",
        input: {
          prompt: text,
          first_frame_image: dataUrl,
        },
      });
      
      console.log('Prediction started with ID:', prediction.id);
      
      // Return immediately with the prediction ID to avoid timeout
      return NextResponse.json({
        success: true,
        message: 'Animation generation started',
        predictionId: prediction.id,
        status: 'processing'
      });
      
    } catch (apiError) {
      console.error('Replicate API error:', apiError);
      return NextResponse.json(
        { error: 'Animation processing failed', details: (apiError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing animation request:', error);
    return NextResponse.json(
      { error: 'Failed to process animation request' },
      { status: 500 }
    );
  }
}

// Create a separate endpoint to check the status of a prediction
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get('id');
  
  if (!predictionId) {
    return NextResponse.json(
      { error: 'Prediction ID is required' },
      { status: 400 }
    );
  }
  
  try {
    console.log('Checking prediction status for ID:', predictionId);
    
    // Get the prediction status
    const prediction = await replicate.predictions.get(predictionId);
    
    if (prediction.status === "succeeded") {
      // Return the output URL when completed
      return NextResponse.json({
        success: true,
        status: 'completed',
        // The output from minimax/video-01 is a URL to the video
        videoUrl: prediction.output,
        predictionId: predictionId
      });
    } else if (prediction.status === "failed") {
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: prediction.error || 'Unknown error',
        predictionId: predictionId
      }, { status: 500 });
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        status: prediction.status,
        predictionId: predictionId
      });
    }
  } catch (error) {
    console.error('Error checking prediction status:', error);
    return NextResponse.json(
      { error: 'Failed to check prediction status' },
      { status: 500 }
    );
  }
} 