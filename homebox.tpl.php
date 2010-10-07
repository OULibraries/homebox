<?php
// $Id$

/**
 * @file
 * homebox.tpl.php
 * Default layout for homebox.
 */
?>
<?php global $user; ?>
<div id="homebox" class="<?php print $classes ?>">
  <?php if ($user->uid): ?>
    <div id="homebox-buttons">
      <?php if (!empty($add_links)): ?>
        <a href="javascript:void(0)" id="homebox-add-link"><?php print t('Add a block') ?></a>
      <?php endif; ?>
      <button id="homebox-restore-link"><?php print t('Restore to defaults'); ?></button>
      <?php print $save_form; ?>
    </div>
  
    <!-- Used by jQuery UI to provide popups -->
    <div id="homebox-restore-confirmation" title="<?php print t('Are you sure you want to restore to defaults?'); ?>">
      <div style="width:400px;"><?php print t('Completing this action will purge your custom settings and items and restore the page to the default configuration.
      This action cannot be undone.'); ?></div>
    </div>
    <div id="homebox-restore-inprogress"><?php print t('Restoring default settings') . '...'; ?></div>
  <?php endif; ?>

  <?php if (!empty($add_links)): ?>
    <div id="homebox-add"><?php print $add_links; ?></div>
  <?php endif; ?>

  <div class="homebox-maximized"></div>
  <?php for ($i = 1; $i <= count($regions); $i++): ?>
    <div class="homebox-column-wrapper homebox-column-wrapper-<?php print $i; ?>"<?php print count($page->settings['widths']) ? ' style="width: ' . $page->settings['widths'][$i] . '%;"' : ''; ?>>
      <div class="homebox-column" id="homebox-column-<?php print $i; ?>">
        <?php foreach ($regions[$i] as $key => $weight): ?>
          <?php foreach ($weight as $block): ?>
            <?php if ($block->content): ?>
              <?php print theme('homebox_block', $block, $page); ?>
            <?php endif; ?>
          <?php endforeach; ?>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endfor; ?>
  <div class="clear-block"></div>
</div>
