// This script will help identify which models need to be fixed
// Run: node fix-all-models.js

const fs = require('fs');
const path = require('path');

const modelsDir = './src/models';
const files = fs.readdirSync(modelsDir);

const modelFiles = files.filter(file => file.endsWith('.model.ts'));

console.log('🔍 Found model files that need fixing:');

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('connection.enterprise')) {
    console.log(`❌ ${file} - needs fixing`);
  } else {
    console.log(`✅ ${file} - already fixed`);
  }
});

console.log('\n📝 To fix each model, replace:');
console.log('connection.enterprise.model<ModelType>');
console.log('\nWith:');
console.log(`
// Create model with fallback to default mongoose connection
let ModelName: mongoose.Model<IModelType>;

try {
  const mainConnection = connection.main;
  if (mainConnection) {
    ModelName = mainConnection.model<IModelType>("ModelName", ModelSchema);
  } else {
    console.warn('⚠️ Main connection not available, using default mongoose connection for ModelName');
    ModelName = mongoose.model<IModelType>("ModelName", ModelSchema);
  }
} catch (error) {
  console.error('❌ Error creating ModelName model:', error);
  ModelName = mongoose.model<IModelType>("ModelName", ModelSchema);
}
`);
