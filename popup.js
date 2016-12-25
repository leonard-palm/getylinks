$(document).ready(function(){
    
    if(navigator.onLine){
    
        // Set Listener's
        $('li#toggleAdd').click(function(){
            toggleadd(function(){});
        });

        $('li#buttonAddContainer').click(function(){
            addContent($('input#linkInput').val());
        });

        $('li.action#rescan').click(function(){
            scan(function(links){         
                adjustClipboardButtons(links);
            });     
        });
    }
    
});

function displaySubscriptions(onFinish){
    
    var channelElements = $();
    var channelElement;
    var toggleDuration = 500;
    
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
                                            <div class='subActionContainer'> \
                                                <div class='subAction' id='removeSub'> \
                                                    <i class='material-icons md-18'>delete_forever</i> \
                                                    <a style='margin-left: 3px'>Remove</a> \
                                                </div> \
                                                <div class='subAction' id='resetHistorySub'> \
                                                    <i class='material-icons md-18'>history</i> \
                                                    <a style='margin-left: 3px'>Reset Copy History</a> \
                                                </div> \
                                            </div> \
                                        </li> \
                                        <li class='itemsub buttonClipboard'> \
                                            <i class='material-icons md-36 red'>filter_none</i> \
                                        </li> \
                                    </ul> \
                                </li>");

            channelElements = channelElements.add(channelElement);
        });
        
        $.each(channelElements, function(i, channelElement){
            assignListenersToChannelElement(channelElement); 
        });
        
        channelElements.insertAfter($("li#enterLink"));
        
        channelElements.slideToggle(toggleDuration, function(){
            console.log('Displayed sub [ID:'+$(this).attr("subID")+'] successfully.');
        }); 
        
        channelElements.promise().done(function(){
            onFinish();
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
                                    <div class='subActionContainer'> \
                                        <div class='subAction' id='removeSub'> \
                                            <i class='material-icons md-18'>delete_forever</i> \
                                            <a style='margin-left: 3px'>Remove</a> \
                                        </div> \
                                        <div class='subAction' id='resetHistorySub'> \
                                            <i class='material-icons md-18'>history</i> \
                                            <a style='margin-left: 3px'>Reset Copy History</a> \
                                        </div> \
                                    </div> \
                                </li> \
                                <li class='itemsub buttonClipboard'> \
                                    <i class='material-icons md-36 red'>filter_none</i> \
                                </li> \
                            </ul> \
                        </li>");
    
    console.log(channelElement);
    
    
    assignListenersToChannelElement(channelElement);
    
    channelElement.insertAfter($("li#enterLink"));
    
    channelElement.slideToggle(500, function(){
        console.log('Inserted new sub [ID:'+sub.id+'] successfully.');
        animatePulse('green', $(this));
        onInserted();
    });
}

function assignListenersToChannelElement(element){
        
    $(element).find('div.subAction#removeSub').click(removeSub);
    $(element).find('li.buttonClipboard').click(copyToClipboard);
    $(element).hover(itemHoverIn, itemHoverOut);
    $(element).find('div.subAction#removeSub').hover(removeHoverIn, removeHoverOut);
    
    $(element).find('div.subAction#resetHistorySub').click(function(){
        resetHistorySub($(this).parents('li.item').attr('subID'));  
    });
    
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
        $buttonadd.find('a').text('Add Channel / Playlist');
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
    var linkIndex;
    var copyHistoryIndex;
    
    chrome.storage.getYLinks(function(ylinks){
       
        if(!ylinks || !ylinks.links) return;
        
        linkIndex = ylinks.links.findIndex(l => l.channelID == subID);
        
        if(linkIndex < 0) return;
        
        copyHistoryIndex = ylinks.copyHistory.findIndex(c => c.channelID == subID);
        
        $.each(ylinks.links[linkIndex].videoLinks, function(i, link){
            
            linkContainer.val(linkContainer.val() + 'www.youtube.com/watch?v=' + link + ' ');
            ylinks.copyHistory[copyHistoryIndex].videoLinks.push(link);
        });
        
        
        ylinks.links[linkIndex].videoLinks = [];
        
        linkContainer.select();
        document.execCommand("copy");
        
        chrome.storage.updateYLinks(ylinks, function(retcode){
        
            if(retcode != 0) return;
            
            adjustClipboardButtons(ylinks.links);
        });
    
    });
}

function adjustClipboardButtons(links){
    
    var clipboardButton;
    var clipboardIcon;
    var linkAmount;
    var animationDuration = 1000;
    
    $.each(links, function(i, linkEntry){
        
        linkAmount = linkEntry.videoLinks.length;
        clipboardButton = $("li[subID = '"+linkEntry.channelID+"']").find('li.buttonClipboard');
        clipboardIcon = clipboardButton.find('i.material-icons');
        
        if(clipboardIcon || clipboardIcon.length == 1){
        
            if(linkAmount <= 0){
                
                clipboardIcon.text('filter_none');
                clipboardButton.css('cursor', 'default');
                
                clipboardButton.animate({ backgroundColor: "#a3a3a3" }, animationDuration );
                clipboardIcon.animate({ color: '#e62117' }, animationDuration);
                
            }else if(linkAmount > 9){
                
                clipboardIcon.text('filter_9_plus');
                clipboardButton.css('cursor', 'pointer');
                
                clipboardButton.animate({ backgroundColor: "#e62117" }, animationDuration );
                clipboardIcon.animate({ color: '#fff' }, animationDuration);
                
            }else{
                clipboardIcon.text('filter_'+linkAmount);
                clipboardButton.css('cursor', 'pointer');
                
                clipboardButton.animate({ backgroundColor: "#e62117" }, animationDuration );
                clipboardIcon.animate({ color: '#fff' }, animationDuration);
            }
        }
    });
}

var itemHoverIn = function(){
    
    $(this).css('background-color', '#f2f2f2');
    $(this).find('li.channelDescription').css('background-color', '#f2f2f2');
    $(this).find('div.subAction').css('background-color', '#f2f2f2');
    $(this).find('div.subActionContainer').css('display', 'flex');
}

var itemHoverOut = function(){
    
    $(this).css('background-color', '#fff');
    $(this).find('li.channelDescription').css('background-color', '#fff');
    $(this).find('div.subAction').css('background-color', '#fff');
    $(this).find('div.subActionContainer').css('display', 'none');
}

var removeHoverIn = function(){
    
    $(this).find('i.material-icons').addClass('red');
}

var removeHoverOut = function(){
    
    $(this).find('i.material-icons').removeClass('red');
}

function setPopupOffline(){
    
    $('li.action#toggleAdd').hide();
    $('li.action#rescan').hide();
    $('li.action#resetCopyHistory').hide();
    $('div#offline').css('display', 'flex');
    $('ul.container#actionContainer').css('flex-flow', 'column');
    $('li.action#closePopup').css('align-self', 'flex-end');
}


