
var hidingSemaphore= false;

var showModal = function ( $dialog ) {
    var $currentModals = $('.modal.in');

    if ( !$currentModals.length ) return $dialog.modal('show');

    var onHide= function() {
        if ( hidingSemaphore ) return $dialog.one('hidden', onHide);

        // when we close the dialog
        $currentModals.modal('show');
    }

    hidingSemaphore= true;
    return $currentModals.one('hidden', function () {
        hidingSemaphore= false;

        // when they've finished hiding
        $dialog.modal('show');
        $dialog.one('hidden', onHide);
    }).modal('hide');
};

DataObjectTools.showModal= showModal;
