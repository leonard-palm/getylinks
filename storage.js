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
                    //adjustStorage(initialStorage, function(retcode){
                      //  onCompleteInit(retcode);
                    //});
                    onCompleteInit(0);
                }
            });
        }else{
            adjustStorage(data, function(retcode){
                onCompleteInit(retcode);
            });
        } 
    });
    
}

function adjustStorage(data, onCompleteAdjust){
       
    if(!data || !data.ylinks){
        onCompleteAdjust(1);
        return;
    }

    var subscriptions = data.ylinks.subscriptions;
    var links = data.ylinks.links;
    var copyHistory = data.ylinks.copyHistory;

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
    
    data.ylinks.subscriptions = subscriptions;
    data.ylinks.links = links;
    data.ylinks.copyHistory = copyHistory;
    
    chrome.storage.sync.set({"ylinks": data.ylinks}, function(){
        
        console.out("Adjusted storage.");
        console.out(data.ylinks);
        
        onCompleteAdjust( (chrome.runtime.lastError) ? 1 : 0 );
    });
}

chrome.storage.getYLinks = function(onRead){
    chrome.storage.sync.get("ylinks", function(data){
        onRead( (data.ylinks) ? data.ylinks : undefined );
    });
}

chrome.storage.updateYLinks = function(data, onUpdate){
    chrome.storage.sync.set({"ylinks": data}, function(){
        onUpdate( (chrome.runtime.lastError) ? 0 : 1 );
    });
}

console.out = function(data){
    console.info(JSON.parse(JSON.stringify(data)));
}