// projectDAO.js

const ObjectId = require('mongodb').ObjectId;
const mongo = require('../database/mongo');

module.exports = {
    addArchivedProject: async (project) => {
        return await mongo.ArchivedProjects.insertOne(project);
    },
    getAllArchivedeProjects: async () => {
        return await mongo.ArchivedProjects .find({}).sort({"_id": -1}).toArray();
    },
    getArchivedProjectById: async (id) => {
        return await mongo.ArchivedProjects.findOne({ _id: new ObjectId(id) }, {files: 0});
    },
    
    
    
};
