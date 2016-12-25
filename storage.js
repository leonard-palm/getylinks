const CONTENT_TYPE_CHANNEL  = 'channel';
const CONTENT_TYPE_PLAYLIST = 'playlist';

function initStorage(onCompleteInit){
    
    
    const initialSubscriptions = [];
    const initialLinks         = { channels : [],
                                   playlists: [] };
    const initialCopyHistory   = { channels : [],
                                   playlists: [] };
    
    const initialStorage = { 'ylinks': { 'subscriptions' : initialSubscriptions,
                                         'links'         : initialLinks,
                                         'copyHistory'   : initialCopyHistory } };
    
    chrome.storage.sync.get('ylinks', function(data){

        if(!data.ylinks){
            
            chrome.storage.sync.set( { 'ylinks': initialStorage.ylinks }, function(){
                if(!chrome.runtime.lastError){
                    console.log('Initialization of storage finished successfully.');
                    onCompleteInit();
                }else{
                    console.error('Initialization of storage failed.');
                }
            });
        }else{
            
            adjustStorage(data.ylinks, function(){
                console.log('Initialization of storage finished successfully.');
                onCompleteInit();
            });
        } 
    });
    
}

function adjustStorage(ylinks, onCompleteAdjust){

    var subs      = ylinks.subscriptions;
    var links     = ylinks.links;
    var cpHistory = ylinks.copyHistory;
    
    var linksField, cpHistField;

    $.each(subs, function(i, subEntry){
        
        if(subEntry.type === CONTENT_TYPE_CHANNEL){
            
            linksField = links.channels;
            cpHistField = cpHistory.channels;
            
        }else if(subEntry.type === CONTENT_TYPE_PLAYLIST){
            
            linksField = links.playlists;
            cpHistField = cpHistory.playlists;
        }
        
        //Add missing key-entries to links array
        if( !linksField.find( l => l.id === subEntry.id) ){
            linksField.push( { 'id'        : subEntry.id,
                               'videoLinks': [] } );
        }

        //Add missing key-entries to copy-history
        if( !cpHistField.find( cH => cH.id === subEntry.id ) ){
            cpHistField.push( { 'id'        : subEntry.id, 
                                'videoLinks': [] } );
        }
        
    });

    //Remove outworn key-entries from links array
    links.channels = links.channels.filter(function(linkEntry){
        return subsContain(subs, linkEntry.id);
    });
    
    links.playlists = links.playlists.filter(function(linkEntry){
        return subsContain(subs, linkEntry.id); 
    });
    
    //Remove outworn key-entries from copy-history
    cpHistory.channels = cpHistory.channels.filter(function(cpHistEntry){
        return subsContain(subs, cpHistEntry.id);
    });
    
    cpHistory.playlists = cpHistory.playlists.filter(function(cpHistEntry){
        return subsContain(subs, cpHistEntry.id);
    });
    
    //Clear previously selected video links from links array
    $.each(links, function(key, linkField){
       $.each(linkField, function(i, linkEntry){
           linkEntry.videoLinks = [];
       }) 
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