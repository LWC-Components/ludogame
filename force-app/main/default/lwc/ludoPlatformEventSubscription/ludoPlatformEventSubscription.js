import { LightningElement, api } from 'lwc';
import { fireComponentEvent, PLATFORMEVENTTYPESMAP, PLATFORMEVENTSUBSCRIPTIONURL} from 'c/utils';

import getSessionId from '@salesforce/apex/LudoUtility.getSessionId';
import { loadScript } from 'lightning/platformResourceLoader';
import StreamingAPI from '@salesforce/resourceUrl/StreamingAPI';


export default class LudoPlatformEventSubscription extends LightningElement {
       //Channle Name
    @api channel;

    //Override the version of api to use cometd. By default it will use 45.
    @api apiVersion = '40.0';

    //If true then user can see console logs with data.
    @api debug = false;

    @api playerType;

    @api playerBoardId;
    
    cometd;
    subscription;

    connectedCallback() {
        console.log(' ludo platform event connect callback '+this.playerType);
        this.loadCometdScript();
    }

   
    loadCometdScript(){
        let mainThis = this;
        if( !this.subscription ){
            this.subscription = true;
            Promise.all([
                loadScript(mainThis, StreamingAPI + '/StreamingAPI/Cometd.js'),
                loadScript(mainThis, StreamingAPI + '/StreamingAPI/jquery_1.5.2.min.js'),
                loadScript(mainThis, StreamingAPI + '/StreamingAPI/json2.js')


            ])
            .then(() => {
                console.log('event connected1 ');

                Promise.all([loadScript(mainThis, StreamingAPI + '/StreamingAPI/jquery.cometd.js')])
                    .then(() => {
                        console.log('event connected2 ');
                        this.loadSessionId();
                }).catch(error => {
                    console.log('errror at last script '+ error);
                });

                
                
            })
            .catch(error => {
                console.log('error '+ JSON.stringify(error));
            });
        }
        else{
            this.consoleLog('(LWC Streaming API) Error: Subscription already exists.');
        }
    }

    firePlatformComponentEvent(data, eventType) {
        console.log('in fireRandomNumberEvent');
        let inputData = {data: data, isPlatformEvent: true, eventType: eventType};
        fireComponentEvent(JSON.stringify(inputData), this)
    }
    loadSessionId() {
        let mainThis = this;
       console.log(' in loadSessionId method ');
       getSessionId().then(sessionId => {
           console.log('(LWC Streaming API) Session ID: '+sessionId);
           let authstring = "OAuth " + sessionId;

           //authenticate to the Streaming API
           $.cometd.init({
               url: window.location.protocol + '//' + window.location.hostname + '/cometd/'+this.apiVersion +'/',
               requestHeaders: { Authorization: authstring },
               appendMessageTypeToURL : false
           });
          
           console.log('after init');
           $.cometd.subscribe(PLATFORMEVENTSUBSCRIPTIONURL, function (message){
                console.log(JSON.stringify(message));
                if(!message || !message.payload || !message.payload.shivalwc__eventType__c || 
                    !message.payload.shivalwc__playerType__c || message.payload.shivalwc__playerType__c === mainThis.playerType) {
                    console.log('either boardid or playerType is not right ');
                    return;
                }

               // mainThis.firePlatformComponentEvent(JSON.stringify(message));
           });
       });
    }
}

/*
sample event 


{ "data": {"schema":"evXyheBJg2LpRlq33WW5FQ",
"payload": {"shivalwc__playerType__c" : "Player1",
        "CreatedById":"0052v00000YGFrOAAX",
        "shivalwc__eventData__c": "{positionFrom: 1, positionTo:5,isHome:false}",
        "CreatedDate":"2020-05-29T16:02:37Z",
        "shivalwc__eventType__c":"POSITIONCHANGEEVENT"},
        "event":{"replayId":2241548}},
        "channel":"/event/shivalwc__LudoEvent__e"}

*/