// $Id$
Drupal.homebox = {};
Drupal.behaviors.homebox = function(context) {
  $homebox = $('#homebox:not(.homebox-processed)', context).addClass('homebox-processed');
  
  if ($homebox.length > 0) {
    // Find all columns
    $columns = $homebox.find('div.homebox-column');
    
    // Equilize columns height
    $columns = Drupal.homebox.equalizeColumnsHeights($columns);
    
    // Make columns sortable
    $columns.sortable({
      items: '.homebox-portlet.homebox-draggable',
      handle: '.portlet-header',
      connectWith: $columns,
      placeholder: 'homebox-placeholder',
      forcePlaceholderSize: true,
      stop: function() {
        Drupal.homebox.equalizeColumnsHeights($columns);
      }
    });
    
    // Add tools links
    $boxes = $homebox.find('.homebox-portlet');
    $boxes.find('.portlet-config').each(function() {
      if (jQuery.trim($(this).html()) != '') {
        $(this).prev('.portlet-header').prepend('<span class="portlet-icon portlet-settings"></span>').end();
      };
    });
    $boxes.find('.portlet-header').prepend('<span class="portlet-icon portlet-minus"></span>')
        .prepend('<span class="portlet-icon portlet-close"></span>')
        .end();
        
    // Remove close tool for unclosable blocks
    $homebox.find('.homebox-unclosable span.portlet-close').remove();
    
    // Add maximize link to every portlet
    $boxes.find('.portlet-header .portlet-minus').before('<span class="portlet-icon portlet-maximize"></span>');
    
    // Add region to place maximized portlets
    $homebox.find('.homebox-column-wrapper:first').before('<div class=\'homebox-maximized\'></div>');
    
    // Attach click event to maximize icon
    $boxes.find('.portlet-header .portlet-maximize').click(function() {
      $(this).toggleClass("portlet-maximize");
      $(this).toggleClass("portlet-minimize");
      Drupal.homebox.maximizeBox(this);
      Drupal.homebox.equalizeColumnsHeights($columns);
    });  
    
    // Attach click event on minus
    $boxes.find('.portlet-header .portlet-minus').click(function() {
      $(this).toggleClass("portlet-minus");
      $(this).toggleClass("portlet-plus");
      $(this).parents(".homebox-portlet:first").find(".portlet-content").toggle();
      Drupal.homebox.equalizeColumnsHeights($columns);
    });
    
    // Attach click event on minus
    $boxes.find('.portlet-header .portlet-minus').each(function() {
      if (!$(this).parents(".homebox-portlet:first").find(".portlet-content").is(':visible')) {
        $(this).toggleClass("portlet-minus");
        $(this).toggleClass("portlet-plus");
        Drupal.homebox.equalizeColumnsHeights($columns);
      };
    });
    
    // Attach double click event on portlet header
    $boxes.find('.portlet-header').dblclick(function() {
      if ($(this).parents(".homebox-portlet:first").find(".portlet-content").is(':visible')) {
        $(this).find('.portlet-minus').toggleClass("portlet-plus");  
        $(this).find('.portlet-minus').toggleClass("portlet-minus");
      }
      else {
        $(this).find('.portlet-plus').toggleClass("portlet-minus");
        $(this).find('.portlet-plus').toggleClass("portlet-plus"); 
      }
      
      $(this).parents(".homebox-portlet:first").find(".portlet-content").toggle();
      
      Drupal.homebox.equalizeColumnsHeights($columns);
    });
    
    // Attach click event on settings icon
    $boxes.find('.portlet-header .portlet-settings').click(function() {
      $(this).parents(".homebox-portlet:first").find(".portlet-config").toggle();
    });
    
    // Attach click event on close
    $boxes.find('.portlet-header .portlet-close').click(function() {
      $(this).parents(".homebox-portlet:first").hide('drop');
      // Uncheck input settings
      dom_id = $(this).parents(".homebox-portlet:first").attr('id');
      $('#homebox_toggle_' + dom_id).attr('checked', false);
      Drupal.homebox.equalizeColumnsHeights($columns);
    });
    
    // Add click behaviour to checkboxes that enable/disable blocks
    $togglers = $homebox.find('#homebox-settings input.homebox_toggle_box');
    $togglers.click(function() {
      if ($(this).attr('checked')) {
        el_id = $(this).attr('id').replace('homebox_toggle_', '');
        $('#' + el_id).show('drop');
      }else{
        el_id = $(this).attr('id').replace('homebox_toggle_', '');
        $('#' + el_id).hide('drop');
      };
      Drupal.homebox.equalizeColumnsHeights($columns);
    });
    
    // Add click behaviour to color buttons
    $boxes.find('.homebox-color-selector').click(function() {
      color = $(this).css('background-color');
      classes = $(this).parents(".homebox-portlet:first").attr('class').split(" ");
      jQuery.each(classes, function(key, value) {
        if (value.indexOf('homebox-color-') == 0) {
          classes[key] = "";
        };
      });
      classes = classes.join(" ");
      $(this).parents(".homebox-portlet:first").attr('class', classes);
      $(this).parents(".homebox-portlet:first").addClass("homebox-color-" + Drupal.homebox.convertRgbToHex(color).replace("#", ''));
    });
    
    // Put widget selection in a dialog window
    $('#homebox-settings').dialog({
      modal: true,
      autoOpen: false,
      width: 400
    });
    
    // Edit content link
    $('#homebox-add').click(function() {
      $('#homebox-settings').dialog('open');
    });
    
    // Save settings progress dialog
    $('#homebox-save-message').dialog({
      modal: true,
      height: 100,
      autoOpen: false
    });
    
    // Save settings link
    $('#homebox-save-link').click(function() {
      Drupal.homebox.saveBoxes();
    });
    
    // Restore to default confirmation dialog
    $('#homebox-restore-confirmation').dialog({
      height: 160,
      width: 450,
      autoOpen: false,
			modal: true,
			buttons: {
				'Restore': function() {
					$(this).dialog('close');
          Drupal.homebox.restoreBoxes();
				},
				Cancel: function() {
					$(this).dialog('close');
				}
			}
    });
    
    // Restore to defaults link
    $('#homebox-restore-link').click(function() {
      $('#homebox-restore-confirmation').dialog('open');
    });
    
    // Restore to default in-progress dialog
    $('#homebox-restore-inprogress').dialog({
      autoOpen: false,
			modal: true,
      height: 100
    });
    
    // Equalize column heights after AJAX calls
    $homebox.ajaxStop(function(){
      Drupal.homebox.equalizeColumnsHeights($columns);
    });
    
    // Add tooltips to icons
    $('span.portlet-icon').tipsy({
      gravity: 's',
      title: function() {
        switch ($(this).attr('class').replace('portlet-icon portlet-', '')) {
          case 'close':
            return 'Close';
          case 'maximize':
            return 'Maximize';
          case 'minimize':
            return 'Minimize';
          case 'minus':
            return 'Collapse';
          case 'plus':
            return 'Expand';
          case 'settings':
            return 'Settings';
        }
      }
    });
    
    // Remove tooltips on header clicks
    $boxes.find('.portlet-header').click(function() {
      $('.tipsy').remove();
    });
  }
};

Drupal.homebox.equalizeColumnsHeights = function(columns) {
  maxHeight = 0;
  $columns.each(function() {
    if ($(this).parent('.homebox-column-wrapper').attr('style') != 'width: 100%;') {
      $(this).height('auto');
      currentHeight = $(this).height();
      if (maxHeight < currentHeight) {
        maxHeight = currentHeight;
      };
    };
  }).each(function() {
    if ($(this).parent('.homebox-column-wrapper').attr('style') != 'width: 100%;') {
      $(this).height(maxHeight);
    }
  });
  
  return $columns;
};

Drupal.homebox.restoreBoxes = function() {
  // Show in-progress dialog
  $('#homebox-restore-inprogress').dialog('open');
  
  // Determine page name
  name = $('#homebox').find('input:hidden.name').val();
  
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/restore',
    type: "POST",
    cache: "false",
    dataType: "json",
    data: {name: name},
    success: function() {
      location.reload(); // Reload page to show defaults
    },
    error: function() {
      $('#homebox-restore').html('<span style="color:red;">Restore failed. Please refresh page.</span>');
      $('#homebox-restore-inprogress').dialog('close');
      console.log(Drupal.t("An error occured while trying to restore to defaults."))
    }
  });
};  

Drupal.homebox.maximizeBox = function(icon) {
  // References to active portlet and its homebox
  var portlet = $(icon).parents('.homebox-portlet');
  var homebox = $(icon).parents('#homebox');

  // Only fire this action if this widget isnt being dragged
  if (!$(portlet).hasClass('ui-sortable-helper')) {
    // Check if we're maximizing or minimizing the portlet
    if ($(portlet).hasClass('portlet-maximized')) {
      // Minimizing portlet
         
      // Move this portlet to its original place (remembered with placeholder)
      $(portlet).insertBefore($(homebox).find('.homebox-maximized-placeholder'))
        .toggleClass('portlet-maximized');
          
      // Remove placeholder
      $(homebox).find('.homebox-maximized-placeholder').remove();
        
      // Show columns again
      $(homebox).find('.homebox-column').show();
         
      // Show close icon again
      $(portlet).find('.portlet-close').show();
       
      // Show the save button
      $('#homebox-save a').show();
      $('#homebox-save span').html('');
      
      // Restore the checkbox under "Edit Content"
      $('input#homebox_toggle_' + $(portlet).attr('id')).removeAttr('disabled');
    }
    else {
      // Maximizing portlet
         
      // Add the portlet to maximized content place and create a placeholder 
      // (for minimizing back to its place)
      $(portlet)
        .before('<div class=\'homebox-maximized-placeholder\'></div>')
        .appendTo($(icon).parents('#homebox').find('.homebox-maximized'))
        .toggleClass('portlet-maximized');
           
      // Hide columns - only show maximized content place (including maximized widget)
      $(homebox).find('.homebox-column').hide();

      // Hide close icon (you wont be able to return if you close the widget)
      $(portlet).find('.portlet-close').hide();  
      
      // Hide the save button
      $('#homebox-save a').hide();
      $('#homebox-save span').html('Minimize to save');
    
      // Disable the checkbox under "Edit content"
      $('input#homebox_toggle_' + $(portlet).attr('id')).attr('disabled', 'disabled');
    }    
  }
}

Drupal.homebox.saveBoxes = function() {
  var color = new String();
  var open = new Boolean();
  var block = new String();
  var blocks = {};
  
  // Show progress dialog
  $('#homebox-save-message').dialog('open');

  $columns = Drupal.homebox.equalizeColumnsHeights($columns);
  $columns.each(function(colIndex) {
    // Determine region
    var colIndex = colIndex + 1;
    $(this).find('>.homebox-portlet').each(function(boxIndex) {
      // Determine page name
      name = $(this).find('input:hidden.name').val();
      
      // Determine block name
      block = $(this).find('input:hidden.homebox').val();
      
      // Determine visibility
      visible = 0;
      if ($(this).is(':visible')) {
        visible = 1;
      };
      
      // Determine custom color, if any
      attributes = $(this).attr('class').split(' ');
      for (a in attributes) {
        if (attributes[a].substr(0, 14) == 'homebox-color-') {
          color = attributes[a].substr(14);
        }
        else {
          color = 'default'; 
        }
      }
      
      // Determine state (open/closed)
      open = $(this).find(".portlet-content").is(':visible');

      // Build blocks object
      blocks[block] = {
          region: colIndex,
          status: visible,
          color: color,
          open: open
      }
    });
  });
 
  // Encode JSON
  blocks = JSON.stringify(blocks);
  
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/save',
    type: "POST",
    cache: "false",
    dataType: "json",
    data: {name: name, blocks: blocks},
    success: function() {
      $('#homebox-save-message').dialog('close');
    },
    error: function() {
      $('#homebox-save-message').dialog('close');
      $('#homebox-save').html('<span style="color:red;">Save failed. Please refresh page.</span>');
      console.log(Drupal.t("An error occured while trying to save you settings."))
    }
  });
}

Drupal.homebox.convertRgbToHex = function(rgb) {
  if (!jQuery.browser.msie) {
    // Script taken from
    // http://stackoverflow.com/questions/638948/background-color-hex-to-js-variable-jquery
    var parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    // parts now should be ["rgb(0, 70, 255", "0", "70", "255"]
    delete (parts[0]);
    for (var i = 1; i <= 3; ++i) {
      parts[i] = parseInt(parts[i]).toString(16);
      if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }
    return "#" + parts.join(''); // "0070ff"
  } else {
    return rgb;
  };
};
