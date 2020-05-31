import {CustomEventReporterBuilder} from '../../../src/extension-analytics.js';
import {dict} from '../../../src/utils/object';
import {isAmznlink} from './scope';

/** 
*@typedef {{output: string, attribute: Object, vars: Object, reportLinks: Object, linkers: Object }}
*/
let oneTagOptsDef;


export class Tracking{
    /**
   * @param {string} referrer
   * @param {!oneTagOptsDef} configOpts
   * @param {!AmpElement} ampElement
   * @param {!Array<!Element>} listElements
   * @param {!../../../src/service/ampdoc-impl.AmpDoc} ampDoc
   */
    constructor(referrer,configOpts,ampElement,listElements,ampDoc,transitId)
    {
        /** @private {string} */
        this.referrer_ = referrer;

        /**@private {Object} */
        this.configOpts_ = configOpts;

        /** @private {Array<!Element>} */
        this.listElements_ = listElements;

        this.ampElement_ = ampElement;

        /** @private {!Object} */
        this.analytics_ = null;
        
        /** @private {?../../../src/service/ampdoc-impl.AmpDoc} */
        this.ampDoc_ = ampDoc;

        /**@private {string} */
        this.transitId_ = transitId; 

        /** @private {number} */
        this.slotNum = -1;
    }

    /**
     * 
     * @param {!AmpElement} element
     * @return {Promise}
     * @private 
     */
    setUpAnalytics()
    {
      const analyticsBuilder = new CustomEventReporterBuilder(this.ampElement_);
      analyticsBuilder.track('page-tracker', this.configOpts_['reportlinks']['url']);
      analyticsBuilder.track('link-tracker', this.configOpts_['reportlinks']['url']);
      analyticsBuilder.setTransportConfig(
        dict({
          'beacon': false,
          'image': {"suppressWarnings": true},
          'xhrpost': false,
        })
      );
      let _this = this;
      return new Promise(function(resolve)
      { 
        _this.analytics_ = analyticsBuilder.build();
        resolve();
        return;
      });
    }

    // pixel call for page
    /**
     * @private
     */
    sendPageImpression()
    {
      let pageImpression = dict(this.configOpts_['reportlinks']['pageload']);
      if(this.configOpts_['reportlinks']['referrer'] === true)
      pageImpression['refUrl'] = this.referrer_;
      if(this.configOpts_['linkers']['enabled'] === true)
      pageImpression['assocPayloadId'] = this.transitId_;
      else
      pageImpression['assocPayloadId'] = this.configOpts_['vars']['impressionToken']+ '-' + this.configOpts_['vars']['impressionId'];
      if(this.configOpts_['reportlinks']['pageTitle'] === true)
      pageImpression['pageTitle'] = this.ampDoc_.getRootNode().title; 
      let pageConfig = dict({
        'impressionId': this.configOpts_['vars']['impressionId'],
        'assoc_payload': JSON.stringify(pageImpression),
      });
      this.analytics_.trigger('page-tracker',pageConfig);
    }

    // pixel call for each link matching the regex
    /**
     * @private
     */
    sendLinkImpression()
    {
      for(let i = 0 ; i < this.listElements_.length ; i++)
        {
          let linkImpression = dict(this.configOpts_['reportlinks']['linkload']);
          if(this.configOpts_['reportlinks']['referrer'] === true)
          linkImpression['refUrl'] = this.referrer_;
          if(this.configOpts_['linkers']['enabled'] === true)
          linkImpression['assocPayloadId'] = this.transitId_;
          else
          linkImpression['assocPayloadId'] = this.configOpts_['vars']['impressionToken']+ '-' + this.configOpts_['vars']['impressionId'];
          if(this.configOpts_['reportlinks']['pageTitle'] === true)
          linkImpression['pageTitle'] = this.ampDoc_.getRootNode().title; 
          linkImpression['destinationUrl'] = this.listElements_[i].href;
          if(this.configOpts_['reportlinks']['slotNum'] === true)
          {
            linkImpression['slotNum'] = this.listElements_[i].getAttribute('data-slot-num');
          } 
          this.analytics_.trigger('link-tracker',dict({
            'impressionId': this.configOpts_['vars']['impressionId'],
            'assoc_payload': JSON.stringify(linkImpression),
          }));
        }
        this.slotNum = this.listElements_.length;
    }

    // pixel call for matching every link
    // added dynamically
    /**
     * @private
     * @param {}
     */
    fireCalls(element)
    {
      if(isAmznlink(element))
      {
        let linkImpression = dict(this.configOpts_['reportlinks']['linkload']);
        if(this.configOpts_['reportlinks']['referrer'] === true)
        linkImpression['refUrl'] = this.referrer_;
        if(this.configOpts_['linkers']['enabled'] === true)
        linkImpression['assocPayloadId'] = this.transitId_;
        else
        linkImpression['assocPayloadId'] = this.configOpts_['vars']['impressionToken']+ '-' + this.configOpts_['vars']['impressionId'];
        if(this.configOpts_['reportlinks']['pageTitle'] === true)
        linkImpression['pageTitle'] = this.ampDoc_.getRootNode().title; 
        linkImpression['destinationUrl'] = element.href;
        if(this.configOpts_['reportlinks']['slotNum'] === true)
        {
          element.setAttribute('data-slot-num',this.slotNum);
          linkImpression['slotNum'] = this.slotNum;
          this.slotNum = this.slotNum + 1;
        } 
        this.analytics_.trigger('link-tracker',dict({
          'impressionId': this.configOpts_['vars']['impressionId'],
          'assoc_payload': JSON.stringify(linkImpression),
        }));
      }
    }

}


