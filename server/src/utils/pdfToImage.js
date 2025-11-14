// server/src/utils/pdfToImage.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const sharp = require('sharp'); // Add this dependency

const execPromise = util.promisify(exec);

async function convertPdfToImage(pdfPath) {
  try {
    const outputDir = path.join('uploads', 'images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputBaseName = path.basename(pdfPath, '.pdf');
    const outputPath = path.join(outputDir, `${outputBaseName}.png`);
    
    await execPromise(`pdftoppm -png -singlefile -r 150 "${pdfPath}" "${path.join(outputDir, outputBaseName)}"`);
    
    // Get image dimensions
    const metadata = await sharp(outputPath).metadata();
    return { 
      outputPath, 
      height: metadata.height, 
      width: metadata.width 
    };
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw error;
  }
}

module.exports = { convertPdfToImage };


  // For Windows: use poppler-utils
    // For Mac: brew install poppler
    // For Ubuntu: apt-get install poppler-utils