# PortraitMix - AI-Powered Image Collage Editor

An advanced image editor that allows users to create collages with AI-powered harmonization and animation capabilities.

## Features

🎨 **Image Editing**
- Background image selection with dialog options
- Layer import and management
- Drag, scale, and rotate layers with Konva.js
- Real-time visual editing

🤖 **AI-Powered Enhancement**
- **Image Generation**: Create images from text using NVIDIA Flux.1-dev
- **Image Harmonization**: Harmonize compositions using OpenAI
- **Animation**: Generate videos from static images using Replicate
- **Smart Dialog**: Choose between uploading or generating images

📱 **User Experience**
- Modern, responsive UI with dark theme
- Download functionality for images and videos
- Real-time status updates with loading indicators
- Smart form validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```env
# NVIDIA API Key for image generation (Flux.1-dev)
NVIDIA_NIM_KEY=your_nvidia_nim_key_here

# Replicate API Token for image harmonization and animation
REPLICATE_API_TOKEN=your_replicate_api_token_here

# OpenAI API Key for harmonization (alternative/fallback)
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### `/api/gen/imagegen` (POST)
Generates images from text prompts using NVIDIA's Flux.1-dev model.

**Parameters:**
```json
{
  "prompt": "a simple coffee shop interior"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image generated successfully with NVIDIA Flux.1-dev",
  "image": "base64_encoded_image_data",
  "prompt": "a simple coffee shop interior"
}
```

### `/api/gen/harmonize` (POST)
Harmonizes image compositions using AI to ensure consistent lighting, colors, and style.

**Parameters:**
- `image` (File): The image file to harmonize
- `instructions` (string): Optional styling instructions

**Response:**
```json
{
  "success": true,
  "image": "base64_encoded_harmonized_image"
}
```

### `/api/gen/animate` (POST & GET)
**POST**: Starts animation generation from a static image.
**GET**: Checks animation status.

**POST Parameters:**
- `image` (File): The image file to animate
- `text` (string): Animation description/instructions

**Response:**
```json
{
  "success": true,
  "predictionId": "prediction_id_string",
  "status": "processing"
}
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Image Editing**: Konva.js, react-konva
- **AI Services**: 
  - NVIDIA NIM (Flux.1-dev) for image generation
  - Replicate API for animation
  - OpenAI for harmonization
- **Styling**: Tailwind CSS

## Environment Variables

- `NVIDIA_NIM_KEY`: **Required** for AI image generation
- `REPLICATE_API_TOKEN`: **Required** for AI image processing and animation
- `OPENAI_API_KEY`: Optional, for alternative harmonization services

### Getting API Keys

- **NVIDIA NIM**: Get your key from [NVIDIA AI Foundation Models](https://build.nvidia.com/)
- **Replicate**: Get your token from [replicate.com](https://replicate.com)
- **OpenAI**: Get your key from [platform.openai.com](https://platform.openai.com)

## Usage

1. **Create Background**: Click "Select Background Image" → Choose "Generate image" or "Load from computer"
2. **Add Layers**: Click "Import an Image" → Add multiple elements to your composition
3. **Edit**: Drag, rotate, and scale elements on the canvas
4. **Generate**: Click "Generate" to create the final composition
5. **Harmonize**: Add styling instructions and harmonize the image
6. **Animate**: Create video animations from your static compositions

## Next.js Info

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
