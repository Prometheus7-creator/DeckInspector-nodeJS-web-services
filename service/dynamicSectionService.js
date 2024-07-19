"use strict";
const LocationDAO = require("../model/locationDAO.js");
const SectionDAO = require("../model/dynamicSectionDAO.js");
const InvasiveSectionService = require("./invasiveSectionService.js");
const ConclusiveSectionService = require("./conclusiveSectionService.js");
const InvasiveUtil = require("./invasiveUtil.js");
const ProjectDAO = require("../model/projectDAO.js");
const updateParentHelper = require("./updateParentHelper.js");
const RatingMapping  = require("../model/ratingMapping.js");
var ObjectId = require('mongodb').ObjectId;


const addSection = async (section) => {
  try {
    section.questions.forEach(question => question._id = new ObjectId(question._id))
    const result = await SectionDAO.addSection(section);
    if (result.insertedId) {
      await updateParentHelper.addDynamicSectionMetadataInParent(result.insertedId, section);

      //if section is invasive ,it will mark entire parent hierarchy as invasive
      await InvasiveUtil.markDynamicSectionInvasive(result.insertedId);
      return {
        success: true,
        id: result.insertedId,
      };
    }
    return {
      code: 500,
      success: false,
      reason: "Insertion failed",
    };
  } catch (error) {
    return handleError(error);
  }
};

var getSectionById = async function (sectionId) {
  try {
    const result = await SectionDAO.getSectionById(sectionId);
    if (result) {
      transformDynamicSectionData(result);
      return {
        success: true,
        section: result,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Section found with the given ID",
    };
  } catch (error) {
    return handleError(error);
  }
};

var deleteSectionPermanently = async function (sectionId) {
  try {
    //Delete Invasive Sections
    const invasiveSectionResult =
      await InvasiveSectionService.getInvasiveSectionByParentId(sectionId);
    if (invasiveSectionResult.sections) {
      for (let invasiveSection of invasiveSectionResult.sections) {
        await InvasiveSectionService.deleteInvasiveSectionPermanently(
          invasiveSection._id
        );
      }
    }

    //Delete Conclusive Sections
    const conclusiveSectionResult =
      await ConclusiveSectionService.deleteConclusiveSectionPermanently(
        sectionId
      );
    if (conclusiveSectionResult.sections) {
      for (let conclusiveSection of conclusiveSectionResult.sections) {
        await ConclusiveSectionService.deleteConclusiveSectionPermanently(
          conclusiveSection._id
        );
      }
    }

    const section = await SectionDAO.getSectionById(sectionId);
    const result = await SectionDAO.deleteSection(sectionId);


    //Mark parent as non-invasive if its all child are non invasive

    if(section.parenttype == "project")
    {
      await InvasiveUtil.markDynamicProjectNonInvasive(section.parentid);
    }
    else{
      await InvasiveUtil.markDynamicLocationNonInvasive(section.parentid);
    }
    //Update Parent for the section
    await updateParentHelper.removeDynamicSectionMetadataFromParent(sectionId, section);

  

    if (result.deletedCount === 1) {
      return {
        success: true,
        id: sectionId,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Section found with the given ID",
    };
  } catch (error) {
    return handleError(error);
  }
};

var getSectionsByParentId = async function (parentId) {
  try {
    const result = await SectionDAO.getSectionByParentId(parentId);
    if (result) {
      for (let section of result) {
        transformDynamicSectionData(section);
      }
      return {
        success: true,
        sections: result,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Location found with the given parent ID",
    };
  } catch (error) {
    return handleError(error);
  }
};

const editSetion = async (sectionId, section) => {
  try {
    section.questions.forEach(question => question._id = new ObjectId(question._id))
    const result = await SectionDAO.editSection(sectionId, section);
    if (result.modifiedCount === 1) {
      const sectionFromDB = await SectionDAO.getSectionById(sectionId);

      await updateParentHelper.addUpdateDynamicSectionMetadataInParent(
        sectionId,
        sectionFromDB
      );
      //if section is invasive ,it will mark entire parent hierarchy as invasive
      if (sectionFromDB.furtherinvasivereviewrequired) {
        await InvasiveUtil.markSectionInvasive(sectionId);
      } else {
        if (sectionFromDB.parenttype == "project") {
          await InvasiveUtil.markDynamicProjectNonInvasive(section.parentid);
        }
        else {
          await InvasiveUtil.markDynamicLocationNonInvasive(section.parentid);
        }
      }
      return {
        success: true,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Section found with the given ID",
    };
  } catch (error) {
    return handleError(error);
  }
};

const addImageInSection = async (sectionId, imageUrl) => {
  try {
    const result = await SectionDAO.addImageInSection(sectionId, imageUrl);
    if (result.modifiedCount === 1) {
      return {
        success: true,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Section found with the given ID",
    };
  } catch (error) {
    return handleError(error);
  }
};


const removeImageFromSection = async (sectionId, imageUrl) => {
  try {
    const result = await SectionDAO.removeImageInSection(sectionId, imageUrl);
    if (result.modifiedCount === 1) {
      return {
        success: true,
      };
    }
    return {
      code: 401,
      success: false,
      reason: "No Section found with the given ID",
    };
  } catch (error) {
    return handleError(error);
  }
};

const handleError = (error) => {
  console.error("An error occurred:", error);
  return {
    code: 500,
    success: false,
    reason: `An error occurred: ${error.message}`,
  };
};

var transformDynamicSectionData = function(section) {
  section.furtherinvasivereviewrequired = capitalizeWords(convertBooleanToString((section.furtherinvasivereviewrequired)));
};

var capitalizeWords = function (word) {
  if (word) {
    var finalWord = word[0].toUpperCase() + word.slice(1);
    return finalWord;
  }
  return word;
};

var convertBooleanToString = function (word) {
  if (typeof word !== 'boolean') {
      return; // this will return undefined by default
  }
  return word ? "Yes" : "No";
};


module.exports = {
  addSection,
  getSectionById,
  deleteSectionPermanently,
  getSectionsByParentId,
  editSetion,
  addImageInSection,
  removeImageFromSection
};