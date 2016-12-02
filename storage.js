function initStorage(callback){
    
    //check if "subscriptions" exists
    chrome.storage.sync.get("subscriptions", function(data){
        if(!data.subscriptions){
            chrome.storage.sync.set({"subscriptions":[]}, function(){
               if(!chrome.runtime.lastError){
                   console.info("Initialized 'subscriptions'");
               }else{
                   console.info("Failed to initialize 'subscriptions'");
               } 
            });
        }else{
            console.info("subscriptions:");
            console.info(data.subscriptions);
        }
        
        //check if "links" exists
        chrome.storage.sync.get("links", function(data){
            if(!data.links){
               chrome.storage.sync.set({"links": [] }, function(){
                   if(!chrome.runtime.lastError){
                       console.info("Initialized 'links'");
                   }else{
                       console.info("Failed to initialize 'links'");
                   }
               });
            } else{
               console.info("links:");
               console.info(data.links);
            }
            
            //check if "copy_history" exists
            chrome.storage.sync.get("copyHistory", function(data){
               if(!data.copyHistory){
                   chrome.storage.sync.set({"copyHistory": [{}]}, function(){
                      if(!chrome.runtime.lastError){
                          console.info("Initialized 'copyHistory'");
                      }else{
                          console.info("Failed to initialize 'copyHistory'");
                      }
                   });
               }else{
                   console.info("copyHistory:");
                   console.info(data.copyHistory);
               } 
            });

            callback();
            
        });
        
    });
    
}

function adjustStorage(){
    
    chrome.storage.sync.get("subscriptions", function(data){
        
        if(!data.subscriptions || data.subscriptions.length < 1) return; 
        
        var subs = data.subscriptions;
        
        chrome.storage.sync.get("links", function(data){
            
            if(!data.links || data.links.length < 1) return;
            
            //Add missing array key-sets of new subscriptions to "links"
            $.each(subs, function(i, sub){
               if( !data.links.find(link => link.channelID == sub) ){
                   data.links.push({"channelID": sub,
                                    "videoLinks": []});
               } 
            });
            
            //Remove outworn key-sets of subscriptions in "links"
            $.each(data.links, function(i, link){
               if(subs.indexOf(links.channelID) == -1){
                   data.links.splice(i, 1);
               } 
            });
            
            chrome.storage.sync.set({"links":data.links}, function(){
                printStorageObject("subscriptions");
                printStorageObject("links");
            });
            
        });
        
    });
    
    
    
    //Remove old subscription keys-sets in "links" 
    
    
    
}

function printStorageObject(name){
    chrome.storage.sync.get(name, function(data){
       console.info(data); 
    });
}