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

                if(chrome.runtime.lastError){
                    onCompleteInit(1);
                }else{
                    //adjustStorage(initialStorage.ylinks, function(retcode){
                      //  onCompleteInit(retcode);
                    //});
                    onCompleteInit(0);
                }
            });
        }else{
            adjustStorage(data.ylinks, function(retcode){
                onCompleteInit(retcode);
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

    $.each(subscriptions, function(i, sub){

        //Add missing key-entries to "ylinks.links"
        if( !links.find(link => link.channelID == sub) ){
            links.push({"channelID": sub,
                        "videoLinks": []});
        }

        //Add missing key-entries to "ylinks.copyHistory"
        if( !copyHistory.find( cpHist => cpHist.channelID == sub) ){
            copyHistory.push({"channelID": sub, 
                              "videoLinks": []});
        }
    });

    //Remove outworn key-entries from "ylinks.links"
    links = links.filter(function(linksEntry){
        return subscriptions.indexOf(linksEntry.channelID) >= 0;
    });
    
    //Remove outworn key-entries from "ylinks.copyHistory"
    copyHistory = copyHistory.filter(function(cpHistEntry){
       return subscriptions.indexOf(cpHistEntry.channelID) >= 0; 
    });
    
    //Clear previously selected video links from "ylinks.links"
    $.each(links, function(i, linksEntry){
       linksEntry.videoLinks = []; 
    });
    
    ylinks.subscriptions = subscriptions;
    ylinks.links = links;
    ylinks.copyHistory = copyHistory;
    
    chrome.storage.sync.set({"ylinks": ylinks}, function(){
        
        console.out("Adjusted storage.");
        console.out(ylinks);
        
        onCompleteAdjust( (chrome.runtime.lastError) ? 1 : 0 );
    });
}

chrome.storage.getYLinks = function(onRead){
    chrome.storage.sync.get("ylinks", function(data){
        onRead( (data.ylinks) ? data.ylinks : undefined );
    });
}

chrome.storage.updateYLinks = function(ylinks, onUpdate){
    chrome.storage.sync.set({"ylinks": ylinks}, function(){
        if(chrome.runtime.lastError){
            console.error("Failed to update Storage.")
            onUpdate(1);
        }else{
            onUpdate(0);
        }
    });
}

console.out = function(data){
    console.info(JSON.parse(JSON.stringify(data)));
}