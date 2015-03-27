'use strict';

var modalStackDepth= 0;

var showModal= function( $dialog, cb ) {

    // get all currently open modal dialogs
    var $currentModals= $('.modal.in');

    var currentStackDepth= ++modalStackDepth;

    // set dialog's state to not-open for hidden-event handlers
    var onHide= function( ev ) {
        if ( this !== ev.target || modalStackDepth !== currentStackDepth ) return;

        $dialog.off('hide', onHide);

        $dialog.data('dialog-is-open', false);
    };

    // if we are the top-most dialog, show previous hidden dialogs
    var onHidden= function( ev ) {
        if ( this !== ev.target || modalStackDepth !== currentStackDepth ) return;

        $dialog.off('hidden', onHidden);

        modalStackDepth--;

        $currentModals.modal('show');
    };

    // mark dialog as open and call callback
    $dialog.one('shown', function() {
        $dialog.data('dialog-is-open', true);
        if ( cb ) return cb();
    });

    $dialog.on('hide', onHide);
    $dialog.on('hidden', onHidden);

    if ( !$currentModals.length ) return $dialog.modal('show');

    // hide currently open dialogs and show this one
    $currentModals.one('hidden', function() {
        $dialog.modal('show');
    }).modal('hide');
};

SpongeTools.Modal= {
    show: showModal,
};
