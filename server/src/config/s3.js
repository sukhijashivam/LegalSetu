// server/src/config/s3.js
const { S3Client } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Test S3 connection
const testS3Connection = async () => {
  try {
    const { HeadBucketCommand } = require('@aws-sdk/client-s3');
    await s3Client.send(new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME }));
    console.log('✅ S3 bucket connection successful');
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
    
    // Create bucket if it doesn't exist
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        const { CreateBucketCommand } = require('@aws-sdk/client-s3');
        const createBucketParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
        };
        
        // Add LocationConstraint only if not us-east-1
        if (process.env.AWS_REGION !== 'us-east-1') {
          createBucketParams.CreateBucketConfiguration = {
            LocationConstraint: process.env.AWS_REGION
          };
        }
        
        await s3Client.send(new CreateBucketCommand(createBucketParams));
        console.log('✅ S3 bucket created successfully');
      } catch (createError) {
        console.error('❌ Failed to create S3 bucket:', createError.message);
      }
    }
  }
};

module.exports = { s3: s3Client, testS3Connection };