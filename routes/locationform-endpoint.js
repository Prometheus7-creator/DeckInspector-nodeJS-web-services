"use strict";
var express = require('express');
var router = express.Router();
const ErrorResponse = require('../model/error');
var ObjectId = require('mongodb').ObjectId;
const newErrorResponse = require('../model/newError');
const LocationFormService = require('../service/locationFormService');
const Tenants = require("../service/tenantService");

require("dotenv").config();

router.route('/add')
.post(async function (req,res){
try{
var errResponse;
// Get user input
var { name, companyIdentifier,questions} = req.body;


// Validate user input
if (!(name&&companyIdentifier)) {
  errResponse = new ErrorResponse(400,"Name,companyIdentifier is required","");
  res.status(400).json(errResponse);
  return;
}

// Check if the count is exceeding the limit
const tenant = await Tenants.getTenantByCompanyIdentifier(
    companyIdentifier
    );
if (!tenant.success) {
    errResponse = new ErrorResponse(402, "Invalid tenant identifier.", ex);
    res.status(402).json(errResponse);
    return;
}
if (!(tenant.allowedCustomFormCount-tenant.customFormCount>0)) {
    errResponse = new ErrorResponse(402, "Custom Form limit reached, please contact administrator.", ex);
    res.status(402).json(errResponse);
  return;
}  
try{
  var newLocationForm = {
      "name":name,
      "companyIdentifier":companyIdentifier,    
      "questions":questions
  }
}catch(ex){
  console.log(ex);
  errResponse = new ErrorResponse(500, "Internal server error", ex);
  res.status(500).json(errResponse);
  return;
} 

var result = await LocationFormService.addLocationForm(newLocationForm);    
if (result.reason) {
  return res.status(result.code).json(result);
}
if (result) {
  //console.debug(result);
  Tenants.addCustomFormCount(tenant._id);
  return res.status(201).json(result);
}
}
catch (exception) {
errResponse = new newErrorResponse(500, false, exception);
return res.status(500).json(errResponse);
}
});


router.route('/:id')
.get(async function(req,res){
  try{
    var errResponse;
    const locationFormId = req.params.id;
    var result = await LocationFormService.getLocationFormById( locationFormId);
    if (result.reason) {
      return res.status(result.code).json(result);
    }
    if (result) {
      //console.debug(result);
      return res.status(201).json(result);
    }
  }
  catch (exception) {
    errResponse = new newErrorResponse(500, false, exception);
    return res.status(500).json(errResponse);
  }
})

router.route('/:id')
.put(async function(req,res){
  try{
    var errResponse;
    const newData = req.body;
    const locationFormId = req.params.id;
    
    var result = await LocationFormService.editLocationForm(locationFormId,newData);
    if (result.reason) {
      return res.status(result.code).json(result);
    }
    if (result) {
      //console.debug(result);
      return res.status(201).json(result);
    }
  }
  catch (exception) {
    errResponse = new newErrorResponse(500, false, exception);
    return res.status(500).json(errResponse);
  }
})
.delete(async function(req,res){
  try{
    var errResponse;
    const locationFormId = req.params.id;
    var result = await LocationFormService.deleteLocationFormPermanently(locationFormId);
    if (result.reason) {
      return res.status(result.code).json(result);
    }
    if (result) {
      //console.debug(result);
      return res.status(201).json(result);
    }
  }
  catch (exception) {
    errResponse = new newErrorResponse(500, false, exception);
    return res.status(500).json(errResponse);
  }
})

router.route('/getalllocationforms')
.post(async function(req,res){
  try{
    var errResponse;   
    const companyIdentifier = req.body.companyIdentifier;
    var result = await LocationFormService.getAllLocationForms( companyIdentifier);
    if (result.reason) {
      return res.status(result.code).json(result);
    }
    if (result) {
      //console.debug(result);
      return res.status(201).json(result);
    }
  }
  catch (exception) {
    errResponse = new newErrorResponse(500, false, exception);
    return res.status(500).json(errResponse);
  }
})

router.route('/:id/addquestions')
.post(async function(req,res){
try{
  var errResponse;
  var questions = req.body.questions;
  var result = await LocationFormService.addQuestionsInLoctionForm(req.params.id,questions);
  if (result.reason) {
    return res.status(result.code).json(result);    
  }
  if (result) {
    //console.debug(result);
    return res.status(201).json(result);
  }
}
catch (exception) {
  errResponse = new newErrorResponse(500, false, exception);
  return res.status(500).json(errResponse);
}
})
router.route('/:id/questions/:questionId')
.delete( async (req, res) => {
    try {
      const result = await LocationFormService.removeQuestionFromLoctionForm(req.params.id,req.params.questionId);
      if (result.reason) {
        return res.status(404).json({ message: 'Location form not found' });
      }
      if (result) {
        //console.debug(result);
        return res.status(201).json(result);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  router.route('/:id/questions/:questionId')
  .post( async (req, res) => {
      try {
        const result = await LocationFormService.addUpdateQuestionInLocationForm(req.params.id,req.params.questionId,
            {"_id":ObjectId(req.params.questionId),...req.body});
        if (result.reason) {
          return res.status(404).json(result);
        }
        if (result) {
          //console.debug(result);
          return res.status(201).json(result);
        }
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    });

module.exports = router ;