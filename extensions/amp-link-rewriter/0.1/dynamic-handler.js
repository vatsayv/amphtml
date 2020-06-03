import {hasOwn} from '../../../src/utils/object';
import {isAmznlink} from './scope';


/** 
*@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
*/
let oneTagOptsDef;


// returns transitId
/**
 * @param {Object} oneTagOptsDef
 * @return {string}
*/
export function amznTransitRecorder(configOpts)
{
  const configObject = configOpts;
  const that = '';
  const TRANSIT_ID_KEY = 'assocPayloadId';
  const trackingEnabled = configObject['linkers']['enabled'];
  const TRANSIT_ID_VALUE =
    configObject['vars']['impressionToken'] +
    '-' +
    configObject['vars']['impressionId'];
  if (trackingEnabled === false){
    return that;
  }
  if (trackingEnabled === true && !getTransitId()) {
    sessionStorage.setItem(TRANSIT_ID_KEY, TRANSIT_ID_VALUE);
  }
  
  return sessionStorage.getItem(TRANSIT_ID_KEY);
}


//To check if the 'assocPayloadId' is already present
  /**
   *
   * @return {string}
   */
function getTransitId() {
    const TRANSIT_ID_KEY = 'assocPayloadId';
    const existingTransitId = sessionStorage.getItem(TRANSIT_ID_KEY);
    return existingTransitId;
}


//Global
let currentTime = Date.now();
let lastRunTime = Date.now();
let updateBetweenTimeStep = false;
let properties;
let unprocessedList;
/**
 * @param {!./tracking.Tracking} tracking
 * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampDoc
 * @param {!oneTagOptsDef} configOpts
 * @param rewriter
 * @param {!./link-rewriter.LinkRewriter}
 */
export function dynamicLinkHandler(tracking, ampDoc, configOpts, rewriter) {
  properties = {
    tracking_: tracking,
    ampDoc_: ampDoc,
    configOpts_: configOpts,
    rewriter_: rewriter,
    target: ampDoc.getRootNode().body,
    timeStep: 3000,
    config: {
      childList: true,
      subTree: true,
      characterData: true,
    },
  };
  unprocessedList = new Array();
  //alert('It is working');
  if (hasOwn(properties.configOpts_, 'reportlinks')) {
    const observer = new MutationObserver(mutationCallBack);
    observer.observe(properties.target, properties.config);
  } else {
    const observer = new MutationObserver(updateCallBack);
    observer.observe(properties.target, properties.config);
  }

  //To process the unprocessed links
  setInterval(periodicCheck, 2000);
}

/**
 * @param {*} mutationList
 */
function periodicCheck() {
  const sampleTime = Date.now();
  if (unprocessedList.length > 0 && sampleTime - lastRunTime >= 3000) {
    for (const mutation of unprocessedList) {
      linkHandler(mutation);
    }
    unprocessedList.length = 0;
    lastRunTime = sampleTime;
  }
}

/**
 * @param {*} mutationList
 */
function mutationCallBack(mutationList) {
  currentTime = Date.now();
  //alert('It is called');
  if (currentTime - lastRunTime > properties.timeStep) {
    lastRunTime = currentTime;
    linkHandler(mutationList, properties);
  } else if (!updateBetweenTimeStep) {
    updateBetweenTimeStep = true;
    setTimeout(handleDynamicContent, properties.timeStep, mutationList);
  } else {
    //pushing in unprocessed list of type mutation
    unprocessedList.push(mutationList);
  }
}

/**
 * @param {*} mutationList
 */
function updateCallBack(mutationList) {
  for (const mutation of mutationList) {
    // eslint-disable-next-line local/no-for-of-statement
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1 && node.tagName === 'A') {
        properties.rewriter_.updateList_(node);
      }
    }
  }
}

/**
 * @param mutationList
 */
function handleDynamicContent(mutationList) {
  currentTime = Date.now();
  lastRunTime = currentTime;
  linkHandler(mutationList);
  updateBetweenTimeStep = false;
}

/**
 * @param mutationList
 */
function linkHandler(mutationList) {
  for (const mutation of mutationList) {
    // eslint-disable-next-line local/no-for-of-statement
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1 && node.tagName === 'A') {
        if (hasOwn(properties.configOpts_, 'reportlinks')) {
          properties.tracking_.fireCalls(node);
        }
        properties.rewriter_.updateList_(node);
      }
    }
  }
}