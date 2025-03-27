// Utility script to compress movie data

// Import the necessary libraries
const fs = require('fs');
const path = require('path');
const pako = require('pako');

// Path to the full data file
const sourcePath = path.resolve(__dirname, '../data/movies_metadata_full.json');
const outputPath = path.resolve(__dirname, '../data/movies_metadata_compressed.json');

// Function to compress the data
async function compressData() {
  try {
    console.log('Reading full data file...');
    const rawData = fs.readFileSync(sourcePath, 'utf8');
    const movieData = JSON.parse(rawData);
    
    console.log(`Original data loaded: ${rawData.length} bytes`);
    
    // Optional: You can process the data here to remove unnecessary fields
    // For example, remove fields that aren't used in the application
    
    // Compress the data using pako
    const compressed = pako.deflate(JSON.stringify(movieData));
    console.log(`Compressed data size: ${compressed.length} bytes`);
    
    // Convert to base64 for storage
    const base64Compressed = Buffer.from(compressed).toString('base64');
    console.log(`Base64 compressed data size: ${base64Compressed.length} bytes`);
    
    // Save the compressed data
    fs.writeFileSync(outputPath, JSON.stringify({ compressed: base64Compressed }));
    console.log(`Compressed data saved to ${outputPath}`);
    
    return {
      originalSize: rawData.length,
      compressedSize: compressed.length,
      base64Size: base64Compressed.length
    };
  } catch (error) {
    console.error('Error compressing data:', error);
    throw error;
  }
}

// Run the compression
compressData()
  .then(result => {
    console.log('Compression completed successfully!');
    console.log(`Compression ratio: ${(result.originalSize / result.base64Size).toFixed(2)}x`);
  })
  .catch(error => {
    console.error('Compression failed:', error);
  });