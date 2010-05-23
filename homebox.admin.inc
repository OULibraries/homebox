<?php
// $Id$

/**
 * @file
 * Home box admin file, takes care admin interface for homebox
 *
 * Defines home box pages, default layout, settings
 */

function homebox_admin_page() {
  // Already validated
  $page = homebox_get_page(arg(4));
  
  if ($page) {
    drupal_set_title(t('Edit !page_name', array('!page_name' => $page->settings['title'])));
  }
  
  if (!$page) {
    $form['page'] = array(
      '#type' => 'fieldset',
      '#title' => t('Add a new page'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    );
  }
  
  $form['page']['name'] = array(
    '#type' => 'textfield',
    '#title' => t('Machine Name'),
    '#required' => TRUE,
    '#size' => 32,
    '#maxlength' => 64,
    '#description' => t('The machine readable name of this page. It must be unique, and it must contain only alphanumeric characters and underscores. Once created, you will not be able to change this value!'),
  );
  
  if($page) {
    $form['page']['name']['#value'] = $page->name;
    $form['page']['name']['#disabled'] = TRUE;
  }
  
  $form['page']['options'] = array(
    '#type' => 'fieldset',
    '#title' => t('Home Box Options'),
    '#collapsible' => TRUE,
  );
  
  if(!$page) {
    $form['page']['options']['#collapsed'] = TRUE;
  }

  $form['page']['options']['title'] = array(
    '#type' => 'textfield',
    '#title' => t('Title'),
    '#size' => 32,
    '#default_value' => $page->settings['title'],
    '#maxlength' => 64,
    '#prefix' => theme('advanced_help_topic', 'homebox', 'new-page'),
    '#description' => t('The title of the page that will be created.'),
  );
  
  $form['page']['options']['path'] = array(
    '#type' => 'textfield',
    '#title' => t('Path'),
    '#size' => 32,
    '#default_value' => $page->settings['path'],
    '#maxlength' => 255,
    '#description' => t('Optionally specify an alternative URL by which this page can be accessed. For example, type "dashboard" when creating a Dashboard page. Use a relative path and don\'t add a trailing slash or the URL alias won\'t work.'),
  );
  
  $form['page']['options']['menu'] = array(
    '#type' => 'checkbox',
    '#title' => t('Create a Menu Entry'),
    '#description' => t('If checked, a menu entry will be created for this page.'),
    '#default_value' => $page ? $page->settings['menu'] : 1,
  );
  
  $form['page']['options']['enabled'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable the Page'),
    '#description' => t('If unchecked, only users with the <i>administer homebox</i> permission will be able to view this page.'),
    '#default_value' => $page ? $page->settings['enabled'] : 1,
  );
  
  $form['page']['options']['full'] = array(
    '#type' => 'checkbox',
    '#title' => t('Disable Block Regions'),
    '#description' => t('If checked, the theme block regions will be disabled for this page, giving more room for the home box.'),
    '#default_value' => $page ? $page->settings['full'] : 0,
  );
  
  $result = db_query('SELECT rid, name FROM {role} ORDER BY name');
  $role_options = array();
  while ($role = db_fetch_object($result)) {
    $role_options[$role->name] = $role->name;
  }
  $form['page']['options']['roles'] = array(
    '#type' => 'checkboxes',
    '#title' => t('Allow only certain roles to access the page'),
    '#default_value' => count($page->settings['roles']) ? $page->settings['roles'] : array(),
    '#options' => $role_options,
    '#description' => t('Select which roles can view the page.'),
  );
  
  if ($page) {
    $form['submit'] = array(
      '#type' => 'submit',
      '#value' => t('Save page'),
      '#weight' => 2,
    );
    $form['delete'] = array(
      '#type' => 'submit',
      '#value' => homebox_page_is_api($page->name) ? t('Revert page') : t('Delete page'),
      '#weight' => 3,
    );
  }
  else {
    $form['page']['import_fieldset'] = array(
      '#type' => 'fieldset',
      '#title' => 'Import Home Box',
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    );
    $form['page']['import_fieldset']['import'] = array(
      '#title' => t('Import Data'),
      '#type' => 'textarea',
      '#description' => t('Optionally include an exported Home Box to import settings and block layout. Ensure that the path is currently not in use. The machine name supplied in the import data will be ignored.'),
    );
    $form['page']['submit'] = array(
      '#type' => 'submit',
      '#value' => t('Add page'),
    );
    
    $form['#submit'][] = 'homebox_admin_page_submit';
    $form['#validate'][] = 'homebox_admin_page_validate';
  }
  
  return $form;
}

/**
 * Theme the new-page form.
 *
 * @ingroup themeable
 */
function theme_homebox_admin_new_page($form) {
  $pages = homebox_pages();
  $output = drupal_render($form);

  $header = array(t('Name'), array('data' => t('Operations'), 'colspan' => 4));
  if (is_array($pages) && !empty($pages)) {
    foreach ($pages as $page) {
      $link = l($page->settings['title'], $page->settings['path']);
      $edit = l(t('Edit'), 'admin/build/homebox/edit/' . $page->name);
      $layout = l(t('Layout'), 'admin/build/homebox/layout/' . $page->name);
      $settings = l(t('Settings'), 'admin/build/homebox/settings/' . $page->name);
      $export = l(t('Export'), 'admin/build/homebox/export/' . $page->name);
      $rows[] = array($link, $edit, $layout, $settings, $export);
    }
  }
  
  $output .= theme('table', $header, $rows);

  return $output;
}

function homebox_admin_page_validate($form, &$form_state) {
  // If no imported settings...
  if (!$form_state['values']['import']) {
    // Filter title
    $form_state['values']['title'] = filter_xss($form_state['values']['title']);
    
    // Make sure a title is present
    if(!$form_state['values']['title']) {
      form_set_error('title', t('You must enter a page title.')); 
    }
    
    // Check if the path exists
    if(!$form_state['values']['path']) {
      form_set_error('path', t('You must enter a path.')); 
    }
    // If so, make sure it's valid
    else {
      homebox_check_path($form_state['values']['path'], 'path');
    }
    
    // Check machine name
    if ($form_state['values']['name'] && $form_state['values']['op'] == t('Add page')) {
      homebox_check_name($form_state['values']['name'], 'name');
    }
  }
  else {
    /*
     * The following checks the import data object and validates
     * all of the components as done above
     */
    // Add object back to the form
    $form_state['values']['import'] = homebox_check_page_object(
      $form_state['values']['import'], 
      $form_state['values']['name'],
      TRUE,
      'import'
    );
  }
}

function homebox_admin_page_submit($form, &$form_state) {
  if ($form_state['values']['op'] == t('Save page')) {
    // Fetch old page to amend
    $page = homebox_get_page($form_state['values']['name']);
    
    // Change settings
    $page->settings['title'] = $form_state['values']['title'];
    $page->settings['path'] = $form_state['values']['path'];
    $page->settings['menu'] = (int) $form_state['values']['menu'];
    $page->settings['enabled'] = (int) $form_state['values']['enabled'];
    $page->settings['full'] = (int) $form_state['values']['full'];
    $page->settings['roles'] = array();
    
    foreach ($form_state['values']['roles'] as $role) {
      if ($role) {
        $page->settings['roles'][] = $role;
      }
    }
    
    // Save settings
    homebox_save_page($page);
    
    drupal_set_message(t('Changes have been saved'));
  }
  else if ($form_state['values']['op'] == t('Delete page')) {
    // Delete the page
    homebox_delete_page($form_state['values']['name']);
    drupal_set_message(t('The page has been deleted.'));
  }
  else if ($form_state['values']['op'] == t('Revert page')) {
    // Delete the page from database so the code persists
    homebox_delete_page($form_state['values']['name']);
    drupal_set_message(t('The page has been reverted.'));
  }
  else if ($form_state['values']['op'] == t('Add page')) {
    // Build page object
    $page = new stdClass;
    $page->name = $form_state['values']['name'];
    
    // Check to see if imported homebox object is present
    if ($form_state['values']['import']) {
      $page->settings = $form_state['values']['import']->settings;
    }
    else {
      // Build settings
      $page->settings = array(
        'title' => $form_state['values']['title'],
        'path' => $form_state['values']['path'],
        'menu' => (int) $form_state['values']['menu'],
        'enabled' => (int) $form_state['values']['enabled'],
        'full' => (int) $form_state['values']['full'],
        'regions' => HOMEBOX_DEFAULT_REGIONS,
        'cache' => 0,
        'color' => 0,
        'colors' => array(),
        'blocks' => array(),
      );
    }
    
    // Save page
    homebox_save_page($page);
    
    drupal_set_message(t('The page has been added.'));
  }
  
  $form_state['redirect'] = 'admin/build/homebox';
  menu_rebuild();
  return;
}

/**
 * Form builder function for module settings.
 */
function homebox_layout($page) {
  drupal_set_title(t('!page_name layout', array('!page_name' => $page->settings['title'])));

  // Gets admin build block helper for usort function
  require_once(drupal_get_path('module', 'block') .'/block.admin.inc');

  // Fetch and sort blocks
  $blocks = _block_rehash();

  $home_blocks = $page->settings['blocks'];

  foreach ($blocks as $key => &$block) {
    // We don't want to list exposed views blocks
    if (strpos($block['delta'], '-exp-') === 0) {
       // Remove exposed views blocks
       unset($blocks[$key]);
       continue;
    }
    
    // Generate identified for current block
    $id = $block['module'] . '_' . $block['delta'];

    // Check if current block has settings
    if (isset($home_blocks[$id])) {
      $hb = $home_blocks[$id];
      $block['weight']  = $hb['weight'];
      $block['movable'] = (bool) $hb['movable'];
      $block['status']  = (bool) $hb['status'];
      $block['open']    = (bool) $hb['open'];
      $block['closable'] = (bool) $hb['closable'];
      $block['title'] = $hb['title'];
    }
    // Set defaults.
    else {
      $block['weight']  = 99;
      $block['movable'] = TRUE;
      $block['status']  = TRUE;
      $block['open']    = TRUE;
      $block['closable'] = TRUE;
    }
  }

  usort($blocks, '_homebox_block_compare');

  return drupal_get_form('homebox_admin_display_form', $blocks, $page, $theme = NULL);
}

/**
 * Generate a page export form
 */
function homebox_export_form(&$form_state, $page) {
  $code = '$homebox = new stdClass;' . "\n";
  $code .= '$homebox->name = \'' . $page->name . '\';' . "\n";
  $code .= '$homebox->settings = ' . var_export($page->settings, TRUE) . ';';
  
  $form['export'] = array(
    '#title' => $page->name,
    '#type' => 'textarea',
    '#rows' => 30,
    '#value' => $code,
  ); 
  
  return $form;
}

/**
 * Generate main blocks administration form.
 */
function homebox_admin_display_form(&$form_state, $blocks, $page, $theme = NULL) {
  global $theme_key, $custom_theme;

  // Add CSS
  drupal_add_css(drupal_get_path('module', 'block') .'/block.css', 'module', 'all', FALSE);

  // If non-default theme configuration has been selected, set the custom theme.
  $custom_theme = isset($theme) ? $theme : variable_get('theme_default', 'garland');

  $columns = homebox_named_columns($page->settings['regions']);

  $block_regions = $columns + array(HOMEBOX_REGION_NONE => '<'. t('none') .'>');

  // Weights range from -delta to +delta, so delta should be at least half
  // of the amount of blocks present. This makes sure all blocks in the same
  // region get an unique weight.
  $weight_delta = round(count($blocks) / 2);

  // Build form tree
  $form = array(
    '#tree' => TRUE,
  );
  // Iterate on each block
  foreach ($blocks as $i => $block) {
    $key = $block['module'] .'_'. $block['delta'];
    $form[$key]['module'] = array(
      '#type' => 'value',
      '#value' => $block['module'],
    );
    $form[$key]['delta'] = array(
      '#type' => 'value',
      '#value' => $block['delta'],
    );
    $form[$key]['info'] = array(
      '#value' => check_plain($block['info'])
    );

    $form[$key]['weight'] = array(
      '#type' => 'weight',
      '#default_value' => $block['weight'],
      '#delta' => $weight_delta,
    );

    // Get default region/column for block
    $column = $page->settings['blocks'][$key]['region'];
    // If not set assign to <none>
    $column = ($column != 0) ? $column : HOMEBOX_REGION_NONE;

    $form[$key]['region'] = array(
      '#type' => 'select',
      '#default_value' => $column,
      '#options' => $block_regions,
    );
    $form[$key]['title'] = array(
      '#type' => 'textfield',
      '#default_value' => $block['title'],
      '#size' => 15,
    );
    $form[$key]['status'] = array(
      '#type' => 'checkbox',
      '#default_value' => $block['status'],
    );
    $form[$key]['open'] = array(
      '#type' => 'checkbox',
      '#default_value' => $block['open'],
    );
    $form[$key]['movable'] = array(
      '#type' => 'checkbox',
      '#default_value' => $block['movable'],
    );
    $form[$key]['closable'] = array(
      '#type' => 'checkbox',
      '#default_value' => $block['closable'],
    );
    $form[$key]['bid'] = array(
      '#type' => 'hidden',
      '#value' => $block['bid'],
    );
  }

  $form['name'] = array(
    '#type' => 'hidden',
    '#value' => $page->name,
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save blocks'),
  );

  return $form;
}

/**
 * Process main home blocks administration form submission.
 */
function homebox_admin_display_form_submit($form, &$form_state) {
  // Page pid
  $page = homebox_get_page($form_state['values']['name']);

  // We can safely remove old records
  $page->settings['blocks'] = array();

  foreach ($form_state['values'] as $key => $block) {
    // Check to see if this is a block
    // We check $block['region'] == 0, since we don't want to store block that are not enabled
    if (is_array($block) && is_numeric($block['bid']) && $block['bid'] != 0 && is_numeric($block['region']) && (int) $block['region'] > 0) {
      $page->settings['blocks'][$key] = array(
        'module' => $block['module'],
        'delta' => $block['delta'],
        'region' => (int) $block['region'],
        'movable' => (int) $block['movable'],
        'status' => (int) $block['status'],
        'open' => (int) $block['open'],
        'closable' => (int) $block['closable'],
        'title' => $block['title'],
        'weight' => (int) $block['weight'],
      );
    }
  }

  // Save the page
  homebox_save_page($page);
  
  /*
   * There is no reason to remove the blocks from user settings that
   * were removed here. Blocks that aren't in the page will be stripped
   * from the user settings upon rendering. Once the user saves, the
   * settings will be updated.
   */
   
  menu_rebuild();
  drupal_set_message(t('Layout settings have been updated for !page_title.', array('!page_title' => $page->settings['title'])));
}

/**
 * Process variables for homebox-admin-display.tpl.php.
 *
 * @param $variables
 * @see theme_homebox_admin_display()
 */
function template_preprocess_homebox_admin_display_form(&$variables) {
  global $theme_key;
  drupal_add_css($path = drupal_get_path('module', 'homebox') .'/homebox.css', $type = 'module', $media = 'all', $preprocess = TRUE);

  // Load page
  $page = homebox_get_page($variables['form']['name']['#value']);
  $block_regions = homebox_named_columns($page->settings['regions']);
  $variables['block_regions'] = $block_regions + array(HOMEBOX_REGION_NONE => t('Disabled'));
  foreach ($block_regions as $key => $value) {
    // Initialize an empty array for the region.
    $variables['block_listing'][$key] = array();
  }

  // Initialize disabled blocks array.
  $variables['block_listing'][BLOCK_REGION_NONE] = array();

  // Set up to track previous region in loop.
  $last_region = '';
  foreach (element_children($variables['form']) as $i) {
    $block = &$variables['form'][$i];
    // Only take form elements that are blocks.
    if (isset($block['info'])) {
      // Fetch region for current block.
      $region = $block['region']['#default_value'];

      // Set special classes needed for table drag and drop.
      $variables['form'][$i]['region']['#attributes']['class'] = 'block-region-select block-region-'. $region;
      $variables['form'][$i]['weight']['#attributes']['class'] = 'block-weight block-weight-'. $region;

      $variables['block_listing'][$region][$i]->row_class = isset($block['#attributes']['class']) ? $block['#attributes']['class'] : '';
      $variables['block_listing'][$region][$i]->block_modified = isset($block['#attributes']['class']) && strpos($block['#attributes']['class'], 'block-modified') !== FALSE ? TRUE : FALSE;
      $variables['block_listing'][$region][$i]->block_title =  drupal_render($block['info']);
      $variables['block_listing'][$region][$i]->region_select = drupal_render($block['region']) . drupal_render($block['theme']);
      $variables['block_listing'][$region][$i]->title = drupal_render($block['title']);
      $variables['block_listing'][$region][$i]->weight_select = drupal_render($block['weight']);
      $variables['block_listing'][$region][$i]->status = drupal_render($block['status']);
      $variables['block_listing'][$region][$i]->open = drupal_render($block['open']);
      $variables['block_listing'][$region][$i]->movable = drupal_render($block['movable']);
      $variables['block_listing'][$region][$i]->closable = drupal_render($block['closable']);
      $variables['block_listing'][$region][$i]->bid = drupal_render($block['bid']);
      $variables['block_listing'][$region][$i]->printed = FALSE;

      $last_region = $region;
    }
  }

  $variables['form_submit'] = drupal_render($variables['form']);
}

/**
 * Forms for administration settings
 *
 * @param $form_state
 * @return
 *  $form
 */
function homebox_configure_form(&$form_state, $page) {
  drupal_set_title(t('!page_name settings', array('!page_name' => $page->settings['title'])));

  $form['columns'] = array(
    '#type' => 'select',
    '#title' => t('Number of columns'),
    '#default_value' => $page->settings['regions'],
    '#options' => array('1' => 1, '2' => 2, '3' => 3, '4' => 4, '5' => 5, '6' => 6, '7' => 7, '8' => 8, '9' => 9),
    '#description' => t('Set the number of columns you want to activate for this Home box page.'),
  );

  $form['homebox_cache_enabled_'. $pid] = array(
    '#type' => 'select',
    '#title' => t('Use blocks cache?'),
    '#default_value' => $page->settings['cache'],
    '#options' => array(0 => t('Don\'t use'), 1 => t('Use if available')),
    '#description' => t('Homebox will use the blocks cache if available for the rendering of the blocks. This can greatly improve performances, but has the drawback to break Views blocks that uses Ajax AND are using <strong>Block settings: Caching</strong>. You can use this option only if the Views blocks used in your homebox that use Ajax are set to <strong>Block settings: Caching:</strong> Do not cache.'),
  );

  $form['color'] = array(
    '#type' => 'fieldset',
    '#title' => t('Boxes colors customization'),
    '#description' => t('Here you can set colors that users can use to customize their boxes.'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  );

  $form['color']['colors_enabled'] = array(
    '#type' => 'checkbox',
    '#title' => t('Can users set custom colors for each boxes?'),
    '#default_value' => $page->settings['color'],
  );

  if (module_exists('colorpicker')) {
    $form['color']['homebox_colorpicker'] = array(
      '#type' => 'colorpicker',
      '#title' => t('Color picker'),
      '#description' => t('Click an input to choose a color.'),
    );

    for ($i=0; $i < HOMEBOX_NUMBER_OF_COLOURS; $i++) {
      $form['color']['block_color_'. $pid .'_'. $i] = array(
        '#type' => 'colorpicker_textfield',
        '#title' => t('Color #!number', array('!number' => $i)),
        '#description' => t('Enter an hexadecimal value prefixed with #.'),
        '#default_value' => $page->settings['colors'][$i] ? $page->settings['colors'][$i] : '#E4F0F8',
        '#colorpicker' => 'homebox_colorpicker',
        '#size' => 7,
        '#maxlength' => 7,
      );
    }
  }
  else {
    for ($i=0; $i < HOMEBOX_NUMBER_OF_COLOURS; $i++) {
      $form['color']['block_color_' . $i] = array(
        '#type' => 'textfield',
        '#title' => t('Color #!number', array('!number' => $i)),
        '#description' => t('Enter an hexadecimal value, ex: #ff33dd'),
        '#default_value' => $page->settings['colors'][$i] ? $page->settings['colors'][$i] : '#E4F0F8',
        '#size' => 7,
        '#maxlength' => 7,
      );
    }
    $form['color']['message'] = array(
      '#type' => 'item',
      '#value' => t('If you had the <a href="@url">Color picker</a> module enabled you could choose colors more easily.', array('@url' => 'http://drupal.org/project/colorpicker')),
    );
  }

  $form['name'] = array(
    '#type' => 'hidden',
    '#value' => $page->name,
  );

  $form['#validate'] = array('homebox_configure_form_validate');
  $form['#submit'] = array('homebox_configure_form_submit');

  return system_settings_form($form);
}

/**
 * Forms for administration settings
 *
 * @param $form
 * @param $form_state
 */
function homebox_configure_form_validate($form, &$form_state) {
  // Make sure the column choice is between 1-9
  $columns = (int) $form_state['values']['columns'];
  if ($columns < 1 ||  $columns > 9) {
    form_set_error('columns', t('You must enter a value between 1 and 9.'));
  }
  
  // Check colors for string length and format - not valid HTML colors!
  for ($i=0; $i < HOMEBOX_NUMBER_OF_COLOURS; $i++) {
    if (strlen($form_state['values']['block_color_' . $i]) != 7) {
      form_set_error('block_color_' . $i, t('Colors must begin with a # and follow by 6 characters.'));
    }
    
    if (substr_count($form_state['values']['block_color_' . $i], '#') != 1) {
      form_set_error('block_color_' . $i, t('Colors must begin with a # and follow by 6 characters.'));
    }
  }
}

/**
 * Forms for administration settings
 *
 * @param $form
 * @param $form_state
 */
function homebox_configure_form_submit($form, &$form_state) {
  // Fetch page
  $page = homebox_get_page($form_state['values']['name']);

  // If the region amount changed, clear our theme registry
  if ($page->settings['regions'] != (int) $form_state['values']['columns']) {
    menu_rebuild();
  }

  // Adjust settings
  $page->settings['regions'] = (int) $form_state['values']['columns'];
  $page->settings['cache'] = (int) $form_state['values']['cache'];
  $page->settings['color'] = (int) $form_state['values']['colors_enabled'];
  
  // Adjust colors
  for ($i=0; $i < HOMEBOX_NUMBER_OF_COLOURS; $i++) {
    $page->settings['colors'][$i] = $form_state['values']['block_color_' . $i];
  }
  
  // If blocks are available and set on regions that were removed, move them!
  foreach ($page->settings['blocks'] as $key => $block) {
    // Check block region
    if ($block['region'] > $page->settings['regions']) {
      $page->settings['blocks'][$key]['region'] = 1;
    }
  }

  // Save settings
  homebox_save_page($page);
}

/**
 * Helper function for sorting blocks on admin/build/homebox.
 *
 * Active blocks are sorted by region, then by weight.
 * Disabled blocks are sorted by name.
 *
 * @param $a
 *  An array
 * @param $b
 *  An array
 * @return
 *  Comparison result
 */
function _homebox_block_compare($a, $b) {
  // Sort by weight.
  $weight = $a['weight'] - $b['weight'];
  if ($weight) {
    return $weight;
  }
  // Sort by title.
  return strcmp($a['info'], $b['info']);
}

/**
 * Returns a keyed array containing regions/columns named base on cols
 *
 * @return
 *  A keyed array like array(1 => 'Column 1', 2 => 'Column 2')
 */
function homebox_named_columns($cols) {
  $columns = array();
  for ($i = 1; $i <= $cols; $i++) {
    $columns[$i] = t('Column !count', array('!count' => $i));
  }
  return $columns;
}
