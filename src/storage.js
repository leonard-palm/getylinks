const CONTENT_TYPE_CHANNEL  = 'channel';
const CONTENT_TYPE_PLAYLIST = 'playlist';

function initStorage(onCompleteInit){
    
    const initialStorage = { 'ylinks': { 'subscriptions' : [],
                                         'links'         : [],
                                         'copyHistory'   : [] } };
    
    chrome.storage.sync.get('ylinks', function(data){

        if( !data.ylinks ){
            
            chrome.storage.sync.set( { 'ylinks': initialStorage.ylinks }, function(){
                if( !chrome.runtime.lastError ){
                    console.log('Initialized storage finished successfully.');
                    onCompleteInit();
                }else{
                    console.error('Initialization of storage failed.');
                }
            });
        }else{
            
            adjustStorage(data.ylinks, function(){
                console.log('Initialized storage finished successfully.');
                onCompleteInit();
            });
        } 
    });
    
}

function adjustStorage(ylinks, onCompleteAdjust){

    var subs      = ylinks.subscriptions;
    var links     = ylinks.links;
    var cpHistory = ylinks.copyHistory;

    $.each(subs, function(i, subEntry){
        
        //Add missing key-entries to links array
        if( !links.find( l => l.id === subEntry.id) ){
            links.push( { 'id'        : subEntry.id,
                          'videoLinks': [] } );
        }

        //Add missing key-entries to copy-history
        if( !cpHistory.find( cH => cH.id === subEntry.id ) ){
            cpHistory.push( { 'id'        : subEntry.id, 
                              'videoLinks': [] } );
        }
        
    });

    //Remove outworn key-entries from links array
    links = links.filter(function(linkEntry){
        return subsContain(subs, linkEntry.id);
    });
    
    //Remove outworn key-entries from copy-history
    cpHistory = cpHistory.filter(function(cpHistEntry){
        return subsContain(subs, cpHistEntry.id);
    });
    
    //Clear previously selected video links from links array
    $.each(links, function(i, linkEntry){
        linkEntry.videoLinks = [];
    });
    
    ylinks.subscriptions = subs;
    ylinks.links         = links;
    ylinks.copyHistory   = cpHistory;
    
    updateYLinks(ylinks, function(){
        console.log('Adjusted storage successfully.');
        onCompleteAdjust();
    });
}

function getYLinks(onRead){
    chrome.storage.sync.get('ylinks', function(data){
        if(data.ylinks) onRead(data.ylinks);
        else            console.error('Reading storage failed.');
    });
};

function updateYLinks(ylinks, onUpdate){
    chrome.storage.sync.set({"ylinks": ylinks}, function(){
        if(!chrome.runtime.lastError) onUpdate();
        else                          console.error("Updating storage failed.");
    });
}

console.out = function(data){
    console.log(JSON.parse(JSON.stringify(data)));
}