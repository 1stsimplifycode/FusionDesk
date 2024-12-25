const mongoose = require('mongoose');

const savedFileSchema = new mongoose.Schema({
    fileName: { type: String, required: true }, // Name of the saved file
    filePath: { type: String, required: true }, // Path or URL to the file
    createdAt: { type: Date, default: Date.now }, // Timestamp for the file
});

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedFiles: {
        documents: [savedFileSchema], // Stack for document files
        whiteboards: [savedFileSchema], // Stack for whiteboard files
        spreadsheets: [savedFileSchema], // Stack for spreadsheet files
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', documentSchema);

