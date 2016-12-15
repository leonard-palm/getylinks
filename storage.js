function initStorage(onCompleteInit){
    
    
    var initialSubscriptions = [];
    var initialLinks = [];
    var initialCopyHistory = [];
    
    var initialStorage = {"ylinks": {"subscriptions" : initialSubscriptions,
                                     "links"         : initialLinks,
                                     "copyHistory"   : initialCopyHistory}};
    
    
    chrome.storage.sync.get("ylinks", function(data){

        if(!data.ylinks){
            chrome.storage.sync.set({"ylinks": initialStorage.ylinks}, function(){

                if(!chrome.runtime.lastError){
                    console.log('Initialization of storage finished successfully.');
                    onCompleteInit();
                }else{
                    console.error('Initialization of storage failed.');
                }
            });
        }else{
            adjustStorage(data.ylinks, function(retcode){
                if(retcode === 0){
                    console.log('Initialization of storage finished successfully.');
                    onCompleteInit();
                }else{
                    console.error('Initialization of storage failed.');
                }
            });
        } 
    });
    
}

function adjustStorage(ylinks, onCompleteAdjust){
       
    if(!ylinks){
        onCompleteAdjust(1);
        return;
    }

    var subscriptions = ylinks.subscriptions;
    var links = ylinks.links;
    var copyHistory = ylinks.copyHistory;

    $.each(subscriptions, function(i, subEntry){

        //Add missing key-entries to "ylinks.links"
        if( !links.find(link => link.channelID == subEntry.id) ){
            links.push({"channelID": subEntry.id,
                        "videoLinks": []});
        }

        //Add missing key-entries to "ylinks.copyHistory"
        if( !copyHistory.find( cpHist => cpHist.channelID == subEntry.id) ){
            copyHistory.push({"channelID": subEntry.id, 
                              "videoLinks": []});
        }
    });

    //Remove outworn key-entries from "ylinks.links"
    links = links.filter(function(linksEntry){
        return subsContain(subscriptions, linksEntry.channelID);
        //return subscriptions.indexOf(linksEntry.channelID) >= 0;
    });
    
    //Remove outworn key-entries from "ylinks.copyHistory"
    copyHistory = copyHistory.filter(function(cpHistEntry){
        return subsContain(subscriptions, cpHistEntry.channelID);
       //return subscriptions.indexOf(cpHistEntry.channelID) >= 0; 
    });
    
    //Clear previously selected video links from "ylinks.links"
    $.each(links, function(i, linksEntry){
       linksEntry.videoLinks = []; 
    });
    
    ylinks.subscriptions = subscriptions;
    ylinks.links = links;
    ylinks.copyHistory = copyHistory;
    
    chrome.storage.updateYLinks(ylinks, function(retcode){
        if(retcode === 0){
            console.log('Adjusted storage successfully.');
        }else{
            console.error('Adjusting storage failed.')
        }
        onCompleteAdjust(retcode);
    });
}

chrome.storage.getYLinks = function(onRead){
    chrome.storage.sync.get("ylinks", function(data){
        if(data.ylinks){
            onRead(data.ylinks);
        }else{
            console.error('Reading storage failed.');
            onRead(undefined);
        }
        
    });
}

chrome.storage.updateYLinks = function(ylinks, onUpdate){
    chrome.storage.sync.set({"ylinks": ylinks}, function(){
        if(chrome.runtime.lastError){
            console.error("Updating storage failed.");
            onUpdate(1);
        }else{
            onUpdate(0);
        }
    });
}

console.out = function(data){
    console.log(JSON.parse(JSON.stringify(data)));
}