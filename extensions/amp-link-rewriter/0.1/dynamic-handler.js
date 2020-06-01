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
  if (trackingEnabled === false) {
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


/**
 * @param {!./tracking.Tracking} tracking
 * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampDoc
 * @param {!oneTagOptsDef} configOpts
 * @param {!./link-rewriter.LinkRewriter}
 */
export function dynamicLinkHandler(tracking,ampDoc,configOpts,rewriter)
{
  const tracking_ = tracking;
  const ampDoc_ = ampDoc;
  const configOpts_ = configOpts;
  const rewriter_ = rewriter;
  const target = ampDoc_.getRootNode().body;
  let currentTime = Date.now();
  let lastRunTime = Date.now();
  let updateBetweenTimeStep = false;
  const timeStep = 30000;
  const config = {
    childList: true,
    subTree: true,
    characterData: true,
  };
  const observer = new MutationObserver(mutationCallBack);
  observer.observe(target, config);
  /**
  * @param {*} mutationList
  */
  function mutationCallBack(mutationList)
  {
    currentTime = Date.now();
    if (currentTime - lastRunTime > timeStep) {
      lastRunTime = currentTime;
      linkHandler(mutationList);
    } else if (!updateBetweenTimeStep) {
      updateBetweenTimeStep = true;
      setTimeout(handleDynamicContent(mutationList), timeStep);
    }
  }
  /**
   * @param mutationList
   * @return
   */
  function handleDynamicContent(mutationList)
  {
    currentTime = Date.now();
    lastRunTime = currentTime;
    linkHandler(mutationList);
    updateBetweenTimeStep = false;
  }

  /**
  *
  * @param {*} mutationList
  */
  function linkHandler(mutationList) {
    for (const mutation of mutationList) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.tagName === 'A') {
          {
            if(hasOwn(configOpts_["reportlinks"],"url") && isAmznlink(node))
            {
              tracking_.fireCalls(node);
            }
            rewriter_.updateList_(node);
          }
        }
      }
    }
  }
}
 