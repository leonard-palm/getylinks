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
    
    $("li.action#rescan").click(function(){
        scan(function(links){         
            adjustClipboardButtons(links);
        });     
    });
    
    $("li.action#clearCopyHistory").click(function(){
        clearCopyHistory();
    });
    
});

function displaySubscriptions(onAdded){
    
    var channelElements = $();
    var channelElement;
    var toggleDuration = 300;
    
    chrome.storage.getYLinks(function(ylinks){
        
        if(!ylinks || !ylinks.subscriptions || ylinks.subscriptions.length == 0){
            insertDummySub(function(){
                return; 
            });
        }

        $.each(ylinks.subscriptions, function(i, subEntry){
            
            channelElement = $("<li class='item' subID='"+subEntry.id+"'> \
                                    <ul class='containersub'> \
                                        <li class='itemsub channelThumbnail'> \
                                            <img src = '"+subEntry.info.thumbnail+"'> \
                                        </li> \
                                        <li class='itemsub channelDescription'> \
                                            <a class='channelTitle'>"+subEntry.info.title+" <br></a> \
                                            <div class='statistics'> \
                                                <a class='count'>"+subEntry.statistics.subscriberCount+"</a> Subscribers <br> \
                                                <a class='count'>"+subEntry.statistics.videoCount+"</a> Videos <br> \
                                            </div> \
                                            <div class='closeButton'> \
                                                <i class='material-icons md-18'>delete_forever</i> \
                                                <a style='margin-left: 3px'>Remove</a> \
                                            </div> \
                                        </li> \
                                        <li class='itemsub buttonClipboard'> \
                                            <i class='material-icons md-36 white'>filter_none</i> \
                                        </li> \
                                    </ul> \
                                </li>");

            channelElements = channelElements.add(channelElement);
        });
        
        $.each(channelElements, function(i, channelElement){
            assignListenersToChannelElement(channelElement); 
        });
        
        channelElements.insertAfter($("li#enterLink"));

        onAdded();
        
        channelElements.slideToggle(toggleDuration, function(){
            console.log('Displayed sub [ID:'+$(this).attr("subID")+'] successfully.');
        }); 
        
    });

}

function insertNewSub(sub, onInserted){
    
    var channelElement;
    
    if(!sub){
        console.error('Insertion of new sub failed (sub undefined).');
        return;
    }
    
    channelElement = $("<li class='item' subID='"+sub.id+"'> \
                            <ul class='containersub'> \
                                <li class='itemsub channelThumbnail'> \
                                    <img src = '"+sub.info.thumbnail+"'> \
                                </li> \
                                <li class='itemsub channelDescription'> \
                                    <a class='channelTitle'>"+sub.info.title+" <br></a> \
                                    <div class='statistics'> \
                                        <a class='count'>"+sub.statistics.subscriberCount+"</a> Subscribers <br> \
                                        <a class='count'>"+sub.statistics.videoCount+"</a> Videos <br> \
                                    </div> \
                                    <div class='closeButton'> \
                                        <i class='material-icons md-18'>delete_forever</i> \
                                        <a style='margin-left: 3px'>Remove</a> \
                                    </div> \
                                </li> \
                                <li class='itemsub buttonClipboard'> \
                                    <i class='material-icons md-36 white'>filter_none</i> \
                                </li> \
                            </ul> \
                        </li>");
    
    
    assignListenersToChannelElement(channelElement);
    
    channelElement.insertAfter($("li#enterLink"));
    
    onInserted();
    
    channelElement.slideToggle(500, function(){
        console.log('Inserted new sub [ID:'+sub.id+'] successfully.');
        animatePulse('green', $(this));
    });
}

function assignListenersToChannelElement(element){
        
    $(element).find('div.closeButton').click(removeSub);
    $(element).find('li.buttonClipboard').click(copyToClipboard);
    $(element).hover(itemHoverIn, itemHoverOut);
    $(element).find('div.closeButton').hover(removeHoverIn, removeHoverOut);
    
    $(element).find('li.channelThumbnail').click(function(){
        openChannel($(this).parents('li.item').attr('subID'));
    });
    
    $(element).find('a.channelTitle').click(function(){
        openChannel($(this).parents('li.item').attr('subID'));
    });
}

function removeOldSub(channelID, onFinish){
    
    var oldSub = $("li[subID = '"+channelID+"']");
    
    oldSub.slideToggle(300, function(){
        oldSub.remove();
        onFinish();
    });
}

function insertDummySub(onFinish){
    
    $("ul#subscriptionContainer").append( $('<li/>',{
        text    : 'No Subscriptions',
        'class' : 'item',
        'id'    : 'dummySubscription',
        'style' : 'display:none;'
    })); 
    
    $("li#dummySubscription").slideToggle(300, function(){
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
    
    var $buttonadd = $('li#toggleAdd');
    var $enterLink = $('li#enterLink');
    
    if( $enterLink.css('display') == 'none' ){
        $buttonadd.find('a').text('Cancel');
        $buttonadd.find('i.material-icons').text('remove_circle');
    }else{
        $buttonadd.find('a').text('Add Channel');
        $buttonadd.find('i.material-icons').text('subscriptions');
    }
    
    $enterLink.slideToggle(300, function(){
        $('input#linkInput').val('');
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

var itemHoverIn = function(){
    
    $(this).css('background-color', '#f2f2f2');
    $(this).find('li.channelDescription').css('background-color', '#f2f2f2');
    $(this).find('div.closeButton').css('background-color', '#f2f2f2');
    $(this).find('div.closeButton').css('display', 'flex');
}

var itemHoverOut = function(){
    
    $(this).css('background-color', '#fff');
    $(this).find('li.channelDescription').css('background-color', '#fff');
    $(this).find('div.closeButton').css('background-color', '#fff');
    $(this).find('div.closeButton').css('display', 'none');
}

var removeHoverIn = function(){
    
    $(this).find('i.material-icons').addClass('red');
}

var removeHoverOut = function(){
    
    $(this).find('i.material-icons').removeClass('red');
}






