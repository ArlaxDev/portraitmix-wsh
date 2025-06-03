import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Buffer } from 'buffer';



const harmonizationInstructions = `Task:
The provided image contains multiple elements combined from various sources, each with potentially different lighting, color temperature, perspective, scale, shadows, or artistic styles. Your task is to harmonize and seamlessly blend these elements into a single, coherent image.

Instructions:

Consistency:
Ensure all elements appear as if they were naturally photographed or created together at the same moment, in the same environment, sharing unified lighting, shadows, reflections, color temperature, saturation, contrast, perspective, and spatial coherence.

Accuracy and Similarity:
Closely match the structure, layout, positioning, and proportions from the provided input image. Your harmonized output should appear as a perfected, coherent version of the original layout.

Naturalness:
Adjust elements minimally yet effectively to ensure the final composition looks natural, believable, and visually consistent. Pay particular attention to shadows, highlights, reflections, edges, and transitions between elements, correcting inconsistencies without compromising the original content. Do not let any object look like a 2D cut-out.

Identity:
Make sure to preserve the identity of people, objects, etc. This means that in the output image, faces of people should be completely recognizable without alteration of their distinctive features or expressions, and objects should maintain their original details, proportions, textures, and recognizable characteristics. While they will be blended and harmonized into a single coherent image with correct lighting, shadows, color temperature, perspective, reflections, etc., they should retain their inherent visual identity and original attributes, because the primary goal is visual coherence and realism without compromising recognizability.

Goal:
Deliver a high-quality, harmonized image that convincingly appears as a single coherent composition, while maintaining fidelity to the original image content and arrangement. The goal is for the output image to look as an image that was photographed / created at once, naturally.`;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Add to your .env.local file
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const instructions = formData.get('instructions') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Log received data
    console.log('Received instructions:', instructions);
    console.log('Received image:', image.name, image.type, image.size);

    // Convert file to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create final prompt with instructions
    let finalPrompt = harmonizationInstructions;
    
    if (typeof instructions === 'string' && instructions.trim().length > 0) {
      finalPrompt += `\n\n When generating the image make sure you do the following: ${instructions} \n Make sure all objects have proper shadows and depth`;
    } else {
      finalPrompt += `\n\n When generating the image make sure you use the following style: Make sure all objects have proper shadows and depth`;
    }

    try {
      // Call OpenAI API
      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: await toOpenAIFile(buffer, image.type),
        prompt: finalPrompt,
        quality: "medium",
      });

      if (!response || !response.data || !response.data[0]?.b64_json) {
        throw new Error("OpenAI response failed");
      }

      // Return the base64 image data in the response
      return NextResponse.json({
        success: true,
        message: 'Image harmonized successfully',
        image: response.data[0].b64_json,
        instructions: instructions || 'No instructions provided'
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: 'OpenAI processing failed', details: (openaiError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

// Helper function to convert Buffer to OpenAI compatible file
async function toOpenAIFile(buffer: Buffer, mimeType: string) {
  // OpenAI needs a File object, but in Node.js we don't have the browser's File
  // So we'll create a Blob with our data and use that directly
  try {
    // The OpenAI SDK has a utility to convert this to the right format
    return new File([buffer], 'image.png', { type: mimeType });
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
} 