
try {
    const { InsForge } = require('insforge');
    console.log('InsForge package is available:', !!InsForge);
} catch (error) {
    console.error('Error importing insforge:', error.message);
}
