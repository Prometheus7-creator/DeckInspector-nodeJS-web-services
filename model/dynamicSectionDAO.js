const ObjectId = require('mongodb').ObjectId;
const mongo = require('../database/mongo');

module.exports = {
    addSection: async (dynamicSection) => {
        return await mongo.DynamicSections.insertOne(dynamicSection);
    },
    getAllSections: async () => {
        return await mongo.DynamicSections.find({}).limit(50).sort({"_id": -1}).toArray();
    },
    getSectionById: async (id) => {
        return await mongo.DynamicSections.findOne({ _id: new ObjectId(id) });
    },
    editSection: async (id, newData) => {
        return await mongo.DynamicSections.updateOne({ _id: new ObjectId(id) }, { $set: newData },{upsert:false});
    },
    deleteSection: async (id) => {
        return await mongo.DynamicSections.deleteOne({ _id: new ObjectId(id) });
    },
    getSectionByParentId: async (parentId) => {
        return await mongo.DynamicSections.find({ parentid: new ObjectId(parentId) }).toArray();
    },
    addImageInSection : async (sectionId, url) => {
        await mongo.DynamicSections.updateOne({ _id: new ObjectId(sectionId) }, { $push: { images: url } });
    },
    removeImageInSection :  async (sectionId, url) => {
        await mongo.DynamicSections.updateOne({ _id: new ObjectId(sectionId) }, { $pull: { images: url } });
    }
}


