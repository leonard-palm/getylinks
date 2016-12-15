$(document).ready(function(){
    
    // Set Listener's
    $("li#toggleAdd").click(function(){
        toggleadd(function(){
            console.log("Insert block toggled successfully.")
        });
    });
    
    $("li#buttonAddContainer").click(function(){
        addChannel($("input#linkInput").val());
    });
    
});

function displaySubscriptions(onAdded){
    
    var subElements = $();
    var toggleDuration = 500;
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks || !ylinks.subscriptions || ylinks.subscriptions.length == 0){
            insertDummySub(function(){
                return; 
            });
        }

        $.each(ylinks.subscriptions, function(i, subEntry){
            var element = $("<li class = 'item' subID = '"+subEntry.id+"' style = 'display:none;'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+subEntry.info.thumbnail+"'></li><li class = 'itemsub channelDescription'>"+subEntry.info.title+"<div class='closeButton'><i class='material-icons md-18'>delete_forever</i></div></li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36 white'>filter_none</i></li></ul></li>");

            subElements = subElements.add(element);
        });

        $("ul#subscriptionContainer").prepend(subElements);

        onAdded();

        $("li.item").filter(function(){return $(this).attr("subID") != undefined}).slideToggle(toggleDuration, function(){

            console.log('Displayed sub [ID:'+$(this).attr("subID")+'] successfully.');

            $(this).find('div.closeButton').click(removeSub);
            $(this).find('li.buttonClipboard').click(copyToClipboard);
        });
        
    });

}

function insertNewSub(sub, onInserted){
    
    var domElement;
    
    if(!sub){
        console.error('Insertion of new sub failed (sub undefined).');
        return;
    }
    
    var element = $("<li class = 'item' subID = '"+sub.id+"' style = 'display:none;'><ul class = 'containersub'><li class = 'itemsub channelThumbnail'><img src = '"+sub.info.thumbnail+"'></li><li class = 'itemsub channelDescription'>"+sub.info.title+"<div class='closeButton'><i class='material-icons md-18'>delete_forever</i></div></li><li class = 'itemsub buttonClipboard'><i class='material-icons md-36 white'>filter_none</i></li></ul></li>");
    
    element.insertBefore($("li#enterLink"));
    domElement = $("li[subID = '"+sub.id+"']");
    
    domElement.find('div.closeButton').click(removeSub);
    domElement.find('li.buttonClipboard').click(copyToClipboard);
    
    onInserted();
    
    domElement.slideToggle(500, function(){
        console.log('Inserted new sub [ID:'+sub.id+'] successfully.');
        animatePulse('green', domElement);
    });
}

function removeOldSub(channelID, onFinish){
    
    var oldSub = $("li[subID = '"+channelID+"']");
    
    oldSub.slideToggle(500, function(){
        oldSub.remove();
        onFinish();
    });
}

function insertDummySub(onFinish){
    
    $("ul#subscriptionContainer").prepend( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription',
        'style' : 'display:none;'
    })); 
    
    $("li#dummySubscription").slideToggle(500, function(){
        onFinish();
    });
}

function removeDummySub(){
    
    var dummySub = $('li#dummySubscription');
    
    if(dummySub != undefined){
        dummySub.slideToggle(500, function(){
            dummySub.remove();
        });
    }
}

function toggleadd(onFinish){
    
    var $buttonadd = $("li#toggleAdd");
    var $enterLink = $("li#enterLink");
    
    if( $enterLink.css("display") == "none" ){
        $buttonadd.text("Cancel");  
    }else{
        $buttonadd.text("Add Channel");
    }
    
    $enterLink.slideToggle(500, function(){
        $("input#linkInput").val("");
        onFinish();
    });
}

function animatePulse(color, element){

    var className;
    
    if(!element) return;
    
    if(color == 'red'){
        className = 'animatedPulseRed';
    }else if(color == 'green'){
        className = 'animatedPulseGreen';
    }else{
        return;
    }
    
    element.addClass(className);
    
    setTimeout(function(){
        element.removeClass(className);
    }, 1000);
}


var removeSub = function(){
    
    removeChannel($(this).parents('li.item').attr('subID'));
}

var copyToClipboard = function(){
    
    var subID = $(this).parents('li.item').attr('subID');
    var linkContainer = $('input#linkContainer');
    var linkEntry;
    
    chrome.storage.getYLinks(function(ylinks){
       
        if(!ylinks || !ylinks.links) return;
        
        linkEntry = ylinks.links.find(l => l.channelID == subID);
        
        if(!linkEntry) return;
        
        $.each(linkEntry.videoLinks, function(i, link){
            linkContainer.val(linkContainer.val() + 'www.youtube.com/watch?v=' + link + ' ');
        });
        
        linkContainer.select();
        document.execCommand("copy");
    });
}

function adjustClipboardButtons(links){
    
    $.each(links, function(i, linkEntry){
        
        var amount = linkEntry.videoLinks.length;
        var clipboardIcon = $("li[subID = '"+linkEntry.channelID+"']").find('li.buttonClipboard').find('i.material-icons');
        
        if(clipboardIcon || clipboardIcon.length == 1){
        
            if(amount <= 0){
                clipboardIcon.text('filter_none');
            }else if(amount > 9){
                clipboardIcon.text('filter_9_plus')
            }else{
                clipboardIcon.text('filter_'+amount);
            }
        }
    });
}


