$(document).ready(function(){
    
    if(navigator.onLine){
    
        // Set Listener's
        $('li#toggleAdd').click(function(){
            toggleAddContainer(function(){});
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
    
    $('li.action#closePopup').click(function(){
        
        var subElements = $('li.item').filter(function(){
           return $(this).attr('id') != 'enterLink'; 
        });
        
        subElements.slideToggle(500, function(){
            console.log('Displayed sub [ID:' + $(this).attr("id") + '] successfully.');
        }); 
        
        subElements.promise().done(function(){ window.close() });
    });
    
});

function displaySubscriptions(onFinish){
    
    var subElements = $();
    const TOGGLE_DURATION = 500;
    
    getYLinks(function(ylinks){
        
        if(ylinks.subscriptions.length === 0){
            toggleDummySub(function(){
                return; 
            });
        }
        
        var subChannelGET = $.get('../html/subChannel.html');
        var subPlaylistGET = $.get('../html/subPlaylist.html');
        
        $.when(subChannelGET, subPlaylistGET).done(function(subChannelHTML, subPlaylistHTML){
            
            $.each(ylinks.subscriptions, function(i, subEntry){
                
                //Parse HTML-String into JQuery-Object
                channelElement = $(subChannelHTML[0]);
                playlistElement = $(subPlaylistHTML[0]);
               
                if( subEntry.type === CONTENT_TYPE_CHANNEL && subChannelHTML[1] === 'success' ){
                    
                    //Add custom variables (title, thumbnail, etc.)
                    channelElement = personalizeChannelElement(channelElement, subEntry);

                    assignListenersToSubElement(channelElement); 
                    
                    subElements = subElements.add(channelElement);
                    
                }else if( subEntry.type === CONTENT_TYPE_PLAYLIST && subPlaylistHTML[1] === 'success' ){
                    
                    //Add custom variables (title, thumbnail, etc.)
                    playlistElement = personalizePlaylistElement(playlistElement, subEntry);
                    
                    assignListenersToSubElement(playlistElement); 
                    
                    subElements = subElements.add(playlistElement);
                }
                
            });
            
            subElements.insertAfter( $("li#enterLink") );

            subElements.slideToggle(TOGGLE_DURATION, function(){
                console.log('Displayed sub (ID:' + $(this).attr("id") + ') successfully.');
            }); 

            subElements.promise().done(function(){ 
                onFinish();
            });
            
        }).fail(function(response){
            
            console.error(response);
            onFinish();
        });
        
    });

}


function insertChannel(newChannel, onInserted){
    
    const TOGGLE_DURATION = 500;
    var channelElement;
    
    //GET HTML content for one subscription item
    $.get('../html/subChannel.html', function(subChannelHTML){

        //Parse HTML-String into JQuery-Object
        channelElement = $(subChannelHTML);

        //Add custom variables (title, thumbnail, etc.)
        channelElement = personalizeChannelElement(channelElement, newChannel);

        assignListenersToSubElement(channelElement); 

        channelElement.insertAfter( $("li#enterLink") );

        channelElement.slideToggle(TOGGLE_DURATION, function(){
            
            console.log('Inserted channel (ID:' + $(this).attr("id") + ') successfully.');
            animatePulse('green', $(this));
            onInserted();
        }); 
    });
    
}

function insertPlaylist(newPlaylist, onInserted){
    
    const TOGGLE_DURATION = 500;
    var playlistElement;
    
    //GET HTML content for one subscription item
    $.get('../html/subPlaylist.html', function(subPlaylistHTML){

        //Parse HTML-String into JQuery-Object
        playlistElement = $(subPlaylistHTML);

        //Add custom variables (title, thumbnail, etc.)
        playlistElement = personalizePlaylistElement(playlistElement, newPlaylist);
        
        assignListenersToSubElement(playlistElement); 

        playlistElement.insertAfter( $("li#enterLink") );

        playlistElement.slideToggle(TOGGLE_DURATION, function(){
            
            console.log('Inserted playlist (ID:' + $(this).attr("id") + ') successfully.');
            animatePulse('green', $(this));
            onInserted();
        }); 
    });
}

function personalizeChannelElement(channelElement, channel){
    
    channelElement.attr('id', channel.id);
    channelElement.attr('type', channel.type);
    channelElement.find('img').attr('src', channel.info.thumbnail);
    channelElement.find('a.subTitle').text(channel.info.title);
    channelElement.find('a.count:first').text(channel.statistics.subscriberCount);
    channelElement.find('a.count:last').text(channel.statistics.videoCount);
    
    return channelElement;
}

function personalizePlaylistElement(playlistElement, playlist){
    
    playlistElement.attr('id', playlist.id);
    playlistElement.attr('type', playlist.type);
    playlistElement.find('img').attr('src', playlist.info.thumbnail);
    playlistElement.find('a.subTitle').text(playlist.info.title);
    playlistElement.find('a.count:first').text( playlist.info.itemCount );
    playlistElement.find('a.count:last').text( playlist.info.channelTitle );
    
    return playlistElement;
    
}

function assignListenersToSubElement(element){
    
    $(element).hover(itemHoverIn, itemHoverOut);
    $(element).find('div.subAction#removeSub').hover(removeHoverIn, removeHoverOut);
    
    $(element).find('li.buttonClipboard').click(function(){
        
        var item = $(this).parents('li.item');
        copyToClipboard(item.attr('id'), item.attr('type'));
    });
    
    $(element).find('div.subAction#removeSub').click(function(){
        
        var item = $(this).parents('li.item');
        removeSub(item.attr('id'), item.attr('type'), true);
    });
    
    $(element).find('div.subAction#resetHistorySub').click(function(){
        
        var item = $(this).parents('li.item');
        resetHistory(item.attr('id'), item.attr('type'));  
    });
    
    $(element).find('li.channelThumbnail, a.channelTitle, li.playlistThumbnail, a.subTitle').click(function(){
        
        var item = $(this).parents('li.item');
        var id = item.attr('id');
        var type = item.attr('type');
        
        if(type === CONTENT_TYPE_CHANNEL){
            openChannel(id);
        }else if(type === CONTENT_TYPE_PLAYLIST){
            openPlaylist(id);
        }
    });
}

function removeOldSub(sublID){
    
    const ANIMATION_DURATION = 300;
    
    var oldSub = $("li[id = '"+sublID+"']");
    
    oldSub.slideToggle(ANIMATION_DURATION, function(){
        
        oldSub.remove();
        
        if( !$('li.item#enterLink').is(':visible') && $('ul.container#subscriptionContainer').children().length === 1 ){
            toggleDummySub(function(){});
        }
    });
}

function toggleDummySub(onFinish){
    
    const ANIMATION_DURATION = 400;
    
    $("div#dummySubscriptionWrapper").slideToggle(ANIMATION_DURATION, function(){ 
        onFinish(); 
    });
}

function toggleAddContainer(onFinish){
    
    var $buttonadd = $('li#toggleAdd');
    var $enterLink = $('li#enterLink');
    
    if( $('div#dummySubscriptionWrapper').is(':visible') ){
                
        toggleDummySub(function(){
           
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
            
        });
        
    }else{
        
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

function copyToClipboard(subID, type){
    
    var linksIndex, cpHistIndex;
    
    var linkContainer = $('input#linkContainer');
    
    getYLinks(function(ylinks){
        
        linksIndex  = ylinks.links.findIndex( l => l.id === subID );
        cpHistIndex = ylinks.copyHistory.findIndex( cH => cH.id === subID );
        
        //Fill invisible textfiled with link's seperated by space
        $.each(ylinks.links[linksIndex].videoLinks, function(i, link){
            
            linkContainer.val(linkContainer.val() + 'www.youtube.com/watch?v=' + link + ' ');
            ylinks.copyHistory[cpHistIndex].videoLinks.push(link);
        });
        
        ylinks.links[linksIndex].videoLinks = [];
        
        //Copy content from invisible textfield to clipboard
        linkContainer.select();
        document.execCommand('copy');
        
        updateYLinks(ylinks, function(){
            adjustClipboardButtons(ylinks.links);
        });
        
    });
    
}

function adjustClipboardButtons(links){
    
    var clipboardButton, clipboardIcon;
    var linkAmount;
    const ANIMATION_DURATION = 1000;
        
    $.each(links, function(i, linkEntry){

        linkAmount      = linkEntry.videoLinks.length;
        clipboardButton = $("li[id = '"+linkEntry.id+"']").find('li.buttonClipboard');
        clipboardIcon   = clipboardButton.find('i.material-icons');

        if(clipboardIcon || clipboardIcon.length === 1){

            if(linkAmount === 0){

                clipboardIcon.text('filter_none');
                clipboardButton.css('cursor', 'default');
                clipboardButton.animate({ backgroundColor: "#a3a3a3" }, ANIMATION_DURATION );
                clipboardIcon.animate({ color: '#e62117' }, ANIMATION_DURATION);

            }else if(linkAmount > 9){

                clipboardIcon.text('filter_9_plus');
                clipboardButton.css('cursor', 'pointer');
                clipboardButton.animate({ backgroundColor: "#e62117" }, ANIMATION_DURATION );
                clipboardIcon.animate({ color: '#fff' }, ANIMATION_DURATION);

            }else{
                clipboardIcon.text('filter_'+linkAmount);
                clipboardButton.css('cursor', 'pointer');
                clipboardButton.animate({ backgroundColor: "#e62117" }, ANIMATION_DURATION );
                clipboardIcon.animate({ color: '#fff' }, ANIMATION_DURATION);
            }
        }

    });
}

var itemHoverIn = function(){
    
    $(this).css('background-color', '#f2f2f2');
    $(this).find('li.description').css('background-color', '#f2f2f2');
    $(this).find('div.subAction').css('background-color', '#f2f2f2');
    $(this).find('div.subActionContainer').css('display', 'flex');
}

var itemHoverOut = function(){
    
    $(this).css('background-color', '#fff');
    $(this).find('li.description').css('background-color', '#fff');
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


