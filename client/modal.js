'use strict';

var modalStackDepth= 0;

var showModal= function( $dialog, cb ) {
    var $currentModals= $('.modal.in');

    var currentStackDepth= ++modalStackDepth;

    var onHide= function( ev ) {
        if ( this !== ev.target || modalStackDepth !== currentStackDepth ) return;

        $dialog.data('dialog-is-open', false);
    };

    var onHidden= function( ev ) {
        if ( this !== ev.target || modalStackDepth !== currentStackDepth ) return;

        $dialog.off('hide', onHide);
        $dialog.off('hidden', onHidden);

        modalStackDepth--;

        $currentModals.modal('show');
    };

    $dialog.one('shown', function() {
        $dialog.data('dialog-is-open', true);
        if ( cb ) return cb();
    });
    $dialog.on('hide', onHide);
    $dialog.on('hidden', onHidden);

    if ( !$currentModals.length ) return $dialog.modal('show');

    $currentModals.one('hidden', function() {
        $dialog.modal('show');
    }).modal('hide');
};

SpongeTools.Modal= {
    show: showModal,
};
