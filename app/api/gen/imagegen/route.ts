import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell";
    
    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_NIM_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    const payload = {
      "prompt": prompt,
      "width": 1024,
      "height": 1024,
      "seed": 0,
      "steps": 4
    };

    const response = await fetch(invokeUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: headers
    });

    if (response.status !== 200) {
      const errBody = await response.text();
      console.error(`NVIDIA API error: ${response.status} ${errBody}`);
      return NextResponse.json({ 
        success: false, 
        error: `Image generation failed: ${response.status}` 
      }, { status: 500 });
    }

    const responseBody = await response.json();
    
    // The NVIDIA API returns artifacts with base64 image data
    // Check if the response contains the artifacts
    if (responseBody && responseBody.artifacts && responseBody.artifacts.length > 0) {
      // Extract the base64 image from the first artifact
      const imageData = responseBody.artifacts[0].base64;
      
      return NextResponse.json({
        success: true,
        image: imageData
      });
    } else {
      console.error('Unexpected response format:', responseBody);
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from image generation service'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in image generation:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during image generation'
    }, { status: 500 });
  }
} 