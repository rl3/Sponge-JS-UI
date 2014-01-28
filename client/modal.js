
var hidingSemaphore= false;

var showModal = function ( $dialog, cb ) {
    var $currentModals = $('.modal.in');

    if ( !$currentModals.length ) {
        $dialog.modal('show');
        if ( cb ) cb();
        return;
    }

    var onHide= function() {
        if ( hidingSemaphore ) return $dialog.one('hidden', onHide);

        // when we close the dialog
        $currentModals.modal('show');
    }

    hidingSemaphore= true;
    return $currentModals.one('hidden', function () {
        hidingSemaphore= false;

        // when they've finished hiding
        if ( cb ) $dialog.one('shown', cb);
        $dialog.modal('show');
        $dialog.one('hidden', onHide);
    }).modal('hide');
};

SpongeTools.showModal= showModal;
