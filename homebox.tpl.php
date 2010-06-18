<?php
// $Id$

/**
 * @file
 * homebox.tpl.php
 * Default layout for homebox.
 */
?>
<?php global $user; ?>
<div id="homebox" class="column-count-<?php print $column_count; ?> homebox-<?php print $page->name; ?>">
  <div id="homebox-buttons">
    <button id="homebox-edit-link"><?php print t('Toggle items'); ?></button>
    <?php if ($user->uid): ?>
      <?php if ($page->settings['custom']): ?>
        <button id="homebox-add-link"><?php print t('Add item'); ?></button>
      <?php endif; ?>
      <button id="homebox-restore-link"><?php print t('Restore to defaults'); ?></button>
      <button id="homebox-save-link"><?php print t('Save settings'); ?></button>
      <span id="minimize-to-save">Minimize to save</span>
    <?php endif; ?>
  </div>
  
  <ul id="homebox-settings" title="Toggle available widgets">
    <?php foreach ($available_blocks as $key => $block): ?>
      <?php if ($block['closable']): ?>
        <li>
          <input type="checkbox" class="homebox_toggle_box" <?php print $block['checked']; ?> id="homebox_toggle_<?php print $block['dom_id']; ?>" /> <?php print $block['subject']; ?>
        </li>
      <?php endif; ?>
    <?php endforeach ?>
  </ul>

  <?php for ($i = 1; $i <= count($regions); $i++): ?>
   <div class="homebox-column-wrapper homebox-column-wrapper-<?php print $i; ?>"<?php print count($page->settings['widths']) ? ' style="width: ' . $page->settings['widths'][$i] . '%;"' : ''; ?>>
    <div class="homebox-column" id="homebox-column-<?php print $i; ?>">
      <?php foreach ($regions[$i] as $key => $weight): ?>
        <?php foreach ($weight as $block): ?>
          <?php if ($block->content): ?>
            <?php print theme('homebox_block', $block, $page); ?>
          <?php endif ?>
        <?php endforeach ?>
      <?php endforeach ?>
    </div>
   </div>
  <?php endfor ?>

  <!-- Used by jQuery UI to provide popups -->
  <div id="homebox-restore-confirmation" title="Are you sure you want to restore to defaults?">
    Completing this action will purge your custom settings and items and restore the page to the default configuration.
    This action cannot be undone.
  </div>
  <div id="homebox-restore-inprogress">Restoring default settings...</div>
  <div id="homebox-save-message">Saving settings...</div>
  <form id="homebox-add-form" title="Add a new item" class="form-item">
    <div id="homebox-add-form-status"></div>
    <label for="title">Title</label>
    <input type="text" name="title" id="homebox-add-form-title" class="" />
    <label for="content">Content</label>
    <textarea name="content" id="homebox-add-form-content" value="" class=""></textarea>
  </form>
  <form id="homebox-edit-form" title="Edit item" class="form-item">
    <div id="homebox-edit-form-status"></div>
    <label for="title">Title</label>
    <input type="text" name="title" id="homebox-edit-form-title" class="" />
    <label for="content">Content</label>
    <textarea name="content" id="homebox-edit-form-content" value="" class=""></textarea>
    <input type="hidden" value="" />
  </form>
  <div id="homebox-delete-custom-message" title="Deletion confirmation">
    <?php print t('Are you sure you want to delete this item? This action cannot be undone.'); ?>
    <input type="hidden" value="" />
  </div>
  <div class="clear-block"></div>
  <!-- Used by jQuery to determine page ID -->
  <input type="hidden" class="name" value="<?php print $page->name; ?>" />
</div>

<?php
// Print CSS classes based on colors
print $color_css_classes;
?>
<!-- End Homebox -->
